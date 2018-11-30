/**
 * Created by paulex on 7/4/17.
 */

const ModelMapper = require('../../../../core/model/ModelMapper');
const Utils = require('../../../../core/Utility/Utils');


class FaultMapper extends ModelMapper {
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "faults";
        this.domainName = "Fault";
    }

    async _audit(data, who, type) {
        const newData = {};
        Object.assign(newData, data);
        for (const [key, value] of Object.entries(newData)) {
            switch (key) {
                case 'relation_id': {
                    //TODO check if the related value is an asset
                    break;
                }
                case 'category_id' || 'fault_category_id': {
                    const category = (await Utils.getFromPersistent(this.context, "fault:categories", true))[value];
                    newData[key] = category.name;
                    break;
                }
                case 'status': {
                    newData[key] = Utils.getFaultStatus(value);
                    break;
                }
                case 'priority': {
                    newData[key] = Utils.getFaultPriority(value);
                    break;
                }
                case 'labels': {
                    newData[key] = JSON.parse(value);
                    break;
                }
                case 'assigned_to': {
                    newData[key] = JSON.parse(value);
                    break;
                }
            }
        }
        super._audit(newData, who, type);
    }
}

module.exports = FaultMapper;