import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const cwd = process.cwd();
  const candidates = [
    '.next/server/app/api/ping/route.js',
    '.next/server/app/api/admin/check/route.js',
    '.next/server/src/app/api/ping/route.js',
    '.next/server/src/app/api/admin/check/route.js',
  ];
  const results = candidates.map(p => ({ path: p, exists: fs.existsSync(path.join(cwd, p)) }));
  return NextResponse.json({ cwd, compiled: results });
}
