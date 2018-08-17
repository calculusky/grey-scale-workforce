const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');

/**
 * @name AssetService
 * Created by paulex on 8/22/17.
 */
class AssetService {

    constructor(context) {
        this.context = context;
        MapperFactory = this.context.modelMappers;
    }

    async getAsset(value, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        const AssetMapper = MapperFactory.build(MapperFactory.ASSET);
        const results = await AssetMapper.findDomainRecord({by, value}, offset, limit);
        const groups = await Utils.redisGet(this.context.persistence, "groups");
        const assets = AssetService.addBUAndUTAttributes(results.records, groups);
        return Utils.buildResponse({data: {items: assets}});
    }

    async getAssets(query = {}, who = {}) {
        const Asset = DomainFactory.build(DomainFactory.ASSET);
        const {group_id, offset = 0, limit = 10} = query;
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
        let resultSets = this.context.database.select(fields).from('assets');
        if (group_id) resultSets.where("group_id", group_id);

        resultSets.where('deleted_at', null).limit(Number(limit)).offset(Number(offset)).orderBy("id", "desc");

        const groups = await Utils.redisGet(this.context.persistence, "groups");

        const results = await resultSets.catch(err => (Utils.buildResponse({status: "fail", data: err}, 500)));

        let assets = AssetService.addBUAndUTAttributes(results, groups, Asset);
        return Utils.buildResponse({data: {items: assets}});
    }

    /**
     *
     * @param body
     * @param who
     */
    createAsset(body = {}, who = {}) {
        const Asset = DomainFactory.build(DomainFactory.ASSET);
        body['api_instance_id'] = who.api;
        let staff = new Asset(body);


        //Get Mapper
        const AssetMapper = MapperFactory.build(MapperFactory.ASSET);
        return AssetMapper.createDomainRecord(staff).then(staff => {
            if (!staff) return Promise.reject();
            return Utils.buildResponse({data: staff});
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
        let resultSets = this.context.database.select(fields).from('assets')
            .where('asset_name', 'like', `%${keyword}%`)
            .where("deleted_at", null)
            .orWhere('asset_type_name', 'like', `%${keyword}%`)
            .limit(parseInt(limit)).offset(parseInt(offset)).orderBy('asset_name', 'asc');

        const groups = await Utils.redisGet(this.context.persistence, "groups");

        const results = await resultSets.catch(err => (Utils.buildResponse({status: "fail", data: err}, 500)));
        let assets = results.map(item => {
            const asset = new Asset(item);
            let group = groups[asset.group_id];
            const [bu, ut] = Utils.getBUAndUT(group, groups);
            let grp = {};

            Object.assign(grp, group);

            if (grp['children']) delete grp['children'];
            if (bu['children']) delete bu['children'];
            if (ut['parent']) delete ut['parent'];

            asset.group = grp;
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
            if (bu['children']) delete bu['children'];
            if (ut['parent']) delete ut['parent'];

            asset.group = grp;
            asset.business_unit = bu;
            asset.undertaking = ut.shift() || null;
            return asset;
        });
    }
}

module.exports = AssetService;