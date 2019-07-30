/**
 * Created by paulex on 9/11/17.
 */
const fs = require("fs");
const cron = require('node-schedule');
const Excel = require('exceljs');
const spawn = require('child_process').spawn;
const Utils = require('../core/Utility/Utils');
const AWS = require('aws-sdk');
const _ = require('lodash');
const DomainFactory = require('../modules/DomainFactory');
const Session = require('../core/Session');
/**
 * @type API
 * */
let API = null;
const Events = require('../events/events.js');


module.exports = function main(context, Api) {
    this.context = context;

    API = Api;

    //lock.d for delinquency list, lock.c for customer
    this.lock = {d: false, g: false, ca: false};

    if (process.env.NODE_ENV !== 'test') {
        //all cron jobs
        console.log('* * * * * * Registered CronJobs');
        //schedule job for running createDelinquencyList
        cron.scheduleJob('*/2 * * * *', main.createDelinquencyList.bind(this));

        //schedule job for running updateAssetLocation
        cron.scheduleJob('*/3 * * * *', main.updateAssetLocation.bind(this));

        cron.scheduleJob('*/3 * * * *', main.updateCustomerAssets.bind(this));

        cron.scheduleJob('43 21 * * *', main.scriptUpdateFaults.bind(this, context));
    }
    //schedule job for running a database backup
    if (process.env.NODE_ENV === 'production') {
        const s3 = new AWS.S3({
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.SECRET_ACCESS_KEY_ID,
            }
        });
        cron.scheduleJob('0 10,15,18,22 * * *', main.backUpDatabase.bind(this, s3));
    }
    return module.exports;
};

/**
 * makes a default session
 *
 * @param context
 * @param id
 * @return {Promise<*>}
 */
async function getSession(context, id/*userID*/) {
    const User = DomainFactory.build(DomainFactory.USER);
    return Session.Builder(context).setUser(new User({id})).default();
}

module.exports.scriptUpdateFaults = function (context) {
    const ApplicationEvent = require('../events/ApplicationEvent');
    const moment = require('moment');

    const appEvent = ApplicationEvent.init(context, undefined, API, {});
    // First thing is to get the fault orders that have this issue
    // We can loop for all the work orders from a particular date
    // Override the completed date to that of the work order
    const startTask = async function () {
        const db = context.db();
        console.log('Starting Task...');
        const workOrders = await db.table('work_orders')
            .where('type_id', 3)
            .where(function () {
                this.where('status', 4).orWhere('status', 8)
            })
            .where('created_at', '>=', '2019-07-15 00:00:00')
            .where('created_at', '<=', '2019-07-23 23:59:00')
            .select(['id', 'relation_id', 'completed_date', 'status']);

        //let's get the activity of the work order when it was closed
        for (let workOrder of workOrders) {
            const query = {module: "work_orders", event_type: 'update', relation_id: `${workOrder.id}`};
            const {data: {data: {items}}} = await API.activities().getActivities(query, {}, API);
            const activity = _.find(items, (o) => {
                const fieldVal = (o.field_value) ? o.field_value.toLowerCase() : "";
                return o.field_name === 'status' && (fieldVal === 'closed' || fieldVal === '/unknown' || fieldVal === 'cancelled')
            });

            if (!activity) continue;

            const session = await getSession(context, activity.by.id);

            if (workOrder.completed_date === null || workOrder.completed_date === '') {
                //Update the completed date of the work order
                console.log(workOrder);
                const status = Utils.getWorkStatuses(3, workOrder.status);
                const compDate = moment(activity.event_time).utc().format('YYYY-MM-DD H:m:s');
                await appEvent.triggerWorkOrderWorkflow(workOrder, status, session, compDate);
            } else {
                const fault = await db.table("faults").where("id", workOrder.relation_id).whereNot('status', 4).first('id');
                if (fault) {
                    const compDate = moment(workOrder.completed_date).utc().format('YYYY-MM-DD H:m:s');
                    await appEvent.modifyFaultStatusByTotalWorkOrderStatus(fault.id, session, compDate, "Closed", "Cancelled");
                }
                //TODO Modify the activity time
            }
            console.log('Done Processing Task.');
        }
        return true;
    };
    return startTask();
};

/**
 * Read the imported delinquency list and create a record on the database
 *
 * Read excel documents from a directory
 * confirm that the excel conforms to what is expected for the process
 *  if it doesn't return an error message that the file is invalid and terminate the process
 * check that the uploaded file is recorded in the database
 *  if it isn't return an error as well that the file is not found and terminate the process
 * iterate through each row of the excel file
 *
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
        const db = this.context.db();
        let uploadData;
        let groups;

        //onComplete is called when the file is done processing
        const onComplete = (status, update = true) => {
            deleteFile(currentFile);
            this.lock.d = false;//release the lock here
            Events.emit("upload_completed", "delinquency", status, fileName, (uploadData) ? uploadData.created_by : 0);
            return (update) ? _updateUploadStatus(this, fileName, status, JSON.stringify(logMgs)) : true;
        };

        const task = [
            this.context.getKey("groups", true),
            db.table("uploads").where("file_name", fileName).select(['group_id', 'assigned_to', 'created_by']),
            workbook.xlsx.readFile(file)
        ];

        //Fetch Groups and the Uploaded record before hand
        ([groups, uploadData] = await Promise.all(task).catch(err => {
            console.error('UploadFailed:', err);
            return logMgs.push("There was an error reading the file.") && onComplete(3);
        }));

        //check that the uploaded data is intact.. if we can't find the uploaded record we can end this right now
        if (!uploadData.length) return logMgs.push("Couldn't find the uploaded record.") && onComplete(5, false);

        uploadData = uploadData.shift();

        const assignedTo = uploadData.assigned_to[0];
        const who = await getSession(this.context, uploadData.assigned_to[0].id);
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
                logMgs.push(`${processedDisc} of ${actualRowCount} delinquent records imported successfully`);
                logMgs.push(`${processedWO ? processedWO : "No"} work order(s) was generated from the total of ${processedDisc} delinquency record imported.`);
                console.log(logMgs);
                return onComplete((processedDisc === actualRowCount) ? 4 : 5);
            }
            return totalRowsVisited === rowLen;
        };

        //@loop
        workSheet.eachRow(async (row, rn) => {
            if (isBadTemplate) return;
            if (rn === 1) {
                colHeaderIndex = getColumnsByNameIndex(row, columnLen);
                if (!_.difference(delinquentCols, Object.keys(colHeaderIndex)).length) return;
                logMgs.push(`Invalid delinquency template uploaded. Template doesn't contain either one of this column headers; ${delinquentCols.join(', ')}`);
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

            /*-----------------------------------------------------------------------------------------
            | Checks if the customer exist
            | Checks also if the customer specified belongs to the undertaking specified in the excel file
            |-------------------------------------------------------------------------------------------
             */
            const customer = (await db.table("customers").where("account_no", accountNo).select(['group_id', 'tariff'])).pop();

            if (!customer) {
                logMgs.push(`The specified account no (${accountNo}) in row(${rn}) does not exist.`);
                return ++processed && endProcess(++total);
            }

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
                "group_id": uploadData.group_id,
                "created_by": who.getAuthUser().getUserId(),
                "assigned_to": JSON.stringify([assignedTo])
            };

            const disc = await API.disconnections().createDisconnectionBilling(delinquency, who, API).catch((err) => {
                logMgs.push(`An error occurred while processing row(${rn}). It could be that the account number doesn't exist.`);
                console.log(err);
                return null;
            });

            if (!disc) return ++processed && endProcess(++total);

            ++processedDisc;

            const {data: {data: {id: discId}}} = disc;

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
            }, who, API).then(res => {
                db.table('disconnection_billings').where('id', '=', discId)
                    .update({
                        work_order_id: res.data.data.work_order_no,
                        assigned_to: JSON.stringify([assignedTo, {
                            "id": hubManagerId,
                            "created_at": Utils.date.dateToMysql(currDate, "YYYY-MM-DD H:m:s")
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

/**
 * Get the uploaded excel file from the customer_assets folder
 * Check if the filename exist in the uploads database
 *   if it doesn't we should end the process completely
 * check if the file contains the right headers
 *   if it doesn't we should end the process and return a "bad file"
 *
 * iterate through each row of the excel
 * check if the assets exist using the DT_Number and check if the customer exist as well
 *   if it doesn't exist add an error to the log that it doesn't exist
 *   if it exist
 *    we should link the customer to the assets
 */
module.exports.updateCustomerAssets = function updateCustomerAssets() {
//lets retrieve the path where asset locations list is saved
    const directory = `${this.context.config.storage.path}/uploads/customers_assets`;
    const workbook = new Excel.Workbook();
    let currentFile = null;
    const cols = ['account_no', 'dt_no'];
    const tableName = "customers_assets";

    //This function processes the excel document
    const startProcessor = async (file/*.xlsx*/, fileName) => {
        this.lock.ca = true;
        currentFile = file;
        const logMgs = [];
        const db = this.context.db();

        //onComplete is called when the file is done processing
        const onComplete = (status, update = true) => {
            deleteFile(currentFile);
            this.lock.ca = false;//release the lock here
            Events.emit("upload_completed", "asset_location", status, fileName, (uploadData) ? uploadData.created_by : 0);
            return (update) ? _updateUploadStatus(this, fileName, status, JSON.stringify(logMgs)) : true;
        };

        const task = [
            db.table("uploads").where("file_name", fileName).select(['group_id', 'assigned_to', 'created_by']),
            workbook.xlsx.readFile(file)
        ];

        //Fetch Groups and the Uploaded record before hand
        let [uploadData] = await Promise.all(task).catch(_ => {
            return logMgs.push("There was an error reading the file") && onComplete(3);
        });

        console.log(uploadData);

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

        //Determines if onComplete should be called or not, depending on the number of rows processed
        const endProcess = (totalRowsVisited) => {
            console.log(totalRowsVisited, workSheet.actualRowCount, rowLen);
            if ((totalRowsVisited === rowLen) || (totalRowsVisited === workSheet.actualRowCount)) {
                logMgs.push(`${processedAsset} of ${actualRowCount}` + " customers assets updated successfully");
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
                logMgs.push(`Invalid customer assets template uploaded. Template doesn't contain either one of these column headers; ${cols.join(', ')}`);
                return onComplete(3) && (isBadTemplate = true);
            }
            const accountCell = row.getCell(colHeaderIndex['account_no']);
            let accountNo = (accountCell.value) ? accountCell.value.text || accountCell.value : null;
            let dtNo = row.getCell(colHeaderIndex['dt_no']).value;
            //check if the the row is empty
            if (row.actualCellCount < cols.length) {
                console.log(row.actualCellCount, cols.length);
                return --actualRowCount && endProcess(++total);
            }
            if (!accountNo || !dtNo) return ++processed && endProcess(++total);

            accountNo = `${accountNo}`.replace(/[^a-zA-Z0-9]/g, '');
            dtNo = `${dtNo}`.replace(/[^a-zA-Z0-9]/g, '');

            const [[customer], [asset]] = await Promise.all([
                db.table("customers").where('account_no', accountNo).select(['account_no']),
                db.table("assets").where('serial_no', `${dtNo}`).select(['id', 'ext_code']),
            ]);
            if (!customer) {
                logMgs.push(`The account no "${accountNo}" specified in row ${rn} doesn't exist.`);
                return ++processed && endProcess(++total);
            }
            if (!asset) {
                logMgs.push(`The asset with DT NO "${dtNo}" specified in row ${rn} doesn't exist.`);
                return ++processed && endProcess(++total);
            }
            const customerAssets = {
                customer_id: customer.account_no,
                asset_id: asset.id,
                created_at: Utils.date.dateToMysql(),
                updated_at: Utils.date.dateToMysql()
            };
            return db.table(tableName).insert(customerAssets).then(() => {
                const headers = {'Content-type': "application/x-www-form-urlencoded"};
                const options = {
                    url: process.env.CRM_URL + "/index.php?entryPoint==customer-asset-link",
                    headers,
                    form: {account_number: accountNo, ext_code: asset.ext_code},
                    timeout: 1500
                };
                Utils.requestPromise(options, 'POST', headers).catch(console.error);
                return ++processedAsset && endProcess(++total);
            }).catch(err => {
                console.error("CustomerAssets:", err);
                return endProcess(++total);
            })
        });
    };
    //if the lock is currently released we can start processing another file
    if (!this.lock.ca) {
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
        const logMgs = [];
        const db = this.context.db();

        //onComplete is called when the file is done processing
        const onComplete = (status, update = true) => {
            deleteFile(currentFile);
            this.lock.g = false;//release the lock here
            Events.emit("upload_completed", "asset_location", status, fileName, (uploadData) ? uploadData.created_by : 0);
            return (update) ? _updateUploadStatus(this, fileName, status, JSON.stringify(logMgs)) : true;
        };

        const task = [
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

module.exports.backUpDatabase = function (s3) {
    //check if no process is currently running
    if (Object.keys(this.lock).every(val => val === true)) return setTimeout(() => this.backUpDatabase(), 10000);
    const sqlArgs = ['-u', process.env.DB_USER, `-p${process.env.DB_PASS}`, process.env.DB_DATABASE, '--single-transaction'];
    const startProcessor = function () {
        console.log(">>>>>>>>>>>>>>> Starting Database Backup Process >>>>>>>>>>>>>>>");
        const mysqldump = spawn('mysqldump', sqlArgs);
        const putParams = {
            Bucket: "mrworking-api",
            Key: `${process.env.NODE_ENV}/iforce_${Utils.date.dateToMysql(undefined, "YYYY-MM-DD H:m:ss")}_dbk.sql`,
            Body: mysqldump.stdout
        };
        s3.upload(putParams, (err, data) => {
            if (err) return console.log("DBBackUpFailed:", err);
            console.log(data, `\n\r<<<<<<<<<<<<<<<<<<<<<< DBBackupSuccessful <<<<<<<<<<<<<<<<<<<<<<<<`);
        });
    };
    return startProcessor();
};

/**
 * Read the imported customer files and create records for customers
 * @returns {*}
 */

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