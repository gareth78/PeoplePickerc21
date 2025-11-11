import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { verifyAdminAuth } from '@/lib/admin/middleware';
import { createAuditLog } from '@/lib/admin/audit';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET all tenancies
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authenticated || !authResult.session) {
      return authResult.response!;
    }
    const admin = authResult.session;

    await createAuditLog({
      action: 'VIEW_TENANCIES',
      adminEmail: admin.email,
    });

    const tenancies = await prisma.officeTenancy.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        domains: true,
      },
    });

    // Sanitize response - never expose clientSecret
    const sanitizedTenancies = tenancies.map((tenancy: typeof tenancies[0]) => ({
      ...tenancy,
      clientSecret: undefined,
    }));

    return NextResponse.json({ tenancies: sanitizedTenancies });
  } catch (error) {
    console.error('Tenancies fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenancies' },
      { status: 500 }
    );
  }
}

// POST - Create new tenancy
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authenticated || !authResult.session) {
      return authResult.response!;
    }
    const admin = authResult.session;

    const body = await request.json();
    const {
      name,
      tenantId,
      clientId,
      clientSecret,
      enabled = true,
      enablePresence = true,
      enablePhotos = true,
      enableOutOfOffice = true,
      enableLocalGroups = false,
      enableGlobalGroups = false,
    } = body;

    // Validation
    if (!name || !tenantId || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Missing required fields: name, tenantId, clientId, clientSecret' },
        { status: 400 }
      );
    }

    // Validate tenantId format (basic UUID check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenantId format (must be a UUID)' },
        { status: 400 }
      );
    }

    if (!uuidRegex.test(clientId)) {
      return NextResponse.json(
        { error: 'Invalid clientId format (must be a UUID)' },
        { status: 400 }
      );
    }

    // Check if tenancy with this tenantId already exists
    const existingTenancy = await prisma.officeTenancy.findUnique({
      where: { tenantId },
    });

    if (existingTenancy) {
      return NextResponse.json(
        { error: 'Tenancy with this Tenant ID already exists' },
        { status: 409 }
      );
    }

    // Create new tenancy
    // Note: In production, clientSecret should be encrypted before storage
    // For now, storing as-is per task requirements
    const newTenancy = await prisma.officeTenancy.create({
      data: {
        id: randomUUID(),
        name,
        tenantId,
        clientId,
        clientSecret,
        enabled,
        enablePresence,
        enablePhotos,
        enableOutOfOffice,
        enableLocalGroups,
        enableGlobalGroups,
        createdBy: admin.email,
      },
    });

    await createAuditLog({
      action: 'CREATE_TENANCY',
      adminEmail: admin.email,
      metadata: {
        tenancyId: newTenancy.id,
        name: newTenancy.name,
        tenantId: newTenancy.tenantId,
      },
    });

    // Return sanitized response
    return NextResponse.json(
      {
        tenancy: {
          ...newTenancy,
          clientSecret: undefined,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Tenancy creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create tenancy' },
      { status: 500 }
    );
  }
}
