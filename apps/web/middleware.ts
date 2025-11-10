import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost:3000',
  'https://localhost:5173',
] as const;

const parseOrigins = (raw: string | null | undefined): string[] => {
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = new Set<string>([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...parseOrigins(process.env.ALLOWED_ORIGINS ?? process.env['allowed-origins']),
]);

const ACCESS_CONTROL_REQUEST_HEADERS = 'Content-Type, Authorization, X-Requested-With';
const ACCESS_CONTROL_REQUEST_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');

  if (!origin || !origin.startsWith('http')) {
    return NextResponse.next();
  }

  if (!allowedOrigins.has(origin)) {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 403,
        headers: {
          Vary: 'Origin',
        },
      });
    }

    return NextResponse.json(
      { error: 'Origin not allowed' },
      {
        status: 403,
        headers: {
          Vary: 'Origin',
        },
      },
    );
  }

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': ACCESS_CONTROL_REQUEST_HEADERS,
        'Access-Control-Allow-Methods': ACCESS_CONTROL_REQUEST_METHODS,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Headers', ACCESS_CONTROL_REQUEST_HEADERS);
  response.headers.set('Access-Control-Allow-Methods', ACCESS_CONTROL_REQUEST_METHODS);
  response.headers.set('Vary', 'Origin');

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
