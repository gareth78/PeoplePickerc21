import { NextResponse } from 'next/server';
import { searchGroups, getGroupPhoto, getGroupMemberCount } from '@/lib/graph';
import { cacheGet, cacheSet, TTL } from '@/lib/redis';
import type { Group, GroupSearchResult } from '@/lib/types';

export const dynamic = 'force-dynamic';
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
        const isM365Group = group.groupTypes?.includes('Unified');
        const memberCountAnnotation = group['members@odata.count'];
        const memberCountCacheKey = `groups:memberCount:${group.id}`;
        let resolvedMemberCount: number | undefined =
          typeof memberCountAnnotation === 'number' ? memberCountAnnotation : undefined;

        if (resolvedMemberCount === undefined && typeof memberCountAnnotation === 'string') {
          const parsed = parseInt(memberCountAnnotation, 10);
          if (!Number.isNaN(parsed)) {
            resolvedMemberCount = parsed;
          }
        }

        if (resolvedMemberCount === undefined) {
          const cachedCount = await cacheGet<number>(memberCountCacheKey);
          if (cachedCount !== null) {
            resolvedMemberCount = cachedCount;
          } else {
            const fetchedCount = await getGroupMemberCount(group.id);
            if (typeof fetchedCount === 'number') {
              resolvedMemberCount = fetchedCount;
              cacheSet(memberCountCacheKey, fetchedCount, TTL.GROUPS).catch(err =>
                console.error('Failed to cache group member count:', err)
              );
            }
          }
        }

        let photoUrl: string | null = null;
        if (isM365Group) {
          photoUrl = await getGroupPhoto(group.id);
        }

        return {
          id: group.id,
          displayName: group.displayName,
          mail: group.mail || null,
          description: group.description || null,
          groupTypes: group.groupTypes || [],
          memberCount: resolvedMemberCount,
          createdDateTime: group.createdDateTime || undefined,
          visibility: group.visibility || undefined,
          classification: group.classification || undefined,
          mailEnabled: group.mailEnabled || undefined,
          securityEnabled: group.securityEnabled || undefined,
          photoUrl,
        };
      })
    );

    // Sort groups by displayName client-side since Microsoft Graph doesn't support
    // sorting with filter queries
    groups.sort((a, b) => a.displayName.localeCompare(b.displayName));

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
