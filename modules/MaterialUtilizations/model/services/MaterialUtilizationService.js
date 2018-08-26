const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');
const Events = require('../../../../events/events');
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
     *
     * @param value
     * @param by
     * @param who
     * @param offset
     * @param limit
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getMaterialUtilization(value, by = "id", who = {}, offset = 0, limit = 10) {
        const db = this.context.database;
        const MaterialUtilizationMapper = MapperFactory.build(MapperFactory.MATERIAL_UTILIZATION);
        const results = await MaterialUtilizationMapper.findDomainRecord({by, value}, offset, limit);
        const materialUtilizations = results.records;

        for (const materialUtilization of materialUtilizations) {
            const task = [
                Utils.getAssignees(materialUtilization.assigned_to || [], db),
                materialUtilization.materialModel()
            ];
            const [assignedTo, material] = await Promise.all(task);

            materialUtilization.assigned_to = assignedTo;
            materialUtilization.material = material.records.shift() || {};
        }
        return Utils.buildResponse({data: {items: materialUtilizations}});
    }


    /**
     *
     * @param query
     * @param who
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getMaterialUtilizations(query, who = {}) {
        const offset = parseInt(query.offset || "0"),
            limit = parseInt(query.limit || "10"),
            workOrderId = query['work_order_id'],
            assignedTo = query['assigned_to'],
            createdBy = query['created_by'];

        const db = this.context.database;

        const materialUtilizations = [];

        let resultSet = db.select(['*']).from("material_utilizations");
        if (assignedTo) resultSet = resultSet.whereRaw(`JSON_CONTAINS(assigned_to, '{"id":${assignedTo}}')`);
        if (workOrderId) resultSet = resultSet.where('work_order_id', workOrderId);
        if (createdBy) resultSet = resultSet.where('created_by', createdBy);

        resultSet = resultSet.where('deleted_at', null).limit(limit).offset(offset).orderBy("id", "desc");

        const records = await resultSet.catch(err => {
            return Promise.reject(Utils.buildResponse(Utils.getMysqlError(err), 400));
        });

        const MaterialUtilization = DomainFactory.build(DomainFactory.MATERIAL_UTILIZATION);

        for (let materialUtilization of records) {
            materialUtilization = new MaterialUtilization(materialUtilization);
            materialUtilization.serialize(undefined, "client");

            const task = [
                Utils.getAssignees(materialUtilization.assigned_to || [], db),
                materialUtilization.materialModel()
            ];

            const [assignedTo, material] = await Promise.all(task);

            materialUtilization.assigned_to = assignedTo;
            materialUtilization['material'] = material.records.shift() || {};

            materialUtilizations.push(materialUtilization);
        }

        return Utils.buildResponse({data: {items: materialUtilizations}});
    }

    /**
     * Matrimony - Wale ft Usher
     *
     * @param body
     * @param who
     */
    createMaterialUtilization(body = {}, who = {}) {
        const MaterialUtilization = DomainFactory.build(DomainFactory.MATERIAL_UTILIZATION);
        const materialUtilization = new MaterialUtilization(body);

        materialUtilization.assigned_to = Utils.serializeAssignedTo(materialUtilization.assigned_to);

        let validator = new validate(materialUtilization, materialUtilization.rules(), materialUtilization.customErrorMessages());

        ApiService.insertPermissionRights(materialUtilization, who);

        if (validator.fails()) return Promise.reject(Error.ValidationFailure(validator.errors.all()));

        materialUtilization.work_order_id = materialUtilization.work_order_id.replace(/-/g, "").toUpperCase();
        //Get Mapper
        const MaterialUtilizationMapper = MapperFactory.build(MapperFactory.MATERIAL_UTILIZATION);
        return MaterialUtilizationMapper.createDomainRecord(materialUtilization).then(materialUtilization => {
            if (!materialUtilization) return Promise.reject(false);
            console.log(materialUtilization);
            return Utils.buildResponse({data: materialUtilization});
        });
    }


    /**
     *
     * @param materialUtilizations
     * @param who
     * @param API {API}
     * @returns {Promise<*>}
     */
    async createMultipleMaterialUtilization(materialUtilizations = [], who = {}, API) {
        const MaterialUtilization = DomainFactory.build(DomainFactory.MATERIAL_UTILIZATION);
        const db = this.context.database;

        if (!Array.isArray(materialUtilizations)) return Promise.reject(Utils.buildResponse({
            status: "fail", msg: "Expected an array of material locations."
        }));

        materialUtilizations = materialUtilizations.map(utilization => (new MaterialUtilization(utilization)));

        for (let i = 0; i < materialUtilizations.length; i++) {
            const materialUtil = materialUtilizations[i];
            let validator = new validate(materialUtil, materialUtil.rules(), materialUtil.customErrorMessages());
            if (validator.fails()) return Promise.reject(Error.ValidationFailure(validator.errors.all()));
            ApiService.insertPermissionRights(materialUtil, who);
        }
        const errors = [];
        await db.table("material_utilizations").insert(materialUtilizations).catch(err => errors.push(Utils.getMysqlError(err)));
        materialUtilizations.forEach(i => {
            if(i.assigned_to) i.assigned_to = JSON.parse(i.assigned_to)
        });
        return Utils.buildResponse({data: {items: materialUtilizations, errors}});
    }


    /**
     *
     *
     * @param by
     * @param value
     * @param body
     * @param who
     * @param file
     * @param API {API}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async updateMaterialUtilization(by, value, body = {}, who, file = [], API) {
        const MaterialUtilization = DomainFactory.build(DomainFactory.MATERIAL_UTILIZATION);
        const MaterialUtilizationMapper = MapperFactory.build(MapperFactory.MATERIAL_UTILIZATION);

        let model = await this.context.database.table("material_utilizations").where(by, value).select(['assigned_to']);

        if (!model.length) return Utils.buildResponse({
            status: "fail",
            data: {message: "Material Utilization doesn't exist"}
        }, 400);

        model = new MaterialUtilization(model.shift());

        const materialReq = new MaterialUtilization(body);

        materialReq.assigned_to = Utils.updateAssigned(model.assigned_to, Utils.serializeAssignedTo(materialReq.assigned_to));

        return MaterialUtilizationMapper.updateDomainRecord({value, domain: materialReq}).then(result => {
            return Utils.buildResponse({data: result.shift()});
        });
    }


    /**
     *
     * @param by
     * @param value
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