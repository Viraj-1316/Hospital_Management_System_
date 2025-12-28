/**
 * Logger Utility
 * 
 * Centralized logging using Winston with environment-based configuration.
 * - Development: Colorful console output with all log levels
 * - Production: JSON format, only info and above logged
 * 
 * Usage:
 *   const logger = require('./utils/logger');
 *   logger.info('Message');
 *   logger.error('Error occurred', { error: err.message });
 *   logger.debug('Debug info', { data: someData });
 */

const winston = require('winston');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

// Custom format for development
const devFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level}: ${message}${metaStr}`;
    })
);

// JSON format for production
const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: isProduction ? prodFormat : devFormat,
    defaultMeta: { service: 'onecare-api' },
    transports: [
        // Console transport
        new winston.transports.Console({
            stderrLevels: ['error'],
        }),
    ],
});

// Add file transport in production
if (isProduction) {
    // Error logs
    logger.add(new winston.transports.File({
        filename: path.join(__dirname, '../logs/error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));

    // Combined logs
    logger.add(new winston.transports.File({
        filename: path.join(__dirname, '../logs/combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
}

// Helper methods for common patterns
logger.request = (req, message = 'Request received') => {
    logger.info(message, {
        method: req.method,
        path: req.path,
        query: Object.keys(req.query).length ? req.query : undefined,
    });
};

logger.response = (statusCode, message = 'Response sent') => {
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    logger[logLevel](message, { statusCode });
};

module.exports = logger;
