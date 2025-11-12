import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin/middleware';
import { createAuditLog } from '@/lib/admin/audit';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET single tenancy
export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await verifyAdminAuth(request);

  if (!authResult.authenticated || !authResult.session) {
    return (
      authResult.response ??
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
  }

  const session = authResult.session;

  try {
    const { id } = await context.params;

    const tenancy = await prisma.officeTenancy.findUnique({
      where: { id },
      include: {
        domains: true,
      },
    });

    if (!tenancy) {
      return NextResponse.json({ error: 'Tenancy not found' }, { status: 404 });
    }

    // Sanitize response
    return NextResponse.json({
      tenancy: {
        ...tenancy,
        clientSecret: undefined,
      },
    });
  } catch (error) {
    console.error('Tenancy fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenancy' },
      { status: 500 }
    );
  }
}

// PUT - Update tenancy
export async function PUT(request: NextRequest, context: RouteContext) {
  const authResult = await verifyAdminAuth(request);

  if (!authResult.authenticated || !authResult.session) {
    return (
      authResult.response ??
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
  }

  const session = authResult.session;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const {
      name,
      enabled,
      enablePresence,
      enablePhotos,
      enableOutOfOffice,
      enableLocalGroups,
      enableGlobalGroups,
      enableGroupSendCheck,
      clientSecret, // Allow updating client secret
    } = body;

    // Find existing tenancy
    const existingTenancy = await prisma.officeTenancy.findUnique({
      where: { id },
    });

    if (!existingTenancy) {
      return NextResponse.json({ error: 'Tenancy not found' }, { status: 404 });
    }

    // Build update data - only include fields that are provided
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (enablePresence !== undefined) updateData.enablePresence = enablePresence;
    if (enablePhotos !== undefined) updateData.enablePhotos = enablePhotos;
    if (enableOutOfOffice !== undefined) updateData.enableOutOfOffice = enableOutOfOffice;
    if (enableLocalGroups !== undefined) updateData.enableLocalGroups = enableLocalGroups;
    if (enableGlobalGroups !== undefined) updateData.enableGlobalGroups = enableGlobalGroups;
    if (enableGroupSendCheck !== undefined) updateData.enableGroupSendCheck = enableGroupSendCheck;

    // Only update clientSecret if a new one is provided and it's not masked
    if (clientSecret && !clientSecret.includes('••••')) {
      updateData.clientSecret = clientSecret;
    }

    // Update tenancy
    const updatedTenancy = await prisma.officeTenancy.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      action: 'UPDATE_TENANCY',
      adminEmail: session.email,
      metadata: {
        tenancyId: updatedTenancy.id,
        name: updatedTenancy.name,
        changes: Object.keys(updateData),
      },
    });

    // Return sanitized response
    return NextResponse.json({
      tenancy: {
        ...updatedTenancy,
        clientSecret: undefined,
      },
    });
  } catch (error) {
    console.error('Tenancy update error:', error);
    return NextResponse.json(
      { error: 'Failed to update tenancy' },
      { status: 500 }
    );
  }
}

// DELETE tenancy
export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await verifyAdminAuth(request);

  if (!authResult.authenticated || !authResult.session) {
    return (
      authResult.response ??
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
  }

  const session = authResult.session;

  try {
    const { id } = await context.params;

    // Find the tenancy to delete
    const tenancy = await prisma.officeTenancy.findUnique({
      where: { id },
      include: {
        domains: true,
      },
    });

    if (!tenancy) {
      return NextResponse.json({ error: 'Tenancy not found' }, { status: 404 });
    }

    // Delete the tenancy (will cascade delete domains)
    await prisma.officeTenancy.delete({
      where: { id },
    });

    await createAuditLog({
      action: 'DELETE_TENANCY',
      adminEmail: session.email,
      metadata: {
        tenancyId: tenancy.id,
        name: tenancy.name,
        tenantId: tenancy.tenantId,
        domainsDeleted: tenancy.domains.length,
      },
    });

    return NextResponse.json({
      success: true,
      domainsDeleted: tenancy.domains.length,
    });
  } catch (error) {
    console.error('Tenancy deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete tenancy' },
      { status: 500 }
    );
  }
}
