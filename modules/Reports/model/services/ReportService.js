let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');

/**
 * @name ReportService
 * Created by paulex on 09/4/17.
 */
class ReportService {

    constructor(context) {
        this.context = context;
        MapperFactory = this.context.modelMappers;
    }

    /**
     *
     * @param who
     * @return {Promise<{data?: *, code?: *} | never>}
     */
    getBasicDashboard(who) {
        console.log(who);
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        return WorkOrderMapper.getTotalWorkOderByUserAndStatus(who.getAuthUser().getUserId(), 2, 3, 4).then(records => {

            const _temp = {Assigned: 0, Closed: 0, Pending: 0};

            for (let i = 0; i < records.length; i++) {
                const item = records[i];
                let statusName = Utils.getWorkStatuses(item.type_id, item.status);

                if (statusName && !["Assigned", "Pending", "Closed", "Disconnected", "Reconnected"].includes(statusName)) continue;

                if (statusName && ["1", "2"].includes(item.type_id)) {
                    const match = statusName.match(/disconnected|reconnection/i);
                    if (match) statusName = "Closed";
                }

                if (!_temp[statusName]) _temp[statusName] = {count: 0};
                _temp[statusName]['count'] = (_temp[statusName]['count'] || 0) + 1;
            }

            const items = [];
            for (const [title, {count}] of Object.entries(_temp)) {
                items.push({title, count, module: "work orders", slug: title.toLowerCase()});
            }

            return Utils.buildResponse({data: {items}});
        }).catch(() => Utils.buildResponse({status: 'fail'}, 500))
    }

    /**
     * @return
     * Query {startDate, endDate}
     * {Promise<{data?: *, code?: *} | never>}
     */
    getDisconnectionOrder(query = {}) {
        /*
        const keys = Object.keys(query);
        const queryData = [];

        keys.forEach(function (item) {
            const data = JSON.parse(item);

            queryData['startDate'] = data.startDate;
            queryData['endDate'] = data.endDate;
        });
        */
        const {start_date, end_date} = query;
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        return WorkOrderMapper.getQueryDisconnectionOrder(start_date, end_date).then(records => {

            const items = [];
            records.forEach(function(value){
                items.push(value);
            });

            return Utils.buildResponse({data: items});
        }).catch(() => Utils.buildResponse({status: 'fail'}, 500))
    }
    /**
     * @return
     * Query {startDate, endDate}
     * Params {groupId}
     * {Promise<{data?: *, code?: *} | never>}
     */
    getDisconnectionOrderByGroup(groupId, query = {}) {
        const {start_date, end_date} = query;
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        return WorkOrderMapper.getQueryDisconnectionOrderByGroup(groupId, start_date, end_date).then(records => {

            const items = [];
            records.forEach(function(value){
                items.push(value);
            });

            return Utils.buildResponse({data: items});
        }).catch(() => Utils.buildResponse({status: 'fail'}, 500))
    }
    /**
     * @return
     * Query {startDate, endDate}
     * Params {groupId, buId}
     * {Promise<{data?: *, code?: *} | never>}
     */
    getDisconnectionOrderByBu(groupId, buId, query = {}) {
        const {start_date, end_date} = query;
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        return WorkOrderMapper.getQueryDisconnectionOrderByBu(groupId, buId, start_date, end_date).then(records => {

            const items = [];
            records.forEach(function(value){
                items.push(value);
            });

            return Utils.buildResponse({data: items});
        }).catch(() => Utils.buildResponse({status: 'fail'}, 500))
    }
    /**
     * @return
     * Query {startDate, endDate}
     * Params {groupId, buId, utId}
     * {Promise<{data?: *, code?: *} | never>}
     */
    getDisconnectionOrderByUt(groupId, buId, utId ,query = {}) {
        const {start_date, end_date} = query;
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        return WorkOrderMapper.getQueryDisconnectionOrderByUt(groupId, buId, utId, start_date, end_date).then(records => {

            const items = [];
            records.forEach(function(value){
                items.push(value);
            });

            return Utils.buildResponse({data: items});
        }).catch(() => Utils.buildResponse({status: 'fail'}, 500))
    }

    /**
     * @return
     * Query {dc_filter, rc_filter}
     * {Promise<{data?: *, code?: *} | never>}
     */
    getStatusLookup(query = {}) {
        const {dc_filter, rc_filter} = query;
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        return WorkOrderMapper.getQueryStatusLookup(dc_filter, rc_filter).then(records => {

            const items = [];
            records.forEach(function (value) {
                items.push(value);
            });

            return Utils.buildResponse({data: {items}});
        }).catch(() => Utils.buildResponse({status: 'fail'}, 500))
    }

    /**
     * @return
     * Query {startDate, endDate}
     * {Promise<{data?: *, code?: *} | never>}
     */
    getPerformanceIndices(query = {}) {
        const {start_date, end_date} = query;
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        return WorkOrderMapper.getQueryPerformanceIndices(start_date, end_date).then(records => {

            const items = [];
            records.forEach(function (value) {
                items.push(value);
            });

            return Utils.buildResponse({data: {items}});
        }).catch(() => Utils.buildResponse({status: 'fail'}, 500))
    }

    /**
     * @return
     * Query {startDate, endDate}
     * Params {buId}
     * {Promise<{data?: *, code?: *} | never>}
     */
    getPerformanceIndicesByBu(buId, query = {}) {
        const {start_date, end_date} = query;
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        return WorkOrderMapper.getQueryPerformanceIndicesByBu(buId, start_date, end_date).then(records => {

            const items = [];
            records.forEach(function (value) {
                items.push(value);
            });

            return Utils.buildResponse({data: {items}});
        }).catch(() => Utils.buildResponse({status: 'fail'}, 500))
    }

    /**
     * @return
     * Query {startDate, endDate}
     * Params {buId, utId}
     * {Promise<{data?: *, code?: *} | never>}
     */
    getPerformanceIndicesByUt(buId, utId, query) {
        const {start_date, end_date} = query;
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        return WorkOrderMapper.getQueryPerformanceIndicesByUt(buId, utId, start_date, end_date).then(records => {

            const items = [];
            records.forEach(function(value){
                items.push(value);
            });

            return Utils.buildResponse({data: items});
        }).catch(() => Utils.buildResponse({status: 'fail'}, 500))
    }
}

module.exports = ReportService;