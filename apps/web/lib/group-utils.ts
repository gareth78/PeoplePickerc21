import type { Group } from './types';

type GroupLike = Pick<Group, 'groupTypes' | 'mailEnabled' | 'securityEnabled'>;

export type GroupBadgeVariant =
  | 'm365'
  | 'distribution'
  | 'mailSecurity'
  | 'security'
  | 'dynamic'
  | 'standard';

export interface GroupBadgeMeta {
  label: string;
  variant: GroupBadgeVariant;
}

export function getGroupBadgeMeta(group: GroupLike): GroupBadgeMeta {
  const groupTypes = group.groupTypes ?? [];
  const isM365Group = groupTypes.includes('Unified');
  const isDynamicGroup = groupTypes.includes('DynamicMembership');
  const isMailEnabled = Boolean(group.mailEnabled);
  const isSecurityEnabled = Boolean(group.securityEnabled);

  if (isM365Group) {
    return {
      label: isDynamicGroup ? 'Dynamic M365' : 'M365',
      variant: 'm365',
    };
  }

  if (isMailEnabled && isSecurityEnabled) {
    return {
      label: isDynamicGroup ? 'Dynamic Mail-Enabled Security' : 'Mail-Enabled Security',
      variant: 'mailSecurity',
    };
  }

  if (isMailEnabled) {
    return {
      label: 'Distribution List',
      variant: 'distribution',
    };
  }

  if (isSecurityEnabled) {
    return {
      label: isDynamicGroup ? 'Dynamic Security Group' : 'Security Group',
      variant: 'security',
    };
  }

  if (isDynamicGroup) {
    return {
      label: 'Dynamic',
      variant: 'dynamic',
    };
  }

  return {
    label: 'Group',
    variant: 'standard',
  };
}

export function getGroupBadgeClasses(variant: GroupBadgeVariant): string {
  switch (variant) {
    case 'm365':
      return 'bg-blue-50 border border-blue-200 text-blue-700';
    case 'distribution':
      return 'bg-green-50 border border-green-200 text-green-700';
    case 'mailSecurity':
      return 'bg-orange-50 border border-orange-200 text-orange-700';
    case 'security':
      return 'bg-purple-50 border border-purple-200 text-purple-700';
    case 'dynamic':
      return 'bg-indigo-50 border border-indigo-200 text-indigo-700';
    case 'standard':
      return 'bg-gray-50 border border-gray-200 text-gray-700';
    default:
      return 'bg-gray-50 border border-gray-200 text-gray-700';
  }
}
