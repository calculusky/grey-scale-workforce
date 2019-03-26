const DomainFactory = require('../../../DomainFactory');
const ApiService = require('../../../ApiService');
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();
let MapperFactory = null;


/**
 * @name AssetService
 * Created by paulex on 8/22/17.
 */
class AssetService extends ApiService {

    constructor(context) {
        super(context);
        this.context = context;
        MapperFactory = this.context.modelMappers;
    }

    async getAsset(value, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        const AssetMapper = MapperFactory.build(MapperFactory.ASSET);
        const results = await AssetMapper.findDomainRecord({by, value}, offset, limit);
        const groups = await this.context.getKey("groups", true);
        const assets = AssetService.addBUAndUTAttributes(results.records, groups);
        return Utils.buildResponse({data: {items: assets}});
    }

    async getAssets(query = {}, who = {}) {
        const Asset = DomainFactory.build(DomainFactory.ASSET);
        const {group_id, status, offset = 0, limit = 10} = query;
        let fields = [
            'id',
            'asset_type',
            'asset_type_name',
            'asset_name',
            'status',
            'group_id',
            'serial_no',
            'location'
        ];
        const resultSets = this.context.db().select(fields).from('assets');
        if (group_id) resultSets.where("group_id", group_id);
        if (status) resultSets.whereIn("status", status.split(","));

        resultSets.where('deleted_at', null).limit(Number(limit)).offset(Number(offset)).orderBy("id", "desc");

        const groups = await this.context.getKey("groups", true);

        const results = await resultSets.catch(err => (Utils.buildResponse({status: "fail", data: err}, 500)));

        let assets = AssetService.addBUAndUTAttributes(results, groups, Asset);
        return Utils.buildResponse({data: {items: assets}});
    }

    /**
     * Creates a new asset
     *
     * @param body
     * @param who {Session}
     */
    createAsset(body = {}, who) {
        const Asset = DomainFactory.build(DomainFactory.ASSET);
        const asset = new Asset(body);

        if (!asset.validate()) return Promise.reject(Error.ValidationFailure(asset.getErrors().all()));

        ApiService.insertPermissionRights(asset, who);

        const AssetMapper = MapperFactory.build(MapperFactory.ASSET);
        return AssetMapper.createDomainRecord(asset, who).then(staff => {
            if (!staff) return Promise.reject();
            return Utils.buildResponse({data: staff});
        });
    }

    /**
     * Updates an existing asset
     *
     * @param value
     * @param body
     * @param who {Session}
     * @param by
     * @returns {Bluebird<{data?: *, code?: *}> | * | void | Bluebird<{data?: *, code?: *} | never> | PromiseLike<{data?: *, code?: *} | never> | Promise<{data?: *, code?: *} | never>}
     */
    async updateAsset(value, body = {}, who, by = "id") {
        const Asset = DomainFactory.build(DomainFactory.ASSET);
        const AssetMapper = MapperFactory.build(MapperFactory.ASSET);
        const model = (await this.context.db()("assets").where(by, value).select()).shift();
        const domain = new Asset(body);

        if (!model) return Promise.reject(Error.RecordNotFound());

        domain.updateAssignedTo(model.assigned_to);

        return AssetMapper.updateDomainRecord({by, value, domain}, who).then(asset => {
            return Utils.buildResponse({data: asset});
        });
    }


    /**
     * We are majorly searching for asset by name
     * @param keyword
     * @param offset
     * @param limit
     * @returns {Promise.<*>}
     */
    async searchAssets(keyword, offset = 0, limit = 10) {
        const Asset = DomainFactory.build(DomainFactory.ASSET);
        let fields = [
            'id',
            'asset_type',
            'asset_type_name',
            'asset_name',
            'status',
            'group_id',
            'serial_no',
            'location'
        ];
        let resultSets = this.context.db().select(fields).from('assets')
            .where('asset_name', 'like', `%${keyword}%`)
            .where("deleted_at", null)
            .orWhere('asset_type_name', 'like', `%${keyword}%`)
            .limit(Number(limit)).offset(Number(offset)).orderBy('asset_name', 'asc');

        const groups = await this.context.getKey("groups", true);

        const results = await resultSets.catch(err => (Utils.buildResponse({status: "fail", data: err}, 500)));
        const assets = AssetService.addBUAndUTAttributes(results, groups, Asset);
        return Utils.buildResponse({data: {items: assets}});
    }

    /**
     * Gets faults that are related to the asset
     *
     * @param assetId
     * @param who
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getAssetFaults(assetId, who) {
        const Asset = DomainFactory.build(DomainFactory.ASSET);
        const asset = new Asset({id: assetId});
        const faults = (await asset.faults()).records;
        return Utils.buildResponse({data: {items: faults}});
    }

    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteAsset(by = "id", value) {
        const AssetMapper = MapperFactory.build(MapperFactory.ASSET);
        return AssetMapper.deleteDomainRecord({by, value}).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {by, message: "Asset deleted"}});
        });
    }

    /**
     * @private
     *
     * @param results
     * @param groups
     * @param Asset
     * @returns {*}
     */
    static addBUAndUTAttributes(results, groups, Asset) {
        return results.map(item => {
            const asset = (!Asset || item instanceof Asset) ? item : new Asset(item);
            let group = groups[asset.group_id];
            const [bu, ut] = Utils.getBUAndUT(group, groups);
            let grp = {};

            Object.assign(grp, group);

            if (grp['children']) delete grp['children'];
            if (bu && bu['children']) delete bu['children'];
            if (ut && ut['parent']) delete ut['parent'];

            asset.group = grp;
            asset.business_unit = bu;
            asset.undertaking = ut.shift() || null;
            return asset;
        });
    }
}

module.exports = AssetService;