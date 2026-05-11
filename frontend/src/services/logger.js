/**
 * Frontend logging utility using Pino for browser
 */
import pino from "pino";

/**
 * Creates and configures a client logger instance
 *
 * @function clientLogger
 * @param {Object} config - Logger configuration options
 * @param {string} [config.level='warn'] - Logging level in production, 'debug' in development
 * @return {Object} Logger instance with info, debug, warn, and error methods
 * @example
 * // Create a logger
 * const logger = clientLogger();
 * 
 * // Log messages
 * logger.info('User action', { action: 'click', element: 'button' });
 * logger.error('API error', { status: 500, endpoint: '/api/data' });
 */
export const clientLogger = (config = {}) => {
  const isDev = import.meta.env.MODE === 'development';
  
  const logger = pino({
    level: config.level || (isDev ? 'debug' : 'warn'),
    browser: { 
      asObject: true,
      serialize: true,
      formatters: {
        level: (label) => {
          return { level: label };
        },
        log: (object) => {
          // Add timestamp in same format as backend
          return {
            time: new Date().toISOString().replace('T', ' ').replace('Z', ''),
            ...object
          };
        }
      },
      transmit: {
        level: 'error',
        send: function (level, logEvent) {
          // Optionally send errors to a logging service
          if (level >= 50) { // error level
            console.error('Client error logged:', logEvent);
          }
        }
      }
    },
  });

  return {
    /**
     * Log an informational message
     * @function info
     * @param {string} msg - Message to log
     * @param {Object} [data] - Additional data to log with the message
     */
    info: (msg, data) => logger.info(data, msg),

    /**
     * Log a debug message
     * @function debug
     * @param {string} msg - Message to log
     * @param {Object} [data] - Additional data to log with the message
     */
    debug: (msg, data) => logger.debug(data, msg),

    /**
     * Log a warning message
     * @function warn
     * @param {string} msg - Message to log
     * @param {Object} [data] - Additional data to log with the message
     */
    warn: (msg, data) => logger.warn(data, msg),

    /**
     * Log an error message
     * @function error
     * @param {string} msg - Message to log
     * @param {Object} [data] - Additional data to log with the message
     */
    error: (msg, data) => logger.error(data, msg),
  };
};

// Create default logger instance
export const logger = clientLogger();

export default { clientLogger, logger };