const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');
const Events = require('../../../../events/events');
const Error = require('../../../../core/Utility/ErrorUtils')();

/**
 * @name MaterialLocationService
 * Created by paulex on 8/22/17.
 */
class MaterialLocationService extends ApiService {

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
    async getMaterialLocations(value, by = "id", who = {}, offset = 0, limit = 10) {
        const MaterialLocationMapper = MapperFactory.build(MapperFactory.MATERIAL_LOCATION);
        const materialLocations = await MaterialLocationMapper.findDomainRecord({by, value}, offset, limit);
        return Utils.buildResponse({data: {items: materialLocations.records}});
    }

    /**
     * @param body
     * @param who
     * @param API {API}
     * @returns {Promise<*>}
     */
    async createMaterialLocation(body = {}, who = {}, API) {
        const MaterialLocation = DomainFactory.build(DomainFactory.MATERIAL_LOCATION);
        let materialLocation = new MaterialLocation(body);

        let validator = new validate(materialLocation, materialLocation.rules(), materialLocation.customErrorMessages());

        ApiService.insertPermissionRights(materialLocation, who);

        if (validator.fails()) return Promise.reject(Error.ValidationFailure(validator.errors.all()));
        //Get Mapper
        const MaterialLocationMapper = MapperFactory.build(MapperFactory.MATERIAL_LOCATION);
        return MaterialLocationMapper.createDomainRecord(materialLocation).then(result => {
            if (!result) return Promise.reject(false);
            API.stockMovements().createStockMovement({
                material_id: materialLocation.material_id,
                group_id: materialLocation.group_id,
                quantity: materialLocation.quantity,
                type: "in",
                who: "default"
            }, who).then().catch(console.error);
            return Utils.buildResponse({data: result});
        });
    }

    /**
     *
     *
     * @param materialLocations
     * @param who
     * @param API {API}
     */
    async createMultipleMaterialLocation(materialLocations = [], who = {}, API) {
        const MaterialLocation = DomainFactory.build(DomainFactory.MATERIAL_LOCATION);
        const db = this.context.database;

        if (!Array.isArray(materialLocations)) return Promise.reject(Utils.buildResponse({status: "fail"}));

        materialLocations = materialLocations.map(loc => (new MaterialLocation(loc)));

        for (let i = 0; i < materialLocations.length; i++) {
            const materialLocation = materialLocations[i];
            let validator = new validate(materialLocation, materialLocation.rules(), materialLocation.customErrorMessages());
            if (validator.fails()) return Promise.reject(Error.ValidationFailure(validator.errors.all()));
            ApiService.insertPermissionRights(materialLocation, who);
        }

        const errors = [];
        for (let materialLocation of materialLocations) {
            materialLocation.created_at = Utils.date.dateToMysql();
            materialLocation.updated_at = materialLocation.created_at;
            const result = await Utils.upsertIncrement(db, "material_locations", materialLocation, ['quantity'])
                .catch(err => errors.push(Utils.getMysqlError(err).msg));
            //We need to create a new stock movement
            if (Array.isArray(result) && result.shift()['affectedRows'] > 0)
                API.stockMovements().createStockMovement({
                    material_id: materialLocation.material_id,
                    group_id: materialLocation.group_id,
                    quantity: materialLocation.quantity,
                    type: "in",
                    who: "default"
                }, who).then().catch(console.error);
        }
        return Utils.buildResponse({data: {items: materialLocations, errors}});
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
    async updateMaterialLocation(by, value, body = {}, who, file = [], API) {
        const MaterialLocation = DomainFactory.build(DomainFactory.MATERIAL_LOCATION);
        const MaterialLocationMapper = MapperFactory.build(MapperFactory.MATERIAL_LOCATION);

        let model = await this.context.database.table("material_locations").where(by, value).select(['assigned_to']);

        if (!model.length) return Utils.buildResponse({
            status: "fail",
            data: {message: "Material Location doesn't exist"}
        }, 400);

        model = new MaterialLocation(model.shift());

        const materialLocation = new MaterialLocation(body);

        materialLocation.assigned_to = Utils.updateAssigned(
            model.assigned_to,
            Utils.serializeAssignedTo(materialLocation.assigned_to)
        );

        return MaterialLocationMapper.updateDomainRecord({value, domain: materialLocation}).then(result => {
            return Utils.buildResponse({data: result.shift()});
        });
    }


    /**
     * We are majorly searching for material location by name
     * @param keyword
     * @param offset
     * @param limit
     * @returns {Promise.<*>}
     */
    async searchMaterialLocations(keyword, offset = 0, limit = 10) {
        const MaterialLocation = DomainFactory.build(DomainFactory.MATERIAL_LOCATION);
        let fields = [
            'id',
            'asset_type',
            'asset_type_name',
            'asset_name',
            'status',
            'group_id',
            'serial_no'
        ];
        let resultSets = this.context.database.select(fields).from('assets')
            .where('asset_name', 'like', `%${keyword}%`)
            .where("deleted_at", null)
            .orWhere('asset_type_name', 'like', `%${keyword}%`)
            .limit(parseInt(limit)).offset(parseInt(offset)).orderBy('asset_name', 'asc');

        const groups = await Utils.redisGet(this.context.persistence, "groups");


        const results = await resultSets.catch(err => (Utils.buildResponse({status: "fail", data: err}, 500)));
        let assets = results.map(item => {
            const asset = new MaterialLocation(item);
            const group = groups[item.group_id];
            const [bu, ut] = Utils.getBUAndUT(group, groups);
            asset.group = group;
            asset.business_unit = bu;
            asset.undertaking = ut.shift() || null;
            return asset;
        });
        return Utils.buildResponse({data: {items: assets}});
    }

    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteMaterialLocation(by = "id", value) {
        const MaterialLocationMapper = MapperFactory.build(MapperFactory.MATERIAL_LOCATION);
        return MaterialLocationMapper.deleteDomainRecord({by, value}).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {by, message: "Material Location deleted"}});
        });
    }
}

module.exports = MaterialLocationService;