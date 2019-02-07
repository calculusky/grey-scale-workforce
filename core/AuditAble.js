/**
 * @author Paul Okeke
 * 20th-Jan-2019
 * @name {AuditAble}
 */
class AuditAble {

    /**
     *
     * @param context {Context}
     * @param API {API}
     * @returns {AuditAble|*}
     */
    constructor(context, API) {
        if (AuditAble._instance) return AuditAble._instance;
        this.api = API;
        this.context = context;
        AuditAble._instance = this;
    }

    /**
     *
     * @param mapper
     * @param domain {DomainObject}
     * @param session {Session}
     * @param action
     * @returns {*|void}
     */
    audit(mapper, domain, session, action = "CREATE") {
        if (!mapper || !domain || !session) throw new Error("Invalid arguments given");
        const primaryKey = mapper.primaryKey;
        const tableName = mapper.tableName;
        if (!domain[primaryKey]) return console.warn("AuditFailed:", `Can't audit a ${domain.constructor.name} without it's primary key`);
        const record = domain.toAuditAbleFormat(this.context);
        const activity = {
            module: tableName,
            relation_id: domain[primaryKey],
            activity_type: action,
            record: JSON.stringify(record),
            description: record['description'] || "...",
            model_type: mapper.domainName,
            activity_by: session.getAuthUser().getUserId(),
            group_id: session.getAuthUser().getGroups().shift() || 1
        };
        return this.api.activities().createActivity(activity, session, this.api).catch(console.error);
    }

    /**
     * Initializes the auditor class for subsequent use
     *
     * @param context
     * @param API
     */
    static initialize(context, API) {
        if (AuditAble._instance) throw new Error("AuditAble has already been initialized");
        new AuditAble(context, API);
    }

    /**
     *
     * @returns {*}
     */
    static getInstance() {
        if (AuditAble._instance === null) throw new Error("AuditAble has not been initialized");
        return AuditAble._instance;
    }
}

module.exports = AuditAble;