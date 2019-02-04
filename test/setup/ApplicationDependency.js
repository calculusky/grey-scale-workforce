const knexMock = require('mock-knex');
const tracker = knexMock.getTracker();
const User = require('../../modules/Users/model/domain-objects/User');
const Session = require('../../core/Session');

exports.applicationBeforeAll = async function (ctx) {
    tracker.install();
    knexMock.mock(ctx.db(), 'knex@0.15.2');
    tracker.on('query', query => {
        if (query.sql.indexOf('from `roles`') !== -1) {
            return query.response([{
                id: 1,
                name: "Excuses",
                slug: "test",
                permissions: '{"works.access":true,"works.index":"group","works.create":false,"works.show":"all","works.edit":"all", "disconnection_billings.index":"group"}'
            }]);
        }else if(query.sql.indexOf('join `user_groups`')!==-1){
            return query.response([{
                id:1,
                name:"Abule-Egba-BU"
            }])
        }
        return query.response([]);
    });
    await new Promise((res, rej) => {
        ctx.on('loaded_static', () => {
            ctx.setKey("fault:categories", '{"1":{"id":1, "name":"ApplicationDependency", "type":"default"}}');
            ctx.setKey("groups", '{"1":{ "id": 1, "name": "Abule-Egba-BU","type": "business_unit","short_name": "ABL"}}');
            ctx.setKey("work:types", '{"1": {"id": 1, "name": "Disconnections"}, "2": {"id": 2, "name": "Re-connections"}, "3": {"id": 3, "name": "Faults"}}');
            res();
        });
    });
    const session = await Session.Builder(ctx).addExtra("pmToken", "test")
        .setUser(new User({id: 1, username: "admin"})).build();

    return [knexMock, tracker, session];
};