'use strict';

const logger = require('winston');
const _ = require('lodash');
const Https = require('https');

/**
 * This is a small wrapper client for the HCA ER Wait Feed
 */
class ErWaitClient {

    /**
     * Retrieve an instance of the ErWaitClient client.
     * @param hostname hostname of the HCA ER Wait public feed.     
     * @param path path of the HCA ER Wait public feed.     
     */
    constructor(hostname, path, deviceAddress) {
        logger.info("Creating ErWaitClient instance.");
        this.hostname = hostname;
        this.path = path;
        this.address = deviceAddress;
    }

    /**
     * This will make a request to the HCA ER Wait Feed     
     * This will retrieve the full ER Wait Feed
     * @return {Promise} promise for the request in flight.
     */
    getErWaitTimes(deviceAdress) {
        const options = this.__getRequestOptions(this.hostname, this.path);
        //const options = "https://hcafeeds.medcity.net/rss/er/wfl_rss_feed.json";
        let erWaitTimesPromise = new Promise((fulfill, reject) => {

            this.__handleDeviceAddressApiRequest(options, fulfill, reject);
        });



        let erWaitTimesFromPromise = erWaitTimesPromise.then((results) => {
            let el = this;
            if (el.address !== null) {
                logger.debug("Order ER locations by distance from " + el.address);
                results = _.sortBy(results, function (o) {
                    return el._calculateDistance(o);
                });
            }
            return results;
        }).catch((error) => {
            logger.error(error);
        });

        return erWaitTimesFromPromise;
    }


    /**
     * This is a helper method that makes requests to HCA ER Wait Fedd and handles the response
     * in a generic manner. It will also resolve promise methods.
     * @param requestOptions
     * @param fulfill
     * @param reject
     * @private
     */
    __handleDeviceAddressApiRequest(requestOptions, fulfill, reject) {
        Https.get(requestOptions, (response) => {
            logger.debug(`ER Wait feed responded with a status code of : ${response.statusCode}`);

            let jsonString = ''

            response.on('data', (data) => {
                jsonString += data;
            });

            response.on('end', (data) => {
                let parsed = JSON.parse(jsonString);
                var results = parsed.rss.channel.item;
                fulfill(results);
            });
        }).on('error', (e) => {
            logger.error(e);
            reject();
        });
    }

    /**
     * Private helper method for retrieving request options.
     * @param hostname the hostname of the HCA ER Wait Feed
     * @param path the path of the HCA ER Wait Feed
     * @return {{hostname: string, path: *, method: string, port: number}}
     * @private
     */
    __getRequestOptions(hostname, path) {
        return {
            hostname: hostname,
            path: path,
            port: 443,
            method: 'GET'
        };
    }

    //  converts numeric degrees to radians
    _toRad(Value) {
        return Value * Math.PI / 180;
    }

    /**
   *
   * @function calculateDistance
   * @memberof ErWaitClient
   * @desc Will return the total
   * distance in miles from location
   */
    _calculateDistance(erLocation) {        
        let lat1, lat2, lng1, lng2, rad, rad_lat, rad_lng, a, b;
        lat1 = parseFloat(erLocation.latitude);
        lat2 = this.address.location.lat
        lng1 = parseFloat(erLocation.longitude)
        lng2 = this.address.location.lng        
        rad = 3961;
        rad_lat = this._toRad(lat2 - lat1);
        rad_lng = this._toRad(lng2 - lng1);
        lat1 = this._toRad(lat1); lat2 = this._toRad(lat2);
        a = Math.sin(rad_lat / 2) * Math.sin(rad_lat / 2) + Math.sin(rad_lng / 2) * Math.sin(rad_lng / 2) * Math.cos(lat1) * Math.cos(lat2);
        b = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        erLocation.distance = rad * b;
        return rad * b;
    }
    
}

module.exports = ErWaitClient;