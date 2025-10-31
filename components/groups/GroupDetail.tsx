'use client';

import { useEffect, useState } from 'react';
import { getGroupBadgeClasses, getGroupBadgeMeta } from '@/lib/group-utils';
import type { GroupDetail as GroupDetailType, GroupMember } from '@/lib/types';

interface GroupDetailProps {
  groupId: string;
  onMemberClick?: (memberId: string, memberType: 'user' | 'group', memberEmail?: string) => void;
  onBack?: () => void;
}

export default function GroupDetail({ groupId, onMemberClick, onBack }: GroupDetailProps) {
  const [group, setGroup] = useState<GroupDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [loadingAllMembers, setLoadingAllMembers] = useState(false);
  const [allMembers, setAllMembers] = useState<GroupMember[]>([]);

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
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${badgeClassName}`}>
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
