import { NextResponse } from 'next/server';
import { getGroupDetail, getGroupMembers, getGroupOwners } from '@/lib/graph';
import { cacheGet, cacheSet, TTL } from '@/lib/redis';
import type { GroupDetail, GroupMember } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const cacheKey = `groups:detail:${id}`;

    // Try to get from cache
    const cached = await cacheGet<GroupDetail>(cacheKey);
    if (cached) {
      return NextResponse.json({
        ok: true,
        data: cached,
        meta: {
          cached: true,
        },
      });
    }

    // Fetch from Microsoft Graph
    const startTime = Date.now();

    // Fetch group details, members, and owners in parallel
    const [groupData, membersData, ownersData] = await Promise.all([
      getGroupDetail(id),
      getGroupMembers(id),
      getGroupOwners(id),
    ]);

    const latency = Date.now() - startTime;

    // Transform members data
    const members: GroupMember[] = membersData.map((member: any) => {
      // Determine if this is a user or nested group
      const isGroup = member['@odata.type'] === '#microsoft.graph.group';

      return {
        id: member.id,
        displayName: member.displayName,
        mail: member.mail || null,
        userPrincipalName: member.userPrincipalName || undefined,
        jobTitle: member.jobTitle || null,
        department: member.department || null,
        type: isGroup ? 'group' : 'user',
      };
    });

    // Transform owners data
    const owners: GroupMember[] = ownersData.map((owner: any) => {
      const isGroup = owner['@odata.type'] === '#microsoft.graph.group';

      return {
        id: owner.id,
        displayName: owner.displayName,
        mail: owner.mail || null,
        userPrincipalName: owner.userPrincipalName || undefined,
        jobTitle: owner.jobTitle || null,
        department: owner.department || null,
        type: isGroup ? 'group' : 'user',
      };
    });

    const groupDetail: GroupDetail = {
      id: groupData.id,
      displayName: groupData.displayName,
      mail: groupData.mail || null,
      description: groupData.description || null,
      groupTypes: groupData.groupTypes || [],
      members,
      owners,
    };

    // Store in cache (don't wait for it)
    cacheSet(cacheKey, groupDetail, TTL.GROUPS).catch(err =>
      console.error('Failed to cache group detail:', err)
    );

    return NextResponse.json({
      ok: true,
      data: groupDetail,
      meta: {
        latency,
        cached: false,
      },
    });
  } catch (error) {
    console.error('Group detail error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to fetch group details',
      },
      { status: 500 }
    );
  }
}
