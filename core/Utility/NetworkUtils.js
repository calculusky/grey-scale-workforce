/**
 * Created by paulex on 9/5/17.
 */
module.exports = function NetworkUtils() {

};

module.exports.exponentialBackOff = function (fnc, max, retries) {
    console.log(fnc.constructor.name);
    fnc.then(() => {
        //end
        console.log(`Processed task for ${fnc.constructor.name} after ${retries} retries`);
    }).catch(() => {
        //if we have not exceeded the amount of times we can do a retry
        if (max > 0) {
            //Exponential callback formula
            //N = 2'c - 1 ; where N is same as the maximum number in the slot, where we randomly pick a wait time

            //In first failure lets assume there has been 3 collisions --- :)
            let c = retries = (retries === 0) ? 3 : retries;

            let N = Math.pow(2, c) - 1;
            //get a random number from 0 to the N
            let delay = (Math.floor(Math.random() * (N))) * 1000;//to milliseconds
            //delay the request
            setTimeout(function () {
                this.exponentialBackOff(fnc, --max, ++retries)
            }.bind(this), delay);
        }
    });
    return true;
};