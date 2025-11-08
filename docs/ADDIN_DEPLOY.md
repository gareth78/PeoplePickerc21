# People Picker Outlook Add-in – Deployment Guide

This document covers packaging the Outlook add-in, configuring environments, and deploying centrally for production tenants.

## 1. Build artifacts

```bash
pnpm install
pnpm run build
```

The root build pipeline executes in dependency order:

1. `packages/sdk` → emits `dist/` TypeScript SDK
2. `apps/web` → Next.js production build
3. `apps/addin` → Vite static bundle + `manifest.xml`

The add-in build output lives in `apps/addin/dist/` and is suitable for static hosting (Azure Static Web Apps, Azure Blob Storage + CDN, etc.).

### Optional deployment helper

```
apps/addin/scripts/deploy.sh
```

The script contains placeholder Azure CLI commands. Replace with your hosting workflow (Storage upload, SWA deploy, etc.) and wire it into CI.

## 2. Configure environment variables

### Web app (`apps/web`)

- Existing secrets (database, Graph, Okta, Redis) remain unchanged.
- `ALLOWED_ORIGINS` – comma-separated list of task-pane origins. Example:
  ```
  ALLOWED_ORIGINS="https://addin.example.org,https://peoplepicker.contoso.com"
  ```
- `PUBLIC_ORG_NAME`, `PUBLIC_ORG_LOGO_URL`, `NEXT_PUBLIC_APP_NAME` (optional) – branding for `/api/config/public`.
- `ADDIN_INSERT_ENABLED`, `ADDIN_PRESENCE_POLLING` (optional) – feature flags returned to the add-in.

### Add-in (`apps/addin`)

- `NEXT_PUBLIC_PEOPLEPICKER_BASE_URL` – absolute URL of the deployed People Picker backend (e.g. `https://peoplepicker.example.org`). Leave empty for same-origin proxy in dev.

## 3. Deploy static assets

1. Upload `apps/addin/dist` to your static host.
2. Ensure the hosted origin (e.g. `https://addin.example.org`) is listed in `ALLOWED_ORIGINS` on the backend.
3. Update `NEXT_PUBLIC_PEOPLEPICKER_BASE_URL` in the add-in environment to point at the production backend.
4. Redeploy the add-in bundle after changing configuration.

## 4. Publish the manifest centrally

1. Edit `apps/addin/manifest.xml` and set production URLs for:
   - `<bt:Urls><bt:Url id="TaskPaneUrl" DefaultValue="https://addin.example.org/index.html" /></bt:Urls>`
   - `<bt:Resources><bt:Url id="CommandsUrl" DefaultValue="https://addin.example.org/index.html" /></bt:Url>` (commented dev URL included)
2. Upload the manifest via Microsoft 365 admin center → **Settings** → **Integrated apps** → **Upload custom apps**.
3. Assign the add-in to targeted users or groups.
4. Inform users to restart Outlook (desktop) or refresh Outlook on the web.

## 5. Post-deployment validation

- `/api/config/public` returns org/app details from production.
- Task pane loads in Outlook and shows correct branding.
- Search, presence, photo, and out-of-office calls succeed (check browser dev tools → Network).
- Insert and recipient helper buttons work in compose surfaces.
- Requests from unknown origins receive HTTP 403 responses (validate with curl or browser console).

## 6. Rollback plan

- **Remove the add-in**: Delete the central deployment from Microsoft 365 admin center. Users lose the ribbon button immediately.
- **Revert CORS**: Remove add-in origins from `ALLOWED_ORIGINS` in the backend environment to restore previous behavior.
- **No backend schema changes**: Removing the add-in requires no database or Graph config changes; the web admin remains unaffected.
