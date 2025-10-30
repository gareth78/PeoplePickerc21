'use client';

import { useEffect, useState } from 'react';
import UserAvatar from './UserAvatar';

interface UserInfo {
  authenticated: boolean;
  email?: string;
  name?: string;
  provider?: string;
  oktaProfile?: {
    displayName: string;
    organization?: string | null;
    title?: string | null;
    officeLocation?: string | null;
    email: string;
    department?: string | null;
    mobilePhone?: string | null;
    manager?: string | null;
    managerEmail?: string | null;
  };
}

export default function UserIdentity() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      // Get auth info
      const authResponse = await fetch('/api/me');
      const authData = await authResponse.json();

      if (!authData.authenticated) {
        setLoading(false);
        return;
      }

      // Try to get Okta profile for internal users
      try {
        console.log('🔍 Fetching Okta profile for:', authData.email);
        const oktaUrl = `/api/okta/users?q=${encodeURIComponent(authData.email)}`;
        console.log('📡 Okta URL:', oktaUrl);
        
        const oktaResponse = await fetch(oktaUrl);
        console.log('📥 Okta response status:', oktaResponse.status);
        
        const oktaData = await oktaResponse.json();
        console.log('📊 Okta data structure:', JSON.stringify(oktaData, null, 2));

        // Handle different response structures
        let users = [];

        // Check if data is in the standard API response format
        if (oktaData.ok && oktaData.data?.users && Array.isArray(oktaData.data.users)) {
          users = oktaData.data.users;
          console.log('✅ Found users in data.users array');
        }
        // Fallback: Check if data is directly in users array
        else if (oktaData.users && Array.isArray(oktaData.users)) {
          users = oktaData.users;
          console.log('✅ Found users in users array');
        }

        console.log('👥 Users array length:', users.length);

        if (users.length > 0) {
          console.log('✅ Processing', users.length, 'user(s)');
          
          const matchingUser = users.find((u: any) => {
            const emailMatch = u.email?.toLowerCase() === authData.email.toLowerCase();
            console.log('🔍 Checking:', u.displayName, u.email, '→', emailMatch);
            return emailMatch;
          });
          
          if (matchingUser) {
            console.log('✅ Found matching Okta user!', matchingUser);
            authData.oktaProfile = {
              displayName: matchingUser.displayName,
              organization: matchingUser.organization,
              title: matchingUser.title,
              officeLocation: matchingUser.officeLocation,
              email: matchingUser.email,
              department: matchingUser.department,
              mobilePhone: matchingUser.mobilePhone,
              manager: matchingUser.manager,
              managerEmail: matchingUser.managerEmail
            };
          }
        }
      } catch (error) {
        console.error('❌ Okta lookup failed:', error);
      }

      setUserInfo(authData);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !userInfo?.authenticated) {
    return null;
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = userInfo.oktaProfile?.displayName || userInfo.name || userInfo.email || 'User';
  const isInternalUser = !!userInfo.oktaProfile;

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowCard(true)}
      onMouseLeave={() => setShowCard(false)}
    >
      {/* Avatar */}
      {isInternalUser && userInfo.email ? (
        <UserAvatar
          email={userInfo.email}
          displayName={displayName}
          size="small"
          className="cursor-pointer"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gray-400 text-white flex items-center justify-center font-semibold text-sm cursor-pointer">
          {getInitials(displayName)}
        </div>
      )}

      {/* Hover Card */}
      {showCard && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="flex items-start gap-3">
            {isInternalUser && userInfo.email ? (
              <UserAvatar
                email={userInfo.email}
                displayName={displayName}
                size="medium"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-400 text-white flex items-center justify-center font-bold text-2xl flex-shrink-0">
                {getInitials(displayName)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {displayName}
              </h3>

              {isInternalUser ? (
                <>
                  {userInfo.oktaProfile?.title && (
                    <p className="text-sm text-gray-600 truncate">
                      {userInfo.oktaProfile.title}
                    </p>
                  )}
                  {userInfo.oktaProfile?.department && (
                    <p className="text-sm text-gray-600 truncate">
                      {userInfo.oktaProfile.department}
                    </p>
                  )}
                  {userInfo.oktaProfile?.officeLocation && (
                    <p className="text-sm text-gray-600 truncate">
                      📍 {userInfo.oktaProfile.officeLocation}
                    </p>
                  )}
                  {userInfo.oktaProfile?.organization && (
                    <p className="text-sm text-gray-600 truncate">
                      {userInfo.oktaProfile.organization}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  External User
                </p>
              )}

              <p className="text-xs text-gray-500 truncate mt-1">
                {userInfo.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
