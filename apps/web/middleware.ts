import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DEFAULT_ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'https://addin.example.org'
]);

function parseAllowedOrigins(): Set<string> {
  const origins = new Set(DEFAULT_ALLOWED_ORIGINS);
  const fromEnv = process.env.ALLOWED_ORIGINS;
  if (!fromEnv) {
    return origins;
  }
  for (const origin of fromEnv.split(',').map((value) => value.trim()).filter(Boolean)) {
    origins.add(origin);
  }
  return origins;
}

function applyCorsHeaders(response: NextResponse, origin: string): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (!response.headers.has('Access-Control-Allow-Headers')) {
    response.headers.set('Access-Control-Allow-Headers', 'Authorization,Content-Type,Accept,X-Requested-With');
  }
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

const allowedOrigins = parseAllowedOrigins();

export function middleware(request: NextRequest) {
  const { nextUrl, method, headers } = request;
  const isApiRoute = nextUrl.pathname.startsWith('/api/');

  if (!isApiRoute) {
    return NextResponse.next();
  }

  const origin = headers.get('origin');

  if (!origin) {
    return NextResponse.next();
  }

  if (!allowedOrigins.has(origin)) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      {
        status: 403
      }
    );
  }

  if (method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    const allowedHeaders = headers.get('access-control-request-headers');
    if (allowedHeaders) {
      response.headers.set('Access-Control-Allow-Headers', allowedHeaders);
    }
    return applyCorsHeaders(response, origin);
  }

  const response = NextResponse.next();
  return applyCorsHeaders(response, origin);
}

export const config = {
  matcher: ['/api/:path*']
};
