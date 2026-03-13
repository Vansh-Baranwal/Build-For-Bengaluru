# Logging Guide for NammaFix Backend

## Overview

The NammaFix backend uses **Pino** for structured, high-performance logging. Pino is one of the fastest Node.js loggers and provides JSON-formatted logs suitable for production monitoring.

## Log Levels

Pino supports the following log levels (in order of severity):

1. **trace** (10) - Very detailed debugging information
2. **debug** (20) - Debugging information
3. **info** (30) - General informational messages
4. **warn** (40) - Warning messages
5. **error** (50) - Error messages
6. **fatal** (60) - Fatal errors that cause application to crash

## Configuration

### Development Environment

In development, logs are:
- Pretty-printed with colors for readability
- Set to `debug` level (shows all logs)
- Include timestamps in HH:MM:ss format
- Display full error stack traces

Example development log:
```
[10:30:45] INFO: NammaFix Backend started successfully
    port: 3000
    environment: "development"
    healthCheck: "http://localhost:3000/health"
```

### Production Environment

In production, logs are:
- JSON-formatted for machine parsing
- Set to `info` level (hides debug/trace logs)
- Exclude sensitive information (passwords, API keys, tokens)
- Suitable for log aggregation services (ELK, Datadog, etc.)

Example production log:
```json
{
  "level": 30,
  "time": 1705320645000,
  "msg": "NammaFix Backend started successfully",
  "port": 3000,
  "environment": "production",
  "env": "production"
}
```

## Sensitive Data Redaction

The logger automatically redacts sensitive information:
- Authorization headers
- API keys
- Passwords
- Tokens
- Secrets

Redacted fields show `[REDACTED]` instead of actual values.

## HTTP Request Logging

All HTTP requests are automatically logged with:
- Request method (GET, POST, etc.)
- Request URL and path
- Query parameters
- Request body (development only)
- Response status code
- Response time (duration)
- Client IP address

Example request log:
```json
{
  "level": 30,
  "request": {
    "method": "POST",
    "url": "/api/complaints",
    "path": "/api/complaints",
    "query": {},
    "remoteAddress": "127.0.0.1"
  },
  "response": {
    "statusCode": 201
  },
  "duration": 245,
  "msg": "POST /api/complaints completed"
}
```

## Using the Logger

### Import the Logger

```javascript
const logger = require('../config/logger');
```

### Log Messages

```javascript
// Info level
logger.info('Server started successfully');

// With context
logger.info({ port: 3000, env: 'production' }, 'Server started');

// Debug level
logger.debug({ userId: '123' }, 'Processing user request');

// Warning
logger.warn({ limit: 100 }, 'Approaching rate limit');

// Error
logger.error({ error: err }, 'Failed to process request');

// Fatal (crashes application)
logger.fatal({ error: err }, 'Critical system failure');
```

### Structured Logging Best Practices

1. **Always include context**:
```javascript
// Good
logger.error({ error, complaint_id: id }, 'Error retrieving complaint');

// Bad
logger.error('Error retrieving complaint');
```

2. **Use appropriate log levels**:
```javascript
logger.debug('Detailed debugging info');  // Development only
logger.info('Normal operation');           // General info
logger.warn('Something unusual');          // Potential issues
logger.error('Operation failed');          // Errors
logger.fatal('System crash');              // Critical failures
```

3. **Don't log sensitive data**:
```javascript
// Good
logger.info({ user_id: user.id }, 'User logged in');

// Bad
logger.info({ password: user.password }, 'User logged in');
```

4. **Include error objects**:
```javascript
// Good
logger.error({ error: err, context: 'additional info' }, 'Operation failed');

// Bad
logger.error(err.message);
```

## Log Output Examples

### Successful Request
```
[10:30:45] INFO: POST /api/complaints completed
    request: {
      "method": "POST",
      "url": "/api/complaints",
      "remoteAddress": "127.0.0.1"
    }
    response: {
      "statusCode": 201
    }
    duration: 245
```

### Error Log
```
[10:31:12] ERROR: Error creating complaint
    error: {
      "type": "DatabaseError",
      "message": "Connection timeout",
      "stack": "..."
    }
    description: "Large pothole on MG Road..."
```

### Database Query (Debug)
```
[10:30:46] DEBUG: Database query executed
    query: "SELECT * FROM complaints WHERE complaint_id = $1"
    duration: 12
    rows: 1
```

## Log Aggregation

For production deployments, consider using log aggregation services:

### ELK Stack (Elasticsearch, Logstash, Kibana)
```bash
# Pipe logs to Logstash
node src/server.js | logstash -f logstash.conf
```

### Datadog
```javascript
// Add Datadog transport to Pino
const pino = require('pino');
const logger = pino({
  transport: {
    target: 'pino-datadog',
    options: {
      apiKey: process.env.DATADOG_API_KEY
    }
  }
});
```

### CloudWatch (AWS)
```bash
# Use CloudWatch agent to collect logs
aws logs create-log-group --log-group-name /nammafix/backend
```

## Monitoring and Alerts

Set up alerts based on log patterns:

1. **Error Rate Alert**: Trigger when error logs exceed threshold
2. **Response Time Alert**: Trigger when duration > 1000ms
3. **Database Connection Alert**: Trigger on database connection failures
4. **AI Service Alert**: Trigger on AI processing failures

Example alert query (for ELK):
```
level: "error" AND msg: "Database connection check failed"
```

## Log Rotation

For file-based logging in production:

```javascript
const pino = require('pino');
const logger = pino(pino.destination({
  dest: './logs/app.log',
  sync: false,
  minLength: 4096
}));
```

Use logrotate for automatic rotation:
```
/var/log/nammafix/*.log {
  daily
  rotate 7
  compress
  delaycompress
  notifempty
  create 0640 nodejs nodejs
  sharedscripts
}
```

## Debugging

To enable debug logs in production temporarily:

```bash
# Set log level via environment variable
LOG_LEVEL=debug npm start
```

Or programmatically:
```javascript
logger.level = 'debug';
```

## Performance

Pino is designed for high performance:
- Asynchronous logging (non-blocking)
- Minimal overhead (~10x faster than Winston)
- JSON serialization optimized
- Child loggers for context isolation

## Best Practices Summary

1. ✅ Use structured logging with context objects
2. ✅ Choose appropriate log levels
3. ✅ Never log sensitive information
4. ✅ Include error objects with stack traces
5. ✅ Use child loggers for module-specific context
6. ✅ Monitor logs in production
7. ✅ Set up alerts for critical errors
8. ✅ Rotate logs to prevent disk space issues
9. ✅ Use log aggregation for distributed systems
10. ✅ Test logging in development before deploying

## Troubleshooting

### Logs not appearing

**Problem**: No logs in console

**Solution**: Check log level configuration
```javascript
logger.level = 'debug'; // Temporarily increase verbosity
```

### Too many logs

**Problem**: Log volume too high

**Solution**: Increase log level to reduce noise
```javascript
logger.level = 'warn'; // Only warnings and errors
```

### Performance impact

**Problem**: Logging slowing down application

**Solution**: Use asynchronous logging and appropriate log levels
```javascript
// Avoid logging in tight loops
// Use debug level for verbose logs
```

## Additional Resources

- [Pino Documentation](https://getpino.io/)
- [Best Practices for Logging](https://www.loggly.com/ultimate-guide/node-logging-basics/)
- [Structured Logging](https://www.honeycomb.io/blog/structured-logging-and-your-team)
