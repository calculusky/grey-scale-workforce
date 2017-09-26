const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Password = require('../../../../core/Utility/Password');
// const Util = require('../../../../core/Utility/MapperUtil');
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

    getName() {
        return "assetService";
    }

    getAssets(value, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        const AssetMapper = MapperFactory.build(MapperFactory.ASSET);
        var executor = (resolve, reject)=> {
            AssetMapper.findDomainRecord({by, value}, offset, limit)
                .then(result=> {
                    let assets = result.records;
                    let processed = 0;
                    let rowLen = assets.length;

                    assets.forEach(asset=> {
                        asset.user().then(res=> {
                            asset.user = res.records.shift();
                            if (++processed == rowLen)
                                return resolve(Utils.buildResponse({data: {items: result.records}}));
                        }).catch(err=> {
                            return reject(err)
                        })
                    })
                })
                .catch(err=> {
                    return reject(err);
                });
        };
        return new Promise(executor)
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
        return AssetMapper.createDomainRecord(staff).then(staff=> {
            if (!staff) return Promise.reject();
            return Utils.buildResponse({data: staff});
        });
    }


    /**
     * We are majorly searching for asset by name
     * @param keyword
     * @returns {Promise.<Customer>}
     */
    searchAssets(keyword) {
        const Customer = DomainFactory.build(DomainFactory.ASSET);
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
            .where('asset_name', 'like', `%${keyword}%`).orWhere('asset_type_name', 'like', `%${keyword}%`);
        return resultSets.then(results=> {
            let customers = [];
            results.forEach(customer=>customers.push(new Customer(customer)));
            return Utils.buildResponse({data: {items: customers}});
        }).catch(err=> {
            return Utils.buildResponse({status: "fail", data: err}, 500);
        });
    }

    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteAsset(by = "id", value) {
        const AssetMapper = MapperFactory.build(MapperFactory.ASSET);
        return AssetMapper.deleteDomainRecord({by, value}).then(count=> {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {by, message: "Asset deleted"}});
        });
    }
}

module.exports = AssetService;