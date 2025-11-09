import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin/middleware';
import { createAuditLog } from '@/lib/admin/audit';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET single domain
export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await verifyAdminAuth(request);

  if (!authResult.authenticated || !authResult.session) {
    return (
      authResult.response ??
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
  }

  try {
    const { id } = await context.params;

    const domain = await prisma.smtpDomain.findUnique({
      where: { id },
      include: {
        tenancy: {
          select: {
            id: true,
            name: true,
            tenantId: true,
            enabled: true,
          },
        },
      },
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    return NextResponse.json({ domain });
  } catch (error) {
    console.error('Domain fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domain' },
      { status: 500 }
    );
  }
}

// PUT - Update domain
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
    const { domain, tenancyId, priority } = body;

    // Find existing domain
    const existingDomain = await prisma.smtpDomain.findUnique({
      where: { id },
    });

    if (!existingDomain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};

    // Validate and update domain if provided
    if (domain !== undefined && domain !== existingDomain.domain) {
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        return NextResponse.json(
          { error: 'Invalid domain format (e.g., example.com)' },
          { status: 400 }
        );
      }

      if (domain.includes('@')) {
        return NextResponse.json(
          { error: 'Domain should not include @ symbol' },
          { status: 400 }
        );
      }

      // Check if new domain already exists
      const domainExists = await prisma.smtpDomain.findUnique({
        where: { domain: domain.toLowerCase() },
      });

      if (domainExists && domainExists.id !== id) {
        return NextResponse.json(
          { error: 'Domain already exists' },
          { status: 409 }
        );
      }

      updateData.domain = domain.toLowerCase();
    }

    // Validate and update tenancyId if provided
    if (tenancyId !== undefined && tenancyId !== existingDomain.tenancyId) {
      const tenancy = await prisma.officeTenancy.findUnique({
        where: { id: tenancyId },
      });

      if (!tenancy) {
        return NextResponse.json(
          { error: 'Tenancy not found' },
          { status: 404 }
        );
      }

      updateData.tenancyId = tenancyId;
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    // Update domain
    const updatedDomain = await prisma.smtpDomain.update({
      where: { id },
      data: updateData,
      include: {
        tenancy: {
          select: {
            id: true,
            name: true,
            tenantId: true,
            enabled: true,
          },
        },
      },
    });

    await createAuditLog({
      action: 'UPDATE_DOMAIN',
      adminEmail: session.email,
      metadata: {
        domainId: updatedDomain.id,
        domain: updatedDomain.domain,
        tenancyId: updatedDomain.tenancyId,
        changes: Object.keys(updateData),
      },
    });

    return NextResponse.json({ domain: updatedDomain });
  } catch (error) {
    console.error('Domain update error:', error);
    return NextResponse.json(
      { error: 'Failed to update domain' },
      { status: 500 }
    );
  }
}

// DELETE domain
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

    // Find the domain to delete
    const domain = await prisma.smtpDomain.findUnique({
      where: { id },
      include: {
        tenancy: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Delete the domain
    await prisma.smtpDomain.delete({
      where: { id },
    });

    await createAuditLog({
      action: 'DELETE_DOMAIN',
      adminEmail: session.email,
      metadata: {
        domainId: domain.id,
        domain: domain.domain,
        tenancyId: domain.tenancyId,
        tenancyName: domain.tenancy.name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Domain deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
}
