# People Picker Outlook Add-in – Developer Guide

## Prerequisites
- Node.js 20.x (matches workspace engines requirement)
- npm (ships with Node 20)
- Outlook on the web (Monarch) or Outlook desktop Insider build that supports add-in sideloading
- Ability to trust a self-signed HTTPS certificate on your development machine

## Install & bootstrap

```bash
cd /workspace
npm install
```

The repository uses npm workspaces. Installing at the root will bootstrap:
- `apps/web` – existing People Picker Next.js app
- `apps/addin` – Outlook task-pane add-in (Vite + React)
- `packages/sdk` – shared TypeScript client that wraps backend APIs

## Running the stack

```bash
# from repo root
npm run dev
```

This starts both applications with labelled logs:
- `web` → http://localhost:3000 (Next.js backend/admin)
- `addin` → https://localhost:5173 (Vite dev server with automatic HTTPS + `/api` proxy to the web app)

> The Vite server runs with HTTPS so Outlook accepts the task pane. The first run prompts you to trust a self-signed cert.

## Environment variables

| Variable | Scope | Purpose | Dev default |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_PEOPLEPICKER_BASE_URL` | apps/addin | Base URL for SDK requests. Leave blank in dev to rely on the `/api` proxy. | _unset_ |
| `ALLOWED_ORIGINS` | apps/web | Comma-separated additional origins allowed by CORS middleware. | Optional |
| `ORG_NAME`, `APP_NAME`, `ORG_LOGO_URL` | apps/web | Optional overrides for `/api/config/public`. | Optional |

## Sideloading in Outlook on the web (Monarch)

1. Run `npm run dev` and wait for both servers to be ready.
2. Browse to https://outlook.office.com/ (new Outlook).
3. Open the **Add-ins** pane → **Custom add-ins** → **Upload add-in** → **Upload from URL**.
4. Enter `https://localhost:5173/manifest.xml`.
5. Outlook prompts to trust the certificate if needed; accept it.
6. After sideloading, open a message (read) or compose window. A "People Picker" button appears on the ribbon. Clicking it opens the task pane at `https://localhost:5173/index.html`.

## Developer workflow notes

- The add-in task pane fetches `/api/config/public` on load to confirm connectivity and display org details.
- Presence polling uses `sdk.presence.get(email, { noCache: true, ttl: 60 })`, aligned with the backend cache clamp (30–300 seconds).
- The SDK aborts requests after 10s by default; adjust per call via `timeoutMs` if required.
- Telemetry is limited to `console.log` statements in dev builds (`import.meta.env.DEV` guard).

## Acceptance checklist for local testing

- [ ] `npm run dev` starts both apps; `https://localhost:5173/index.html` loads without CORS issues.
- [ ] `/api/config/public` responds with `appName` and `orgName`.
- [ ] Search tab queries `/api/okta/users` via the SDK and returns results.
- [ ] Selecting a user displays photo, presence (with `fetchedAt`), and OOO information.
- [ ] Presence auto-refreshes every 60s and after tab visibility changes.
- [ ] Insert tab injects the HTML summary into a compose body and the recipient buttons add addresses.
- [ ] Requests from unknown origins are rejected by the API (verify via browser devtools or curl).
