const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');
const Events = require('../../../../events/events');
const Error = require('../../../../core/Utility/ErrorUtils')();

/**
 * @name MaterialService
 * Created by paulex on 06/02/18.
 */
class MaterialService extends ApiService {

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
    async getMaterials(value, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        const MaterialMapper = MapperFactory.build(MapperFactory.MATERIAL);
        const materials = await MaterialMapper.findDomainRecord({by, value}, offset, limit);
        return Utils.buildResponse({data: {items: materials.records}});
    }

    /**
     *
     * @param body
     * @param who
     */
    createMaterial(body = {}, who = {}) {
        const Material = DomainFactory.build(DomainFactory.MATERIAL);
        let material = new Material(body);

        let validator = new validate(material, material.rules(), material.customErrorMessages());

        ApiService.insertPermissionRights(material, who);

        if (validator.fails()) return Promise.reject(Error.ValidationFailure(validator.errors.all()));

        //Get Mapper
        const MaterialMapper = MapperFactory.build(MapperFactory.MATERIAL);
        return MaterialMapper.createDomainRecord(material).then(domain => {
            if (!domain) return Promise.reject(false);
            return Utils.buildResponse({data: domain});
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
    async updateMaterial(by, value, body = {}, who, file = [], API) {
        const Material = DomainFactory.build(DomainFactory.MATERIAL);
        const MaterialMapper = MapperFactory.build(MapperFactory.MATERIAL);

        let model = await this.context.database.table("materials").where(by, value).select(['assigned_to']);

        if (!model.length) return Utils.buildResponse({status: "fail", data: {message: "Material doesn't exist"}}, 400);

        model = new Material(model.shift());

        const material = new Material(body);

        material.assigned_to = Utils.updateAssigned(model.assigned_to, Utils.serializeAssignedTo(material.assigned_to));

        return MaterialMapper.updateDomainRecord({value, domain: material}).then(result => {
            return Utils.buildResponse({data: result.shift()});
        });
    }


    /**
     * We are majorly searching for material by name
     * @param keyword
     * @param offset
     * @param limit
     * @returns {Promise.<*>}
     */
    async searchMaterials(keyword, offset = 0, limit = 10) {
        const Material = DomainFactory.build(DomainFactory.MATERIAL);
        let fields = [
            'id',
            'material_type',
            'material_type_name',
            'material_name',
            'status',
            'group_id',
            'serial_no'
        ];
        let resultSets = this.context.database.select(fields).from('materials')
            .where('material_name', 'like', `%${keyword}%`)
            .where("deleted_at", null)
            .orWhere('material_type_name', 'like', `%${keyword}%`)
            .limit(parseInt(limit)).offset(parseInt(offset)).orderBy('material_name', 'asc');

        const groups = await Utils.redisGet(this.context.persistence, "groups");


        const results = await resultSets.catch(err => (Utils.buildResponse({status: "fail", data: err}, 500)));
        let materials = results.map(item => {
            const material = new Material(item);
            const group = groups[item.group_id];
            const [bu, ut] = Utils.getBUAndUT(group, groups);
            material.group = group;
            material.business_unit = bu;
            material.undertaking = ut.shift() || null;
            return material;
        });
        return Utils.buildResponse({data: {items: materials}});
    }

    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteMaterial(by = "id", value) {
        const MaterialMapper = MapperFactory.build(MapperFactory.MATERIAL);
        return MaterialMapper.deleteDomainRecord({by, value}).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {by, message: "Material deleted"}});
        });
    }
}

module.exports = MaterialService;