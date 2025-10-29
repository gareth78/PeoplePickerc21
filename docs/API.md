# API Reference

All endpoints are JSON over HTTP. Unless noted, responses use the standard envelope:

```json
{
  "ok": boolean,
  "data"?: any,
  "error"?: string,
  "meta"?: object
}
```

Base URL: relative to the Next.js app (e.g., `http://localhost:3000`).

## GET /api/health
Returns app health information.

- Cache: `no-store`
- Response 200:
```json
{
  "ok": true,
  "status": 200,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "environment": "development",
  "nodeVersion": "v20.x.x",
  "uptime": 123.45
}
```
- Response 500:
```json
{ "ok": false, "error": "Health check failed" }
```

Example:
```bash
curl -s http://localhost:3000/api/health
```

---

## GET /api/cache/stats
Returns Redis cache connection and performance statistics.

- Requires: Redis configured via `redis-connection-string` or `REDIS_CONNECTION_STRING`
- Response 200 (when configured):
```json
{
  "ok": true,
  "data": {
    "connected": true,
    "keys": 123,
    "memoryUsed": "12.3M",
    "hits": 100,
    "misses": 50,
    "hitRate": "66.7%"
  }
}
```
- Response 200 (when not configured):
```json
{
  "ok": true,
  "data": {
    "connected": false,
    "keys": 0,
    "memoryUsed": "0",
    "hits": 0,
    "misses": 0,
    "hitRate": "0%"
  }
}
```
- Response 500: `{ "ok": false, "error": "Failed to get cache stats" }`

Example:
```bash
curl -s http://localhost:3000/api/cache/stats
```

---

## GET /api/okta/ping
Checks connectivity to the Okta Users API by performing a minimal query.

- Requires: `okta-org-url`, `okta-api-token`
- Cache: `no-store`
- Response 200:
```json
{
  "ok": true,
  "data": { "connected": true, "latency": 250 },
  "meta": { "latency": 250 }
}
```
- Response 500:
```json
{
  "ok": false,
  "data": { "connected": false, "latency": 250 },
  "error": "Connection failed"
}
```

Example:
```bash
curl -s http://localhost:3000/api/okta/ping
```

---

## GET /api/okta/users
Search for users by name or email. Minimum 2 characters are required.

Query parameters:
- `q` (required): search term, min length 2
- `cursor` (optional): pagination cursor (from previous response `data.nextCursor`)

Responses:
- 200 OK:
```json
{
  "ok": true,
  "data": {
    "users": [
      {
        "id": "00u...",
        "displayName": "Jane Doe",
        "email": "jane.doe@example.com",
        "firstName": "Jane",
        "lastName": "Doe",
        "title": "Software Engineer",
        "department": "Engineering",
        "officeLocation": "London",
        "mobilePhone": "+44...",
        "avatarUrl": null,
        "managerEmail": null
      }
    ],
    "nextCursor": "abc123",
    "totalCount": 10
  },
  "meta": { "count": 10, "cached": false }
}
```
- 400 Bad Request (query too short):
```json
{ "ok": false, "error": "Query must be at least 2 characters" }
```
- 500 Server Error:
```json
{ "ok": false, "error": "Search failed" }
```

Examples:
```bash
# Basic search
curl -s "http://localhost:3000/api/okta/users?q=jane"

# With pagination
curl -s "http://localhost:3000/api/okta/users?q=jane&cursor=abc123"
```

Client usage:
```ts
const params = new URLSearchParams({ q: 'jane' });
const res = await fetch(`/api/okta/users?${params}`);
const json = await res.json();
```

---

## GET /api/okta/users/sample
Returns 5 sample users (uses the same normalization and sorting as the main search endpoint).

- Requires: Okta configuration
- Response 200:
```json
{
  "ok": true,
  "data": {
    "users": [...],
    "nextCursor": null,
    "totalCount": 5
  },
  "meta": { "count": 5 }
}
```
- Response 500: `{ "ok": false, "error": "Failed to fetch sample" }`

Example:
```bash
curl -s http://localhost:3000/api/okta/users/sample
```

---

## GET /api/okta/users/{id}
Fetch a single user by Okta ID.

- Requires: Okta configuration
- Response 200:
```json
{
  "ok": true,
  "data": {
    "id": "00u...",
    "displayName": "Jane Doe",
    "email": "jane.doe@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "title": "Software Engineer",
    "department": "Engineering",
    "officeLocation": "London",
    "mobilePhone": null,
    "avatarUrl": null,
    "managerEmail": null
  },
  "meta": { "cached": false }
}
```
- 500 Server Error: `{ "ok": false, "error": "Failed to fetch user" }`

Example:
```bash
curl -s http://localhost:3000/api/okta/users/00u123456789ABCDEF
```
