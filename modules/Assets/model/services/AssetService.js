const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Password = require('../../../../core/Utility/Password');
const Util = require('../../../../core/Utility/MapperUtil');
/**
 * @name AssetService
 * Created by paulex on 8/22/17.
 */
class AssetService {

    constructor() {

    }

    getName() {
        return "assetService";
    }

    getAssets(value, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        if (!value || "" + value + "".trim() == '') {
            //Its important that all queries are streamlined to majorly for each business
            value = who.api;
            by = "api_instance_id";
        } else if (value) {
            const temp = value;
            value = {};
            value[by] = temp;
            value['api_instance_id'] = who.api;
            by = "*_and";
        }
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
                                return resolve(Util.buildResponse({data: {items: result.records}}));
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
            return Util.buildResponse({data: staff});
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
                return Util.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Util.buildResponse({data: {by, message: "Asset deleted"}});
        });
    }
}

module.exports = AssetService;