'use client';

import { useState, useEffect, Suspense } from 'react';
import SearchInterface from '@/components/search/SearchInterface';
import UserIdentity from '@/components/UserIdentity';
import Link from 'next/link';

export default function HomePage() {
  const [userOrg, setUserOrg] = useState<string>();

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
          
          // Check stats.users structure
          if (oktaData.stats?.users) {
            console.log('✅ Found stats.users:', JSON.stringify(oktaData.stats.users, null, 2));
            
            if (typeof oktaData.stats.users === 'object' && !Array.isArray(oktaData.stats.users)) {
              const org = oktaData.stats.users.organization;
              console.log('🏢 Organization from stats.users:', org);
              
              if (org) {
                setUserOrg(org);
                console.log('✅ Successfully set userOrg state to:', org);
              } else {
                console.log('❌ Organization field is empty in stats.users');
              }
            } else {
              console.log('⚠️ stats.users is not an object:', typeof oktaData.stats.users);
            }
          }
          // Check users array structure
          else if (oktaData.users && Array.isArray(oktaData.users) && oktaData.users.length > 0) {
            console.log('✅ Found users array with', oktaData.users.length, 'users');
            const org = oktaData.users[0].organization;
            console.log('🏢 Organization from users[0]:', org);
            
            if (org) {
              setUserOrg(org);
              console.log('✅ Successfully set userOrg state to:', org);
            } else {
              console.log('❌ Organization field is empty in users[0]');
            }
          } else {
            console.log('❌ No stats.users or users array found in response');
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
          <h1 className="text-4xl font-bold text-gray-900">People Finder</h1>
          <p className="text-gray-600 mt-2">
            Search the Okta directory to quickly connect with colleagues
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
          className="inline-block text-sm text-primary hover:text-primary-dark font-medium transition-colors"
        >
          View Technical Details →
        </Link>
      </div>
    </div>
  );
}
