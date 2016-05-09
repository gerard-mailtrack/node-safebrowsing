/* global require, module */

'use strict';

var Winston = require('winston');
var Logger = Winston.Logger;

var instance;

var logger = function(level) {
    
    if (!instance) {
        
        instance = new Logger({
            transports: [
                new (Winston.transports.Console)({
                    level: level || 'error',
                    silent: level === 'silent',
                    colorize: 'all',
                    prettyPrint: true,
                    timestamp: true,
                })
            ]
        });
    }
    
    return instance;
};

module.exports = logger;