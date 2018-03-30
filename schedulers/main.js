/**
 * Created by paulex on 9/11/17.
 */
const fs = require("fs");
const cron = require('node-schedule');
const Excel = require('exceljs');
const Utils = require('../core/Utility/Utils');
const _ = require('lodash');
let API = null;


module.exports = function main(context, Api) {
    this.context = context;

    API = Api;

    //lock.d for delinquency list, lock.c for customer
    this.lock = {d: false};
    //all cron jobs
    console.log('* * * * * * Registered CronJobs');
    //schedule job for running createDelinquencyList
    cron.scheduleJob('*/2 * * * *', main.createDelinquencyList.bind(this));

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

    //This function processes the excel document
    const startProcessor = async (file/*.xlsx*/, fileName) => {
        this.lock.d = true;
        currentFile = file;
        const currDate = new Date();
        const logMessages = [];
        const db = this.context.database;

        const task = [
            Utils.getFromPersistent(this.context, "groups"),
            db.table("uploads").where("file_name", fileName).select(['group_id', 'assigned_to']),
            workbook.xlsx.readFile(file)
        ];

        //Fetch Groups and the Uploaded record before hand
        let [groups, uploadData] = await Promise.all(task).catch(err => {
            console.log(err);
            deleteFile(file);
            this.lock.d = false;//should in-case an error occurs we can release the lock to allow a retry
            logMessages.push("There was an error reading the file");
            return _updateUploadStatus(this, fileName, 3, logMessages);
        });

        groups = JSON.parse(groups);
        uploadData = uploadData.shift();

        const workSheet = workbook.getWorksheet(1);
        let rowLen = workSheet.rowCount,
            columnLen = workSheet.actualColumnCount,
            processed = 0,
            processedDelinquencies = 0,
            processedWorkOrders = 0;

        let colHeaderIndex = {};

        //if it is empty or just includes the column heads... lets delete the file and release lock
        if (rowLen <= 1) {
            deleteFile(file);
            logMessages.push("The uploaded file is empty. Nothing to do.");
            this.lock.d = false;//release the lock here
            return _updateUploadStatus(this, fileName, 4, logMessages);
        }

        const endProcess = (recordsProcessed) => {
            if (recordsProcessed === rowLen - 1) {
                deleteFile(file);
                logMessages.push(`${processedDelinquencies} of ${rowLen - 1}` +
                    " delinquent records imported successfully"
                );
                logMessages.push(`${processedWorkOrders} work orders was generated for a total of` +
                    ` ${processedDelinquencies}` + " delinquencies imported.");

                let status = (processedDelinquencies === rowLen - 1) ? 4 : 5;
                _updateUploadStatus(this, fileName, status, JSON.stringify(logMessages));
                this.lock.d = false;
                console.log(logMessages);
            }
            return recordsProcessed === rowLen - 1;
        };

        const processDelinquentRows = (row, rn) => {
            let rowNum = rn;
            if (rowNum === 1) {
                colHeaderIndex = getColumnsByNameIndex(row, columnLen);
                if (_.difference(delinquentCols, Object.keys(colHeaderIndex)).length > 0) {
                    deleteFile(file);
                    this.lock.d = false;//release the lock here
                    logMessages.push("Invalid delinquency template uploaded. Template doesn't contain either one of " +
                        `this column heads; ${delinquentCols.join(', ')}`);
                    return _updateUploadStatus(this, fileName, 3, JSON.stringify(logMessages));
                }
            }
            else if (rowNum > 1) {
                const accountNo = row.getCell(colHeaderIndex['account_no']).value;
                const cBill = row.getCell(colHeaderIndex['current_bill']).value;
                const arrears = row.getCell(colHeaderIndex['net_arrears']).value;
                const undertaking = row.getCell(colHeaderIndex['undertaking']).value;
                const utIndex = row.getCell(colHeaderIndex['undertaking_index']).value;
                const generate = row.getCell(colHeaderIndex['auto_generate_do']).value || "NO";
                //We need to validate the rows.
                //If the current row is empty quickly move to the next and log the error for the client
                if (rn !== rowLen && (accountNo == null || !accountNo.length > 0
                        || Number.isNaN(cBill)
                        || Number.isNaN(arrears)
                        || utIndex == null)) {
                    //TODO make error messages
                    return endProcess(++processed) || processDelinquentRows(workSheet.getRow(++rn), rn);
                }

                //check if the the row is empty
                if (accountNo == null && cBill == null
                    && arrears == null && undertaking == null
                    && utIndex == null && generate == null) {
                    return endProcess(++processed) || processDelinquentRows(workSheet.getRow(++rn), rn);
                }


                //Worst case scenario: if we can't find the hub an undertaking falls under
                //lets assign it to the UT group itself
                let hubGroup = {id: utIndex.result};
                let hubManagerId = null;

                //Get the technical hub that manages the Undertaking of the Delinquent customer
                //Only if we are to generate work order for this delinquent customer automatically
                if (generate.toUpperCase() === 'YES') {
                    hubGroup = Utils.getGroupParent(groups[utIndex.result], "technical_hub") || hubGroup;

                    //There is no need looking up for the hub manager if the UT doesn't belong to a hub
                    if (hubGroup.id !== utIndex.result) {
                        db.select(['users.id']).from("users")
                            .innerJoin("role_users", "users.id", "role_users.user_id")
                            .innerJoin("roles", "role_users.role_id", "roles.id")
                            .innerJoin("user_groups", "user_groups.group_id", hubGroup.id)
                            .where("roles.slug", "technical_hub")
                            .then(userId => {
                                hubManagerId = (userId.length) ? userId.shift().id : null;
                            });
                    } else {
                        logMessages.push(`The undertaking(${undertaking}) specified in row(${rowNum})` +
                            " doesn't belong to any Hub.");
                    }
                } else logMessages.push("Work order was not auto-generated for row(" + rowNum + ")");

                let assignedTo = uploadData.assigned_to[0];
                assignedTo.created_at = Utils.date.dateToMysql(currDate, "YYYY-MM-DD H:m:s");
                //TODO what happens if the hubManagerID is null?
                let delinquency = {
                    "account_no": accountNo,
                    "current_bill": cBill,
                    "arrears": arrears,
                    "min_amount_payable": cBill + arrears,
                    "total_amount_payable": cBill + arrears + 2000,
                    "group_id": uploadData.group_id,
                    "created_by": assignedTo.id,
                    "assigned_to": JSON.stringify([assignedTo]),
                    "created_at": assignedTo.created_at,
                    "updated_at": assignedTo.created_at
                };

                // Insert record to Database
                db.table("disconnection_billings").insert(delinquency)
                    .then(res => {
                        const discId = res.shift();
                        ++processedDelinquencies;

                        // We need to only call endProcess only when we are sure that all processes are completed
                        // thus if we are creating a work order we can only call endProcess when it either passes
                        // or fail. If we aren't creating a work-order then we can test endProcess
                        let doWorkOrder = generate.toUpperCase() === 'YES';

                        if (doWorkOrder) {
                            //We now need to create a work order only if it has a hub and a hub mgr
                            if (hubGroup.id !== utIndex.result) {
                                API.workOrders().createWorkOrder({
                                    type_id: 1,
                                    related_to: "disconnection_billings",
                                    relation_id: `${discId}`,
                                    labels: '["work"]',
                                    summary: "Disconnect Customer!!!",
                                    status: '1',
                                    group_id: hubGroup.id,
                                    assigned_to: `[{"id": ${hubManagerId}, "created_at": "${assignedTo.created_at}"}]`,
                                    issue_date: Utils.date.dateToMysql(currDate, "YYYY-MM-DD"),
                                    created_at: assignedTo.created_at,
                                    updated_at: assignedTo.created_at
                                }).then(res => {
                                    //We need to get the work order id and relate it with the disconnection billing
                                    //Not necessary to wait for the return
                                    db.table('disconnection_billings').where('id', '=', discId)
                                        .update({
                                            work_order_id: res.data.data.work_order_no,
                                            assigned_to: JSON.stringify([assignedTo, {
                                                "id": hubManagerId,
                                                "created_at": assignedTo.created_at
                                            }])
                                        }).then();

                                    ++processedWorkOrders;
                                    endProcess(++processed);
                                }).catch(err => {
                                    console.log('CREATE_ERR', err);
                                    endProcess(++processed);
                                });
                            } else {
                                logMessages.push(`Couldn't create a work order for row(${rowNum})`
                                    + " because the undertaking doesn't belong to a hub; " +
                                    "however a delinquent record was created.");
                                endProcess(++processed);
                            }
                        }
                        if (!doWorkOrder) endProcess(++processed);
                    })
                    .catch(err => {
                        logMessages.push(`An error occurred while processing row(${rowNum})` + "." +
                            " It could be that the account number doesn't exist.");
                        endProcess(++processed);
                    });
            }
            if (rn !== rowLen) return setTimeout(() => processDelinquentRows(workSheet.getRow(++rn), rn), 20);
        };
        processDelinquentRows(workSheet.getRow(1), 1);
    };
    //if the lock is currently released we can start processing another file
    if (!this.lock.d) {
        return fs.readdir(directory, (err, files) => {
            if (err) {
                console.log(err);
                return;
            }
            //start processing the files.. we are processing one file at a time from a specific folder
            //TODO check that this files are indeed excel files e.g xlsx or csv
            const fileName = files.shift();
            if (fileName) startProcessor(`${directory}/${fileName}`, fileName);
        });
    }
    console.log("Lock for delinquency list is held, i'll wait till it is released")
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
            status: status, updated_at: Utils.date.dateToMysql(new Date(), "YYYY-MM-DD H:m:s"),
            message: message
        }).then(r => console.log());
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
    fs.unlink(file, e => (e) ? console.log(`Error deleting file ${file}`, e) : `${file} DELETED`);
}