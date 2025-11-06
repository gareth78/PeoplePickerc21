'use client';

import { useState, useEffect } from 'react';
import SearchInterface from '@/components/search/SearchInterface';
import UserIdentity from '@/components/UserIdentity';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function HomePage() {
  const [userOrg, setUserOrg] = useState<string>();

  // Fetch user's organization
  useEffect(() => {
    fetch('/api/me')
      .then(res => {
        return res.json();
      })
      .then(async (authData) => {
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
        console.error('❌ Error fetching user org:', err);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-5xl font-bold text-gray-900">People Finder</h1>
          <p className="text-gray-600 mt-2">
            Search the global directory to quickly connect with colleagues
          </p>
        </div>
        <UserIdentity />
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

      <Footer />
    </div>
  );
}
