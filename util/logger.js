var winston = require('winston');

var config = {
    levels: {
        silly: 0,
        verbose: 1,
        info: 2,
        data: 3,
        warn: 4,
        debug: 5,
        error: 6
    },
    colors: {
        silly: 'magenta',
        verbose: 'cyan',
        info: 'green',
        data: 'grey',
        warn: 'yellow',
        debug: 'blue',
        error: 'red'
    }
};

var _winstonLogger = null;

module.exports = function() {
    if (!_winstonLogger) {
        _winstonLogger = new (winston.Logger)({
            transports: [
                new (winston.transports.Console)({
                    colorize: true,
                    timestamp: function() {
                        return new Date().toLocaleString();
                    }
                })
            ],
            levels: config.levels,
            colors: config.colors
        });
    }
    return _winstonLogger;
};