const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();

/**
 * @name MaterialUtilizationService
 * Created by paulex on 6/19/18.
 */
class MaterialUtilizationService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }

    /**
     * Creates a material utilization
     *
     * @param body {Object}
     * @param who {Session}
     */
    createMaterialUtilization(body = {}, who) {
        const MaterialUtilizationMapper = MapperFactory.build(MapperFactory.MATERIAL_UTILIZATION);
        const MaterialUtilization = DomainFactory.build(DomainFactory.MATERIAL_UTILIZATION);
        const materialUtilization = new MaterialUtilization(body);

        materialUtilization.serializeAssignedTo();

        if (!materialUtilization.validate()) return Promise.reject(Error.ValidationFailure(materialUtilization.getErrors().all()));

        ApiService.insertPermissionRights(materialUtilization, who);

        return MaterialUtilizationMapper.createDomainRecord(materialUtilization, who).then(materialUtilization => {
            if (!materialUtilization) return Promise.reject(Error.InternalServerError);
            return Utils.buildResponse({data: materialUtilization});
        });
    }

    /**
     *
     * @param body {Array}
     * @param who {Session}
     * @param API {API}
     * @returns {Promise<*>}
     */
    async createMultipleMaterialUtilization(body = [], who, API) {
        const MaterialUtilizationMapper = MapperFactory.build(MapperFactory.MATERIAL_UTILIZATION);
        const MaterialUtilization = DomainFactory.build(DomainFactory.MATERIAL_UTILIZATION);

        if (!Array.isArray(body)) return Promise.reject(Error.ValidationFailure({body: ["request body must be an array of material utilizations."]}));

        const materialUtilizations = body.map(utilization => (new MaterialUtilization(utilization)));

        for (let i = 0; i < materialUtilizations.length; i++) {
            const materialUtil = materialUtilizations[i];
            if (!materialUtil.validate()) return Promise.reject(Error.ValidationFailure(materialUtil.getErrors().all()));
            ApiService.insertPermissionRights(materialUtil, who);
        }

        await MaterialUtilizationMapper.createDomainRecord(null, materialUtilizations);

        materialUtilizations.forEach(i => {
            if (i.assigned_to) i.assigned_to = JSON.parse(i.assigned_to)
        });

        return Utils.buildResponse({data: {items: materialUtilizations}});
    }


    /**
     *
     * @param value {String|Number}
     * @param by {String}
     * @param who {Session}
     * @param offset {Number}
     * @param limit {Number}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getMaterialUtilization(value, by = "id", who, offset = 0, limit = 10) {
        const MaterialUtilizationMapper = MapperFactory.build(MapperFactory.MATERIAL_UTILIZATION);
        const results = await MaterialUtilizationMapper.findDomainRecord({by, value}, offset, limit);
        const materialUtilizations = results.records;

        for (const materialUtilization of materialUtilizations) {
            const task = [materialUtilization.getAssignedUsers(this.context.db()), materialUtilization.getMaterial()];
            const [assignedTo, material] = await Promise.all(task);
            materialUtilization.assigned_to = assignedTo;
            materialUtilization.material = material.records.shift() || {};
        }
        return Utils.buildResponse({data: {items: materialUtilizations}});
    }

    /**
     * @param query {Object}
     * @returns {*}
     */
    buildQuery(query) {
        const offset = parseInt(query.offset || "0"),
            limit = parseInt(query.limit || "10"),
            workOrderId = query['work_order_id'],
            assignedTo = query['assigned_to'],
            createdBy = query['created_by'];

        const resultSet = this.context.db().select(['*']).from("material_utilizations");

        if (assignedTo) resultSet.whereRaw(`JSON_CONTAINS(assigned_to, '{"id":${assignedTo}}')`);
        if (workOrderId) resultSet.where('work_order_id', workOrderId);
        if (createdBy) resultSet.where('created_by', createdBy);

        resultSet.where('deleted_at', null).limit(limit).offset(offset).orderBy("id", "desc");

        return resultSet;
    }

    /**
     * Get material utilizations
     *
     * @param query {Object}
     * @param who {Session}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getMaterialUtilizations(query, who) {
        const MaterialUtilization = DomainFactory.build(DomainFactory.MATERIAL_UTILIZATION);
        const materialUtilizations = [];
        const records = await this.buildQuery(query).catch(err => {
            return Promise.reject(Utils.buildResponse(Utils.getMysqlError(err), 400));
        });

        for (let materialUtilization of records) {
            materialUtilization = new MaterialUtilization(materialUtilization);
            const task = [materialUtilization.getAssignedUsers(this.context.db()), materialUtilization.getMaterial()];
            const [assignedTo, material] = await Promise.all(task);
            materialUtilization.assigned_to = assignedTo;
            materialUtilization['material'] = material.records.shift() || {};
            materialUtilizations.push(materialUtilization);
        }
        return Utils.buildResponse({data: {items: materialUtilizations}});
    }


    /**
     * Update material utilizations
     *
     * @param by {String}
     * @param value {String|Number}
     * @param body {Object}
     * @param who {Session}
     * @param file {Array}
     * @param API {API}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async updateMaterialUtilization(by, value, body = {}, who, file = [], API) {
        const MaterialUtilizationMapper = MapperFactory.build(MapperFactory.MATERIAL_UTILIZATION);
        const MaterialUtilization = DomainFactory.build(DomainFactory.MATERIAL_UTILIZATION);
        const model = (await this.context.db().table("material_utilizations").where(by, value).select(['assigned_to'])).shift();

        if (!model) return Promise.reject(Error.RecordNotFound());

        const materialReq = new MaterialUtilization(body);

        materialReq.updateAssignedTo(model.assigned_to);

        return MaterialUtilizationMapper.updateDomainRecord({by, value, domain: materialReq}, who).then(result => {
            return Utils.buildResponse({data: result.shift()});
        });
    }


    /**
     *
     * @param by {String}
     * @param value {String|Value}
     * @returns {*}
     */
    deleteMaterialUtilization(by = "id", value) {
        const MaterialUtilizationMapper = MapperFactory.build(MapperFactory.MATERIAL_UTILIZATION);
        return MaterialUtilizationMapper.deleteDomainRecord({by, value}).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {by, message: "Material Utilization deleted"}});
        });
    }
}

module.exports = MaterialUtilizationService;