# Log Filter System

A flexible MongoDB-inspired filter system for the logs endpoint.

## What's Included

### Core Files
- **[log-filter.dto.ts](src/modules/logger/dto/log-filter.dto.ts)** - Type definitions for filter syntax
- **[log-filter-evaluator.ts](src/modules/logger/helpers/log-filter-evaluator.ts)** - Filter evaluation logic
- **[log-filter-query.dto.ts](src/modules/logger/dto/log-filter-query.dto.ts)** - Query validation DTO
- **[logger.controller.ts](src/modules/logger/logger.controller.ts)** - Updated controller with filter support

### Documentation
- **[log-filter.md](docs/log-filter.md)** - Complete documentation with all operators and examples
- **[log-filter-quick-reference.md](docs/log-filter-quick-reference.md)** - Quick reference with curl examples

### Tests
- **[log-filter-evaluator.spec.ts](src/modules/logger/helpers/__tests__/log-filter-evaluator.spec.ts)** - Comprehensive unit tests (30 tests, all passing)
- **[get logs with filter.bru](bruno/logs/get%20logs%20with%20filter.bru)** - Bruno API collection for testing

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

## Implementation Phases

✅ **Phase 1** - Basic operators: `$eq`, `$ne`, `$in`, `$nin`, nested field access  
✅ **Phase 2** - Enhanced operators: `$gt`, `$gte`, `$lt`, `$lte`, `$regex`, `$exists`  
✅ **Phase 3** - Logical operators: `$and`, `$or`

## Features

- **Memory Efficient**: Filters applied during stream processing
- **Type Safe**: Full TypeScript support with proper type definitions
- **Well Tested**: 30+ unit tests covering all operators
- **Error Handling**: Graceful handling of invalid filters
- **Nested Fields**: Dot notation support for deep field access
- **Flexible Syntax**: MongoDB-inspired, familiar to many developers

## Testing

```bash
# Run unit tests
npm test -- log-filter-evaluator.spec.ts

# Use Bruno collection
# Open bruno/logs/get logs with filter.bru in Bruno
```

## Architecture

```
Transform Stream Pipeline:
  File Read → Parse JSON → Filter String Messages → Apply Custom Filter → Build JSON Array
```

The filter evaluator is instantiated once in the controller and used within the transform stream for each log entry, ensuring efficient memory usage even with large log files.

## Error Handling

- Invalid JSON in filter query → `400 Bad Request`
- Missing log file → `404 Not Found`
- Invalid regex patterns → Silently fails (returns false)
- Type mismatches → Gracefully handled (e.g., `$gt` on strings returns false)

## See Also

- [Complete Documentation](docs/log-filter.md)
- [Quick Reference](docs/log-filter-quick-reference.md)
- [Bruno API Tests](bruno/logs/get%20logs%20with%20filter.bru)
