const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');
const Events = require('../../../../events/events');
const Error = require('../../../../core/Utility/ErrorUtils')();

/**
 * @name MaterialRequisitionService
 * Created by paulex on 8/22/17.
 */
class MaterialRequisitionService extends ApiService {

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
    async getMaterialRequisition(value, by = "id", who = {}, offset = 0, limit = 10) {
        const db = this.context.database;
        const MaterialRequisitionMapper = MapperFactory.build(MapperFactory.MATERIAL_REQUISITION);
        const results = await MaterialRequisitionMapper.findDomainRecord({by, value}, offset, limit);

        const materialRequisitions = await __doMaterialRequisitionList(db, results.records);

        return Utils.buildResponse({data: {items: materialRequisitions}});
    }


    /**
     *
     * @param query
     * @param who
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getMaterialRequisitions(query, who = {}) {
        const offset = parseInt(query.offset || "0"),
            limit = parseInt(query.limit || "10"),
            status = query.status,
            workOrderId = query['work_order_id'],
            assignedTo = query['assigned_to'],
            requestedBy = query['requested_by'];

        const db = this.context.database;
        let materialRequisitions = [];

        let resultSet = this.context.database.select(['*']).from("material_requisitions");
        if (assignedTo) resultSet = resultSet.whereRaw(`JSON_CONTAINS(assigned_to, '{"id":${assignedTo}}')`);
        if (status) resultSet = resultSet.where('status', status);
        if (workOrderId) resultSet = resultSet.where('work_order_id', workOrderId);
        if (requestedBy) resultSet = resultSet.where('requested_by', requestedBy);

        resultSet = resultSet.where('deleted_at', null).limit(limit).offset(offset).orderBy("id", "desc");

        const records = await resultSet.catch(err => {
            return Promise.reject(Utils.buildResponse(Utils.getMysqlError(err), 400));
        });

        const MaterialRequisition = DomainFactory.build(DomainFactory.MATERIAL_REQUISITION);

        records.forEach(record => {
            const domain = new MaterialRequisition(record);
            domain.serialize(undefined, "client");
            materialRequisitions.push(domain);
        });

        if (!records.length) return Utils.buildResponse({data: {items: materialRequisitions}});

        materialRequisitions = await __doMaterialRequisitionList(db, materialRequisitions);

        return Utils.buildResponse({data: {items: materialRequisitions}});
    }

    /**
     * Matrimony - Wale ft Usher
     *
     * @param body
     * @param who
     */
    createMaterialRequisition(body = {}, who = {}) {
        const MaterialRequisition = DomainFactory.build(DomainFactory.MATERIAL_REQUISITION);
        let materialReq = new MaterialRequisition(body);

        materialReq.assigned_to = Utils.serializeAssignedTo(materialReq.assigned_to);

        let validator = new validate(materialReq, materialReq.rules(), materialReq.customErrorMessages());

        ApiService.insertPermissionRights(materialReq, who);

        if (validator.fails()) return Promise.reject(Error.ValidationFailure(validator.errors.all()));

        //Get Mapper
        const MaterialRequisitionMapper = MapperFactory.build(MapperFactory.MATERIAL_REQUISITION);
        return MaterialRequisitionMapper.createDomainRecord(materialReq).then(materialRequisition => {
            if (!materialRequisition) return Promise.reject(false);
            return Utils.buildResponse({data: materialRequisition});
        });
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
    async updateMaterialRequisition(by, value, body = {}, who, file = [], API) {
        const MaterialRequisition = DomainFactory.build(DomainFactory.MATERIAL_REQUISITION);
        const MaterialRequisitionMapper = MapperFactory.build(MapperFactory.MATERIAL_REQUISITION);

        let model = await this.context.database.table("material_requisitions").where(by, value).select(['assigned_to']);

        if (!model.length) return Utils.buildResponse({
            status: "fail",
            data: {message: "Material Requisition doesn't exist"}
        }, 400);

        model = new MaterialRequisition(model.shift());

        const materialReq = new MaterialRequisition(body);

        materialReq.assigned_to = Utils.updateAssigned(model.assigned_to, Utils.serializeAssignedTo(materialReq.assigned_to));

        return MaterialRequisitionMapper.updateDomainRecord({value, domain: materialReq}).then(result => {
            return Utils.buildResponse({data: result.shift()});
        });
    }


    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteMaterialRequisition(by = "id", value) {
        const MaterialRequisitionMapper = MapperFactory.build(MapperFactory.MATERIAL_REQUISITION);
        return MaterialRequisitionMapper.deleteDomainRecord({by, value}).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {by, message: "Material Requisition deleted"}});
        });
    }
}

async function __doMaterialRequisitionList(db, materialRequisitions) {
    for (const materialReq of materialRequisitions) {
        const task = [
            Utils.getAssignees(materialReq.assigned_to || [], db),
            Utils.getModels(db, "materials", materialReq['materials'], ['id', 'name']),
            materialReq.requestedBy(),
        ];
        const [assignedTo, materials, reqBy] = await Promise.all(task);

        materialReq.assigned_to = assignedTo;
        materialReq.materials = materials.map((mat, i) => {
            mat.qty = materialReq.materials[i]['qty'];
            return mat;
        });
        materialReq.requested_by = reqBy.records.shift() || {};
    }
    return materialRequisitions;
}

module.exports = MaterialRequisitionService;