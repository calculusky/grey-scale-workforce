const request = require('request');
/**
 *
 * @type {LegendService}
 */
module.exports = (function () {

    const BASE_URL = process.env.IBM_APIC_BASE_URL;
    const APIC_KEY = process.env.IBM_APIC_KEY;
    const options = {headers: {'x-ibm-client-id': APIC_KEY}, json: true};

    let context = null;
    let initialized = false;
    let itemTypes = {};
    let categoryToItemCodeMap = {};

    /**
     * This is class is quite coupled with @context
     * @class LegendService
     */
    class LegendService {
        //We need the context to be able to interface with the persistent storage
        //
        constructor() {
        }

        // noinspection JSMethodCanBeStatic
        /**
         *
         */
        getItemTypeCodes() {
            _checkInitialized();
            return itemTypes;
        }

        // noinspection JSMethodCanBeStatic
        /**
         *
         * @param categoryId
         * @return {*}
         */
        getItemCodeByMaterialCategoryId(categoryId) {
            _checkInitialized();
            return categoryToItemCodeMap[categoryId];
        }

        /**
         *
         * @param typeCode
         * @return {Promise<*>}
         */
        async getMaterialsByItemCode(typeCode) {
            _checkInitialized();
            const url = `${BASE_URL}/items?itemtype_code=${typeCode}`;
            console.log(url);
            return new Promise((resolve, reject) => {
                if (!itemTypes[typeCode]) return resolve([]);
                request.get(url, options, (err, res, body) => {
                    if (err) return reject(err);
                    const materials = body.data.entry.map(item => {
                        return {
                            id: item.id,
                            name: item.description,
                            category: {
                                id: itemTypes[typeCode].code,
                                name: itemTypes[typeCode].name,
                            },
                            source: "ie_legend",
                            source_id: item.id
                        };
                    });
                    return resolve(materials);
                });
            });
        }

        /**
         *
         * @param faultId
         * @param material
         * @param group
         * @return {Promise<any>}
         */
        requestMaterial(faultId, material = {}, group = {}) {
            _checkInitialized();
            if (!faultId) throw new Error("The Fault ID is required");
            const executor = (resolve, reject) => {
                //TODO use validate
                if (!itemTypes[material.category.id]) return reject("ItemTypes not found");
                const _options = {...options};
                const legendMatRequest = {Fault_ID: faultId};
                legendMatRequest['item'] = material.name;
                legendMatRequest['itemType'] = material.category.id;
                legendMatRequest['category'] = itemTypes[material.category.id].category_code;
                legendMatRequest['project'] = "";
                legendMatRequest['user'] = "*";
                legendMatRequest['Collected By'] = "*";
                legendMatRequest['supervisor'] = "*";
                _options.json = legendMatRequest;
                request.post(`${BASE_URL || process.env.IBM_APIC_BASE_URL}/requests`, _options, (err, res, body) => {
                    if (err || res.statusCode !== 200) return reject(err || res.statusCode);
                    return resolve(body);
                });
            };
            return new Promise(executor);
        }

        /**
         *
         * @param faultId
         * @return {Promise<any>}
         */
        checkMaterialRequestStatus(faultId){
            _checkInitialized();
            const executor = (resolve, reject)=>{
                request.post(`${BASE_URL}/`);
            };
            return new Promise(executor);
        }
    }

    /**
     *
     * @param ctx
     * @return {Promise<boolean>}
     */
    LegendService.prototype.init = async function (ctx) {
        if (!ctx) throw Error("context cannot be null");
        if (initialized) return true;
        context = ctx;
        await _loadItemTypes();
        initialized = true;
        return true;
    };


    /*---------------------------------------------------------------------/
    | Private Implementations
    |*---------------------------------------------------------------------/
     */
    /**
     *
     * @return {Promise<*>}
     * @private
     */
    async function _loadItemTypes() {
        const _cacheItemTypes = await context.getKey('LEGEND_ITEM_TYPES', true);

        if (_cacheItemTypes) {
            itemTypes = _cacheItemTypes;
            return _joinLocalCategories();
        }

        return new Promise((resolve, reject) => {
            request.get(`${BASE_URL}/itemtypes`, options, (err, res, body) => {
                if (err) return reject(err);
                const {data: {entry: entries} = {}} = body, entryByCode = {};
                if (!entries) return reject();

                entries.forEach(elem => entryByCode[elem['code']] = elem);
                itemTypes = entryByCode;
                context.setKey('LEGEND_ITEM_TYPES', JSON.stringify(itemTypes));
                _joinLocalCategories().then(resolve);
            });//end of request
        });
    }

    /**
     * Creates a mapping for the local material_category id to legend type_code
     *
     * @return {Promise<boolean | never>}
     * @private
     */
    function _joinLocalCategories() {
        return context.getKey("material:categories", true).then(mCategories => {
            Object.entries(mCategories).forEach(([key, value]) => {
                const itemType = itemTypes[value['source_id']];
                if (value['source'] === 'ie_legend' && itemType) {
                    categoryToItemCodeMap[value.id] = itemType.code;
                }
            });
            return true;
        });
    }

    /**
     *
     * @private
     */
    function _checkInitialized() {
        if (!initialized) throw new Error("Legend Service hasn't been initialized")
    }

    return new LegendService();
})();