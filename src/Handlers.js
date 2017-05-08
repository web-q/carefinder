'use strict';

/**
 * This class contains all handler function definitions
 * for the various events that we will be registering for.
 * For an understanding of how these Alexa Skill event objects
 * are structured refer to the following documentation:
 * https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-interface-reference
 */

// Internal imports
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

    console.info("Starting newSessionRequestHandler()");
    console.info(JSON.stringify(this.event));
    // TODO check if device address enabled and available.

    let consentToken;    
    try{    
        consentToken = this.event.context.System.user.permissions.consentToken;
    }catch(err){
        this.emit(":tell", Messages.NOTIFY_MISSING_PERMISSIONS, PERMISSIONS);
        console.log("ConsentToken is not available.");
        return;
    }   
   
    // If we have not been provided with a consent token, this means that the user has not
    // authorized your skill to access this information. In this case, you should prompt them
    // that you don't have permissions to retrieve their address.
    if (!consentToken) {
        this.emit(":tellWithPermissionCard", Messages.NOTIFY_MISSING_PERMISSIONS, PERMISSIONS);

        // Lets terminate early since we can't do anything else.
        console.log("User did not give us permissions to access their address.");
        console.info("Ending getAddressHandler()");
        return;
    }

    const deviceId = this.event.context.System.device.deviceId;
    const apiEndpoint = this.event.context.System.apiEndpoint;

    console.log('deviceId' + deviceId);
    console.log('apiEndpoint' + apiEndpoint);


    const alexaDeviceAddressClient = new AlexaDeviceAddressClient(apiEndpoint, deviceId, consentToken);
    let deviceAddressRequest = alexaDeviceAddressClient.getFullAddress();

    deviceAddressRequest.then((addressResponse) => {
        switch (addressResponse.statusCode) {
            case 200:
                const address = addressResponse.address;
                console.log("Address successfully retrieved: " + `${address['addressLine1']}, ${address['stateOrRegion']}, ${address['postalCode']}`);
                // TODO geocode and add the coordinates to the session
                //const ADDRESS_MESSAGE = Messages.ADDRESS_AVAILABLE + `${address['addressLine1']}, ${address['stateOrRegion']}, ${address['postalCode']}`;
                //this.emit(":tell", ADDRESS_MESSAGE);
                break;
            case 204:
                // This likely means that the user didn't have their address set via the companion app.
                console.log("Successfully requested from the device address API, but no address was returned.");
                this.emit(":tell", Messages.NO_ADDRESS);
                break;
            case 403:
                console.log("The consent token we had wasn't authorized to access the user's address.");
                this.emit(":tellWithPermissionCard", Messages.NOTIFY_MISSING_PERMISSIONS, PERMISSIONS);
                break;
            default:
                console.log("There was an error with the Device Address API. Please try again.");
                this.emit(':tell', Messages.ERROR);
        }

        if (this.event.request.type === Events.LAUNCH_REQUEST) {
            this.emit(Events.LAUNCH_REQUEST);
        } else if (this.event.request.type === "IntentRequest") {
            this.emit(this.event.request.intent.name);
        }
        console.info("Ending newSessionRequestHandler()");
    });

    deviceAddressRequest.catch(() => {
        this.emit(':tell', Messages.ERROR);
    });

};

/**
 * This is the handler for the LaunchRequest event. Refer to
 * the Events.js file for more documentation.
 */
const launchRequestHandler = function () {
    console.info("Starting launchRequestHandler()");
    let speechText = Messages.WELCOME + Messages.HELP + Messages.HELP_GENERIC;

    VoiceLabs.track(this.event.session, this.event.request.type, null, speechText, (error, response) => {
        this.emit(':ask', speechText, Messages.SAY_THAT_AGAIN);
    });


    console.info("Ending launchRequestHandler()");
};

/**
 * This is the handler for our custom ClosestErIntent intent.
 * Refer to the Intents.js file for documentation.
 */
const closestErHandler = function () {
    console.info("Starting closestErHandler()");

    // Geocode an address.
    /*
    const googleMapsClient = new GoogleMapsClient();
    let googleMapRequest = googleMapsClient.geocodeAddress('1600 Amphitheatre Parkway, Mountain View, CA');

    googleMapRequest.then((response) => {
        //resolve
        console.log('geocodeAddress() response.json: ' + JSON.stringify(response.json));
        let speechOutput = 'The Closest ER is '
            + 'Brandon Regional Hospital'
            + ' 11 miles from zip code <say-as interpret-as="address"> 34120'
            + '</say-as>. <break time="0.5s"/>'
            + 'Current wait time is 11 minutes. <break time="0.5s"/>'
            + 'Say next to show the second closest location. '
            + 'Say phone number to get the phone number. '
            + 'Say directions to get the driving directions. '
            + 'Or you can say stop to exit.';

        VoiceLabs.track(this.event.session, this.event.request.intent.name, null, speechOutput, (error, response) => {
            this.emit(':ask', speechOutput, Messages.SAY_THAT_AGAIN);
        });


        console.info("Ending closestErHandler()");
    });

    googleMapRequest.catch((error) => {
        //reject
        console.log('geocodeAddress() error: ' + error);

        console.info("Ending closestErHandler()");
        this.emit(":tell", Messages.ERROR);
    });
    */

    const erWaitClient = new ErWaitClient('hcafeeds.medcity.net', '/rss/er/wfl_rss_feed.json');
    
    let erWaitRequest = erWaitClient.getErWaitTimes();

    erWaitRequest.then((response => {
        console.log(JSON.stringify(response));
        let speechOutput = 'The Closest ER is '
            + 'Brandon Regional Hospital'
            + ' 11 miles from zip code <say-as interpret-as="address"> 34120'
            + '</say-as>. <break time="0.5s"/>'
            + 'Current wait time is 11 minutes. <break time="0.5s"/>'
            + 'Say next to show the second closest location. '
            + 'Say phone number to get the phone number. '
            + 'Say directions to get the driving directions. '
            + 'Or you can say stop to exit.';

        VoiceLabs.track(this.event.session, this.event.request.intent.name, null, speechOutput, (error, response) => {
            this.emit(':ask', speechOutput, Messages.SAY_THAT_AGAIN);
        });

    }));

    erWaitRequest.catch( (error) => {
        console.log('ER Wait Feed Error');
        this.emit(":tell", Messages.ERROR);
    });
};

/**
 * This is the handler for the SessionEnded event. Refer to
 * the Events.js file for more documentation.
 */
const sessionEndedRequestHandler = function () {
    console.info("Starting sessionEndedRequestHandler()");
    this.emit(":tell", Messages.GOODBYE);
    console.info("Ending sessionEndedRequestHandler()");
};

/**
 * This is the handler for the Unhandled event. Refer to
 * the Events.js file for more documentation.
 */
const unhandledRequestHandler = function () {
    console.info("Starting unhandledRequestHandler()");
    this.emit(":ask", Messages.UNHANDLED, Messages.UNHANDLED);
    console.info("Ending unhandledRequestHandler()");
};

/**
 * This is the handler for the Amazon help built in intent.
 * Refer to the Intents.js file for documentation.
 */
const amazonHelpHandler = function () {
    console.info("Starting amazonHelpHandler()");
    VoiceLabs.track(this.event.session, this.event.request.intent.name, null, Messages.HELP, (error, response) => {
        this.emit(":ask", Messages.HELP, Messages.HELP);
    });


    console.info("Ending amazonHelpHandler()");
};

/**
 * This is the handler for the Amazon cancel built in intent.
 * Refer to the Intents.js file for documentation.
 */
const amazonCancelHandler = function () {
    console.info("Starting amazonCancelHandler()");

    VoiceLabs.track(this.event.session, this.event.request.intent.name, null, Messages.GOODBYE, (error, response) => {
        this.emit(":tell", Messages.GOODBYE);
    });
    console.info("Ending amazonCancelHandler()");
};

/**
 * This is the handler for the Amazon stop built in intent.
 * Refer to the Intents.js file for documentation.
 */
const amazonStopHandler = function () {
    console.info("Starting amazonStopHandler()");
    VoiceLabs.track(this.event.session, this.event.request.intent.name, null, Messages.GOODBYE, (error, response) => {
        this.emit(":tell", Messages.GOODBYE);
    });
    console.info("Ending amazonStopHandler()");
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