# Log Filter Quick Reference

## Quick Examples

### Filter by Log Level
```bash
# Get only error logs
curl "http://localhost:3000/logs?filter=%7B%22level%22%3A%22error%22%7D"

# Get error OR warn logs
curl "http://localhost:3000/logs?filter=%7B%22level%22%3A%7B%22%24in%22%3A%5B%22error%22%2C%22warn%22%5D%7D%7D"
```

### Filter by User
```bash
# Get logs for specific user
curl "http://localhost:3000/logs?filter=%7B%22userData.userId%22%3A%22user123%22%7D"

# Get logs for admin users (regex)
curl "http://localhost:3000/logs?filter=%7B%22userData.username%22%3A%7B%22%24regex%22%3A%22%5Eadmin%22%7D%7D"
```

### Filter by HTTP Status
```bash
# Get 4xx errors
curl "http://localhost:3000/logs?filter=%7B%22%24and%22%3A%5B%7B%22httpResponse%22%3A%7B%22%24gte%22%3A400%7D%7D%2C%7B%22httpResponse%22%3A%7B%22%24lt%22%3A500%7D%7D%5D%7D"

# Get successful responses (200-299)
curl "http://localhost:3000/logs?filter=%7B%22%24and%22%3A%5B%7B%22httpResponse%22%3A%7B%22%24gte%22%3A200%7D%7D%2C%7B%22httpResponse%22%3A%7B%22%24lte%22%3A299%7D%7D%5D%7D"
```

### Filter by Module
```bash
# Get logs for specific module
curl "http://localhost:3000/logs?filter=%7B%22moduleData.moduleId%22%3A42%7D"

# Get logs that have module data
curl "http://localhost:3000/logs?filter=%7B%22moduleData%22%3A%7B%22%24exists%22%3Atrue%7D%7D"
```

### Security Alerts
```bash
# Get all security alerts
curl "http://localhost:3000/logs?filter=%7B%22securityAlert%22%3Atrue%7D"

# Get security alerts OR errors
curl "http://localhost:3000/logs?filter=%7B%22%24or%22%3A%5B%7B%22securityAlert%22%3Atrue%7D%2C%7B%22level%22%3A%22error%22%7D%5D%7D"
```

## Filter JSON Examples (before URL encoding)

### Simple Filters
```json
{"level": "error"}
{"userData.userId": "user123"}
{"securityAlert": true}
{"moduleData.moduleId": 42}
```

### Comparison Filters
```json
{"httpResponse": {"$gte": 400}}
{"httpResponse": {"$lt": 500}}
```

### Array Filters
```json
{"level": {"$in": ["error", "warn", "fatal"]}}
{"level": {"$nin": ["debug", "verbose"]}}
```

### Existence Filters
```json
{"moduleData": {"$exists": true}}
{"errorMessage": {"$exists": false}}
```

### Pattern Matching
```json
{"userData.username": {"$regex": "^admin"}}
{"errorMessage": {"$regex": "timeout"}}
```

### Complex Filters
```json
{
  "$and": [
    {"level": {"$in": ["error", "warn"]}},
    {"httpResponse": {"$gte": 400}}
  ]
}
```

```json
{
  "$or": [
    {"level": "error"},
    {"securityAlert": true}
  ]
}
```

## URL Encoding Helper

Use online tools or:
- JavaScript: `encodeURIComponent(JSON.stringify(filter))`
- Python: `urllib.parse.quote(json.dumps(filter))`
- Command line: Use tools like `jq` or online encoders

## Common Filter Patterns

### All Critical Issues
```json
{
  "$or": [
    {"level": "fatal"},
    {"level": "error"},
    {"securityAlert": true}
  ]
}
```

### User Activity Tracking
```json
{
  "userData.userId": "user123",
  "level": {"$nin": ["debug", "verbose"]}
}
```

### Failed API Requests
```json
{
  "$and": [
    {"httpMethod": {"$exists": true}},
    {"httpResponse": {"$gte": 400}}
  ]
}
```

### Module-Related Errors
```json
{
  "level": "error",
  "moduleData": {"$exists": true}
}
```
