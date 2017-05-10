'use strict';

const logger = require('winston');

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, { level: 'debug' });

module.exports = logger;