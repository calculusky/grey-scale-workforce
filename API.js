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
                        if (!API._(this).services) API._(this).services = {};

                        API._(this).services[serviceObj.constructor.name] = serviceObj;
                    });
            }
        });
    }

    //TODO on a second thought we can as well avoid declaring the below functions and automatically generate them
    /**
     * @returns {UserService|*}
     */
    users() {
        return API._(this)['services']['UserService'];
    }

    /**
     *
     * @returns {CustomerService|*}
     */
    customers() {
        return API._(this)['services']['CustomerService'];
    }

    /**const API = require('');

     *
     * @returns {MeterReadingService|*}
     */
    meter_readings() {
        return API._(this)['services']['MeterReadingService'];
    }

    /**
     *
     * @returns {RecognitionService|*}
     */
    recognitions() {
        return API._(this)['services']['RecognitionService']
    }

    /**
     *
     * @returns {FaultService|*}
     */
    faults() {
        return API._(this)['services']['FaultService']
    }

    /**
     *
     * @returns {WorkOrderService|*}
     */
    workOrders() {
        return API._(this)['services']['WorkOrderService'];
    }

    /**
     * @returns {MaterialLocationService|*}
     */
    materialLocations() {
        return API._(this)['services']['MaterialLocationService'];
    }

    /**
     * @returns {MaterialService|*}
     */
    materials() {
        return API._(this)['services']['MaterialService'];
    }

    /**
     * @returns {MaterialRequisitionService|*}
     */
    materialRequisitions() {
        return API._(this)['services']['MaterialRequisitionService'];
    }

    /**
     * @returns {MaterialUtilizationService|*}
     */
    materialUtilizations() {
        return API._(this)['services']['MaterialUtilizationService'];
    }

    /**
     * @returns {StockMovementService|*}
     */
    stockMovements() {
        return API._(this)['services']['StockMovementService'];
    }

    /**
     *
     * @returns {AssetService}
     */
    assets() {
        return API._(this)['services']['AssetService'];
    }


    /**
     *
     * @returns {NoteService}
     */
    notes() {
        return API._(this)['services']['NoteService'];
    }


    /**
     *
     * @returns {AttachmentService}
     */
    attachments() {
        return API._(this)['services']['AttachmentService'];
    }

    /**
     *
     * @returns {NotificationService|*}
     */
    notifications() {
        return API._(this)['services']['NotificationService'];
    }

    /**
     *
     * @returns {UploadService|*}
     */
    uploads() {
        return API._(this)['services']['UploadService'];
    }

    /**
     *
     * @returns {PaymentService|*}
     */
    payments() {
        return API._(this)['services']['PaymentService'];
    }  
    
    /**
     *
     * @returns {PaymentPlanService|*}
     */
    paymentPlans() {
        return API._(this)['services']['PaymentPlanService'];
    }

    /**
     * @returns {ActivationService|*}
     */
    activations() {
        return API._(this)['services']['ActivationService'];
    }

    /**
     * @returns {ActivityService|*}
     */
    activities() {
        return API._(this)['services']['ActivityService'];
    }

    /**
     * @returns {WorkflowService|*}
     */
    workflows() {
        return API._(this)['services']['WorkflowService'];
    }

    /**
     * @returns {GroupService|*}
     */
    groups() {
        return API._(this)['services']['GroupService'];
    }

    /**
     * @returns {FaultCategoryService|*}
     */
    faultCategories() {
        return API._(this)['services']['FaultCategoryService'];
    }

    /**
     * @returns {RoleService|*}
     */
    roles() {
        return API._(this)['services']['RoleService'];
    }

    /**
     * @returns {BaseRecordService}
     */
    baseRecords(){
        return API._(this)['services']['BaseRecordService'];
    }

    /**
     * @returns {ReportService|*}
     */
    reports() {
        return API._(this)['services']['ReportService'];
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
