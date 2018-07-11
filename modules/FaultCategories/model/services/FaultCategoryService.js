const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
const Utils = require('../../../../core/Utility/Utils');
// const Error = require('../../../../core/Utility/ErrorUtils')();
// const validate = require('validatorjs');
// const Events = require('../../../../events/events');
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

    /**
     *
     *
     * @param query
     * @param who
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getFaultCategories(query = {}, who = {}) {
        const offset = (query.offset) ? parseInt(query.offset) : undefined,
            limit = (query.limit) ? parseInt(query.limit) : undefined,
            type = query['type'],
            weight = query['weight'];

        const faultCategories = await Utils.getFromPersistent(this.context, "fault:categories", true);

        let items = [];
        Object.entries(faultCategories).forEach(([key, value]) => {
            if (value.hasOwnProperty("children")) delete  value['children'];
            if (type && value['type'].toLowerCase() !== type.toLowerCase()) return;
            if (weight && value['weight'] !== weight) return;
            items.push(value);
        });

        if (offset && limit) items = items.slice(offset, offset + limit);

        return Utils.buildResponse({data: {items}});
    }
}

module.exports = FaultCategoryService;