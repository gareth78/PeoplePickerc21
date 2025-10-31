'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useSearch } from '@/lib/hooks/useSearch';
import type {
  User,
  Group,
  GroupDetail as GroupDetailType,
} from '@/lib/types';
import UserAvatar from '../UserAvatar';
import GroupDetail from '../groups/GroupDetail';

interface SearchInterfaceProps {
  userOrganization?: string;
}

export default function SearchInterface({ userOrganization }: SearchInterfaceProps) {
  console.log('🎨 SearchInterface rendered, userOrganization prop:', userOrganization);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileHistory, setProfileHistory] = useState<User[]>([]);
  const [managerData, setManagerData] = useState<User | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const { results, loading, error, nextCursor, search } = useSearch();

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | 'myorg' | 'groups'>('all');
  const [myOrgFilter, setMyOrgFilter] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Store unfiltered results
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]); // Display these

  // Groups state
  const [searchMode, setSearchMode] = useState<'users' | 'groups'>('users');
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [previousGroup, setPreviousGroup] = useState<{ id: string; name: string } | null>(null);

  // Initialize query from URL params on mount
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam) {
      setQuery(queryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchMode === 'users') {
      if (debouncedQuery) {
        void search(debouncedQuery);
      } else {
        void search('');
        setSelectedUser(null);
      }
    }
  }, [debouncedQuery, search, searchMode]);

  // Search groups when in groups mode
  useEffect(() => {
    if (searchMode === 'groups' && debouncedQuery.length >= 2) {
      const searchGroups = async () => {
        setGroupsLoading(true);
        setGroupsError(null);

        try {
          const response = await fetch(`/api/graph/groups?q=${encodeURIComponent(debouncedQuery)}`);
          const data = await response.json();

          if (data.ok) {
            setGroups(data.data.groups);
          } else {
            setGroupsError(data.error || 'Failed to search groups');
          }
        } catch (err) {
          setGroupsError('Failed to search groups');
          console.error(err);
        } finally {
          setGroupsLoading(false);
        }
      };

      void searchGroups();
    } else if (searchMode === 'groups') {
      setGroups([]);
      setSelectedGroup(null);
    }
  }, [debouncedQuery, searchMode]);

  // Update allUsers and apply filter when results change
  useEffect(() => {
    setAllUsers(results);
    applyFilter(results, myOrgFilter);
  }, [results]);

  // Re-apply filter when checkbox changes
  useEffect(() => {
    applyFilter(allUsers, myOrgFilter);
  }, [myOrgFilter]);

  // Handle filter changes
  const handleFilterChange = (filter: 'all' | 'myorg' | 'groups') => {
    setActiveFilter(filter);
    if (filter === 'groups') {
      setSearchMode('groups');
      setMyOrgFilter(false);
      setSelectedUser(null);
      setProfileHistory([]);
      setPreviousGroup(null);
    } else {
      setSearchMode('users');
      setSelectedGroup(null);
      setPreviousGroup(null);
      if (filter === 'myorg') {
        setMyOrgFilter(true);
      } else if (filter === 'all') {
        setMyOrgFilter(false);
      }
    }
  };

  // Filter function
  const applyFilter = (users: User[], filterActive: boolean) => {
    if (!filterActive || !userOrganization) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      user.organization === userOrganization
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
    console.log('🔍 Manager fetch useEffect triggered');
    console.log('📧 selectedUser?.managerEmail:', selectedUser?.managerEmail);
    
    if (selectedUser?.managerEmail) {
      console.log('✅ Has managerEmail, fetching:', selectedUser.managerEmail);
      fetch(`/api/okta/users?q=${encodeURIComponent(selectedUser.managerEmail)}`)
        .then(res => {
          console.log('📡 Manager fetch response status:', res.status);
          return res.json();
        })
        .then(data => {
          console.log('📊 Manager fetch data:', data);
          if (data.ok && data.data?.users && data.data.users.length > 0) {
            console.log('✅ Setting managerData:', data.data.users[0]);
            setManagerData(data.data.users[0]);
          } else {
            console.log('❌ No users in manager response or API error');
          }
        })
        .catch(err => console.error('❌ Failed to fetch manager:', err));
    } else {
      console.log('❌ No managerEmail, clearing managerData');
      setManagerData(null);
    }
  }, [selectedUser?.managerEmail]);

  const handleLoadMore = () => {
    if (nextCursor) {
      void search(query, nextCursor);
    }
  };

  // Navigate to a user profile with history tracking
  const navigateToUser = (user: User) => {
    if (selectedUser) {
      setProfileHistory(prev => [...prev, selectedUser]);
    }
    setSelectedUser(user);
  };

  // Go back to previous user in history
  const goBackInHistory = () => {
    if (profileHistory.length > 0) {
      const previousUser = profileHistory[profileHistory.length - 1];
      setProfileHistory(prev => prev.slice(0, -1));
      setSelectedUser(previousUser);
    }
  };

  // Handle member click from GroupDetail
  const handleMemberClick = async (memberId: string, memberType: 'user' | 'group', memberEmail?: string) => {
    if (memberType === 'group') {
      // Store current group for back navigation
      if (selectedGroup) {
        setPreviousGroup({ id: selectedGroup.id, name: selectedGroup.displayName });
      }

      try {
        const response = await fetch(`/api/graph/groups/${memberId}`);
        const data = await response.json();

        if (data.ok && data.data) {
          const detail: GroupDetailType = data.data;
          setSelectedUser(null);
          setSelectedGroup({
            id: detail.id,
            displayName: detail.displayName,
            mail: detail.mail,
            description: detail.description,
            groupTypes: detail.groupTypes,
          });
        } else {
          console.error('Failed to fetch nested group detail:', data.error);
        }
      } catch (err) {
        console.error('Failed to fetch nested group detail:', err);
      }

      return;
    } else {
      // User was clicked - store the current group and show user profile
      if (selectedGroup) {
        setPreviousGroup({ id: selectedGroup.id, name: selectedGroup.displayName });
      }

      // Fetch user details using email (like manager fetch)
      if (!memberEmail) {
        console.error('No email provided for user member');
        return;
      }

      try {
        const response = await fetch(`/api/okta/users?q=${encodeURIComponent(memberEmail)}`);
        const data = await response.json();

        if (data.ok && data.data?.users && data.data.users.length > 0) {
          setSelectedUser(data.data.users[0]);
          setSelectedGroup(null);
        } else {
          console.error('Failed to fetch user:', data.error);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    }
  };

  // Go back to group from user profile
  const goBackToGroup = async () => {
    if (!previousGroup) return;

    try {
      const response = await fetch(`/api/graph/groups/${previousGroup.id}`);
      const data = await response.json();

      if (data.ok && data.data) {
        const detail: GroupDetailType = data.data;
        setSelectedGroup({
          id: detail.id,
          displayName: detail.displayName,
          mail: detail.mail,
          description: detail.description,
          groupTypes: detail.groupTypes,
        });
        setSelectedUser(null);
        setPreviousGroup(null);
      }
    } catch (err) {
      console.error('Failed to fetch group:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Search Header */}
      <div className="p-5 border-b border-gray-200">
        {/* Quick Filters Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Quick Filters</h2>
          <div className="flex gap-2 flex-wrap">
            {/* All Users Button - FIRST */}
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-full text-base font-medium transition-all ${
                activeFilter === 'all'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Users
            </button>

            {/* Groups Button - SECOND */}
            <button
              onClick={() => handleFilterChange('groups')}
              className={`px-4 py-2 rounded-full text-base font-medium transition-all ${
                activeFilter === 'groups'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Groups
            </button>

            {/* My Organization Button - THIRD (LAST) */}
            {userOrganization && (
              <button
                onClick={() => handleFilterChange(activeFilter === 'myorg' ? 'all' : 'myorg')}
                className={`px-4 py-2 rounded-full text-base font-medium transition-all ${
                  activeFilter === 'myorg'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                My Organization: {userOrganization}
                {activeFilter === 'myorg' && (
                  <span className="ml-2 cursor-pointer" onClick={(e) => {
                    e.stopPropagation();
                    handleFilterChange('all');
                  }}>×</span>
                )}
              </button>
            )}
            
            {/* Debug display for development */}
            {!userOrganization && process.env.NODE_ENV === 'development' && (
              <div className="text-sm text-gray-500 px-2 py-1 bg-yellow-50 rounded">
                Loading organization...
              </div>
            )}
          </div>
        </div>

        {/* Search Box */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, title, or location..."
            className="w-full px-4 py-3 pr-10 text-lg border-2 border-gray-300 rounded-lg outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
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
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Results
            </h3>
            {searchMode === 'users' && filteredUsers.length > 0 && (
              <span className="text-sm text-gray-500">{filteredUsers.length} found</span>
            )}
            {searchMode === 'groups' && groups.length > 0 && (
              <span className="text-sm text-gray-500">{groups.length} found</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Users Mode */}
            {searchMode === 'users' && (
              <>
                {loading && (
                  <div className="p-10 text-center text-base text-gray-600">
                    Searching...
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 text-red-700 text-base border-b border-red-100">
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
                          <div className="font-semibold text-base text-gray-900 truncate">
                            {user.displayName}
                          </div>
                          {user.title && (
                            <div className="text-sm text-gray-600 truncate">
                              {user.title}
                            </div>
                          )}
                          {(user.organization || user.city || user.countryName) && (
                            <div className="text-sm text-gray-500 truncate">
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
                        className="w-full py-3 bg-gray-50 text-base text-primary font-medium hover:bg-gray-100 transition-colors border-b border-gray-200"
                      >
                        Load more results
                      </button>
                    )}
                  </div>
                )}

                {debouncedQuery.length >= 2 && filteredUsers.length === 0 && !loading && (
                  <div className="p-10 text-center">
                    <p className="text-base text-gray-600 mb-2">
                      No colleagues found matching &quot;{debouncedQuery}&quot;
                    </p>
                    <p className="text-sm text-gray-500">Try a different search term</p>
                  </div>
                )}

                {!debouncedQuery && (
                  <div className="p-10 text-center">
                    <p className="text-base text-gray-600 mb-2">
                      Start typing to search for colleagues
                    </p>
                    <p className="text-sm text-gray-500">
                      Search by name, title, or office location
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Groups Mode */}
            {searchMode === 'groups' && (
              <>
                {groupsLoading && (
                  <div className="p-10 text-center text-base text-gray-600">
                    Searching groups...
                  </div>
                )}

                {groupsError && (
                  <div className="p-4 bg-red-50 text-red-700 text-base border-b border-red-100">
                    {groupsError}
                  </div>
                )}

                {groups.length > 0 && (
                  <div className="flex flex-col">
                    {groups.map((group) => {
                      const isM365Group = group.groupTypes.includes('Unified');
                      const isDistributionList = group.mailEnabled && !isM365Group;

                      // Determine badge style and text - using subtle pastel colors
                      const badgeStyle = isM365Group
                        ? 'bg-blue-100 text-blue-700'
                        : isDistributionList
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700';
                      const badgeText = isM365Group
                        ? 'M365 Group'
                        : isDistributionList
                          ? 'Distribution List'
                          : 'Mail-Enabled';
                      
                      return (
                        <button
                          key={group.id}
                          onClick={() => setSelectedGroup(group)}
                          className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 text-left transition-colors hover:bg-gray-50 ${
                            selectedGroup?.id === group.id ? 'bg-primary-light border-l-4 border-l-primary' : ''
                          }`}
                        >
                          {/* Group avatar - show photo if available, otherwise show icon */}
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {group.photoUrl ? (
                              <img
                                src={group.photoUrl}
                                alt={group.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg
                                className="w-6 h-6 text-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-base text-gray-900 truncate mb-2">
                              {group.displayName}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm px-2 py-0.5 ${badgeStyle} rounded-full`}>
                                {badgeText}
                              </span>
                              {group.memberCount !== undefined && (
                                <span className="text-sm text-gray-500">
                                  • {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {debouncedQuery.length >= 2 && groups.length === 0 && !groupsLoading && (
                  <div className="p-10 text-center">
                    <p className="text-base text-gray-600 mb-2">
                      No groups found matching &quot;{debouncedQuery}&quot;
                    </p>
                    <p className="text-sm text-gray-500">Try a different search term</p>
                  </div>
                )}

                {!debouncedQuery && (
                  <div className="p-10 text-center">
                    <p className="text-base text-gray-600 mb-2">
                      Start typing to search for groups
                    </p>
                    <p className="text-sm text-gray-500">
                      Search by group name or email
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Panel: Detail */}
        <div className="flex flex-col min-h-0">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Detail
            </h3>
          </div>

          {/* Back button */}
          {((selectedUser && (profileHistory.length > 0 || previousGroup)) || (selectedGroup && previousGroup)) && (
            <div className="px-6 pt-4">
              <button
                onClick={previousGroup ? goBackToGroup : goBackInHistory}
                className="flex items-center gap-2 text-base text-primary hover:text-primary-dark transition-colors font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span>
                  {previousGroup
                    ? `Back to ${previousGroup.name}`
                    : `Back to ${profileHistory[profileHistory.length - 1].displayName}`}
                </span>
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {selectedGroup ? (
              <GroupDetail
                groupId={selectedGroup.id}
                onMemberClick={handleMemberClick}
                onBack={() => setSelectedGroup(null)}
              />
            ) : selectedUser ? (
              <div className="max-w-md mx-auto">
                <UserAvatar
                  email={selectedUser.email}
                  displayName={selectedUser.displayName}
                  size="medium"
                  className="mx-auto mb-4"
                />

                <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
                  {selectedUser.displayName}
                </h2>

                {selectedUser.title && (
                  <p className="text-lg text-gray-600 text-center mb-1">
                    {selectedUser.title}
                  </p>
                )}

                {selectedUser.department && (
                  <p className="text-base text-gray-500 text-center mb-1">
                    {selectedUser.department}
                  </p>
                )}

                {selectedUser.organization && (
                  <p className="text-lg text-gray-600 text-center mb-1">
                    {selectedUser.organization}
                  </p>
                )}

                {managerData && (
                  <p className="text-base text-gray-500 text-center mb-5">
                    Manager: {' '}
                    <button
                      onClick={() => navigateToUser(managerData)}
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
                  <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    Contact Information
                  </h4>

                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-100 text-base">
                      <span className="font-medium text-gray-600">Email:</span>
                      <a
                        href={`mailto:${selectedUser.email}`}
                        className="text-primary hover:underline"
                      >
                        {selectedUser.email}
                      </a>
                    </div>

                    {selectedUser.mobilePhone && (
                      <div className="flex justify-between py-2 border-b border-gray-100 text-base">
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
                      <div className="flex justify-between py-2 text-base">
                        <span className="font-medium text-gray-600">Location:</span>
                        <span className="text-gray-900">{selectedUser.officeLocation}</span>
                      </div>
                    )}
                  </div>
                </div>

                <a
                  href={`/user/${selectedUser.id}${query ? `?q=${encodeURIComponent(query)}` : ''}`}
                  className="block mt-5 px-5 py-2.5 bg-primary text-white text-base font-medium text-center rounded-lg hover:bg-primary-dark transition-colors"
                >
                  View full profile →
                </a>
              </div>
            ) : (
              <div className="p-10 text-center text-base text-gray-600">
                {searchMode === 'groups'
                  ? 'Choose a group to view details'
                  : 'Choose a person to preview their profile details'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
