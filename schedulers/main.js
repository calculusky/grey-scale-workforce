/**
 * Created by paulex on 9/11/17.
 */
const fs = require("fs");
const cron = require('node-schedule');
const Excel = require('exceljs');
const Utils = require('../core/Utility/Utils');


module.exports = function main(context) {
    this.context = context;
    this.lock = {d: false};
    //all cron jobs
    console.log('* * * * * * Registered CronJobs');

    //schedule job for running createDelinquencyList
    cron.scheduleJob('*/15 * * * *', main.createDelinquencyList.bind(this));

    //schedule job for creating meter readings
    // cron.scheduleJob('*/1 * * * *', main.createMeterReadings.bind(this));

    // schedule job for creating meter readings
    cron.scheduleJob('*/30 * * * *', main.createCustomers.bind(this));
};

/**
 * Read the imported delinquency list and create a record on the database
 * @returns {*}
 */
module.exports.createDelinquencyList = function () {
    //lets retrieve the path where delinquency list is saved
    const directory = `${this.context.config.storage.path}/uploads/work`;
    const workbook = new Excel.Workbook();
    let currentFile = null;

    //This function processes the excel document
    const startProcessor = (file/*.xlsx*/, fileName)=> {
        this.lock.d = true;
        currentFile = file;
        workbook.xlsx.readFile(file).then(()=> {
            console.log("PROCESSING:", currentFile);
            const workSheet = workbook.getWorksheet(1);
            let rowLen = workSheet.rowCount, processed = 0, columnLen = workSheet.actualColumnCount;
            let colHeaderIndex = {};
            let delinquencies = [];
            //iterate through each row
            workSheet.eachRow((row, rn)=> {
                //the first row returned is the column header so lets skip
                if (rn == 1) colHeaderIndex = getColumnsByNameIndex(row, columnLen);
                else if (rn > 1) {
                    const currentBill = row.getCell(colHeaderIndex['current_bill']).value;
                    const netArrears = row.getCell(colHeaderIndex['net_arrears']).value;
                    const minAmount = (0.25 * netArrears) + currentBill;
                    const total = minAmount + 2000.00;
                    console.log(currentBill);
                    let delinquency = {
                        "account_no": row.getCell(colHeaderIndex['account_no']).value,
                        "customer_name": row.getCell(colHeaderIndex['customer_name']).value,
                        "current_bill": currentBill,
                        "arrears": row.getCell(colHeaderIndex['net_arrears']).value,
                        "min_amount_payable": minAmount,
                        "dt": row.getCell(colHeaderIndex['dt']).value,
                        "feeders": row.getCell(colHeaderIndex['feeders']).value,
                        "total_amount_payable": total,
                        "created_at": Utils.date.dateToMysql(new Date(), "YYYY-MM-DD H:m:s"),
                        "updated_at": Utils.date.dateToMysql(new Date(), "YYYY-MM-DD H:m:s")
                    };
                    delinquencies.push(delinquency);
                    if (++processed == rowLen - 1) {
                        //we can release the lock here
                        this.context.database.insert(delinquencies).into("delinquency_lists").catch(r=>console.log(r));
                        deleteFile(file);
                        _updateUploadStatus(this, fileName, 4);
                        console.log("Lock has been released for delinquency processes");
                        this.lock.d = false;
                    }
                }
            });
            //if it is empty or just includes the column heads... lets delete the file and release lock
            if (rowLen == 0 || rowLen == 1) {
                deleteFile(file);
                _updateUploadStatus(this, fileName, 4);
                //we can release the lock here
                console.log("Lock has been released for work orders processes.. there was nothing to do");
                this.lock.d = false;
            }
        }).catch(err=> {
            //should in-case an error occurs we can release the lock to allow a retry
            _updateUploadStatus(this, fileName, 3);
            deleteFile(file);
            this.lock.d = false;
            console.log(err);
        });
    };
    //if the lock is currently released we can start processing another file
    if (!this.lock.d) {
        return fs.readdir(directory, (err, files)=> {
            if (err) return;
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

    const startProcessor = (file/*.xlsx*/, fileName)=> {
        this.lock.c = true;
        _updateUploadStatus(this, fileName, 2);
        currentFile = file;
        workbook.xlsx.readFile(file).then(()=> {
            const workSheet = workbook.getWorksheet(1);
            let rowLen = workSheet.rowCount, processed = 0, columnLen = workSheet.actualColumnCount;
            let colHeaderIndex = {};
            let customers = [];
            //iterate through each row
            workSheet.eachRow((row, rn)=> {
                //the first row returned is the column header so lets skip
                //for the first row we need to get all the column head
                //TODO we should be able to validate the columns supplied
                if (rn == 1) colHeaderIndex = getColumnsByNameIndex(row, columnLen);
                else if (rn > 1) {
                    //so we should basically know the columns we are expecting since we provided the template
                    //lets build the customer data
                    let status = (row.getCell(colHeaderIndex['status']).value.trim() == 'Active') ? 1 : 0;
                    let customer = {
                        "account_no": row.getCell(colHeaderIndex['account_no']).value,
                        "old_account_no": row.getCell(colHeaderIndex['old_account_no']).value,
                        "meter_no": row.getCell(colHeaderIndex['meter_no']).value,
                        "first_name": row.getCell(colHeaderIndex['first_name']).value,
                        "last_name": row.getCell(colHeaderIndex['last_name']).value,
                        "email": row.getCell(colHeaderIndex['email']).value.text,
                        "customer_name": row.getCell(colHeaderIndex['customer_name']).value,
                        status,
                        "plain_address": row.getCell(colHeaderIndex['address']).value,
                        "customer_type": row.getCell(colHeaderIndex['type']).value,
                        "tariff": row.getCell(colHeaderIndex['tariff']).value,
                        "created_at": Utils.date.dateToMysql(new Date(), "YYYY-MM-DD H:m:s"),
                        "updated_at": Utils.date.dateToMysql(new Date(), "YYYY-MM-DD H:m:s")
                    };

                    //get it ready for batch insert
                    customers.push(customer);
                    if (++processed == rowLen - 1) {
                        //for now lets ignore duplicates... TODO handle duplicates
                        this.context.database.insert(customers).into("customers").catch(r=>console.log());
                        deleteFile(file);
                        _updateUploadStatus(this, fileName, 4);
                        //we can release the lock here
                        console.log(`Lock has been released for customers process... I imported ${rowLen - 1} customer(s)`);
                        this.lock.c = false;
                    }
                }
            });
            //if it is empty or just includes the column heads... lets delete the file and release lock
            if (rowLen == 0 || rowLen == 1) {
                deleteFile(file);
                _updateUploadStatus(this, fileName, 4);
                //we can release the lock here
                console.log("Lock has been released for customers processes.. there was nothing to do");
                this.lock.c = false;
            }
        }).catch(err=> {
            //should in-case an error occurs we can release the lock to allow a retry
            _updateUploadStatus(this, fileName, 3);
            this.lock.c = false;
            console.log(err)
        });
    };
    //if the lock is currently released we can start processing another file
    if (!this.lock.c) {
        return fs.readdir(directory, (err, files)=> {
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

    const startProcessor = (file/*.xlsx*/, fileName)=> {
        this.lock.m = true;
        _updateUploadStatus(this, fileName, 2);
        currentFile = file;
        workbook.xlsx.readFile(file).then(()=> {
            const workSheet = workbook.getWorksheet(1);
            let rowLen = workSheet.rowCount, processed = 0, columnLen = workSheet.actualColumnCount;
            let colHeaderIndex = {};
            let meter_readings = [];
            //iterate through each row
            workSheet.eachRow((row, rn)=> {
                //the first row returned is the column header so lets skip
                //for the first row we need to get all the column head
                //TODO we should be able to validate the columns supplied
                if (rn == 1) colHeaderIndex = getColumnsByNameIndex(row, columnLen);
                else if (rn > 1) {
                    //so we should basically know the columns we are expecting since we provided the template
                    //lets build the customer data
                    let meter_reading = {};

                    //get it ready for batch insert
                    meter_readings.push(meter_reading);
                    if (++processed == rowLen - 1) {
                        //for now lets ignore duplicates... TODO handle duplicates
                        this.context.database.insert(meter_readings).into("meter_readings").catch(r=>console.log());
                        deleteFile(file);
                        _updateUploadStatus(this, fileName, 4);
                        //we can release the lock here
                        console.log(`Lock has been released for meter readings process... I imported ${rowLen - 1} meter_reading(s)`);
                        this.lock.m = false;
                    }
                }
            });
            //if it is empty or just includes the column heads... lets delete the file and release lock
            if (rowLen == 0 || rowLen == 1) {
                deleteFile(file);
                _updateUploadStatus(this, fileName, 4);
                //we can release the lock here
                console.log("Lock has been released for meter readings process.. there was nothing to do");
                this.lock.m = false;
            }
        }).catch(err=> {
            //should in-case an error occurs we can release the lock to allow a retry
            _updateUploadStatus(this, fileName, 3);
            this.lock.m = false;
            console.log(err)
        });
    };

    //if the lock is currently released we can start processing another file
    if (!this.lock.m) {
        return fs.readdir(directory, (err, files)=> {
            if (err) return;
            //start processing the files.. we are processing one file at a time from a specific folder
            //TODO check that this files are indeed excel files e.g xlsx or csv
            const fileName = files.shift();
            if (fileName) startProcessor(`${directory}/${fileName}`, fileName);
        });
    }
    console.log("Lock for Meter Reading transaction is held... i'll be waiting till it is released!!!")
};

function _updateUploadStatus(ctx, fileName, status) {
    ctx.context.database.table("uploads")
        .where("file_name", fileName)
        .update({
            status: status, updated_at: Utils.date.dateToMysql(new Date(), "YYYY-MM-DD H:m:s")
        }).then(r=>console.log());
}

function getColumnsByNameIndex(row, colLen) {
    const colHeaderIndex = {};
    for (let i = 0; i < colLen; i++) {
        let colName = row.getCell(i + 1).value.replace(/ /g, "_").toLowerCase();
        colHeaderIndex[colName] = i + 1;
    }
    return colHeaderIndex;
}

function deleteFile(file) {
    fs.unlink(file);
}