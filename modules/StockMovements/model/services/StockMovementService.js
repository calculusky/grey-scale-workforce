const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');
const Error = require('../../../../core/Utility/ErrorUtils')();

/**
 * @todo TEST
 * @name StockMovementService
 * Created by paulex on 6/05/18.
 */
class StockMovementService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }

    /**
     *
     * @param value
     * @param by
     * @param who
     * @param offset
     * @param limit
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getStockMovements(value, by = "id", who = {}, offset = 0, limit = 10) {
        const StockMovementMapper = MapperFactory.build(MapperFactory.STOCK_MOVEMENT);
        const stockMovements = await StockMovementMapper.findDomainRecord({by, value}, offset, limit);
        return Utils.buildResponse({data: {items: stockMovements.records}});
    }

    /**
     *
     * @param body
     * @param who
     */
    async createStockMovement(body = {}, who = {}) {
        const StockMovement = DomainFactory.build(DomainFactory.STOCK_MOVEMENT);
        const stockMovement = new StockMovement(body);

        if(!stockMovement.validate()) return Promise.reject(Error.ValidationFailure(stockMovement.getErrors().all()));

        ApiService.insertPermissionRights(stockMovement, who);

        const StockMovementMapper = MapperFactory.build(MapperFactory.STOCK_MOVEMENT);
        return StockMovementMapper.createDomainRecord(stockMovement, who).then(result => {
            if (!result) return Promise.reject(Error.InternalServerError);
            return Utils.buildResponse({data: result});
        });
    }

    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteStockMovement(by = "id", value) {
        const StockMovementMapper = MapperFactory.build(MapperFactory.STOCK_MOVEMENT);
        return StockMovementMapper.deleteDomainRecord({by, value}).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {by, message: "StockMovement deleted"}});
        });
    }
}

module.exports = StockMovementService;