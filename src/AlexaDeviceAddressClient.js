'use strict';

const logger= require('winston');
const Https = require('https');

/**
 * This is a small wrapper client for the Alexa Address API.
 */
class AlexaDeviceAddressClient {

    /**
     * Retrieve an instance of the Address API client.
     * @param apiEndpoint the endpoint of the Alexa APIs.
     * @param deviceId the device ID being targeted.
     * @param consentToken valid consent token.
     */
    constructor(apiEndpoint, deviceId, consentToken) {
        logger.debug("Creating AlexaAddressClient instance.");
        this.deviceId = deviceId;
        this.consentToken = consentToken;
        this.endpoint = apiEndpoint.replace(/^https?:\/\//i, "");
    }

    /**
     * This will make a request to the Address API using the device ID and
     * consent token provided when the Address Client was initialized.
     * This will retrieve the full address of a device.
     * @return {Promise} promise for the request in flight.
     */
    getFullAddress() {
        const options = this.__getRequestOptions(`/v1/devices/${this.deviceId}/settings/address`);

        return new Promise((fulfill, reject) => {
            this.__handleDeviceAddressApiRequest(options, fulfill, reject);
        });
    }

    /**
     * This will make a request to the Address API using the device ID and
     * consent token provided when the Address Client was initialized.
     * This will retrieve the country and postal code of a device.
     * @return {Promise} promise for the request in flight.
     */
    getCountryAndPostalCode() {
        const options = this.__getRequestOptions(
            `/v1/devices/${this.deviceId}/settings/address/countryAndPostalCode`);

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
            logger.debug(`Device Address API responded with a status code of : ${response.statusCode}`);
            let jsonString = ''

            response.on('data', (data) => {
                jsonString += data;
            });

            response.on('end', (data) => {
                let responsePayloadObject = JSON.parse(jsonString);

                const deviceAddressResponse = {
                    statusCode: response.statusCode,
                    responsePayloadObject: responsePayloadObject
                };

                if (response.statusCode === 200) {
                    
                    if (responsePayloadObject['addressLine1'] === null || responsePayloadObject['stateOrRegion'] === null) {
                        reject({ statusCode: 1, responsePayloadObject: responsePayloadObject })
                    } else {
                        logger.debug("Device Address Completed: " + JSON.stringify(deviceAddressResponse));
                        fulfill(deviceAddressResponse);
                    }
                } else {
                    logger.debug("Device Address Rejected: " + JSON.stringify(deviceAddressResponse));
                    reject(deviceAddressResponse);
                }

            });

        }).on('error', (e) => {
            logger.error(e);
            reject({ statusCode: 0, responsePayloadObject: e.message });
        });
    }

    /**
     * Private helper method for retrieving request options.
     * @param path the path that you want to hit against the API provided by the skill event.
     * @return {{hostname: string, path: *, method: string, headers: {Authorization: string}}}
     * @private
     */
    __getRequestOptions(path) {
        return {
            hostname: this.endpoint,
            path: path,
            method: 'GET',
            'headers': {
                'Authorization': 'Bearer ' + this.consentToken
            }
        };
    }
}

module.exports = AlexaDeviceAddressClient;