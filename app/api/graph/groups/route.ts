import { NextResponse } from 'next/server';
import { searchGroups, getGroupPhoto } from '@/lib/graph';
import { cacheGet, cacheSet, TTL } from '@/lib/redis';
import type { Group, GroupSearchResult } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Query must be at least 2 characters',
        },
        { status: 400 }
      );
    }

    const normalizedQuery = query.trim();
    const cacheKey = `groups:search:${normalizedQuery}`;

    // Try to get from cache
    const cached = await cacheGet<GroupSearchResult>(cacheKey);
    if (cached) {
      return NextResponse.json({
        ok: true,
        data: cached,
        meta: {
          count: cached.groups.length,
          cached: true,
        },
      });
    }

    // Fetch from Microsoft Graph
    const startTime = Date.now();
    const result = await searchGroups(normalizedQuery);
    const latency = Date.now() - startTime;

    // Transform Graph API response to our format and fetch photos for M365 groups
    const groups: Group[] = await Promise.all(
      (result.value || []).map(async (group: any) => {
        // Get member count from the expanded members object
        const memberCount = group.members?.['@odata.count'] || group['members@odata.count'];

        // Fetch photo for M365 groups (Unified)
        let photoUrl: string | null = null;
        const isM365Group = group.groupTypes?.includes('Unified');
        if (isM365Group) {
          photoUrl = await getGroupPhoto(group.id);
        }

        return {
          id: group.id,
          displayName: group.displayName,
          mail: group.mail || null,
          description: group.description || null,
          groupTypes: group.groupTypes || [],
          memberCount: memberCount || undefined,
          createdDateTime: group.createdDateTime || undefined,
          visibility: group.visibility || undefined,
          classification: group.classification || undefined,
          mailEnabled: group.mailEnabled || undefined,
          securityEnabled: group.securityEnabled || undefined,
          photoUrl: photoUrl,
        };
      })
    );

    const searchResult: GroupSearchResult = {
      groups,
      nextLink: result['@odata.nextLink'] || null,
      totalCount: groups.length,
    };

    // Store in cache (don't wait for it)
    cacheSet(cacheKey, searchResult, TTL.GROUPS).catch(err =>
      console.error('Failed to cache group search result:', err)
    );

    return NextResponse.json({
      ok: true,
      data: searchResult,
      meta: {
        count: groups.length,
        latency,
        cached: false,
      },
    });
  } catch (error) {
    console.error('Group search error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Group search failed',
      },
      { status: 500 }
    );
  }
}
