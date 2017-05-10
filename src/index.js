// External imports
const Alexa = require('alexa-sdk');

// Local imports
const logger = require('./logger');
const Handlers = require('./Handlers');


// Constants

const APP_ID = "amzn1.ask.skill.99e69df1-c838-42af-b8fc-e352437825a9";

exports.handler = function (event, context, callback) {
  const alexa = Alexa.handler(event, context);

  alexa.appId = APP_ID;
  alexa.registerHandlers(Handlers);

  logger.info(`Beginning execution for skill with APP_ID=${alexa.appId}`);
  logger.debug('Event: ' + JSON.stringify(event));
  alexa.execute();
  logger.info(`Ending execution  for skill with APP_ID=${alexa.appId}`);
};

