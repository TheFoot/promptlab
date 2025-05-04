# Utility Modules

This directory contains utility modules that provide shared functionality across the backend application.

## Modules

### Logger

The `logger.js` module provides a standardized logging interface for the application.

```javascript
import logger from '../modules/logger.js';

logger.info('Server started');
logger.error('Database connection failed', error);
```

#### Features:

- Multiple log levels (debug, info, warn, error)
- Structured JSON logging for production
- Formatted console output for development
- Request logging for HTTP requests

## Usage

Import the specific module you need:

```javascript
import logger from '../modules/logger.js';

// Use the module
logger.info('Operation successful', { additionalData: 'value' });
```

## Creating New Modules

When creating new utility modules:

1. Place the module in this directory
2. Use ES Module exports
3. Add unit tests
4. Update this README with usage instructions
5. Follow single responsibility principle

## Related Documentation

- [Backend README](../../README.md)
- [Configuration](../config/README.md)