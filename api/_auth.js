import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: 'https://login.microsoftonline.com/common/discovery/v2.0/keys',
  cache: true,
  cacheMaxAge: 86400000,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

export async function getUserId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  return new Promise((resolve) => {
    jwt.verify(token, getKey, {
      algorithms: ['RS256'],
      issuer: /https:\/\/login\.microsoftonline\.com\/.+\/v2\.0/,
    }, (err, decoded) => {
      if (err) {
        console.error('Token verification failed:', err.message);
        return resolve(null);
      }
      // Use oid (object ID) as unique user identifier
      resolve(decoded.oid || decoded.sub || null);
    });
  });
}
