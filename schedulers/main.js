/**
 * Created by paulex on 9/11/17.
 */
const fs = require("fs");
const cron = require('node-schedule');
const Excel = require('exceljs');
const Utils = require('../core/Utility/Utils');
const _ = require('lodash');
let API = null;
const Events = require('../events/events.js');


module.exports = function main(context, Api) {
    this.context = context;

    API = Api;

    //lock.d for delinquency list, lock.c for customer
    this.lock = {d: false, g: false};
    //all cron jobs
    console.log('* * * * * * Registered CronJobs');
    //schedule job for running createDelinquencyList
    cron.scheduleJob('*/2 * * * *', main.createDelinquencyList.bind(this));

    //schedule job for running updateAssetLocation
    cron.scheduleJob('*/2 * * * *', main.updateAssetLocation.bind(this));

    //schedule job for creating meter readings
    cron.scheduleJob('*/1 * * * *', main.createMeterReadings.bind(this));

    // schedule job for creating meter readings
    cron.scheduleJob('*/30 * * * *', main.createCustomers.bind(this));
};

/**
 * Read the imported delinquency list and create a record on the database
 * @returns {*}
 */
module.exports.createDelinquencyList = function () {
    //lets retrieve the path where delinquency list is saved
    const directory = `${this.context.config.storage.path}/uploads/delinquencies`;
    const workbook = new Excel.Workbook();
    let currentFile = null;
    const delinquentCols = ['account_no', 'current_bill', 'net_arrears', 'undertaking', 'undertaking_index', 'auto_generate_do'];
    const tableName = "disconnection_billings";

    //This function processes the excel document
    const startProcessor = async (file/*.xlsx*/, fileName) => {
        this.lock.d = true;
        currentFile = file;
        const currDate = new Date();
        const logMgs = [];
        const db = this.context.database;

        //onComplete is called when the file is done processing
        const onComplete = (status, update = true) => {
            deleteFile(currentFile);
            this.lock.d = false;//release the lock here
            Events.emit("upload_completed", "delinquency", status, fileName, (uploadData) ? uploadData.created_by : 0);
            return (update) ? _updateUploadStatus(this, fileName, status, JSON.stringify(logMgs)) : true;
        };

        const task = [
            Utils.getFromPersistent(this.context, "groups", true),
            db.table("uploads").where("file_name", fileName).select(['group_id', 'assigned_to', 'created_by']),
            workbook.xlsx.readFile(file)
        ];

        //Fetch Groups and the Uploaded record before hand
        let [groups, uploadData] = await Promise.all(task).catch(_ => {
            return logMgs.push("There was an error reading the file") && onComplete(3);
        });

        //check that the uploaded data is intact.. if we can't find the uploaded record we can end this right now
        if (!uploadData.length) return logMgs.push("Couldn't find the uploaded record.") && onComplete(5, false);

        uploadData = uploadData.shift();

        const workSheet = workbook.getWorksheet(1);
        let rowLen = workSheet.rowCount,
            actualRowCount = rowLen - 1,
            columnLen = workSheet.actualColumnCount,
            processed = 0,
            processedDisc = 0,
            processedWO = 0,
            isBadTemplate = false,
            total = 1;

        let colHeaderIndex = {};

        //if the file is empty or just includes the column heads... lets delete the file and release lock
        if (rowLen <= 1) return logMgs.push("Empty file uploaded.") && onComplete(5);


        //Determines if onComplete should be called or not depending on the number of rows processed
        const endProcess = (totalRowsVisited) => {
            if ((totalRowsVisited === rowLen) || (totalRowsVisited === workSheet.actualRowCount)) {
                logMgs.push(`${processedDisc} of ${actualRowCount}` + " delinquent records imported successfully");
                logMgs.push(`${processedWO ? processedWO : "No"} work order(s) was generated from the total of`
                    + ` ${processedDisc}` + " delinquency record imported.");
                console.log(logMgs);
                return onComplete((processedDisc === actualRowCount) ? 4 : 5);
            }
            return totalRowsVisited === rowLen;
        };


        workSheet.eachRow(async (row, rn) => {
            if (isBadTemplate) return;
            if (rn === 1) {
                colHeaderIndex = getColumnsByNameIndex(row, columnLen);
                if (!_.difference(delinquentCols, Object.keys(colHeaderIndex)).length) return;
                logMgs.push("Invalid delinquency template uploaded. Template doesn't contain either one of " +
                    `this column headers; ${delinquentCols.join(', ')}`);
                return onComplete(3) && (isBadTemplate = true);
            }

            const accountCell = row.getCell(colHeaderIndex['account_no']);
            const accountNo = (accountCell.value) ? accountCell.value.text || accountCell.value : null;
            const cBill = row.getCell(colHeaderIndex['current_bill']).value;
            const arrears = row.getCell(colHeaderIndex['net_arrears']).value;
            const undertaking = row.getCell(colHeaderIndex['undertaking']).value;
            const utIndex = row.getCell(colHeaderIndex['undertaking_index']).value;
            const generate = row.getCell(colHeaderIndex['auto_generate_do']).value || "NO";

            //check if the the row is empty
            if (row.actualCellCount < delinquentCols.length) return --actualRowCount && endProcess(++total);

            //Worst case scenario: if we can't find the hub an undertaking falls under
            //lets assign it to the UT group itself
            let generateWO = generate.toUpperCase() === 'YES';
            let hubGroup = {id: utIndex.result};
            let hubManagerId = null;

            let assignedTo = uploadData.assigned_to[0];
            assignedTo.created_at = Utils.date.dateToMysql(currDate, "YYYY-MM-DD H:m:s");

            /*-----------------------------------------------------------------------------------------
            | Checks if the customer exist
            | Checks also if the customer specified belongs to the undertaking specified in the excel file
            |-------------------------------------------------------------------------------------------
             */
            let customer = await db.table("customers").where("account_no", accountNo).select(['group_id', 'tariff']);
            customer = customer.pop();

            if (!customer) {
                logMgs.push(`The specified account no (${accountNo}) in row(${rn}) does not exist.`);
                return ++processed && endProcess(++total);
            }

            let reconnection_fee = await db.table("rc_fees").where("name", customer.tariff).select(['amount']);
            reconnection_fee = (reconnection_fee[0]) ? reconnection_fee[0].amount : 3000;

            const customerUT = Utils.getGroupParent(groups[customer.group_id], "undertaking");

            if (customerUT && customerUT.id !== utIndex.result) {
                logMgs.push(`The customer (${accountNo}) does not belong to the undertaking (${undertaking}) specified in row(${rn}).`);
                if (customerUT.name === undertaking) logMgs.push("The template you are using might be the problem.");
                return ++processed && endProcess(++total);
            }

            const delinquency = {
                "account_no": accountNo,
                "current_bill": cBill,
                "arrears": arrears,
                "min_amount_payable": cBill + arrears,
                "total_amount_payable": cBill + arrears + reconnection_fee,
                reconnection_fee,
                "group_id": uploadData.group_id,
                "created_by": assignedTo.id,
                "assigned_to": JSON.stringify([assignedTo]),
                "created_at": assignedTo.created_at,
                "updated_at": assignedTo.created_at
            };

            const inserted = await db.table(tableName).insert(delinquency).catch(_ => {
                logMgs.push(`An error occurred while processing row(${rn})` + "." +
                    " It could be that the account number doesn't exist.");
                return null;
            });

            if (!inserted) return ++processed && endProcess(++total);

            ++processedDisc;

            const discId = inserted.shift();

            if (!generateWO) {
                return logMgs.push("Work order was not auto-generated for row(" + rn + ")") && endProcess(++total);
            }

            hubGroup = Utils.getGroupParent(groups[utIndex.result], "technical_hub") || hubGroup;
            if (hubGroup.id === utIndex.result) {
                logMgs.push(`Couldn't create a work order for row(${rn})` +
                    ` because the undertaking (${undertaking}) doesn't belong to a hub.`);
                return ++processed && endProcess(++total);
            }

            const [hubUser, hasPending] = await Promise.all([
                db.select(['users.id']).from("users").innerJoin("role_users", "users.id", "role_users.user_id")
                    .innerJoin("roles", "role_users.role_id", "roles.id")
                    .innerJoin("user_groups", "user_groups.group_id", hubGroup.id)
                    .where("roles.slug", "technical_hub").where("users.deleted_at", null),
                Utils.customerHasPendingWorkOrder(db, accountNo)
            ]).catch(err => console.error('something light', err));

            // If the customer has a pending work order we shouldn't create a new one
            if (hasPending) {
                logMgs.push(`Couldn't create a work order for customer (${accountNo}) in row(${rn})`
                    + ` because the customer still has a pending work order.`);
                return ++processed && endProcess(++total);
            }

            if (!hubUser.length) {
                logMgs.push(`Couldn't create a work order for row ${rn} because there was no hub manager for`
                    + ` the undertaking (${undertaking}).`);
                return ++processed && endProcess(++total);
            }

            hubManagerId = hubUser.shift().id;

            return API.workOrders().createWorkOrder({
                type_id: 1,
                related_to: tableName,
                relation_id: `${discId}`,
                labels: '["work"]',
                summary: "Disconnect Customer!!!",
                status: '1',
                group_id: uploadData.group_id,
                created_by: assignedTo.id,
                assigned_to: `[${hubManagerId}]`,
                issue_date: Utils.date.dateToMysql(currDate, "YYYY-MM-DD"),
                created_at: assignedTo.created_at,
                updated_at: assignedTo.created_at
            }).then(res => {
                db.table('disconnection_billings').where('id', '=', discId)
                    .update({
                        work_order_id: res.data.data.work_order_no,
                        assigned_to: JSON.stringify([assignedTo, {
                            "id": hubManagerId,
                            "created_at": assignedTo.created_at
                        }])
                    }).then();

                ++processedWO;
                return ++processed && endProcess(++total);
            }).catch(err => {
                console.log('CREATE_ERR', err);
                return ++processed && endProcess(++total);
            });
        });
    };
    //if the lock is currently released we can start processing another file
    if (!this.lock.d) {
        return fs.readdir(directory, (err, files) => {
            if (err) return console.log(err);
            //start processing the files.. we are processing one file at a time from a specific folder
            //TODO check that this files are indeed excel files e.g xlsx or csv
            const fileName = files.shift();
            if (fileName) startProcessor(`${directory}/${fileName}`, fileName).catch(console.error);
        });
    }
    console.log("Lock for delinquency list is held, i'll wait till it is released");
};


module.exports.updateAssetLocation = function () {
    //lets retrieve the path where asset locations list is saved
    const directory = `${this.context.config.storage.path}/uploads/assets_location`;
    const workbook = new Excel.Workbook();
    let currentFile = null;
    const cols = ['asset_id', 'lat', 'lng'];
    const tableName = "assets";


    //This function processes the excel document
    const startProcessor = async (file/*.xlsx*/, fileName) => {
        this.lock.g = true;
        currentFile = file;
        // const currDate = new Date();
        const logMgs = [];
        const db = this.context.database;


        //onComplete is called when the file is done processing
        const onComplete = (status, update = true) => {
            deleteFile(currentFile);
            this.lock.g = false;//release the lock here
            Events.emit("upload_completed", "asset_location", status, fileName, (uploadData) ? uploadData.created_by : 0);
            return (update) ? _updateUploadStatus(this, fileName, status, JSON.stringify(logMgs)) : true;
        };

        const task = [
            // Utils.getFromPersistent(this.context, "groups", true),
            db.table("uploads").where("file_name", fileName).select(['group_id', 'assigned_to', 'created_by']),
            workbook.xlsx.readFile(file)
        ];

        //Fetch Groups and the Uploaded record before hand
        let [uploadData] = await Promise.all(task).catch(_ => {
            return logMgs.push("There was an error reading the file") && onComplete(3);
        });

        //check that the uploaded data is intact.. if we can't find the uploaded record we can end this right now
        if (!uploadData.length) return logMgs.push("Couldn't find the uploaded record.") && onComplete(5, false);

        uploadData = uploadData.shift();

        const workSheet = workbook.getWorksheet(1);
        let rowLen = workSheet.rowCount,
            actualRowCount = rowLen - 1,
            columnLen = workSheet.actualColumnCount,
            processed = 0,
            processedAsset = 0,
            isBadTemplate = false,
            total = 1;

        let colHeaderIndex = {};

        //if the file is empty or just includes the column heads... lets delete the file and release lock
        if (rowLen <= 1) return logMgs.push("Empty file uploaded.") && onComplete(5);

        //Determines if onComplete should be called or not depending on the number of rows processed
        const endProcess = (totalRowsVisited) => {
            console.log(totalRowsVisited, workSheet.actualRowCount, rowLen);
            if ((totalRowsVisited === rowLen) || (totalRowsVisited === workSheet.actualRowCount)) {
                logMgs.push(`${processedAsset} of ${actualRowCount}` + " assets location updated successfully");
                console.log(logMgs);
                return onComplete((processedAsset === actualRowCount) ? 4 : 5);
            }
            return totalRowsVisited === rowLen;
        };

        workSheet.eachRow(async (row, rn) => {
            if (isBadTemplate) return;
            if (rn === 1) {
                colHeaderIndex = getColumnsByNameIndex(row, columnLen);
                if (!_.difference(cols, Object.keys(colHeaderIndex)).length) return;
                logMgs.push("Invalid asset location template uploaded. Template doesn't contain either one of " +
                    `these column headers; ${cols.join(', ')}`);
                return onComplete(3) && (isBadTemplate = true);
            }
            const assetID = row.getCell(colHeaderIndex['asset_id']).value;
            const lat = row.getCell(colHeaderIndex['lat']).value;
            const lng = row.getCell(colHeaderIndex['lng']).value;

            //check if the the row is empty
            if (row.actualCellCount < cols.length) return --actualRowCount && endProcess(++total);
            if (typeof lat === "object" || typeof lng === "object") return endProcess(++total);

            const data = {location: db.raw(`POINT(${lat}, ${lng})`)};
            return db.table(tableName).where("serial_no", `${assetID}`.trim()).update(data).then(res => {
                if (res === 0) return logMgs.push(`Asset specified in row(${rn}) doesn't exist.`) && endProcess(++total);
                else return ++processedAsset && endProcess(++total);
            }).catch(err => {
                console.error("AssetLOC:", err);
                return endProcess(++total);
            });
        });
    };

    //if the lock is currently released we can start processing another file
    if (!this.lock.g) {
        return fs.readdir(directory, (err, files) => {
            if (err) return console.log(err);
            //start processing the files.. we are processing one file at a time from a specific folder
            //TODO check that this files are indeed excel files e.g xlsx or csv
            const fileName = files.shift();
            if (fileName) startProcessor(`${directory}/${fileName}`, fileName).catch(console.error);
        });
    }
    console.log("Lock for asset locations list is held, i'll wait till it is released");
};

/**
 * Read the imported customer files and create records for customers
 * @returns {*}
 */
module.exports.createCustomers = function () {
    const directory = `${this.context.config.storage.path}/uploads/customer`;
    const workbook = new Excel.Workbook();
    let currentFile = null;

    const startProcessor = (file/*.xlsx*/, fileName) => {
        this.lock.c = true;
        _updateUploadStatus(this, fileName, 2);
        currentFile = file;
        workbook.xlsx.readFile(file).then(() => {
            const workSheet = workbook.getWorksheet(1);
            let rowLen = workSheet.rowCount, processed = 0, columnLen = workSheet.actualColumnCount;
            let colHeaderIndex = {};
            let customers = [];
            //iterate through each row
            workSheet.eachRow((row, rn) => {
                //the first row returned is the column header so lets skip
                //for the first row we need to get all the column head
                //TODO we should be able to validate the columns supplied
                if (rn === 1) colHeaderIndex = getColumnsByNameIndex(row, columnLen);
                else if (rn > 1) {
                    //so we should basically know the columns we are expecting since we provided the template
                    //lets build the customer data
                    let status = (getRowValueOrEmpty(row, colHeaderIndex, 'status') === 'Active') ? 1 : 0;
                    let customer = {
                        "account_no": getRowValueOrEmpty(row, colHeaderIndex, 'account_no'),
                        "old_account_no": getRowValueOrEmpty(row, colHeaderIndex, 'old_account_no'),
                        "meter_no": getRowValueOrEmpty(row, colHeaderIndex, 'meter_no'),
                        "first_name": getRowValueOrEmpty(row, colHeaderIndex, 'first_name'),
                        "last_name": getRowValueOrEmpty(row, colHeaderIndex, 'last_name'),
                        "email": row.getCell(colHeaderIndex['email']).value.text,
                        "customer_name": getRowValueOrEmpty(row, colHeaderIndex, 'customer_name'),
                        status,
                        "plain_address": getRowValueOrEmpty(row, colHeaderIndex, 'address'),
                        "customer_type": getRowValueOrEmpty(row, colHeaderIndex, 'customer_type'),
                        "tariff": getRowValueOrEmpty(row, colHeaderIndex, 'tariff'),
                        "created_at": Utils.date.dateToMysql(new Date(), "YYYY-MM-DD H:m:s"),
                        "updated_at": Utils.date.dateToMysql(new Date(), "YYYY-MM-DD H:m:s")
                    };

                    //ORGANIZE THE BUSINESS UNIT HERE AND DT

                    //get it ready for batch insert
                    customers.push(customer);
                    if (++processed === rowLen - 1) {
                        //for now lets ignore duplicates... TODO handle duplicates
                        this.context.database.insert(customers).into("customers").catch(r => console.log());
                        deleteFile(file);
                        _updateUploadStatus(this, fileName, 4);
                        //we can release the lock here
                        console.log(`Lock has been released for customers process... I imported ${rowLen - 1} customer(s)`);
                        this.lock.c = false;
                    }
                }
            });
            //if it is empty or just includes the column heads... lets delete the file and release lock
            if (rowLen === 0 || rowLen === 1) {
                deleteFile(file);
                _updateUploadStatus(this, fileName, 4);
                //we can release the lock here
                console.log("Lock has been released for customers processes.. there was nothing to do");
                this.lock.c = false;
            }
        }).catch(err => {
            //should in-case an error occurs we can release the lock to allow a retry
            _updateUploadStatus(this, fileName, 3);
            this.lock.c = false;
            console.log(err)
        });
    };
    //if the lock is currently released we can start processing another file
    if (!this.lock.c) {
        return fs.readdir(directory, (err, files) => {
            if (err) return;
            //start processing the files.. we are processing one file at a time from a specific folder
            //TODO check that this files are indeed excel files e.g xlsx or csv
            const fileName = files.shift();
            if (fileName) startProcessor(`${directory}/${fileName}`, fileName);
        });
    }
    console.log("Lock for customers transaction is held... i'll be waiting till it is released!!!")
};


module.exports.createMeterReadings = function () {
    const directory = `${this.context.config.storage.path}/uploads/meter`;
    const workbook = new Excel.Workbook();
    let currentFile = null;

    const startProcessor = (file/*.xlsx*/, fileName) => {
        this.lock.m = true;
        _updateUploadStatus(this, fileName, 2);
        currentFile = file;
        workbook.xlsx.readFile(file).then(() => {
            const workSheet = workbook.getWorksheet(1);
            let rowLen = workSheet.rowCount, processed = 0, columnLen = workSheet.actualColumnCount;
            let colHeaderIndex = {};
            let meter_readings = [];
            //iterate through each row
            workSheet.eachRow((row, rn) => {
                //the first row returned is the column header so lets skip
                //for the first row we need to get all the column head
                //TODO we should be able to validate the columns supplied
                if (rn === 1) colHeaderIndex = getColumnsByNameIndex(row, columnLen);
                else if (rn > 1) {
                    //so we should basically know the columns we are expecting since we provided the template
                    //lets build the customer data
                    let meter_reading = {
                        'meter_no': row.getCell(colHeaderIndex['meter_no']).value,
                        // 'tariff': row.getCell(colHeaderIndex['tariff']).value,
                        // 'account_no': row.getCell(colHeaderIndex['account_no']).value,
                        // 'set_up_date': row.getCell(colHeaderIndex['set_up_date']).value,
                        'reading_code': row.getCell(colHeaderIndex['meter_reading_code']).value,
                        'demand': row.getCell(colHeaderIndex['demand']).value,
                        'current_reading': row.getCell(colHeaderIndex['current_reading']).value,
                        'previous_reading': row.getCell(colHeaderIndex['previous_reading']).value,
                        'current_bill': row.getCell(colHeaderIndex['current_bill']).value,
                        'current_opening_bal': row.getCell(colHeaderIndex['current_opening_bal']).value,
                        'current_closing_bal': row.getCell(colHeaderIndex['current_closing_bal']).value,
                        'current_payment': row.getCell(colHeaderIndex['current_payment']).value,
                        'last_payment': row.getCell(colHeaderIndex['last_payment_amount']).value,
                        'last_payment_date': Utils.date.dateToMysql(row.getCell(colHeaderIndex['last_payment_date']).value),
                        'read_date': Utils.date.dateToMysql(row.getCell(colHeaderIndex['read_date']).value),
                        'vat_charge': row.getCell(colHeaderIndex['vat_charge']).value,
                        'fixed_charge': row.getCell(colHeaderIndex['fixed_charge']).value,
                        'energy': row.getCell(colHeaderIndex['energy']).value
                    };

                    //get it ready for batch insert
                    meter_readings.push(meter_reading);
                    if (++processed === rowLen - 1) {
                        //for now lets ignore duplicates... TODO handle duplicates
                        this.context.database.insert(meter_readings).into("meter_readings").catch(r => console.log(r));
                        deleteFile(file);
                        _updateUploadStatus(this, fileName, 4);
                        //we can release the lock here
                        console.log(`Lock has been released for meter readings process... I imported ${rowLen - 1} meter_reading(s)`);
                        this.lock.m = false;
                    }
                }
            });
            //if it is empty or just includes the column heads... lets delete the file and release lock
            if (rowLen === 0 || rowLen === 1) {
                deleteFile(file);
                _updateUploadStatus(this, fileName, 4);
                //we can release the lock here
                console.log("Lock has been released for meter readings process.. there was nothing to do");
                this.lock.m = false;
            }
        }).catch(err => {
            //should in-case an error occurs we can release the lock to allow a retry
            _updateUploadStatus(this, fileName, 3);
            this.lock.m = false;
            console.log(err)
        });
    };

    //if the lock is currently released we can start processing another file
    if (!this.lock.m) {
        return fs.readdir(directory, (err, files) => {
            if (err) return;
            //start processing the files.. we are processing one file at a time from a specific folder
            //TODO check that this files are indeed excel files e.g xlsx or csv
            const fileName = files.shift();
            if (fileName) startProcessor(`${directory}/${fileName}`, fileName);
        });
    }
    console.log("Lock for Meter Reading transaction is held... i'll be waiting till it is released!!!")
};

function _updateUploadStatus(ctx, fileName, status, message = "[]") {
    ctx.context.database.table("uploads")
        .where("file_name", fileName)
        .update({
            status: status, updated_at: Utils.date.dateToMysql(),
            message: message
        }).then(console.log);
    return true;
}


//Helper functions
function getRowValueOrEmpty(row, headers, key) {
    let _row = row.getCell(headers[key]);
    return (_row) ? _row.value : "";
}

/**
 *
 * @param row
 * @param colLen
 * @returns {{}}
 */
function getColumnsByNameIndex(row, colLen) {
    const colHeaderIndex = {};
    for (let i = 0; i < colLen; i++) {
        let colName = row.getCell(i + 1).value;
        colName = (colName) ? colName.replace(/ /g, "_").toLowerCase() : "";
        colHeaderIndex[colName] = i + 1;
    }
    return colHeaderIndex;
}


function deleteFile(file) {
    fs.unlink(file, e => (e) ? console.error(`Error deleting file ${file}`, e) : `${file} DELETED`);
}