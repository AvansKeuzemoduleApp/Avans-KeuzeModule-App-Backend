## Quick Start

### Basic Usage
```bash
# Filter by level
GET /logs?filter={"level":"error"}

# Filter by nested field
GET /logs?filter={"userData.userId":"user123"}

# Multiple conditions (implicit AND)
GET /logs?filter={"level":"error","securityAlert":true}
```

### Supported Operators

**Comparison**: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`  
**Array**: `$in`, `$nin`  
**Logical**: `$and`, `$or`  
**Other**: `$exists`, `$regex`

### Examples

```json
// IN operator
{"level": {"$in": ["error", "warn"]}}

// Comparison
{"httpResponse": {"$gte": 400}}

// Nested access
{"userData.username": "admin"}

// Regex
{"userData.username": {"$regex": "^admin"}}

// Complex query
{
  "$or": [
    {"level": "error"},
    {"securityAlert": true}
  ]
}
```