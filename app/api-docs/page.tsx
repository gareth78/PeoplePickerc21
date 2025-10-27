import styles from './page.module.css';

export default function ApiDocsPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>API Documentation</h1>
      <p className={styles.subtitle}>
        PeoplePickerc21 REST API endpoints for Okta directory integration
      </p>

      <div className={styles.endpoint}>
        <div className={styles.method}>GET</div>
        <div className={styles.path}>/api/health</div>
        <p className={styles.description}>
          Returns system health status, uptime, and cache statistics.
        </p>
        <div className={styles.response}>
          <strong>Response:</strong>
          <pre>{`{
  "ok": true,
  "status": 200,
  "timestamp": "2025-10-27T10:00:00.000Z",
  "environment": "production",
  "nodeVersion": "v20.19.5",
  "cacheType": "memory",
  "uptime": 3600,
  "cache": {
    "type": "memory",
    "ttl": 600,
    "entries": 5,
    "hitRate": 0.75
  }
}`}</pre>
        </div>
      </div>

      <div className={styles.endpoint}>
        <div className={styles.method}>GET</div>
        <div className={styles.path}>/api/okta/ping</div>
        <p className={styles.description}>
          Tests Okta API connectivity and returns latency.
        </p>
        <div className={styles.response}>
          <strong>Response:</strong>
          <pre>{`{
  "ok": true,
  "data": {
    "connected": true,
    "latency": 250
  },
  "meta": {
    "latency": 250,
    "cached": false
  }
}`}</pre>
        </div>
      </div>

      <div className={styles.endpoint}>
        <div className={styles.method}>GET</div>
        <div className={styles.path}>/api/okta/users?q={'{query}'}&cursor={'{cursor}'}</div>
        <p className={styles.description}>
          Search for users by name or email. Requires minimum 2 characters.
        </p>
        <div className={styles.params}>
          <strong>Query Parameters:</strong>
          <ul>
            <li><code>q</code> (required): Search term (min 2 chars)</li>
            <li><code>cursor</code> (optional): Pagination cursor</li>
          </ul>
        </div>
        <div className={styles.response}>
          <strong>Response:</strong>
          <pre>{`{
  "ok": true,
  "data": {
    "users": [
      {
        "id": "00u...",
        "displayName": "John Doe",
        "email": "john.doe@company.com",
        "firstName": "John",
        "lastName": "Doe",
        "title": "Software Engineer",
        "department": "Engineering",
        "officeLocation": "London",
        "mobilePhone": "+44...",
        "avatarUrl": null
      }
    ],
    "nextCursor": "abc123",
    "totalCount": 10
  },
  "meta": {
    "count": 10,
    "cached": false
  }
}`}</pre>
        </div>
      </div>

      <div className={styles.endpoint}>
        <div className={styles.method}>GET</div>
        <div className={styles.path}>/api/okta/users/sample</div>
        <p className={styles.description}>
          Returns 5 sample users for testing and development.
        </p>
        <div className={styles.response}>
          <strong>Response:</strong>
          <pre>{`{
  "ok": true,
  "data": {
    "users": [...],
    "nextCursor": null,
    "totalCount": 5
  },
  "meta": {
    "count": 5
  }
}`}</pre>
        </div>
      </div>

      <div className={styles.endpoint}>
        <div className={styles.method}>GET</div>
        <div className={styles.path}>/api/okta/users/{'{id}'}</div>
        <p className={styles.description}>
          Retrieve a specific user by their Okta ID.
        </p>
        <div className={styles.response}>
          <strong>Response:</strong>
          <pre>{`{
  "ok": true,
  "data": {
    "id": "00u...",
    "displayName": "John Doe",
    "email": "john.doe@company.com",
    ...
  }
}`}</pre>
        </div>
      </div>

      <div className={styles.footer}>
        <a href="/" className={styles.link}>← Back to Dashboard</a>
      </div>
    </div>
  );
}
