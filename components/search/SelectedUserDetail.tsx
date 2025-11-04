'use client';

import { useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { usePresence } from '@/lib/hooks/usePresence';
import { formatPresenceActivity, getPresenceBadgeClasses } from '@/lib/presence-utils';
import type { User } from '@/lib/types';
import UserAvatar from '../UserAvatar';

interface SelectedUserDetailProps {
  user: User;
  managerData: User | null;
  copiedField: string | null;
  onCopyField: (text: string, fieldName: string) => void | Promise<void>;
  onNavigateToUser: (user: User) => void;
  query: string;
}

export default function SelectedUserDetail({
  user,
  managerData,
  copiedField,
  onCopyField,
  onNavigateToUser,
  query,
}: SelectedUserDetailProps) {
  const normalizedEmail = useMemo(
    () => (user.email ? user.email.trim().toLowerCase() : undefined),
    [user.email]
  );

  const { presence } = usePresence(normalizedEmail);

  const presenceActivity = presence?.activity ?? null;
  const presenceBadgeClasses = presenceActivity
    ? getPresenceBadgeClasses(presenceActivity)
    : '';
  const shouldShowPresence = Boolean(
    presenceActivity &&
      presenceActivity !== 'PresenceUnknown' &&
      presenceBadgeClasses
  );
  const presenceLabel = shouldShowPresence
    ? formatPresenceActivity(presenceActivity!)
    : null;

  return (
    <div className="max-w-md mx-auto">
      <UserAvatar
        email={user.email}
        displayName={user.displayName}
        size="medium"
        className="mx-auto mb-4 hover:scale-150 transition-transform duration-200 ease-in-out cursor-pointer"
        rounded="rounded-lg"
      />

      {shouldShowPresence && presenceLabel && (
        <div className="flex justify-center mb-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${presenceBadgeClasses}`}
          >
            {presenceLabel}
          </span>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
        {user.displayName}
      </h2>

      {user.title && (
        <p className="text-lg text-gray-600 text-center mb-1">
          {user.title}
        </p>
      )}

      {user.department && (
        <p className="text-base text-gray-500 text-center mb-1">
          {user.department}
        </p>
      )}

      {user.organization && (
        <p className="text-base text-gray-600 text-center mb-1">
          {user.organization}
        </p>
      )}

      {managerData && (
        <p className="text-sm text-gray-500 text-center mb-5">
          Manager:{' '}
          <button
            onClick={() => onNavigateToUser(managerData)}
            className="text-primary hover:underline font-medium"
          >
            {managerData.displayName}
          </button>
        </p>
      )}

      <div className="flex justify-center gap-3 mb-6">
        <a
          href={`mailto:${user.email}`}
          className="w-12 h-12 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center border-2 border-gray-200 hover:border-blue-400"
          title="Send email in Outlook"
        >
          <img
            src="/icons/OutlookAppIcon.jpg"
            alt="Email"
            className="w-8 h-8 rounded"
          />
        </a>

        <a
          href={`https://teams.microsoft.com/l/chat/0/0?users=${user.email}`}
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
          <div className="flex justify-between items-center py-2 border-b border-gray-100 text-base">
            <span className="font-medium text-gray-600">Name:</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-900">{user.displayName}</span>
              <button
                onClick={() => onCopyField(user.displayName, 'name')}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                title="Copy to clipboard"
              >
                {copiedField === 'name' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {user.title && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100 text-base">
              <span className="font-medium text-gray-600">Job Title:</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-900">{user.title}</span>
                <button
                  onClick={() => onCopyField(user.title ?? '', 'title')}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title="Copy to clipboard"
                >
                  {copiedField === 'title' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {user.department && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100 text-base">
              <span className="font-medium text-gray-600">Department:</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-900">{user.department}</span>
                <button
                  onClick={() => onCopyField(user.department ?? '', 'department')}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title="Copy to clipboard"
                >
                  {copiedField === 'department' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {user.organization && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100 text-base">
              <span className="font-medium text-gray-600">Organization:</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-900">{user.organization}</span>
                <button
                  onClick={() => onCopyField(user.organization ?? '', 'organization')}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title="Copy to clipboard"
                >
                  {copiedField === 'organization' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center py-2 border-b border-gray-100 text-base">
            <span className="font-medium text-gray-600">Email:</span>
            <div className="flex items-center gap-2">
              <a href={`mailto:${user.email}`} className="text-primary hover:underline">
                {user.email}
              </a>
              <button
                onClick={() => onCopyField(user.email, 'email')}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                title="Copy to clipboard"
              >
                {copiedField === 'email' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {user.mobilePhone && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100 text-base">
              <span className="font-medium text-gray-600">Phone:</span>
              <div className="flex items-center gap-2">
                <a href={`tel:${user.mobilePhone}`} className="text-primary hover:underline">
                  {user.mobilePhone}
                </a>
                <button
                  onClick={() => onCopyField(user.mobilePhone ?? '', 'phone')}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title="Copy to clipboard"
                >
                  {copiedField === 'phone' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {user.officeLocation && (
            <div className="flex justify-between items-center py-2 text-base">
              <span className="font-medium text-gray-600">Location:</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-900">{user.officeLocation}</span>
                <button
                  onClick={() => onCopyField(user.officeLocation ?? '', 'location')}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title="Copy to clipboard"
                >
                  {copiedField === 'location' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <a
        href={`/user/${user.id}${query ? `?q=${encodeURIComponent(query)}` : ''}`}
        className="block mt-5 px-5 py-2.5 bg-primary text-white text-base font-medium text-center rounded-lg hover:bg-primary-dark transition-colors"
      >
        View full profile →
      </a>
    </div>
  );
}
