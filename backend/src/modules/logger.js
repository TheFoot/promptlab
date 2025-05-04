/**
 * @module modules/logger
 * @description Logging utility module using the Pino logger
 * @requires pino
 */

import pino from 'pino';

/**
 * Creates and configures a server logger instance
 *
 * @function serverLogger
 * @param {Object} config - Logger configuration options
 * @param {string} [config.level='info'] - Logging level ('trace'|'debug'|'info'|'warn'|'error'|'fatal')
 * @returns {Object} Logger instance with info, debug, warn, and error methods
 * @example
 * // Create a logger with default info level
 * const logger = serverLogger({ level: 'info' });
 *
 * // Log an informational message with metadata
 * logger.info('Server started', { port: 3000 });
 */
export const serverLogger = config => {

    const logger = pino ( {
        level    : config.level || 'info',
        transport: {
            target : 'pino-pretty',
            options: {
                colorize       : true,
                colorizeObjects: true,
                translateTime  : 'UTC:yyyy-MM-dd\'T\'HH:MM:ss\'Z\'',
                ignore         : 'pid,hostname'
            }
        }
    } );

    return {
        /**
         * Log an informational message
         * @function info
         * @param {string} msg - Message to log
         * @param {Object} [data] - Additional data to log with the message
         */
        info: ( msg, data ) => logger.info ( data, msg ),

        /**
         * Log a debug message
         * @function debug
         * @param {string} msg - Message to log
         * @param {Object} [data] - Additional data to log with the message
         */
        debug: ( msg, data ) => logger.debug ( data, msg ),

        /**
         * Log a warning message
         * @function warn
         * @param {string} msg - Message to log
         * @param {Object} [data] - Additional data to log with the message
         */
        warn: ( msg, data ) => logger.warn ( data, msg ),

        /**
         * Log an error message
         * @function error
         * @param {string} msg - Message to log
         * @param {Object} [data] - Additional data to log with the message
         */
        error: ( msg, data ) => logger.error ( data, msg )
    };

};

export default { serverLogger };
