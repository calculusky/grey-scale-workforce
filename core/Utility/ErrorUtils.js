const Utils = require('./Utils');
const status = 'fail';
module.exports = function () {
    return {
        InternalServerError: Utils.buildResponse({status, msg: 'Internal Server Error'}, 500),
        ValidationFailure: data => Utils.buildResponse({status: "fail", data, code: 'VALIDATION_ERROR'}, 400),
        GroupNotFound: Utils.buildResponse({status: "fail", data: {group_id: ["The group_id doesn't exist."]}}, 400),
        InvalidWorkOrderNo: system_id => Utils.buildResponse({
            status: "fail",
            msg: "Invalid Work Order Number",
            code: "INVALID_WORK_ORDER_NO",
            desc: `The Work Order Number specified '${system_id}' does not exist or it is invalid`
        }, 400),
        InvalidSystemName: system => Utils.buildResponse({
            status: "fail",
            msg: "Invalid System Name Specified",
            code: "INVALID_SYSTEM_NAME",
            desc: `The system name you specified '${system}' doesn't exist or is currently not being handled`
        }, 400),
        NotDisconnection: system_id => Utils.buildResponse({
            status: "fail",
            msg: "Work order cannot acknowledge payments",
            code: "NOT_DISCONNECTION",
            desc: `Payment to this type of work order '${system_id}' isn't supported`
        }, 403),
        InvalidAckState: Utils.buildResponse({
            status: "fail",
            msg: "Invalid state to acknowledge payment",
            code: "INVALID_ACK_STATE",
            desc: "The work order is not in the right state to acknowledge payments. " +
            "Only when the status is disconnected can payments be acknowledged"
        }, 403),
        InvalidDisconnectionAmount: amount => Utils.buildResponse({
            status: "fail",
            msg: "The amount is not acceptable",
            code: "INVALID_AMOUNT",
            desc: `The amount must be equal to or above the minimum amount payable (${amount})`
        }, 400),
        InvalidPaymentPlanAmount: amount => Utils.buildResponse({
            status: "fail",
            msg: "The amount is not acceptable",
            code: "INVALID_PLANNED_AMOUNT",
            desc: `The amount paid is lower than the amount specified on the payment plan (${amount})`
        }, 400),
        TransactionAlreadyExist: Utils.buildResponse({
            status: "fail",
            msg: "Duplicate Transaction",
            code: "TRANSACTION_ALREADY_EXIST",
            desc: `The work order has previously been acknowledged.`
        }, 403),
        InvalidLogin: Utils.buildResponse({
            status: "fail",
            data: Utils.authFailData("AUTH_CRED")
        }, 401)
    }
};