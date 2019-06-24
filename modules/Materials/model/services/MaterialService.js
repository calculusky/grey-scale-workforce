const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();
const LegendService = require('../../../../processes/LegendService');
let MapperFactory = null;


/**
 * @name MaterialService
 * Created by paulex on 06/02/18.
 */
class MaterialService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
        LegendService.init(context).catch(console.error);
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
    async getMaterial(value, by = "id", who, offset = 0, limit = 10) {
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
        const results = await this.buildQuery(query).catch(() => (Error.InternalServerError));
        const extras = [this.context.getKey("groups", true), this.context.getKey("material:categories", true)];
        const [groups, categories] = await Promise.all(extras);
        const materials = MaterialService.addBUAndUTAttributes(results, groups, Material);
        materials.forEach(item => item['category'] = categories[item.category_id] || null);
        if (query.category_id) {
            const itemCode = LegendService.getItemCodeByMaterialCategoryId(query.category_id);
            const legendMaterials = await LegendService.getMaterialsByItemCode(itemCode).catch(err => {
                console.error(err);
            });
            materials.push(...legendMaterials || []);
        }
        return Utils.buildResponse({data: {items: materials}});
    }

    /**
     * Creates a material
     *
     * @param body {Object}
     * @param who {Session}
     */
    createMaterial(body = {}, who) {
        const MaterialMapper = MapperFactory.build(MapperFactory.MATERIAL);
        const Material = DomainFactory.build(DomainFactory.MATERIAL);
        const material = new Material(body);

        ApiService.insertPermissionRights(material, who);

        if (!material.validate()) return Promise.reject(Error.ValidationFailure(material.getErrors().all()));

        return MaterialMapper.createDomainRecord(material, who).then(domain => {
            if (!domain) return Promise.reject(false);
            return Utils.buildResponse({data: domain});
        });
    }

    /**
     * Updates an existing material
     *
     * @param by {String}
     * @param value {String|Number}
     * @param body {Object}
     * @param who {Session}
     * @param file {Array}
     * @param API {API}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async updateMaterial(by, value, body = {}, who, file = [], API) {
        const Material = DomainFactory.build(DomainFactory.MATERIAL);
        const MaterialMapper = MapperFactory.build(MapperFactory.MATERIAL);
        const model = (await this.context.db()("materials").where(by, value).select(['assigned_to'])).shift();
        const material = new Material(body);

        if (!model) return Promise.reject(Error.RecordNotFound());

        material.updateAssignedTo(model.assigned_to);

        return MaterialMapper.updateDomainRecord({value, domain: material}, who).then(result => {
            return Utils.buildResponse({data: result.shift()});
        });
    }

    /**
     * Searches for a material by the material name
     *
     * @param keyword {String}
     * @param offset {Number}
     * @param limit {Number}
     * @returns {Promise.<*>}
     */
    async searchMaterials(keyword, offset = 0, limit = 10) {
        const Material = DomainFactory.build(DomainFactory.MATERIAL);
        const fields = [
            'name',
            'unit_of_measurement',
            'unit_price'
        ];
        const resultSets = this.context.db().select(fields).from('materials')
            .where('name', 'like', `%${keyword}%`)
            .where('unit_of_measurement', 'like', `%${keyword}%`)
            .where('unit_price', 'like', `%${keyword}%`)
            .where("deleted_at", null)
            .limit(Number(limit)).offset(Number(offset)).orderBy('name', 'asc');

        const groups = await this.context.getKey("groups", true);

        const results = await resultSets.catch(err => (Utils.buildResponse({status: "fail", data: err}, 500)));
        const materials = results.map(item => {
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
     * @param who {Session}
     * @returns {*}
     */
    deleteMaterial(by = "id", value, who) {
        const MaterialMapper = MapperFactory.build(MapperFactory.MATERIAL);
        return MaterialMapper.deleteDomainRecord({by, value}, true, who).then(count => {
            if (!count) return Promise.reject(Error.RecordNotFound());
            return Utils.buildResponse({data: {message: "Material successfully deleted."}});
        });
    }

    /**
     * @param query {Object}
     * @returns {*}
     * @private
     */
    buildQuery(query) {
        if (typeof query !== 'object') throw new TypeError("Query parameter must be an object");

        const {
            name,
            measurement,
            unit_price: price,
            category_id,
            offset = 0,
            limit = 10
        } = query;
        const resultSets = this.context.db().select(['*']).from('materials');

        if (name) resultSets.where("name", name);
        if (category_id) resultSets.where('material_category_id', category_id);
        if (measurement) resultSets.where("unit_of_measurement", measurement);
        if (price) resultSets.where("unit_price", price);

        resultSets.where('deleted_at', null).limit(Number(limit)).offset(Number(offset)).orderBy("id", "desc");

        return resultSets;
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
            if (material instanceof Material) material.serialize(item, "client");
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