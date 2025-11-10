import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { verifyAdminAuth } from '@/lib/admin/middleware';
import { createAuditLog } from '@/lib/admin/audit';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET all SMTP domains with tenant info
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authenticated || !authResult.session) {
      return authResult.response!;
    }
    const admin = authResult.session;

    await createAuditLog({
      action: 'VIEW_DOMAINS',
      adminEmail: admin.email,
    });

    const domains = await prisma.smtpDomain.findMany({
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json({ domains });
  } catch (error) {
    console.error('Domains fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

// POST - Create new domain
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authenticated || !authResult.session) {
      return authResult.response!;
    }
    const admin = authResult.session;

    const body = await request.json();
    const { domain, tenancyId, priority = 0 } = body;

    // Validation
    if (!domain || !tenancyId) {
      return NextResponse.json(
        { error: 'Missing required fields: domain, tenancyId' },
        { status: 400 }
      );
    }

    // Validate domain format (basic validation)
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format (e.g., example.com)' },
        { status: 400 }
      );
    }

    // Domain should not contain @ symbol
    if (domain.includes('@')) {
      return NextResponse.json(
        { error: 'Domain should not include @ symbol (e.g., use "example.com" not "@example.com")' },
        { status: 400 }
      );
    }

    // Check if domain already exists
    const existingDomain = await prisma.smtpDomain.findUnique({
      where: { domain: domain.toLowerCase() },
    });

    if (existingDomain) {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 409 }
      );
    }

    // Verify tenancy exists
    const tenancy = await prisma.officeTenancy.findUnique({
      where: { id: tenancyId },
    });

    if (!tenancy) {
      return NextResponse.json(
        { error: 'Tenancy not found' },
        { status: 404 }
      );
    }

    // Create new domain
    const newDomain = await prisma.smtpDomain.create({
      data: {
        id: randomUUID(),
        domain: domain.toLowerCase(),
        tenancyId,
        priority,
      },
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
      action: 'CREATE_DOMAIN',
      adminEmail: admin.email,
      metadata: {
        domainId: newDomain.id,
        domain: newDomain.domain,
        tenancyId: newDomain.tenancyId,
        tenancyName: tenancy.name,
      },
    });

    return NextResponse.json({ domain: newDomain }, { status: 201 });
  } catch (error) {
    console.error('Domain creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create domain' },
      { status: 500 }
    );
  }
}
