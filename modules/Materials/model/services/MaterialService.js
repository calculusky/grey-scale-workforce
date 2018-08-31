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
    async getMaterial(value, by = "id", who = {}, offset = 0, limit = 10) {
        const MaterialMapper = MapperFactory.build(MapperFactory.MATERIAL);
        const results = await MaterialMapper.findDomainRecord({by, value}, offset, limit);
        const groups = await Utils.redisGet(this.context.persistence, "groups");
        const materials = MaterialService.addBUAndUTAttributes(results.records, groups);
        return Utils.buildResponse({data: {items: materials.records}});
    }

    /**
     * Fetch a list of Materials
     *
     * @param query
     * @param who
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getMaterials(query = {}, who = {}) {
        const Material = DomainFactory.build(DomainFactory.MATERIAL);
        const {name, measurement, unit_price: price, offset = 0, limit = 10} = query;
        const fields = ["*"];

        const resultSets = this.context.database.select(fields).from('materials');
        if (name) resultSets.where("name", name);
        if (measurement) resultSets.where("unit_of_measurement", measurement);
        if (price) resultSets.where("unit_price", price);

        resultSets.where('deleted_at', null).limit(Number(limit)).offset(Number(offset)).orderBy("id", "desc");

        const groups = await Utils.getFromPersistent(this.context, "groups", true);
        const results = await resultSets.catch(err => (Utils.buildResponse({status: "fail", data: err}, 500)));

        const materials = MaterialService.addBUAndUTAttributes(results, groups, Material);

        return Utils.buildResponse({data: {items: materials}});
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
            'name',
            'unit_of_measurement',
            'unit_price'
        ];
        let resultSets = this.context.database.select(fields).from('materials')
            .where('name', 'like', `%${keyword}%`)
            .where('unit_of_measurement', 'like', `%${keyword}%`)
            .where('unit_price', 'like', `%${keyword}%`)
            .where("deleted_at", null)
            .limit(Number(limit)).offset(Number(offset)).orderBy('name', 'asc');

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

    /**
     * @private
     *
     * @param results
     * @param groups
     * @param Material
     * @returns {*}
     */
    static addBUAndUTAttributes(results, groups, Material) {
        return results.map(item => {
            const material = (!Material || item instanceof Material) ? item : new Material(item);
            let group = groups[material.group_id];
            const [bu, ut] = Utils.getBUAndUT(group, groups);
            let grp = {};

            Object.assign(grp, group);

            if (grp['children']) delete grp['children'];
            if (bu && bu['children']) delete bu['children'];
            if (ut && ut['parent']) delete ut['parent'];

            material.group = grp;
            material.business_unit = bu;
            material.undertaking = ut.shift() || null;
            return material;
        });
    }
}

module.exports = MaterialService;