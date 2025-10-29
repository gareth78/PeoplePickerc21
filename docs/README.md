# People Finder Documentation

Welcome to the People Finder documentation. This reference covers all public REST APIs, React components, custom hooks, and utility modules available in this repository.

- API Reference: [API.md](./API.md)
- Components: [Components.md](./Components.md)
- Hooks: [Hooks.md](./Hooks.md)
- Utilities and Types: [Utilities.md](./Utilities.md)

## Useful App Pages
- In-app API docs (UI): `/api-docs`
- Technical dashboard: `/technical`
- Diagnostics: `/diagnostics`

## Environment Variables
Some features require configuration:

- Okta
  - `okta-org-url` (required for Okta APIs)
  - `okta-api-token` (required for Okta APIs)
- Redis (optional; enables caching)
  - `redis-connection-string` or `REDIS_CONNECTION_STRING`

When Redis is not configured, caching-related APIs gracefully degrade and return default values.
