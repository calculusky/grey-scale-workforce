/**
 * Created by paulex on 9/5/17.
 */
module.exports = function NetworkUtils() {

};

module.exports.exponentialBackOff = function (fnc, max, retries) {
    fnc.then(()=> {
        //end
        console.log("Sent a data to fcm server which was initially unavailable")
    }).catch(()=> {
        //if we have not exceeded the amount of times we can do a retry
        if (max > 0) {
            //Exponential callback formula
            //N = 2'c - 1 ; where N is same as the maximum number in the slot, where we randomly pick a wait time

            //In first failure lets assume there has been 3 collisions --- :)
            let c = retries = (retries === 0) ? 3 : retries;

            var N = Math.pow(2, c) - 1;
            //get a random number from 0 to the N
            var delay = (Math.floor(Math.random() * (N))) * 1000;//to milliseconds
            //delay the request
            setTimeout(NetworkUtils.exponentialBackOff(fnc, --max, ++retries), delay);
        }
    });
    return true;
};