// Okta API client with exponential backoff retry logic
// Uses 'q' parameter for simple text search across firstName, lastName, email

import { User, OktaUser, SearchResult } from './types';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const OKTA_ORG_URL = process.env['okta-org-url'];
const OKTA_API_TOKEN = process.env['okta-api-token'];

function validateOktaConfig(): void {
  if (!process.env['okta-org-url']) {
    throw new Error("'okta-org-url' environment variable is required");
  }
  if (!process.env['okta-api-token']) {
    throw new Error("'okta-api-token' environment variable is required");
  }
}

export function normalizeUser(oktaUser: OktaUser): User {
  const profile = oktaUser.profile;
  const displayName =
    profile.displayName ||
    `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
    profile.email;

  return {
    id: oktaUser.id,
    displayName,
    email: profile.email,
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    title: profile.title || null,
    department: profile.department || null,
    officeLocation: profile.officeLocation || profile.city || null,
    mobilePhone: profile.mobilePhone || null,
    avatarUrl: null,
    managerEmail: profile.managerEmail || null,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(fn: () => Promise<T>, retryCount = 0): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    const isRateLimit = message.includes('429') || message.toLowerCase().includes('rate limit');
    if (isRateLimit && retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
      await sleep(delay);
      return fetchWithRetry(fn, retryCount + 1);
    }
    throw error;
  }
}

export async function searchUsers(query: string, limit = 100, cursor?: string): Promise<SearchResult> {
  return fetchWithRetry(async () => {
    validateOktaConfig();

    const baseUrl = `${OKTA_ORG_URL}/api/v1/users`;
    const params = new URLSearchParams();

    params.append('limit', limit.toString());

    if (cursor) {
      params.append('after', cursor);
    }

    if (query) {
      const trimmedQuery = query.trim();
      const terms = trimmedQuery.split(/\s+/).filter(Boolean);

      if (terms.length <= 1) {
        params.append('q', trimmedQuery);
      } else {
        const filters = terms.map((term) => {
          const escapedTerm = term.replace(/"/g, '\\"');
          return `profile.firstName sw "${escapedTerm}" or profile.lastName sw "${escapedTerm}" or profile.email sw "${escapedTerm}"`;
        });

        const combinedFilter = filters.map((filter) => `(${filter})`).join(' and ');
        params.append('search', combinedFilter);
      }
    }

    const url = `${baseUrl}?${params.toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `SSWS ${OKTA_API_TOKEN}`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Okta API error: ${response.status}`);
      }

      const data: OktaUser[] = await response.json();

      const linkHeader = response.headers.get('Link');
      let nextCursor: string | null = null;

      if (linkHeader) {
        const nextMatch = linkHeader.match(/<[^>]*[?&]after=([^&>]+)[^>]*>;\s*rel="next"/);
        if (nextMatch) {
          nextCursor = nextMatch[1];
        }
      }

      const users = data
        .map(normalizeUser)
        .sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }));

      return {
        users,
        nextCursor,
        totalCount: users.length,
      };
    } finally {
      clearTimeout(timeout);
    }
  });
}

export async function getUserById(id: string): Promise<User> {
  return fetchWithRetry(async () => {
    validateOktaConfig();

    const url = `${OKTA_ORG_URL}/api/v1/users/${id}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `SSWS ${OKTA_API_TOKEN}`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Okta API error: ${response.status}`);
      }

      const data: OktaUser = await response.json();
      return normalizeUser(data);
    } finally {
      clearTimeout(timeout);
    }
  });
}

export async function searchUserByEmail(email: string): Promise<User | null> {
  return fetchWithRetry(async () => {
    validateOktaConfig();

    const baseUrl = `${process.env['okta-org-url']}/api/v1/users`;
    const params = new URLSearchParams();
    params.append('q', email);
    params.append('limit', '1');

    const url = `${baseUrl}?${params.toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `SSWS ${process.env['okta-api-token']}`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Okta API error: ${response.status}`);
      }

      const data: OktaUser[] = await response.json();

      if (data.length === 0) {
        return null;
      }

      return normalizeUser(data[0]);
    } finally {
      clearTimeout(timeout);
    }
  });
}
