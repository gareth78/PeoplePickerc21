import { Suspense } from 'react';
import SearchInterface from '@/components/search/SearchInterface';
import UserIdentity from '@/components/UserIdentity';
import Link from 'next/link';

export default function HomePage() {
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
        <SearchInterface />
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
