'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useSearch } from '@/lib/hooks/useSearch';
import type { User } from '@/lib/types';
import UserAvatar from '../UserAvatar';

export default function SearchInterface() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [managerData, setManagerData] = useState<User | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const { results, loading, error, nextCursor, search } = useSearch();
  
  // Organization filter state
  const [myOrgFilter, setMyOrgFilter] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Store unfiltered results
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]); // Display these

  // Initialize query from URL params on mount
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam) {
      setQuery(queryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (debouncedQuery) {
      void search(debouncedQuery);
    } else {
      void search('');
      setSelectedUser(null);
    }
  }, [debouncedQuery, search]);

  // Update allUsers and apply filter when results change
  useEffect(() => {
    setAllUsers(results);
    applyFilter(results, myOrgFilter);
  }, [results]);

  // Re-apply filter when checkbox changes
  useEffect(() => {
    applyFilter(allUsers, myOrgFilter);
  }, [myOrgFilter]);

  // Filter function
  const applyFilter = (users: User[], filterActive: boolean) => {
    if (!filterActive) {
      setFilteredUsers(users);
      return;
    }
    
    // Hardcoded for testing - will make dynamic later
    const myOrg = 'Plan International GH';
    
    const filtered = users.filter(user => 
      user.organization === myOrg
    );
    
    setFilteredUsers(filtered);
  };

  // Update URL when query changes
  useEffect(() => {
    if (query) {
      router.replace(`/?q=${encodeURIComponent(query)}`, { scroll: false });
    } else {
      router.replace('/', { scroll: false });
    }
  }, [query, router]);

  // Fetch manager data when user is selected
  useEffect(() => {
    if (selectedUser?.managerEmail) {
      // Fetch manager by email
      fetch(`/api/okta/users?q=${encodeURIComponent(selectedUser.managerEmail)}`)
        .then(res => res.json())
        .then(data => {
          if (data.users && data.users.length > 0) {
            setManagerData(data.users[0]);
          }
        })
        .catch(err => console.error('Failed to fetch manager:', err));
    } else {
      setManagerData(null);
    }
  }, [selectedUser?.managerEmail]);

  const handleLoadMore = () => {
    if (nextCursor) {
      void search(query, nextCursor);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Search Header */}
      <div className="p-5 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Directory search</h2>
        
        {/* Organization Filter */}
        <div className="mb-4">
          <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={myOrgFilter}
              onChange={(e) => setMyOrgFilter(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700">
              Show only: Plan International GH
            </span>
          </label>
        </div>
        
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, title, or location..."
            className="w-full px-4 py-3 pr-10 text-base border-2 border-gray-300 rounded-lg outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] h-[600px]">
        {/* Left Panel: Results */}
        <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 min-h-0">
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Results
            </h3>
            {filteredUsers.length > 0 && (
              <span className="text-xs text-gray-500">{filteredUsers.length} found</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
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

            {filteredUsers.length > 0 && (
              <div className="flex flex-col">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 text-left transition-colors hover:bg-gray-50 ${
                      selectedUser?.id === user.id ? 'bg-primary-light border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <UserAvatar
                      email={user.email}
                      displayName={user.displayName}
                      size="small"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">
                        {user.displayName}
                      </div>
                      {user.title && (
                        <div className="text-xs text-gray-600 truncate">
                          {user.title}
                        </div>
                      )}
                      {(user.organization || user.city || user.countryName) && (
                        <div className="text-xs text-gray-500 truncate">
                          {[
                            user.organization,
                            user.city,
                            user.countryName
                          ].filter(Boolean).join(', ')}
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

            {debouncedQuery.length >= 2 && filteredUsers.length === 0 && !loading && (
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
        <div className="flex flex-col min-h-0">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Person Detail
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {selectedUser ? (
              <div className="max-w-md mx-auto">
                <UserAvatar
                  email={selectedUser.email}
                  displayName={selectedUser.displayName}
                  size="medium"
                  className="mx-auto mb-4"
                />

                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                  {selectedUser.displayName}
                </h2>

                {selectedUser.title && (
                  <p className="text-base text-gray-600 text-center mb-1">
                    {selectedUser.title}
                  </p>
                )}

                {selectedUser.department && (
                  <p className="text-sm text-gray-500 text-center mb-1">
                    {selectedUser.department}
                  </p>
                )}

                {selectedUser.organization && (
                  <p className="text-base text-gray-600 text-center mb-1">
                    {selectedUser.organization}
                  </p>
                )}

                {managerData && (
                  <p className="text-sm text-gray-500 text-center mb-5">
                    Manager: {' '}
                    <button
                      onClick={() => setSelectedUser(managerData)}
                      className="text-primary hover:underline font-medium"
                    >
                      {managerData.displayName}
                    </button>
                  </p>
                )}

                {/* Quick Action Buttons */}
                <div className="flex justify-center gap-3 mb-6">
                  {/* Email button with Outlook icon */}
                  <a
                    href={`mailto:${selectedUser.email}`}
                    className="w-12 h-12 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center border-2 border-gray-200 hover:border-blue-400"
                    title="Send email in Outlook"
                  >
                    <img
                      src="/icons/OutlookAppIcon.jpg"
                      alt="Email"
                      className="w-8 h-8 rounded"
                    />
                  </a>

                  {/* Teams button with Teams icon */}
                  <a
                    href={`https://teams.microsoft.com/l/chat/0/0?users=${selectedUser.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center border-2 border-gray-200 hover:border-purple-400"
                    title="Chat in Microsoft Teams"
                  >
                    <img
                      src="/icons/TeamsAppIcon.jpg"
                      alt="Teams"
                      className="w-8 h-8 rounded"
                    />
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
                  href={`/user/${selectedUser.id}${query ? `?q=${encodeURIComponent(query)}` : ''}`}
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
