'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useSearch } from '@/lib/hooks/useSearch';
import type { User } from '@/lib/types';

export default function SearchInterface() {
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const { results, loading, error, nextCursor, search } = useSearch();

  useEffect(() => {
    if (debouncedQuery) {
      void search(debouncedQuery);
    } else {
      void search('');
      setSelectedUser(null);
    }
  }, [debouncedQuery, search]);

  const handleLoadMore = () => {
    if (nextCursor) {
      void search(query, nextCursor);
    }
  };

  const getInitials = (user: User) => {
    return `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}` || user.displayName.charAt(0);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Search Header */}
      <div className="p-5 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Directory search</h2>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, title, or location..."
          className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] min-h-[500px]">
        {/* Left Panel: Results */}
        <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200">
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Results
            </h3>
            {results.length > 0 && (
              <span className="text-xs text-gray-500">{results.length} found</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[500px]">
            {loading && (
              <div className="p-10 text-center text-sm text-gray-600">
                Searching...
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm border-b border-red-100">
                {error}
              </div>
            )}

            {results.length > 0 && (
              <div className="flex flex-col">
                {results.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 text-left transition-colors hover:bg-gray-50 ${
                      selectedUser?.id === user.id ? 'bg-primary-light border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      {getInitials(user)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">
                        {user.displayName}
                      </div>
                      {user.title && (
                        <div className="text-xs text-gray-600 truncate">
                          {user.title}
                        </div>
                      )}
                      {user.officeLocation && (
                        <div className="text-xs text-gray-500 truncate">
                          {user.officeLocation}
                        </div>
                      )}
                    </div>
                  </button>
                ))}

                {nextCursor && (
                  <button
                    onClick={handleLoadMore}
                    className="w-full py-3 bg-gray-50 text-sm text-primary font-medium hover:bg-gray-100 transition-colors border-b border-gray-200"
                  >
                    Load more results
                  </button>
                )}
              </div>
            )}

            {debouncedQuery.length >= 2 && results.length === 0 && !loading && (
              <div className="p-10 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  No colleagues found matching &quot;{debouncedQuery}&quot;
                </p>
                <p className="text-xs text-gray-500">Try a different search term</p>
              </div>
            )}

            {!debouncedQuery && (
              <div className="p-10 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Start typing to search for colleagues
                </p>
                <p className="text-xs text-gray-500">
                  Search by name, title, or office location
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Person Detail */}
        <div className="flex flex-col">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Person Detail
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {selectedUser ? (
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                  {getInitials(selectedUser)}
                </div>

                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                  {selectedUser.displayName}
                </h2>

                {selectedUser.title && (
                  <p className="text-base text-gray-600 text-center mb-1">
                    {selectedUser.title}
                  </p>
                )}

                {selectedUser.department && (
                  <p className="text-sm text-gray-500 text-center mb-5">
                    {selectedUser.department}
                  </p>
                )}

                {/* Action Buttons - Centered under photo */}
                <div className="flex justify-center gap-3 mb-6">
                  <a
                    href="/diagnostics"
                    className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-dark border border-primary hover:bg-primary-light rounded-lg transition-colors"
                  >
                    Diagnostics
                  </a>
                  <a
                    href="/api-docs"
                    className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-dark border border-primary hover:bg-primary-light rounded-lg transition-colors"
                  >
                    API Docs
                  </a>
                </div>

                <div className="pt-5 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    Contact Information
                  </h4>

                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                      <span className="font-medium text-gray-600">Email:</span>
                      <a
                        href={`mailto:${selectedUser.email}`}
                        className="text-primary hover:underline"
                      >
                        {selectedUser.email}
                      </a>
                    </div>

                    {selectedUser.mobilePhone && (
                      <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                        <span className="font-medium text-gray-600">Phone:</span>
                        <a
                          href={`tel:${selectedUser.mobilePhone}`}
                          className="text-primary hover:underline"
                        >
                          {selectedUser.mobilePhone}
                        </a>
                      </div>
                    )}

                    {selectedUser.officeLocation && (
                      <div className="flex justify-between py-2 text-sm">
                        <span className="font-medium text-gray-600">Location:</span>
                        <span className="text-gray-900">{selectedUser.officeLocation}</span>
                      </div>
                    )}
                  </div>
                </div>

                <a
                  href={`/user/${selectedUser.id}`}
                  className="block mt-5 px-5 py-2.5 bg-primary text-white text-sm font-medium text-center rounded-lg hover:bg-primary-dark transition-colors"
                >
                  View full profile →
                </a>
              </div>
            ) : (
              <div className="p-10 text-center text-sm text-gray-600">
                Choose a person to preview their profile details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
