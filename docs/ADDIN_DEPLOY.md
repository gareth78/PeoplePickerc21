# People Picker Outlook Add-in – Deployment Guide

## Overview
The Outlook add-in is a thin client that calls the existing People Picker backend (`apps/web`). Deployment consists of:

1. Building static assets for the task pane (`apps/addin`).
2. Hosting the assets on a static site (Azure Static Web Apps, Azure Storage + CDN, etc.).
3. Updating the add-in manifest with production URLs.
4. Central deployment through the Microsoft 365 admin center.

All configuration (Graph, Okta, Redis, etc.) remains in the backend. The add-in reuses backend APIs via the shared SDK (`packages/sdk`).

## Build & package

```bash
npm install
npm run build
```

This runs in dependency order:
- `packages/sdk`: compiles TypeScript to `dist/`.
- `apps/web`: `next build` for the admin app.
- `apps/addin`: `npm run typecheck && vite build`, outputting static assets to `apps/addin/dist`.

### Deploying the add-in assets
Upload the contents of `apps/addin/dist` to your chosen static host. The build output includes:
- `index.html` – task pane UI
- `commands.html` – command function host
- Manifest-ready asset paths under `/assets/` and `/icons/`

> _Placeholder_: adapt the following command for Azure Static Web Apps or Azure Storage:
> ```bash
> az storage blob upload-batch \
>   --destination '$web' \
>   --source apps/addin/dist \
>   --account-name <your-storage-account>
> ```

## Configure backend CORS

Ensure `apps/web` includes the add-in origin(s) in the `ALLOWED_ORIGINS` environment variable. Example:

```
ALLOWED_ORIGINS=https://addin.example.org,https://addin-usw.azurestaticapps.net
```

The middleware also allows `https://localhost:5173` for emergency debugging sideloads.

## Public config endpoint

The add-in reads `/api/config/public` to display organisation branding. Configure via database (`configuration` table) **or** environment variables:

| Key | Database key | Environment overrides | Notes |
| --- | --- | --- | --- |
| App name | `app_name` | `APP_NAME`, `NEXT_PUBLIC_APP_NAME` | Default `People Picker` |
| Org name | `org_name` | `ORG_NAME`, `NEXT_PUBLIC_ORG_NAME` | Default `Plan International` |
| Org logo URL | `org_logo_url` | `ORG_LOGO_URL`, `NEXT_PUBLIC_ORG_LOGO_URL` | Must be http(s) |

No secrets are exposed; the response only contains presentation metadata and feature flags.

## Manifest updates

1. Copy `apps/addin/public/manifest.xml`.
2. Replace all instances of `https://localhost:5173` with your production host, e.g. `https://addin.example.org`.
3. Update `<AppDomain>` entries to include the production host.
4. Bump the `<Version>` if required by your deployment policy.
5. Set `HighResolutionIconUrl` and icon resource URLs to your hosted icons (optional but recommended).

> Tip: keep the localhost URLs commented in the manifest for future sideloading.

## Centralised deployment (Microsoft 365 admin centre)

1. Sign in to the [Microsoft 365 admin centre](https://admin.microsoft.com/).
2. Navigate to **Settings → Integrated apps → Upload custom apps**.
3. Choose **Provide link to manifest file** and paste the hosted manifest URL.
4. Select the target users/groups (pilot group recommended).
5. Complete the wizard. The add-in appears in Outlook after the propagation window (typically < 1 hour).

## Configuring the add-in

- Set `NEXT_PUBLIC_PEOPLEPICKER_BASE_URL` for the add-in host to point to the deployed backend, e.g. `https://peoplepicker.plan.org`.
- Confirm the backend environment exposes `/api/config/public` and the other `/api/*` routes.
- Verify the task pane loads, displays org info, and search/presence/photo/OOO flows function.

## Rollback plan

1. Remove the custom app deployment from **Integrated apps** in the Microsoft 365 admin centre.
2. Optionally remove add-in origins from `ALLOWED_ORIGINS` to revert the backend CORS policy.
3. The People Picker web app continues to operate; no backend schema changes are required.

## Acceptance checks (production)

- [ ] Manifest sideloaded to pilot tenants loads without TLS warnings.
- [ ] `/api/config/public` returns `appName` and `orgName`.
- [ ] Search results, presence (with `fetchedAt`), photos, and OOO messages all render.
- [ ] Presence updates no more than once per minute per user (check Redis TTL or Graph call logs).
- [ ] Insert tab writes the summary block and `[To]/[CC]/[BCC]` buttons add recipients.
- [ ] Requests from unknown origins are blocked with HTTP 403.
