/**
 * Created by paulex on 9/11/17.
 */
const fs = require("fs");
const cron = require('node-schedule');
const Excel = require('exceljs');
const Utils = require('../core/Utility/Utils');


module.exports = function main(context) {
    this.context = context;
    //lock.d for delinquency list, lock.c for customer
    this.lock = {d: false};
    //all cron jobs
    console.log('* * * * * * Registered CronJobs');
    //schedule job for running createDelinquencyList
    cron.scheduleJob('*/1 * * * *', main.createDelinquencyList.bind(this));

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
                    //TODO add the group and assigned_to
                    let delinquency = {
                        "account_no": row.getCell(colHeaderIndex['account_no']).value,
                        "current_bill": row.getCell(colHeaderIndex['current_bill']).value,
                        "arrears": row.getCell(colHeaderIndex['net_arrears']).value,
                        "created_at": Utils.date.dateToMysql(new Date(), "YYYY-MM-DD H:m:s"),
                        "updated_at": Utils.date.dateToMysql(new Date(), "YYYY-MM-DD H:m:s")
                    };

                    delinquencies.push(delinquency);
                    if (++processed == rowLen - 1) {
                        //we can release the lock here
                        this.context.database.insert(delinquencies).into("disconnection_billings").catch(r=>console.log(r));
                        deleteFile(file);
                        _updateUploadStatus(this, fileName, 4);
                        console.log("Lock has been released for delinquency processes");
                        this.lock.d = false;
                    }
                }
            });
            //if it is empty or just includes the column heads... lets delete the file and release lock
            if (rowLen <= 1) {
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
                    let status = (getRowValueOrEmpty(row, colHeaderIndex, 'status') == 'Active') ? 1 : 0;
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
                    if (++processed == rowLen - 1) {
                        //for now lets ignore duplicates... TODO handle duplicates
                        this.context.database.insert(meter_readings).into("meter_readings").catch(r=>console.log(r));
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

function _updateUploadStatus(ctx, fileName, status, message) {
    ctx.context.database.table("uploads")
        .where("file_name", fileName)
        .update({
            status: status, updated_at: Utils.date.dateToMysql(new Date(), "YYYY-MM-DD H:m:s")
        }).then(r=>console.log());
}


//Helper functions
function getRowValueOrEmpty(row, headers, key) {
    let _row = row.getCell(headers[key]);
    return (_row) ? _row.value : "";
}

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
    fs.unlink(file);
}