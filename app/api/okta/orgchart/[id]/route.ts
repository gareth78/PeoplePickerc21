import { NextResponse } from 'next/server';
import { getUserById, searchUsers, searchUserByEmail } from '@/lib/okta';
import type { OrgChartNode, User } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the main user
    const user = await getUserById(params.id);

    // Get manager (1 level up)
    let manager: User | null = null;
    if (user.managerEmail) {
      manager = await searchUserByEmail(user.managerEmail);
    }

    // Get manager's manager (2 levels up)
    let managersManager: User | null = null;
    if (manager?.managerEmail) {
      managersManager = await searchUserByEmail(manager.managerEmail);
    }

    // Get peers (users with same manager)
    let peers: User[] = [];
    if (user.managerEmail) {
      const peerResults = await searchUsers('', 50); // Get more users to find peers
      peers = peerResults.users.filter(
        (u) => u.managerEmail === user.managerEmail && u.id !== user.id
      );
    }

    // Get direct reports (users where manager = this user's email)
    const allUsers = await searchUsers('', 100); // Get enough users to find reports
    const reports = allUsers.users.filter(
      (u) => u.managerEmail === user.email
    );

    const orgChart: OrgChartNode = {
      user,
      manager,
      managersManager,
      peers,
      reports,
    };

    return NextResponse.json({
      ok: true,
      data: orgChart,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to fetch org chart',
      },
      { status: 500 }
    );
  }
}
