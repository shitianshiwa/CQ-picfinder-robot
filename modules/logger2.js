const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log`
        // - Write all logs error (and below) to `error.log`.
        //
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 10485760
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 10485760
        })
    ]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
logger.add(
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
        silent: process.env.NODE_ENV === 'test'
    })
);

module.exports = logger;