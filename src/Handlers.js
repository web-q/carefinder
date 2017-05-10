/**
 * This class contains all handler function definitions
 * for the various events that we will be registering for.
 * For an understanding of how these Alexa Skill event objects
 * are structured refer to the following documentation:
 * https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-interface-reference
 */

// Internal imports
const logger= require('winston');
const AlexaDeviceAddressClient = require('./AlexaDeviceAddressClient');
const GoogleMapsClient = require('./GoogleMapsClient');
const ErWaitClient = require('./ErWaitClient');
const Intents = require('./Intents');
const Events = require('./Events');
const Messages = require('./Messages');
const VoiceLabs = require("voicelabs")('2ab22e40-3104-11a7-0d51-0e2486876586');


/**
 * Another Possible value if you only want permissions for the country and postal code is:
 * read::alexa:device:all:address:country_and_postal_code
 * Be sure to check your permissions settings for your skill on https://developer.amazon.com/
 */
const ALL_ADDRESS_PERMISSION = "read::alexa:device:all:address";

const PERMISSIONS = [ALL_ADDRESS_PERMISSION];

/**
 * This is the handler for the NewSession event.
 * Refer to the  Events.js file for more documentation.
 */
const newSessionRequestHandler = function () {

    logger.info("Starting newSessionRequestHandler()");
        
    let consentToken;
    try {
        consentToken = this.event.context.System.user.permissions.consentToken;
    } catch (err) {
        this.emit(":tell", Messages.NOTIFY_MISSING_PERMISSIONS, PERMISSIONS);
        logger.error("ConsentToken is not available.");
        return;
    }

    // If we have not been provided with a consent token, this means that the user has not
    // authorized your skill to access this information. In this case, you should prompt them
    // that you don't have permissions to retrieve their address.
    if (!consentToken) {
        this.emit(":tellWithPermissionCard", Messages.NOTIFY_MISSING_PERMISSIONS, PERMISSIONS);

        // Lets terminate early since we can't do anything else.
        logger.info("User did not give us permissions to access their address.");
        logger.info("Ending getAddressHandler()");
        return;
    }

    const deviceId = this.event.context.System.device.deviceId;
    const apiEndpoint = this.event.context.System.apiEndpoint;

    logger.debug('deviceId' + deviceId);
    logger.debug('apiEndpoint' + apiEndpoint);


    const alexaDeviceAddressClient = new AlexaDeviceAddressClient(apiEndpoint, deviceId, consentToken);
    let deviceAddressRequest = alexaDeviceAddressClient.getFullAddress();

    deviceAddressRequest.then((addressResponse) => {
        logger.debug(JSON.stringify(addressResponse));
        let address = addressResponse.responsePayloadObject;
        return `${address['addressLine1']}, ${address['stateOrRegion']}, ${address['postalCode']}`;
    }, (error) => {
        if (error.statusCode) {
            switch (error.statusCode) {
                case 0:
                    logger.info("There was an error with the Device Address API. Please try again.");
                    this.emit(':tell', Messages.ERROR);
                    break;
                case 1:
                    logger.info("Full address is not available");
                    this.emit(":tell", Messages.NO_FULL_ADDRESS);
                    break;
                case 204:
                    // This likely means that the user didn't have their address set via the companion app.
                    logger.info("Successfully requested from the device address API, but no address was returned.");
                    this.emit(":tell", Messages.NO_ADDRESS);
                    break;
                case 403:
                    logger.info("The consent token we had wasn't authorized to access the user's address.");
                    this.emit(":tellWithPermissionCard", Messages.NOTIFY_MISSING_PERMISSIONS, PERMISSIONS);
                    break;
                default:
                    logger.info("There was an error: " + e);
                    this.emit(':tell', Messages.ERROR);
            }
        } else {
            logger.error("There was an error: " + e);
            this.emit(':tell', Messages.ERROR);
        }
    }).then((address) => {
        //geocode address        
        const googleMapsClient = new GoogleMapsClient();
        let googleMapRequest = googleMapsClient.geocodeAddress(address)
        googleMapRequest.then((response) => {
            // TODO add address and coordinates to the session                
            this.attributes['device_coordinates'] = {"address": address,"location": response.geometry.location};
        }, (error) => {
            //reject
            logger.error('geocodeAddress() error: ' + error);            
            this.emit(":tell", Messages.ERROR);                        
        });
        return googleMapRequest;
    }).then(() => {
        
        if (this.event.request.type === Events.LAUNCH_REQUEST) {
            this.emit(Events.LAUNCH_REQUEST);
        } else if (this.event.request.type === "IntentRequest") {
            this.emit(this.event.request.intent.name);
        }
        logger.info("Ending newSessionRequestHandler()");
    });

};

/**
 * This is the handler for the LaunchRequest event. Refer to
 * the Events.js file for more documentation.
 */
const launchRequestHandler = function () {
    logger.info("Starting launchRequestHandler()");
    let speechText = Messages.WELCOME + Messages.HELP + Messages.HELP_GENERIC;

    VoiceLabs.track(this.event.session, this.event.request.type, null, speechText, (error, response) => {
        this.emit(':ask', speechText, Messages.SAY_THAT_AGAIN);
    });


    logger.info("Ending launchRequestHandler()");
};

/**
 * This is the handler for our custom ClosestErIntent intent.
 * Refer to the Intents.js file for documentation.
 */
const closestErHandler = function () {
    logger.info("Starting closestErHandler()");

    let deviceAddress = this.attributes['device_coordinates'];
    
    const erWaitClient = new ErWaitClient('hcafeeds.medcity.net', '/rss/er/wfl_rss_feed.json', deviceAddress);

    let erWaitRequest = erWaitClient.getErWaitTimes();

    erWaitRequest.then((response => {
        logger.debug(JSON.stringify(response));
        let closestErLocation = response[0];
        let title = closestErLocation.title;
        if(closestErLocation.displayName !== undefined){
            title =  closestErLocation.displayName;
        }        
        let distance = parseFloat(closestErLocation.distance).toFixed(1);
        let waitTime = closestErLocation.description.split(" ")[0];
        let speechOutput = 'The Closest ER is '
            + title
            + ' '
            + distance
            +' miles away from your address'
            + '. <break time="0.2s"/>'
            + ' Current wait time is '
            +  waitTime
            + 'minutes. <break time="0.2s"/>'
            + 'Say next to show the second closest location. '
            + 'Say phone number to get the phone number. '
            + 'Say directions to get the driving directions. '
            + 'Or you can say stop to exit.';

        VoiceLabs.track(this.event.session, this.event.request.intent.name, null, speechOutput, (error, response) => {
            this.emit(':ask', speechOutput, Messages.SAY_THAT_AGAIN);
        });

    }));

    erWaitRequest.catch((error) => {
        logger.error('ER Wait Feed Error');
        this.emit(":tell", Messages.ERROR);
    });
};

/**
 * This is the handler for the SessionEnded event. Refer to
 * the Events.js file for more documentation.
 */
const sessionEndedRequestHandler = function () {
    logger.info("Starting sessionEndedRequestHandler()");
    this.emit(":tell", Messages.GOODBYE);
    logger.info("Ending sessionEndedRequestHandler()");
};

/**
 * This is the handler for the Unhandled event. Refer to
 * the Events.js file for more documentation.
 */
const unhandledRequestHandler = function () {
    logger.info("Starting unhandledRequestHandler()");
    this.emit(":ask", Messages.UNHANDLED, Messages.UNHANDLED);
    logger.info("Ending unhandledRequestHandler()");
};

/**
 * This is the handler for the Amazon help built in intent.
 * Refer to the Intents.js file for documentation.
 */
const amazonHelpHandler = function () {
    logger.info("Starting amazonHelpHandler()");
    VoiceLabs.track(this.event.session, this.event.request.intent.name, null, Messages.HELP, (error, response) => {
        this.emit(":ask", Messages.HELP, Messages.HELP);
    });
    logger.info("Ending amazonHelpHandler()");
};

/**
 * This is the handler for the Amazon cancel built in intent.
 * Refer to the Intents.js file for documentation.
 */
const amazonCancelHandler = function () {
    logger.info("Starting amazonCancelHandler()");

    VoiceLabs.track(this.event.session, this.event.request.intent.name, null, Messages.GOODBYE, (error, response) => {
        this.emit(":tell", Messages.GOODBYE);
    });
    logger.info("Ending amazonCancelHandler()");
};

/**
 * This is the handler for the Amazon stop built in intent.
 * Refer to the Intents.js file for documentation.
 */
const amazonStopHandler = function () {
    logger.info("Starting amazonStopHandler()");
    VoiceLabs.track(this.event.session, this.event.request.intent.name, null, Messages.GOODBYE, (error, response) => {
        this.emit(":tell", Messages.GOODBYE);
    });
    logger.info("Ending amazonStopHandler()");
};


const handlers = {};
// Add event handlers
handlers[Events.NEW_SESSION] = newSessionRequestHandler;
handlers[Events.LAUNCH_REQUEST] = launchRequestHandler;
handlers[Events.SESSION_ENDED] = sessionEndedRequestHandler;
handlers[Events.UNHANDLED] = unhandledRequestHandler;

// Add intent handlers
handlers[Intents.GET_ADDRESS] = closestErHandler;
handlers[Intents.AMAZON_CANCEL] = amazonCancelHandler;
handlers[Intents.AMAZON_STOP] = amazonStopHandler;
handlers[Intents.AMAZON_HELP] = amazonHelpHandler;

module.exports = handlers;