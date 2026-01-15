# Log Filter System Documentation

## Overview

The log filter system provides a flexible MongoDB-inspired query syntax for filtering logs through the `/logs` endpoint.

## Usage

Add the `filter` query parameter to the `/logs` endpoint with a URL-encoded JSON object:

```
GET /logs?filter={"level":"error"}
```

## Filter Syntax

### Basic Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq` | Equals | `{"level": {"$eq": "error"}}` |
| `$ne` | Not equals | `{"level": {"$ne": "log"}}` |
| `$in` | In array | `{"level": {"$in": ["error", "warn"]}}` |
| `$nin` | Not in array | `{"level": {"$nin": ["debug", "verbose"]}}` |
| `$gt` | Greater than | `{"httpResponse": {"$gt": 399}}` |
| `$gte` | Greater than or equal | `{"httpResponse": {"$gte": 400}}` |
| `$lt` | Less than | `{"httpResponse": {"$lt": 400}}` |
| `$lte` | Less than or equal | `{"httpResponse": {"$lte": 299}}` |
| `$exists` | Field exists | `{"moduleData": {"$exists": true}}` |
| `$regex` | Regular expression match | `{"userData.username": {"$regex": "^admin"}}` |

### Logical Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$and` | Logical AND | `{"$and": [{"level": "error"}, {"securityAlert": true}]}` |
| `$or` | Logical OR | `{"$or": [{"level": "error"}, {"level": "fatal"}]}` |

## Examples

### Simple Equality (Shorthand)

Filter logs with level "error":
```json
{"level": "error"}
```

URL: `/logs?filter=%7B%22level%22%3A%22error%22%7D`

### Multiple Conditions (Implicit AND)

Filter logs with level "error" from a specific user:
```json
{
  "level": "error",
  "userData.userId": "user123"
}
```

### IN Operator

Filter logs with level "log" or "warn":
```json
{
  "level": {
    "$in": ["log", "warn"]
  }
}
```

### NOT IN Operator

Exclude debug and verbose logs:
```json
{
  "level": {
    "$nin": ["debug", "verbose"]
  }
}
```

### Comparison Operators

Filter HTTP errors (status >= 400):
```json
{
  "httpResponse": {
    "$gte": 400
  }
}
```

Filter successful responses (200-299):
```json
{
  "$and": [
    {"httpResponse": {"$gte": 200}},
    {"httpResponse": {"$lte": 299}}
  ]
}
```

### Nested Field Access

Filter by nested user data:
```json
{
  "userData.username": "admin",
  "userData.userId": "user123"
}
```

Filter by module data:
```json
{
  "moduleData.moduleId": 42
}
```

### Regular Expression

Find logs from admin users:
```json
{
  "userData.username": {
    "$regex": "^admin"
  }
}
```

### Field Existence

Filter logs that have module data:
```json
{
  "moduleData": {
    "$exists": true
  }
}
```

Filter logs that don't have an error message:
```json
{
  "errorMessage": {
    "$exists": false
  }
}
```

### Complex Logical Queries

Filter error logs from a specific user OR security alerts:
```json
{
  "$or": [
    {
      "level": "error",
      "userData.userId": "user123"
    },
    {
      "securityAlert": true
    }
  ]
}
```

Filter warn/error logs with HTTP errors, excluding specific users:
```json
{
  "$and": [
    {"level": {"$in": ["warn", "error"]}},
    {"httpResponse": {"$gte": 400}},
    {"userData.userId": {"$ne": "system"}}
  ]
}
```

## Available Log Fields

### Top-Level Fields
- `timestamp` (Date)
- `level` (string: "log" | "fatal" | "error" | "warn" | "debug" | "verbose")
- `codeLocation` (string)
- `httpResponse` (number | null)
- `httpMethod` (string | null)
- `requestBody` (any | null)
- `errorMessage` (string | null)
- `programmerNote` (string | null)
- `responseMessage` (string | null)
- `originalUrl` (string | null)
- `securityAlert` (boolean)
- `message` (string | null)

### Nested Fields

**userData** (object | null):
- `userData.username` (string | null)
- `userData.userId` (string | null)
- `userData.requestInterests` (string | null)
- `userData.requestMerits` (string | null)
- `userData.requestGoals` (string | null)
- `userData.requestRoleName` (string | null)
- `userData.refreshTokenUsed` (string | null)

**moduleData** (object | null):
- `moduleData.moduleId` (number | null)
- `moduleData.name` (string | null)
- `moduleData.requestShortdescription` (string | null)
- And more module-related fields...

**debugObject** (object | null):
- `debugObject.value` (string | null)
- `debugObject.fieldName` (string | null)
- `debugObject.filterData` (object | null)