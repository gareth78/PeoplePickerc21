# People Picker Outlook Add-in – Developer Guide

This guide explains how to run the People Picker web app and Outlook add-in together in development, sideload the manifest, and verify core workflows.

## Prerequisites

- Node.js 20.x
- npm 9+
- Outlook on the web (Monarch) with sideloading enabled
- Access to the existing People Picker development configuration (environment variables, database, Redis, etc.)

## Install dependencies

```bash
pnpm install
```

The root `package.json` configures npm workspaces for:

- `apps/web` – existing Next.js admin/backend app
- `apps/addin` – Outlook task-pane app (Vite + React)
- `packages/sdk` – shared TypeScript SDK used by the add-in

## Run both apps together

```bash
pnpm run dev
```

The command starts:

- **Web app** at http://localhost:3000
- **Add-in dev server** at http://localhost:5173 (includes `manifest.xml`)

During development leave `NEXT_PUBLIC_PEOPLEPICKER_BASE_URL` unset in the add-in so the Vite proxy forwards `/api/*` to the web app.

## Sideload in the new Outlook experience

1. Open https://outlook.office.com in a Chromium-based browser.
2. Switch to the new Outlook UI (Monarch) if prompted.
3. Open the **Settings ⚙️ → View all Outlook settings → Mail → Customize actions → Add-ins** page.
4. Choose **Upload custom app** and provide the manifest URL: `http://localhost:5173/manifest.xml`.
5. Outlook will add the ribbon button **People Picker** to message compose/read surfaces.
6. Open or create a message, click **People Picker**, and confirm the task pane loads the add-in UI.

> ℹ️ Manifest sideloading requires your browser to trust the localhost HTTPS certificate if enforced by policy.

## Expected dev workflow

- **Org banner** – `/api/config/public` is fetched on task-pane mount to display app/org name and logo.
- **Search tab** – typing 2+ characters triggers `sdk.users.search()` which proxies to `/api/okta/users`.
- **Presence** – hovering a result preloads `/api/graph/presence/:email`. The Details tab forces a refresh with `?noCache=1&ttl=60` every minute while visible.
- **Photos & OOO** – loaded lazily via `/api/graph/photo` and `/api/graph/ooo`.
- **Insert & recipients** – buttons use `Office.context.mailbox.item.*` APIs to inject HTML or recipients into the current compose item.

## Troubleshooting

- **CORS errors** – ensure the web app has `ALLOWED_ORIGINS` including `http://localhost:5173`.
- **Presence cache confusion** – Redis caches are scoped per email. Use `noCache=1` when validating live Graph data.
- **Manifest not loading** – confirm Vite dev server is running and firewall rules allow port 5173.

## Acceptance smoke checklist

Run through the following after major changes:

1. `pnpm run dev` boots both apps with useful logging.
2. `/api/config/public` returns JSON including `appName` and `orgName`.
3. The task pane loads inside Outlook with organisation branding.
4. Searching finds users (Okta) and displays photos/presence/OOO data.
5. Presence badge refreshes after 60 seconds and on tab visibility changes.
6. Insert and recipient buttons update the compose item.
7. Requests from unknown origins are rejected (check browser console for 403 when testing from a random origin).
