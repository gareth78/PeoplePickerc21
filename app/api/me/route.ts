import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    console.log('=== /api/me Debug ===');
    
    // Log ALL headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (key.startsWith('x-ms-')) {
        headers[key] = value;
        console.log(`Header: ${key} = ${value.substring(0, 100)}...`);
      }
    });

    // Try different Easy Auth headers
    const principalHeader = request.headers.get('x-ms-client-principal');
    const principalIdHeader = request.headers.get('x-ms-client-principal-id');
    const principalNameHeader = request.headers.get('x-ms-client-principal-name');
    const principalIdpHeader = request.headers.get('x-ms-client-principal-idp');

    console.log('Principal header exists:', !!principalHeader);
    console.log('Principal ID header:', principalIdHeader);
    console.log('Principal name header:', principalNameHeader);
    console.log('Principal IDP header:', principalIdpHeader);

    if (!principalHeader) {
      // Try the /.auth/me endpoint as fallback
      console.log('No x-ms-client-principal header, trying /.auth/me');
      
      const authMeUrl = new URL('/.auth/me', request.url);
      const authMeResponse = await fetch(authMeUrl.toString(), {
        headers: {
          'Cookie': request.headers.get('cookie') || ''
        }
      });
      
      const authMeData = await authMeResponse.json();
      console.log('/.auth/me response:', JSON.stringify(authMeData, null, 2));
      
      if (authMeData.length > 0) {
        const principal = authMeData[0];
        return NextResponse.json({
          authenticated: true,
          email: principal.user_id,
          name: principal.user_claims?.find((c: any) => c.typ === 'name')?.val,
          provider: principal.provider_name,
          rawData: principal
        });
      }

      return NextResponse.json({ 
        authenticated: false,
        debug: 'No auth headers or /.auth/me data'
      }, { status: 401 });
    }

    // Decode the principal header
    const principalJson = Buffer.from(principalHeader, 'base64').toString('utf-8');
    const principal = JSON.parse(principalJson);
    
    console.log('Decoded principal:', JSON.stringify(principal, null, 2));

    // Extract user info from various possible fields
    const userEmail = principal.userDetails 
      || principal.userId 
      || principal.claims?.find((c: any) => c.typ?.includes('emailaddress'))?.val
      || principalNameHeader;
    
    const userName = principal.userClaims?.find((c: any) => c.typ === 'name')?.val 
      || principal.claims?.find((c: any) => c.typ?.includes('name'))?.val
      || userEmail;

    console.log('Extracted - Email:', userEmail, 'Name:', userName);

    return NextResponse.json({
      authenticated: true,
      email: userEmail,
      name: userName,
      provider: principal.identityProvider || principalIdpHeader,
      debug: {
        hasHeader: !!principalHeader,
        principalKeys: Object.keys(principal),
        allHeaders: headers
      }
    });
  } catch (error) {
    console.error('Failed to get user info:', error);
    return NextResponse.json({ 
      authenticated: false,
      error: String(error)
    }, { status: 500 });
  }
}
