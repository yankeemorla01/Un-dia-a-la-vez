import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL('https://login.microsoftonline.com/common/discovery/v2.0/keys')
);

export async function getUserId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      algorithms: ['RS256'],
    });

    // Verify issuer matches Microsoft pattern
    if (!payload.iss || !payload.iss.match(/^https:\/\/login\.microsoftonline\.com\/.+\/v2\.0$/)) {
      console.error('Token issuer mismatch:', payload.iss);
      return null;
    }

    // Use oid (object ID) as unique user identifier
    return payload.oid || payload.sub || null;
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return null;
  }
}
