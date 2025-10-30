import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get auth info from Easy Auth
    const authHeader = request.headers.get('x-ms-client-principal');

    if (!authHeader) {
      return NextResponse.json({
        authenticated: false
      }, { status: 401 });
    }

    // Decode the Easy Auth header
    const principal = JSON.parse(
      Buffer.from(authHeader, 'base64').toString('utf-8')
    );

    const userEmail = principal.userDetails || principal.userId;
    const userName = principal.userClaims?.find((c: any) => c.typ === 'name')?.val || userEmail;

    return NextResponse.json({
      authenticated: true,
      email: userEmail,
      name: userName,
      provider: principal.identityProvider
    });
  } catch (error) {
    console.error('Failed to get user info:', error);
    return NextResponse.json({
      authenticated: false
    }, { status: 500 });
  }
}
