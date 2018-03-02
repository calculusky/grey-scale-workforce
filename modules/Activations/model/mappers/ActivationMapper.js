/**
 * Created by paulex on 2/28/17.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class ActivationMapper extends ModelMapper {
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "activations";
        this.domainName = "Activation";
    }
}

module.exports = ActivationMapper;