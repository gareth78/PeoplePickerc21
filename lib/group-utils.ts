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
      label: isDynamicGroup ? 'Dynamic Microsoft 365 Group' : 'Microsoft 365 Group',
      variant: 'm365',
    };
  }

  if (isMailEnabled && isSecurityEnabled) {
    return {
      label: isDynamicGroup ? 'Dynamic Mail-Enabled Security Group' : 'Mail-Enabled Security Group',
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
      label: 'Dynamic Group',
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
      return 'bg-blue-100 text-blue-700';
    case 'distribution':
      return 'bg-green-100 text-green-700';
    case 'mailSecurity':
      return 'bg-teal-100 text-teal-700';
    case 'security':
      return 'bg-purple-100 text-purple-700';
    case 'dynamic':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}
