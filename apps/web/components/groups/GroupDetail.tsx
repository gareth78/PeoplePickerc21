'use client';

import { useEffect, useState } from 'react';
import { Users, Mail, ShieldCheck, Shield, Zap } from 'lucide-react';
import { getGroupBadgeClasses, getGroupBadgeMeta, type GroupBadgeVariant } from '@/lib/group-utils';
import type { GroupDetail as GroupDetailType, GroupMember, CheckSendPermissionResponse } from '@/lib/types';

interface GroupDetailProps {
  groupId: string;
  onMemberClick?: (memberId: string, memberType: 'user' | 'group', memberEmail?: string) => void;
  onBack?: () => void;
}

// Helper function to get the icon for each badge variant
function getBadgeIcon(variant: GroupBadgeVariant) {
  switch (variant) {
    case 'm365':
      return <Users className="w-4 h-4" />;
    case 'distribution':
      return <Mail className="w-4 h-4" />;
    case 'mailSecurity':
      return <ShieldCheck className="w-4 h-4" />;
    case 'security':
      return <Shield className="w-4 h-4" />;
    case 'dynamic':
      return <Zap className="w-4 h-4" />;
    case 'standard':
      return <Users className="w-4 h-4" />;
    default:
      return <Users className="w-4 h-4" />;
  }
}

export default function GroupDetail({ groupId, onMemberClick, onBack }: GroupDetailProps) {
  const [group, setGroup] = useState<GroupDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [loadingAllMembers, setLoadingAllMembers] = useState(false);
  const [allMembers, setAllMembers] = useState<GroupMember[]>([]);

  // Permission check state
  const [permissionCheckLoading, setPermissionCheckLoading] = useState(false);
  const [permissionCheckResult, setPermissionCheckResult] = useState<CheckSendPermissionResponse | null>(null);
  const [permissionCheckError, setPermissionCheckError] = useState<string | null>(null);

  useEffect(() => {
    setPermissionCheckResult(null);
    setPermissionCheckError(null);
  }, [groupId]);

  useEffect(() => {
    const fetchGroupDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/graph/groups/${groupId}`);
        const data = await response.json();

        if (data.ok) {
          setGroup(data.data);
          setAllMembers(data.data.members);
        } else {
          setError(data.error || 'Failed to load group details');
        }
      } catch (err) {
        setError('Failed to fetch group details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void fetchGroupDetail();
  }, [groupId]);

  // Load cached permission check result
  useEffect(() => {
    if (group?.mail) {
      const cacheKey = `group-permission-${groupId}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          const cacheAge = Date.now() - parsedCache.timestamp;
          // Cache valid for 5 minutes
          if (cacheAge < 5 * 60 * 1000) {
            setPermissionCheckResult(parsedCache.result);
          } else {
            sessionStorage.removeItem(cacheKey);
          }
        } catch (err) {
          console.error('Failed to parse permission cache:', err);
        }
      }
    }
  }, [groupId, group]);

  const renderPermissionDetails = (result: CheckSendPermissionResponse | null) => {
    const details = result?.groupDetails;
    if (!details) return null;

    const rows: { label: string; value: string }[] = [];

    if (details.visibility) {
      const value = `${details.visibility.charAt(0).toUpperCase()}${details.visibility.slice(1)}`;
      rows.push({ label: 'Visibility', value });
    }

    if (typeof details.mailEnabled === 'boolean') {
      rows.push({ label: 'Mail-enabled', value: details.mailEnabled ? 'Yes' : 'No' });
    }

    if (typeof details.allowExternalSenders === 'boolean') {
      rows.push({
        label: 'External senders',
        value: details.allowExternalSenders ? 'Allowed' : 'Restricted',
      });
    }

    if (typeof details.requireSenderAuthenticationEnabled === 'boolean') {
      rows.push({
        label: 'Sender authentication',
        value: details.requireSenderAuthenticationEnabled ? 'Required' : 'Not required',
      });
    }

    if (!rows.length) {
      return null;
    }

    return (
      <dl className="mt-3 space-y-1 text-xs text-gray-600">
        {rows.map(row => (
          <div key={row.label} className="flex justify-between">
            <dt className="font-medium text-gray-500">{row.label}:</dt>
            <dd className="text-gray-700">{row.value}</dd>
          </div>
        ))}
      </dl>
    );
  };

  const renderMembershipDisclaimer = (result: CheckSendPermissionResponse | null) => {
    if (!result?.available || result.membershipChecked !== false) {
      return null;
    }

    return (
      <p className="mt-3 text-xs text-gray-500">
        We couldn't automatically verify your membership. Results are based on the group's sending settings.
      </p>
    );
  };

  const checkSendPermission = async () => {
    if (!group?.mail) return;

    setPermissionCheckLoading(true);
    setPermissionCheckError(null);

    try {
      // Get user email from JWT token or session
      // For now, we'll get it from the /api/auth/me endpoint
      const meResponse = await fetch('/api/auth/me');
      const meData = await meResponse.json();

      if (!meData.email) {
        setPermissionCheckError('Unable to determine your email address');
        return;
      }

      const userEmail = meData.email;

      // Make the permission check request
      const response = await fetch('/api/groups/check-send-permission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          userEmail,
        }),
      });

      const result: CheckSendPermissionResponse = await response.json();
      setPermissionCheckResult(result);

      // Cache the result
      const cacheKey = `group-permission-${groupId}`;
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          result,
          timestamp: Date.now(),
        })
      );
    } catch (err) {
      console.error('Permission check error:', err);
      setPermissionCheckError('An unexpected error occurred');
    } finally {
      setPermissionCheckLoading(false);
    }
  };

  const retryPermissionCheck = () => {
    if (permissionCheckLoading) return;
    // Clear cache and retry
    const cacheKey = `group-permission-${groupId}`;
    sessionStorage.removeItem(cacheKey);
    setPermissionCheckResult(null);
    setPermissionCheckError(null);
    checkSendPermission();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const loadAllMembers = async () => {
    if (!group) return;
    
    setLoadingAllMembers(true);
    try {
      const response = await fetch(`/api/graph/groups/${groupId}`);
      const data = await response.json();
      
      if (data.ok) {
        setAllMembers(data.data.members);
        setShowAllMembers(true);
      }
    } catch (err) {
      console.error('Failed to load all members:', err);
    } finally {
      setLoadingAllMembers(false);
    }
  };

  const displayedMembers = showAllMembers ? allMembers : allMembers.slice(0, 50);

  // Helper function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-base text-gray-600">
        Loading group details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 text-base">
        {error}
      </div>
    );
  }

  if (!group) {
    return null;
  }

  const badgeMeta = getGroupBadgeMeta(group);
  const badgeClassName = getGroupBadgeClasses(badgeMeta.variant);

  return (
    <div className="max-w-md mx-auto">
      {/* Group Icon */}
      <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
        {group.photoUrl ? (
          <img
            src={group.photoUrl}
            alt={group.displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            className="w-10 h-10 text-primary"
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

      {/* Group Name */}
      <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
        {group.displayName}
      </h2>

      {/* Group Type Badge */}
      <div className="flex justify-center mb-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium ${badgeClassName}`}>
          {getBadgeIcon(badgeMeta.variant)}
          {badgeMeta.label}
        </span>
      </div>

      {/* Description */}
      {group.description && (
        <p className="text-base text-gray-600 text-center mb-5">
          {group.description}
        </p>
      )}

      {/* Quick Action Buttons */}
      <div className="flex justify-center gap-3 mb-6">
        {/* Email button */}
        {group.mail && (
          <a
            href={`mailto:${group.mail}`}
            className="w-12 h-12 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center border-2 border-gray-200 hover:border-blue-400"
            title="Send email to group"
          >
            <img
              src="/icons/OutlookAppIcon.jpg"
              alt="Email"
              className="w-8 h-8 rounded"
            />
          </a>
        )}
      </div>

      {/* Permission Check Section */}
      {group.mail && (
        <div className="mb-6">
          {!permissionCheckResult && !permissionCheckError && (
            <button
              onClick={checkSendPermission}
              disabled={permissionCheckLoading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {permissionCheckLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking permissions...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Can I send to this group?
                </>
              )}
            </button>
          )}

          {/* Success - Can Send */}
          {permissionCheckResult && permissionCheckResult.available && permissionCheckResult.canSend && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-green-900 mb-1">You can send to this group</p>
                  <p className="text-sm text-green-700">{permissionCheckResult.reason}</p>
                  {renderPermissionDetails(permissionCheckResult)}
                  {renderMembershipDisclaimer(permissionCheckResult)}
                  <button
                    onClick={retryPermissionCheck}
                    disabled={permissionCheckLoading}
                    className="mt-3 inline-flex items-center text-xs font-medium text-green-800 underline hover:no-underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Check again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success - Cannot Send */}
          {permissionCheckResult && permissionCheckResult.available && !permissionCheckResult.canSend && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-red-900 mb-1">You cannot send to this group</p>
                  <p className="text-sm text-red-700 mb-2">{permissionCheckResult.reason}</p>
                  <p className="text-xs text-gray-600">Contact IT if you need access</p>
                  {renderPermissionDetails(permissionCheckResult)}
                  {renderMembershipDisclaimer(permissionCheckResult)}
                  <button
                    onClick={retryPermissionCheck}
                    disabled={permissionCheckLoading}
                    className="mt-3 inline-flex items-center text-xs font-medium text-red-800 underline hover:no-underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Check again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feature Not Available */}
          {permissionCheckResult && !permissionCheckResult.available && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">Permission check not available</p>
                  <p className="text-sm text-gray-600">{permissionCheckResult.reason}</p>
                  {renderPermissionDetails(permissionCheckResult)}
                  <button
                    onClick={retryPermissionCheck}
                    disabled={permissionCheckLoading}
                    className="mt-3 inline-flex items-center text-xs font-medium text-gray-800 underline hover:no-underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {permissionCheckError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-yellow-900 mb-1">Unable to check permissions</p>
                  <p className="text-sm text-yellow-700 mb-3">{permissionCheckError}</p>
                  <button
                    onClick={retryPermissionCheck}
                    className="text-sm text-yellow-800 font-medium underline hover:no-underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Group Metadata Section (for M365 Groups) */}
      {(group.createdDateTime || group.visibility || group.classification || group.mailEnabled !== undefined || group.securityEnabled !== undefined) && (
        <div className="pt-5 border-t border-gray-200 mb-5">
          <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Group Information
          </h4>
          <div className="space-y-2">
            {group.createdDateTime && (
              <div className="flex justify-between py-2 text-base">
                <span className="font-medium text-gray-600">Created:</span>
                <span className="text-gray-900">{formatDate(group.createdDateTime)}</span>
              </div>
            )}
            {group.visibility && (
              <div className="flex justify-between py-2 border-t border-gray-100 text-base">
                <span className="font-medium text-gray-600">Visibility:</span>
                <span className="text-gray-900 capitalize">{group.visibility}</span>
              </div>
            )}
            {group.classification && (
              <div className="flex justify-between py-2 border-t border-gray-100 text-base">
                <span className="font-medium text-gray-600">Classification:</span>
                <span className="text-gray-900">{group.classification}</span>
              </div>
            )}
            {group.mailEnabled !== undefined && (
              <div className="flex justify-between py-2 border-t border-gray-100 text-base">
                <span className="font-medium text-gray-600">Mail Enabled:</span>
                <span className="text-gray-900">{group.mailEnabled ? 'Yes' : 'No'}</span>
              </div>
            )}
            {group.securityEnabled !== undefined && (
              <div className="flex justify-between py-2 border-t border-gray-100 text-base">
                <span className="font-medium text-gray-600">Security Enabled:</span>
                <span className="text-gray-900">{group.securityEnabled ? 'Yes' : 'No'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Email with copy button */}
      {group.mail && (
        <div className="pt-5 border-t border-gray-200 mb-5">
          <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Contact Information
          </h4>
          <div className="flex justify-between items-center py-2 text-base">
            <span className="font-medium text-gray-600">Email:</span>
            <div className="flex items-center gap-2">
              <a
                href={`mailto:${group.mail}`}
                className="text-primary hover:underline"
              >
                {group.mail}
              </a>
              <button
                onClick={() => copyToClipboard(group.mail!)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy email"
              >
                {copiedEmail ? (
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Owners */}
      {group.owners.length > 0 && (
        <div className="pt-5 border-t border-gray-200 mb-5">
          <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Owners ({group.owners.length})
          </h4>
          <div className="space-y-2">
            {group.owners.map((owner) => (
              <MemberItem
                key={owner.id}
                member={owner}
                onClick={onMemberClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      {allMembers.length > 0 && (
        <div className="pt-5 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Members ({group.memberCount || allMembers.length})
          </h4>
          <div className="space-y-2">
            {displayedMembers.map((member) => (
              <MemberItem
                key={member.id}
                member={member}
                onClick={onMemberClick}
              />
            ))}
          </div>
          
          {/* Load All Members Button */}
          {!showAllMembers && allMembers.length > 50 && (
            <button
              onClick={loadAllMembers}
              disabled={loadingAllMembers}
              className="w-full mt-4 py-3 bg-gray-50 text-base text-primary font-medium hover:bg-gray-100 transition-colors border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAllMembers ? 'Loading...' : `Load all ${group.memberCount || allMembers.length} members`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Helper component for rendering members/owners
function MemberItem({
  member,
  onClick,
}: {
  member: GroupMember;
  onClick?: (memberId: string, memberType: 'user' | 'group', memberEmail?: string) => void;
}) {
  const handleClick = () => {
    if (onClick) {
      onClick(member.id, member.type, member.mail || member.userPrincipalName);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
    >
      {/* Icon based on type */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        member.type === 'group' ? 'bg-purple-100' : 'bg-blue-100'
      }`}>
        {member.type === 'group' ? (
          <svg
            className="w-5 h-5 text-purple-600"
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
        ) : (
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        )}
      </div>

      {/* Member details */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-base text-gray-900 truncate">
          {member.displayName}
        </div>
        {member.jobTitle && (
          <div className="text-sm text-gray-600 truncate">
            {member.jobTitle}
          </div>
        )}
        {member.type === 'group' && (
          <div className="text-sm text-purple-600">
            Group
          </div>
        )}
      </div>
    </button>
  );
}
