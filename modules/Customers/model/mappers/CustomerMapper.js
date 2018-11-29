/**
 * Created by paulex on 8/22/17.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class CustomerMapper extends ModelMapper{
    constructor(context) {
        super(context);
        this.primaryKey = "account_no";
        this.tableName = "customers";
        this.domainName = "Customer";
    }

    _audit(){}
}

module.exports = CustomerMapper;