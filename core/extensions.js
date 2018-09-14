const Validator = require("validatorjs");
const Utils = require("./Utility/Utils");

Validator.register("string-array", (value, req, attr) => {
    const [isValid, obj] = Utils.isJson(value);
    return (isValid) ? Array.isArray(obj) : false;
}, "The :attribute must be a string-array or an array");


if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, padString) {
        targetLength = targetLength >> 0; //floor if number or convert non-number to 0;
        padString = String(padString || ' ');
        if (this.length > targetLength) {
            return String(this);
        }
        else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                //append to original to ensure we are longer than needed
                padString += padString.repeat(targetLength / padString.length);
            }
            return padString.slice(0, targetLength) + String(this);
        }
    };
}

Array.prototype.mLast = function() {
    return this[this.length - 1];
};