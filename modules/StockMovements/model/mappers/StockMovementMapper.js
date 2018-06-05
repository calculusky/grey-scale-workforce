/**
 * Created by paulex on 6/05/18.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class StockMovementMapper extends ModelMapper {
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "stock_movements";
        this.domainName = "StockMovement";
    }
}

module.exports = StockMovementMapper;