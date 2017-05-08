'use strict';

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
    constructor(hostname, path) {
        console.log("Creating ErWaitClient instance.");
        this.hostname = hostname;
        this.path = path;
    }

    /**
     * This will make a request to the Address API using the device ID and
     * consent token provided when the Address Client was initialized.
     * This will retrieve the full address of a device.
     * @return {Promise} promise for the request in flight.
     */
    getErWaitTimes() {
        const options = this.__getRequestOptions(this.hostname, this.path);
        //const options = "https://hcafeeds.medcity.net/rss/er/wfl_rss_feed.json";
        return new Promise((fulfill, reject) => {
            this.__handleDeviceAddressApiRequest(options, fulfill, reject);
        });
    }

    /**
     * This is a helper method that makes requests to the Address API and handles the response
     * in a generic manner. It will also resolve promise methods.
     * @param requestOptions
     * @param fulfill
     * @param reject
     * @private
     */
    __handleDeviceAddressApiRequest(requestOptions, fulfill, reject) {
        Https.get(requestOptions, (response) => {
            console.log(`ER Wait feed responded with a status code of : ${response.statusCode}`);
            let jsonString = ''

            response.on('data', (data) => {
                jsonString += data;
            });

            response.on('end', (data) => {
                let parsed = JSON.parse(jsonString);
                fulfill(parsed);
            });
        }).on('error', (e) => {
            console.error(e);
            reject();
        });
    }

    /**
     * Private helper method for retrieving request options.
     * @param path the path that you want to hit against the API provided by the skill event.
     * @return {{hostname: string, path: *, method: string, headers: {Authorization: string}}}
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
}

module.exports = ErWaitClient;