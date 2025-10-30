/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    // Git commit SHA (first 7 chars)
    NEXT_PUBLIC_GIT_SHA: process.env.GITHUB_SHA?.substring(0, 7) || 'dev',
    // Build timestamp
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

module.exports = nextConfig;
