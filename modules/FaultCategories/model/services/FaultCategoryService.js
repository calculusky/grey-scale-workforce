const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();
const validate = require('validatorjs');
const Events = require('../../../../events/events');
let MapperFactory = null;


/**
 * @name FaultCategoryService
 * Created by paulex on 07/10/18.
 */
class FaultCategoryService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }


    async getFaultCategories(query = {}, who = {}) {
        const offset = parseInt(query.offset || "0"),
            limit = parseInt(query.limit || "10"),
            type = query['type'],
            weight = query['weight'];

        let faultCategories = await Utils.getFromPersistent(this.context, "fault:categories", true);
        const items = [];
        Object.entries(faultCategories).forEach(([key, value]) => {
            if (value.hasOwnProperty("children")) delete  value['children'];
            items.push(value);
        });
        return Utils.buildResponse({data: {items}});
    }
}

module.exports = FaultCategoryService;