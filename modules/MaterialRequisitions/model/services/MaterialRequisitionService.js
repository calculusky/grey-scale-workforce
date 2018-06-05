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

    async getMaterialRequisitions(value, by = "id", who = {}, offset = 0, limit = 10) {
        const MaterialRequisitionMapper = MapperFactory.build(MapperFactory.MATERIAL_REQUISITION);
        const materialRequisitions = await MaterialRequisitionMapper.findDomainRecord({by, value}, offset, limit);
        return Utils.buildResponse({data: {items: materialRequisitions}});
    }

    /**
     *
     * @param body
     * @param who
     */
    createMaterialRequisition(body = {}, who = {}) {
        const MaterialRequisition = DomainFactory.build(DomainFactory.MATERIAL_REQUISITION);
        let materialReq = new MaterialRequisition(body);

        let validator = new validate(materialReq, materialReq.rules(), materialReq.customErrorMessages());

        ApiService.insertPermissionRights(materialReq, who);

        if (validator.fails()) return Promise.reject(Error.ValidationFailure(validator.errors.all()));

        //Get Mapper
        const MaterialRequisitionMapper = MapperFactory.build(MapperFactory.MATERIAL_REQUISITION);
        return MaterialRequisitionMapper.createDomainRecord(materialReq).then(materialRequisition => {
            if (!materialRequisition) return Promise.reject();
            return Utils.buildResponse({data: materialRequisition});
        });
    }


    /**
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

module.exports = MaterialRequisitionService;