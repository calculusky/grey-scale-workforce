const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const ApiService = require('../../../ApiService');
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

    async activateUser(userId, who = {}) {
        const Activation = DomainFactory.build(DomainFactory.ACTIVATION);
        const ActivationMapper = MapperFactory.build(MapperFactory.ACTIVATION);

        const activation = new Activation({
            user_id: userId,
            code: crypto.randomBytes(16).toString('hex'),
            completed: 1
        });

        if (!activation.validate()) return Promise.reject("UserId wasn't specified");

        return await ActivationMapper.createDomainRecord(activation);
    }
}

module.exports = ActivationService;