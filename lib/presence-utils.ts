export interface PresenceData {
  activity: string;
  availability: string;
}

export function formatPresenceActivity(activity: string): string {
  switch (activity) {
    case 'InAMeeting':
      return 'In a Meeting';
    case 'InACall':
      return 'On a Call';
    case 'OutOfOffice':
      return 'Out of Office';
    case 'BeRightBack':
      return 'Be Right Back';
    case 'DoNotDisturb':
      return 'Do Not Disturb';
    default:
      return activity;
  }
}

export function getPresenceBadgeClasses(activity: string): string {
  switch (activity) {
    case 'Available':
      return 'bg-green-100 text-green-700';
    case 'Busy':
    case 'DoNotDisturb':
    case 'InAMeeting':
    case 'InACall':
    case 'Presenting':
      return 'bg-red-100 text-red-700';
    case 'Away':
    case 'BeRightBack':
      return 'bg-amber-100 text-amber-700';
    case 'OutOfOffice':
      return 'bg-purple-100 text-purple-700';
    case 'Offline':
      return 'bg-gray-100 text-gray-700';
    default:
      return '';
  }
}
