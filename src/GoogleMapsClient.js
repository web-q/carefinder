'use strict';

const key = 'yourkey';
const logger= require('winston');
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
    logger.debug('Creating an instance of the GoogleMapsClient');
    this.client = googleMaps.createClient({
      key: 'yourkey',
      timeout: 10000
    });
  }


  geocodeAddress(addressString) {
    return new Promise( (resolve, reject) => {
      this.client.geocode({
        address: addressString
      }, function (err, response) {
        if (err) {
          logger.error(JSON.stringify(response));
          reject(err);
          return;
        }
        // PROCESS RESPONSE                  
        if(response.json.results.length > 0){         
          logger.debug(JSON.stringify(response));
          resolve(response.json.results[0]);
        }else{
          reject(new Error("No Geocoding Results!"));
        }
        
      });
    });
  }

  geocodeAddressOld(addressString) {
    return this.client.geocode({
      address: addressString
    }).asPromise();
  }

  _processGeocodeResult(result) {
    let coord = '23.3636,80.234356';
    return coord;
  }

}


module.exports = GoogleMapsClient;
