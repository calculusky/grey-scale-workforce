const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const ApiService = require('../../../ApiService');
const Utils = require('../../../../core/Utility/Utils');
const crypto = require('crypto');

/**
 * @name ActivationService
 * Created by paulex on 8/22/17.
 */
class ActivationService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }

    activateUser(userId, who = {}) {
        const Activation = DomainFactory.build(DomainFactory.ACTIVATION);
        const ActivationMapper = MapperFactory.build(MapperFactory.ACTIVATION);

        const activation = new Activation({
            user_id: userId,
            code: crypto.randomBytes(16).toString('hex'),
            completed: 1
        });

        const executor = (resolve, reject) => {
            return ActivationMapper.createDomainRecord(activation).then(act => {
                return resolve(act);
            }).catch(err => {
                return reject(err);
            });
        };
        return new Promise(executor);
    }
}

module.exports = ActivationService;