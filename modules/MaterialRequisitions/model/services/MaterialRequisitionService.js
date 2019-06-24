const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();
const {flattenDeep} = require("lodash");
const LegendService = require('../../../../processes/LegendService');

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
     * @param value {String|Number}
     * @param by {String}
     * @param who {Session}
     * @param offset {Number}
     * @param limit {Number}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getMaterialRequisition(value, by = "id", who, offset = 0, limit = 10) {
        const db = this.context.database;
        const MaterialRequisitionMapper = MapperFactory.build(MapperFactory.MATERIAL_REQUISITION);
        const results = await MaterialRequisitionMapper.findDomainRecord({by, value}, offset, limit);
        const materialRequisitions = await __doMaterialRequisitionList(db, results.records);
        return Utils.buildResponse({data: {items: materialRequisitions}});
    }


    /**
     * @param query {Object}
     * @param who {Session}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getMaterialRequisitions(query, who) {
        const MaterialRequisition = DomainFactory.build(DomainFactory.MATERIAL_REQUISITION);
        const records = await this.buildQuery(query).catch(err => {
            return Promise.reject(Utils.buildResponse(Utils.getMysqlError(err), 400));
        });
        const materialRequisitions = records.map(item => new MaterialRequisition(item));

        if (!materialRequisitions.length) return Utils.buildResponse({data: {items: materialRequisitions}});

        const items = await __doMaterialRequisitionList(this.context.db(), materialRequisitions, query);

        return Utils.buildResponse({data: {items}});
    }

    /**
     * Matrimony - Wale ft Usher
     * //TODO Validate material request: Closed work order should not have material requisition
     * @param body {Object}
     * @param who {Session}
     */
    createMaterialRequisition(body = {}, who) {
        const MaterialRequisition = DomainFactory.build(DomainFactory.MATERIAL_REQUISITION);
        let materialReq = new MaterialRequisition(body);

        materialReq.serializeAssignedTo();

        if (!materialReq.validate()) return Promise.reject(Error.ValidationFailure(materialReq.getErrors().all()));
        if (materialReq.work_order_id) materialReq.work_order_id = materialReq.work_order_id.replace(/-/g, "");

        ApiService.insertPermissionRights(materialReq, who);

        const materials = materialReq.materials.map(({id, qty = 0, category = {}, source = null, source_id = null}) => ({
            id,
            qty,
            category_id: category.id,
            status: MaterialRequisitionService.MATERIAL_PENDING,
            source,
            source_id
        }));

        materialReq.materials = JSON.stringify(materials);

        const MaterialRequisitionMapper = MapperFactory.build(MapperFactory.MATERIAL_REQUISITION);
        return MaterialRequisitionMapper.createDomainRecord(materialReq, who).then(materialRequisition => {
            if (!materialRequisition) return Promise.reject(Error.InternalServerError);
            //TODO create requisition on legend
            // LegendService.requestMaterials(`${materialReq.work_order_id}-${materialRequisition.id}`, materials).then(res => {
            //     console.log(res);
            // }).catch(err=>{
            //     console.log(err);
            // });
            materialRequisition.materials = body.materials;
            materialRequisition.assigned_to = JSON.parse(materialRequisition.assigned_to);
            return Utils.buildResponse({data: materialRequisition});
        });
    }

    /**
     *
     * @param by {String}
     * @param value {String|Number}
     * @param body {Object}
     * @param who {Session}
     * @param file {Array}
     * @param API {API}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async updateMaterialRequisition(by, value, body = {}, who, file = [], API) {
        const MaterialRequisition = DomainFactory.build(DomainFactory.MATERIAL_REQUISITION);
        const MaterialRequisitionMapper = MapperFactory.build(MapperFactory.MATERIAL_REQUISITION);
        const model = (await this.context.db().table("material_requisitions").where(by, value).select(['assigned_to'])).shift();

        if (!model) return Promise.reject(Error.RecordNotFound());

        const materialReq = new MaterialRequisition(body);

        materialReq.updateAssignedTo(model.assigned_to);

        return MaterialRequisitionMapper.updateDomainRecord({value, domain: materialReq}, who).then(result => {
            return Utils.buildResponse({data: result.shift()});
        });
    }


    /**
     *
     * @param by {String}
     * @param value {String|Number}
     * @param who {Session}
     * @returns {*}
     */
    deleteMaterialRequisition(by = "id", value, who) {
        const MaterialRequisitionMapper = MapperFactory.build(MapperFactory.MATERIAL_REQUISITION);
        return MaterialRequisitionMapper.deleteDomainRecord({by, value}, true, who).then(count => {
            if (!count) return Promise.reject(Error.RecordNotFound());
            return Utils.buildResponse({data: {message: "Material Requisition deleted successfully."}});
        });
    }

    /**
     * @param query {Object}
     * @returns {*}
     */
    buildQuery(query) {
        const {status, work_order_id: workOrderId, assigned_to, requested_by, offset = 0, limit = 10} = query;
        const resultSet = this.context.db().select(['*']).from("material_requisitions");
        if (assigned_to) resultSet.whereRaw(`JSON_CONTAINS(assigned_to, '{"id":${assigned_to}}')`);
        if (status) resultSet.where('status', status);
        if (workOrderId) resultSet.where('work_order_id', `${workOrderId}`.replace(/-/g, ""));
        if (requested_by) resultSet.where('requested_by', requested_by);
        resultSet.where('deleted_at', null).limit(Number(limit)).offset(Number(offset)).orderBy("id", "desc");

        return resultSet;
    }
}

async function __doMaterialRequisitionList(db, materialRequisitions, query = {}) {
    for (const materialReq of materialRequisitions) {
        const task = [materialReq.getAssignedUsers(db), materialReq.getMaterials(db), materialReq.requestedBy()];
        const [assignedTo, materials, reqBy] = await Promise.all(task);

        materialReq.materials = await materialReq.materials.reduce(async (acc, curr) => {
            const _acc = await acc;
            if (curr['source'] !== 'ie_legend') {
                const item = materials.find(i => curr.id === i.id);
                if (item) {
                    item.qty = curr['qty'];
                    _acc.push(item);
                }
            } else {
                const item = await LegendService.getMaterialByTypeCodeAndItemCode(curr['category_id'], curr['source_id']).catch(console.error);
                if (item) {
                    item['qty'] = curr['qty'];
                    item['status'] = curr['status'];
                    item['category_id'] = curr['category_id'];
                }
                _acc.push(item || curr);
            }
            return Promise.resolve(_acc);
        }, Promise.resolve([]));

        materialReq.assigned_to = assignedTo;
        materialReq.requested_by_user = reqBy.records.shift() || {};
    }
    let response = materialRequisitions;

    if (query['includeOnly'] && query['includeOnly'] === "materials") {
        response = [];
        materialRequisitions.forEach(req => response.push(req.materials));
        response = flattenDeep(response);
    }
    return response;
}

MaterialRequisitionService.MATERIAL_PENDING = "PENDING";
MaterialRequisitionService.MATERIAL_APPROVED = "APPROVED";

module.exports = MaterialRequisitionService;