
'use strict';

// External imports
const Alexa = require('alexa-sdk');

// Local imports
const Handlers = require('./Handlers');


// Constants

const APP_ID = "amzn1.ask.skill.99e69df1-c838-42af-b8fc-e352437825a9"; 

exports.handler = function (event, context, callback) {
    let alexa = Alexa.handler(event, context);

    alexa.appId = APP_ID;
    alexa.registerHandlers(Handlers);

    console.log(`Beginning execution for skill with APP_ID=${alexa.appId}`);
    alexa.execute();
    console.log(`Ending execution  for skill with APP_ID=${alexa.appId}`);
};
