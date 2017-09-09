/**
 * @author Paul Okeke
 * Created by paulex on 7/2/17.
 */
const fs = require('fs');

//Private Fields
let _privateStore = new WeakMap();

/**
 * @name API
 *
 * Manages all the services in the application
 * and also provides access of this services where it is required.
 *
 * Kindly keep this class as simple as possible
 * Do not include business logic of any kind in this class.
 */
class API {

    constructor(context) {
        //We should add all the services in all modules here
        //All services should have a getName method
        let modulesPath = './modules';
        fs.readdirSync(modulesPath).forEach(dir=> {
            if (fs.statSync(`${modulesPath}/${dir}`).isDirectory()) {
                let servicePath = `${modulesPath}/${dir}/model/services`;
                if (fs.existsSync(servicePath))
                    fs.readdirSync(servicePath).forEach(service=> {
                        let serviceObj = require(`${servicePath}/${service}`);
                        //Save all services into their own object
                        serviceObj = new serviceObj(context);
                        if (!API._(this).services) {
                            API._(this).services = {};
                        }
                        API._(this).services[serviceObj.getName()] = serviceObj;
                    });
            }
        });
        
        
        // //We should load all mappers here into memory
        // fs.readdir(modulesPath).forEach(dir=>{
        //    
        // })
    }

    /**
     * @returns {UserService|*}
     */
    users() {
        return API._(this)['services']['userService'];
    }

    /**
     *
     * @returns {CustomerService|*}
     */
    customers(){
        return API._(this)['services']['customerService'];
    }

    /**const API = require('');

     * 
     * @returns {MeterReadingService|*}
     */
    meter_readings(){
        return API._(this)['services']['meterReadingService'];
    }

    /**
     *
     * @returns {RecognitionService|*}
     */
    recognitions() {
        return API._(this)['services']['recognitionService']
    }

    /**
     *
     * @returns {FaultService|*}
     */
    faults() {
        return API._(this)['services']['faultService']
    }

    /**
     *
     * @returns {WorkOrderService|*}
     */
    workOrders() {
        return API._(this)['services']['workOrderService']
    }

    /**
     * 
     * @returns {AssetService}
     */
    assets(){
        return API._(this)['services']['assetService'];
    }


    /**
     *
     * @returns {NoteService}
     */
    notes(){
        return API._(this)['services']['noteService'];
    }


    /**
     *
     * @returns {AttachmentService}
     */
    attachments(){
        return API._(this)['services']['attachmentService'];
    }

    /**
     * 
     * @returns {NotificationService|*}
     */
    notifications(){
        return API._(this)['services']['notificationService'];
    }

    /**
     * This method theoretically can be accessed outside this class
     * however conventionally its should be private.
     * Notwithstanding this method can't be used outside of this class
     * as it would throw a ReferenceError.
     *
     * @private
     */
    static _(instance) {
        if (!instance instanceof API) throw ReferenceError("You are trying to access my internal part");
        let api = _privateStore.get(instance);
        if (!api) {
            api = {};
            _privateStore.set(instance, api);
        }
        return api;
    }

}

module.exports = API;
