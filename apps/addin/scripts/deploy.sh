#!/usr/bin/env bash
set -euo pipefail

# Placeholder deployment script for the People Picker add-in.
# Replace these steps with your preferred static hosting workflow.

if [[ -z "${NEXT_PUBLIC_PEOPLEPICKER_BASE_URL:-}" ]]; then
  echo "NEXT_PUBLIC_PEOPLEPICKER_BASE_URL is not set. Using manifest defaults."
fi

BUILD_DIR="$(dirname "$0")/../dist"
if [[ ! -d "$BUILD_DIR" ]]; then
  echo "Add-in has not been built yet. Run 'pnpm --filter @peoplepicker/addin build'."
  exit 1
fi

AZURE_STORAGE_ACCOUNT="${AZURE_STORAGE_ACCOUNT:-peoplepickerdev}"
AZURE_CONTAINER="${AZURE_CONTAINER:-addin}" # update to your container name

echo "Uploading add-in bundle to Azure Storage account: $AZURE_STORAGE_ACCOUNT"
# Example using Azure CLI (replace with your deployment pipeline)
az storage blob upload-batch \
  --account-name "$AZURE_STORAGE_ACCOUNT" \
  --destination "$AZURE_CONTAINER" \
  --source "$BUILD_DIR" \
  --overwrite

echo "Deployment complete. Ensure the manifest points at the uploaded origin."
