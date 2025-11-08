'use client';

import { useEffect, useState, useRef } from 'react';
import UserAvatar from './UserAvatar';
import { User, Shield, Moon, Sun, LogOut } from 'lucide-react';
import Link from 'next/link';

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

interface UserMenuProps {
  isAdmin?: boolean;
}

export default function UserMenu({ isAdmin = false }: UserMenuProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUserInfo();
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const fetchUserInfo = async () => {
    try {
      const authResponse = await fetch('/api/me');
      const authData = await authResponse.json();

      if (!authData.authenticated) {
        setLoading(false);
        return;
      }

      // Try to get Okta profile
      try {
        const oktaUrl = `/api/okta/users?q=${encodeURIComponent(authData.email)}`;
        const oktaResponse = await fetch(oktaUrl);
        const oktaData = await oktaResponse.json();

        let users = [];
        if (oktaData.ok && oktaData.data?.users && Array.isArray(oktaData.data.users)) {
          users = oktaData.data.users;
        } else if (oktaData.users && Array.isArray(oktaData.users)) {
          users = oktaData.users;
        }

        if (users.length > 0) {
          const matchingUser = users.find((u: any) => 
            u.email?.toLowerCase() === authData.email.toLowerCase()
          );
          
          if (matchingUser) {
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

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (loading || !userInfo?.authenticated) {
    return null;
  }

  const displayName = userInfo.oktaProfile?.displayName || userInfo.name || userInfo.email || 'User';
  const isInternalUser = !!userInfo.oktaProfile;

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-all hover:opacity-80"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {isInternalUser && userInfo.email ? (
          <UserAvatar
            email={userInfo.email}
            displayName={displayName}
            size="small"
            className="cursor-pointer"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gray-400 text-white flex items-center justify-center font-semibold text-base cursor-pointer">
            {getInitials(displayName)}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* User Info Header */}
          <div className="px-4 py-4 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              {isInternalUser && userInfo.email ? (
                <UserAvatar
                  email={userInfo.email}
                  displayName={displayName}
                  size="medium"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-400 text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
                  {getInitials(displayName)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-base">
                  {displayName}
                </h3>
                <p className="text-sm text-gray-600 truncate">
                  {userInfo.email}
                </p>
              </div>
            </div>

            {/* Additional Info */}
            {isInternalUser && (
              <div className="mt-3 space-y-1">
                {userInfo.oktaProfile?.title && (
                  <p className="text-xs text-gray-600 truncate">
                    {userInfo.oktaProfile.title}
                  </p>
                )}
                {userInfo.oktaProfile?.department && (
                  <p className="text-xs text-gray-600 truncate">
                    {userInfo.oktaProfile.department}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* My Profile */}
            <Link
              href={`/user/${userInfo.email}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-5 h-5 text-gray-500" />
              <span className="font-medium">My Profile</span>
            </Link>

            {/* Admin Dashboard - Only show if admin */}
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-blue-600 hover:text-blue-700"
                onClick={() => setIsOpen(false)}
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">Admin Dashboard</span>
              </Link>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Light Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-200 py-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-red-600 hover:text-red-700"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
