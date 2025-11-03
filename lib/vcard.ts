import type { User } from './types';

/**
 * Escapes special characters for vCard format (VERSION 3.0)
 * Backslash, semicolon, and comma must be escaped with a backslash
 * Newlines should be replaced with \n
 */
function escapeVCardValue(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/;/g, '\\;')     // Escape semicolons
    .replace(/,/g, '\\,')     // Escape commas
    .replace(/\n/g, '\\n')    // Escape newlines
    .replace(/\r/g, '');      // Remove carriage returns
}

/**
 * Folds a vCard line at 75 characters per vCard specification
 * Continuation lines start with a space
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;

  const folded: string[] = [];
  let remaining = line;

  // First line can be 75 chars
  folded.push(remaining.substring(0, 75));
  remaining = remaining.substring(75);

  // Continuation lines start with space and can be 74 chars (75 - 1 for the space)
  while (remaining.length > 0) {
    folded.push(' ' + remaining.substring(0, 74));
    remaining = remaining.substring(74);
  }

  return folded.join('\r\n');
}

/**
 * Generates a vCard (VERSION 3.0) string from a User object
 * Returns a properly formatted vCard that can be imported into Outlook or any contact manager
 */
export function generateVCard(user: User): string {
  const lines: string[] = [];

  // Start vCard
  lines.push('BEGIN:VCARD');
  lines.push('VERSION:3.0');

  // Full name (FN) - required field
  lines.push(`FN:${escapeVCardValue(user.displayName)}`);

  // Structured name (N) - format: LastName;FirstName;MiddleName;Prefix;Suffix
  const lastName = escapeVCardValue(user.lastName || '');
  const firstName = escapeVCardValue(user.firstName || '');
  lines.push(`N:${lastName};${firstName};;;`);

  // Email - required field
  lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(user.email)}`);

  // Secondary email if available
  if (user.secondaryEmail) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(user.secondaryEmail)}`);
  }

  // Phone numbers
  if (user.mobilePhone) {
    lines.push(`TEL;TYPE=CELL,VOICE:${escapeVCardValue(user.mobilePhone)}`);
  }

  if (user.primaryPhone) {
    lines.push(`TEL;TYPE=WORK,VOICE:${escapeVCardValue(user.primaryPhone)}`);
  }

  // Organization
  if (user.organization) {
    lines.push(`ORG:${escapeVCardValue(user.organization)}`);
  }

  // Title
  if (user.title) {
    lines.push(`TITLE:${escapeVCardValue(user.title)}`);
  }

  // Address (ADR) - format: POBox;ExtendedAddress;Street;City;State;PostalCode;Country
  if (user.streetAddress || user.city || user.state || user.zipCode || user.countryName) {
    const street = escapeVCardValue(user.streetAddress || '');
    const city = escapeVCardValue(user.city || '');
    const state = escapeVCardValue(user.state || '');
    const zip = escapeVCardValue(user.zipCode || '');
    const country = escapeVCardValue(user.countryName || '');
    lines.push(`ADR;TYPE=WORK:;;${street};${city};${state};${zip};${country}`);
  }

  // Office location (if different from address)
  if (user.officeLocation && user.officeLocation !== user.city) {
    lines.push(`X-MS-OL-DEFAULT-POSTAL-ADDRESS:2`);
    lines.push(`LABEL;TYPE=WORK:${escapeVCardValue(user.officeLocation)}`);
  }

  // Department and additional info in NOTE field
  const noteItems: string[] = [];
  if (user.department) {
    noteItems.push(`Department: ${user.department}`);
  }
  if (user.division) {
    noteItems.push(`Division: ${user.division}`);
  }
  if (user.employeeNumber) {
    noteItems.push(`Employee Number: ${user.employeeNumber}`);
  }
  if (user.costCenter) {
    noteItems.push(`Cost Center: ${user.costCenter}`);
  }

  if (noteItems.length > 0) {
    const note = escapeVCardValue(noteItems.join('; '));
    lines.push(`NOTE:${note}`);
  }

  // URL to full profile (custom field)
  if (user.id) {
    lines.push(`URL:${window.location.origin}/user/${user.id}`);
  }

  // End vCard
  lines.push('END:VCARD');

  // Fold lines that exceed 75 characters and join with CRLF
  return lines.map(foldLine).join('\r\n');
}

/**
 * Generates a safe filename from a display name
 * Replaces special characters with underscores
 */
export function generateVCardFilename(displayName: string): string {
  return `${displayName.replace(/[^a-z0-9]/gi, '_')}.vcf`;
}
