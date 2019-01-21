
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
        AuditAble._instance = this;
    }

    /**
     *
     * @param mapper
     * @param domain {DomainObject}
     * @param session
     * @param action
     * @returns {*|void}
     */
    audit(mapper, domain, session, action = "CREATE") {
        if (!mapper || !domain) throw new Error("Invalid arguments given");
        const primaryKey = mapper.primaryKey;
        const tableName = mapper.tableName;
        console.log(primaryKey);
        if (!domain[primaryKey]) return console.error("AuditFailed:", "Can't audit a record without it's primary key");
        const record = domain.toAuditAbleFormat();
        const activity = {
            module: tableName,
            relation_id: domain[primaryKey],
            activity_type: action,
            record: JSON.stringify(record),
            description: record['description'] || "...",
            model_type: mapper.domainName,
            activity_by: session.sub,
            group_id: (Array.isArray(session.group) && session.group.length) ? `${session.group[0]}` : '1'
        };
        return this.api.activities().createActivity(activity, {}, this.api).catch(console.error);
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