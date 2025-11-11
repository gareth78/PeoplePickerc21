/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    // Trust X-Forwarded-Host and X-Forwarded-Proto headers from Azure Container Apps proxy
    // This allows Next.js to properly construct URLs when behind a reverse proxy
    trustHost: true,
  },
  env: {
    // Git commit SHA (first 7 chars)
    NEXT_PUBLIC_GIT_SHA: process.env.GITHUB_SHA?.substring(0, 7) || 'dev',
    // Build timestamp
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

module.exports = nextConfig;
