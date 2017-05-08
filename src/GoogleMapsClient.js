'use strict';

const key = 'AIzaSyBOebiqD_kzsZWxn1GppUNB8PFV-tBzunM';
const googleMaps = require('@google/maps');

/**
 * This is a small wrapper client for the Alexa Address API.
 */
class GoogleMapsClient {
  /**
   * Retrieve an instance of the GoogleMapsClient
   * 
   * 
   */
  constructor() {
    console.log('Creating an instance of the GoogleMapsClient');
    this.client = googleMaps.createClient({
      key: 'AIzaSyBOebiqD_kzsZWxn1GppUNB8PFV-tBzunM',
      timeout: 5000
    });
  }


  geocodeAddress(addressString) {
    return new Promise( (resolve, reject) => {
      this.client.geocode({
        address: addressString
      }, function (err, response) {
        if (err) {
          console.log(JSON.stringify(response));
          reject(err);
          return;
        }
        // PROCESS RESPONSE
        _processGeocodeResult();
        resolve(response);
      });
    });
  }

  geocodeAddressOld(addressString) {
    return this.client.geocode({
      address: addressString
    }).asPromise();
  }

  _processGeocodeResult(result) {
    return null;
  }

}


module.exports = GoogleMapsClient;
