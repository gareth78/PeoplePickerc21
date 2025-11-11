'use client';

import { useState, useEffect } from 'react';
import SearchInterface from '@/components/search/SearchInterface';
import UserMenu from '@/components/UserMenu';
import Link from 'next/link';

export default function HomePage() {
  const [userOrg, setUserOrg] = useState<string>();
  const [adminStatus, setAdminStatus] = useState<{ isAdmin: boolean; email?: string | null } | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Get version info
  const version = process.env.NEXT_PUBLIC_GIT_SHA || 'dev';
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME;
  const buildDate = buildTime ? new Date(buildTime).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }) : '';

  // Check authentication and fetch user's organization
  useEffect(() => {
    // Check for OAuth errors in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      const errorMessages: Record<string, string> = {
        auth_failed: 'Authentication failed. Please try again.',
        user_not_found: 'User not found in directory.',
        directory_error: 'Directory lookup error. Please try again.',
        server_error: 'Server error. Please try again.',
      };
      setAuthError(errorMessages[error] || 'Authentication error');
      setAuthenticated(false);
      return;
    }

    fetch('/api/me')
      .then(res => {
        if (res.status === 401) {
          setAuthenticated(false);
          return null;
        }
        if (!res.ok) {
          throw new Error('Authentication failed');
        }
        return res.json();
      })
      .then(async (authData) => {
        if (!authData) return;

        setAuthenticated(true);
        setAdminStatus({ isAdmin: authData.isAdmin || false, email: authData.email });

        if (authData.email) {
          const oktaUrl = `/api/okta/users?q=${encodeURIComponent(authData.email)}`;

          const oktaRes = await fetch(oktaUrl);

          const oktaData = await oktaRes.json();

          let org: string | null = null;

          if (oktaData.data?.users && Array.isArray(oktaData.data.users) && oktaData.data.users.length > 0) {
            org = oktaData.data.users[0].organization;
          } else if (oktaData.users && Array.isArray(oktaData.users) && oktaData.users.length > 0) {
            org = oktaData.users[0].organization;
          }

          if (org) {
            setUserOrg(org);
          }
        }
      })
      .catch(err => {
        console.error('❌ Error fetching user data:', err);
        setAuthenticated(false);
        setAuthError('Failed to load user data');
      });
  }, []);

  // Show loading state while checking authentication
  if (authenticated === null) {
    return (
      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (authenticated === false) {
    return (
      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">People Finder</h1>
            <p className="text-gray-600 mb-8">
              Search the global directory to quickly connect with colleagues
            </p>

            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
                <p className="font-semibold">Authentication Error</p>
                <p className="text-sm">{authError}</p>
              </div>
            )}

            <a
              href="/api/auth/oauth"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Sign in with Microsoft
            </a>

            <p className="text-sm text-gray-500 mt-4">
              You&apos;ll be redirected to Microsoft to sign in
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-5xl font-bold text-gray-900">People Finder</h1>
          <p className="text-gray-600 mt-2">
            Search the global directory to quickly connect with colleagues
          </p>
          <p className="text-sm text-gray-400 mt-1">
            version {version}
            {buildDate && ` • ${buildDate}`}
          </p>
        </div>
        <UserMenu isAdmin={adminStatus?.isAdmin || false} />
      </div>

      <SearchInterface userOrganization={userOrg} />

      <div className="text-center mt-8">
        <Link
          href="/technical"
          className="inline-block text-base text-primary hover:text-primary-dark font-medium transition-colors"
        >
          View Technical Details →
        </Link>
      </div>
    </div>
  );
}
