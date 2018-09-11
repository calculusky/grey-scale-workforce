const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const {groupBy} = require('lodash');

/**
 * @name ReportService
 * Created by paulex on 09/4/17.
 */
class ReportService {

    constructor(context) {
        this.context = context;
        MapperFactory = this.context.modelMappers;
    }

    getName() {
        return "reportService";
    }


    getBasicDashboard(who = {}) {
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        return WorkOrderMapper.getTotalWorkOderByUserAndStatus(who.sub, 1, 2, 3, 4).then(records => {
            console.log(groupBy(records, "type_id"));
            return groupBy(records, "type_id");
        }).catch(err => {

        })
    }
}

module.exports = ReportService;