'use client';

import { useState, useEffect, Suspense } from 'react';
import SearchInterface from '@/components/search/SearchInterface';
import UserIdentity from '@/components/UserIdentity';
import Link from 'next/link';

export default function HomePage() {
  const [userOrg, setUserOrg] = useState<string>();

  // Get version info
  const version = process.env.NEXT_PUBLIC_GIT_SHA || 'dev';
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME;
  const buildDate = buildTime ? new Date(buildTime).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }) : '';

  // Fetch user's organization
  useEffect(() => {
    console.log('🔍 Starting user organization fetch...');
    
    fetch('/api/me')
      .then(res => {
        console.log('📡 /api/me response status:', res.status);
        return res.json();
      })
      .then(async (authData) => {
        console.log('📧 Auth data received:', JSON.stringify(authData, null, 2));
        
        if (authData.email) {
          const oktaUrl = `/api/okta/users?q=${encodeURIComponent(authData.email)}`;
          console.log('🔎 Fetching Okta profile from:', oktaUrl);
          
          const oktaRes = await fetch(oktaUrl);
          console.log('📡 Okta response status:', oktaRes.status);
          
          const oktaData = await oktaRes.json();
          console.log('📊 Full Okta response:', JSON.stringify(oktaData, null, 2));

          let org: string | null = null;

          if (oktaData.data?.users && Array.isArray(oktaData.data.users) && oktaData.data.users.length > 0) {
            org = oktaData.data.users[0].organization;
            console.log('✅ Found org in data.users[0]:', org);
          } else if (oktaData.users && Array.isArray(oktaData.users) && oktaData.users.length > 0) {
            org = oktaData.users[0].organization;
            console.log('✅ Found org in users[0]:', org);
          }

          if (org) {
            setUserOrg(org);
            console.log('✅ Set userOrg to:', org);
          }
        } else {
          console.log('❌ No email in auth data');
        }
      })
      .catch(err => {
        console.error('❌ Error fetching user org:', err);
      });
  }, []);

  // Add debug render logging
  console.log('🎨 Rendering Home, userOrg state:', userOrg);

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
        <UserIdentity />
      </div>

      <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
        <SearchInterface userOrganization={userOrg} />
      </Suspense>

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
