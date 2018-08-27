const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');
const Events = require('../../../../events/events');
const Error = require('../../../../core/Utility/ErrorUtils')();
const _ = require("lodash");

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

        const {status, work_order_id: workOrderId, assigned_to, requested_by, offset = 0, limit = 10} = query;

        const db = this.context.database;
        let materialRequisitions = [];

        let resultSet = this.context.database.select(['*']).from("material_requisitions");
        if (assigned_to) resultSet = resultSet.whereRaw(`JSON_CONTAINS(assigned_to, '{"id":${assigned_to}}')`);
        if (status) resultSet = resultSet.where('status', status);
        if (workOrderId) resultSet = resultSet.where('work_order_id', workOrderId);
        if (requested_by) resultSet = resultSet.where('requested_by', requested_by);

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

        materialRequisitions = await __doMaterialRequisitionList(db, materialRequisitions, query);

        return Utils.buildResponse({data: {items: materialRequisitions}});
    }

    /**
     * Matrimony - Wale ft Usher
     * //TODO Validate material request: Closed work order should not have material requisition
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

        if (materialReq.work_order_id)
            materialReq.work_order_id = materialReq.work_order_id.replace(/-/g, "");

        //Get Mapper
        const MaterialRequisitionMapper = MapperFactory.build(MapperFactory.MATERIAL_REQUISITION);
        return MaterialRequisitionMapper.createDomainRecord(materialReq).then(materialRequisition => {
            if (!materialRequisition) return Promise.reject(false);
            materialRequisition.assigned_to = JSON.parse(materialRequisition.assigned_to);
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

async function __doMaterialRequisitionList(db, materialRequisitions, query = {}) {
    const materialCols = [
        'id', 'name', 'unit_of_measurement',
        'unit_price', 'total_quantity',
        'created_at', 'updated_at', 'assigned_to'
    ];
    for (const materialReq of materialRequisitions) {
        const task = [
            Utils.getAssignees(materialReq.assigned_to || [], db),
            Utils.getModels(db, "materials", materialReq['materials'], materialCols),
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

    let response = materialRequisitions;

    if (query['includeOnly'] && query['includeOnly'] === "materials") {
        response = [];
        materialRequisitions.forEach(req => response.push(req.materials));
        response = _.flattenDeep(response);
    }

    return response;
}

module.exports = MaterialRequisitionService;