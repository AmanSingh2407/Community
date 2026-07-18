// Google Token Verifier
// Verifies Google tokens (supports both ID Tokens and Access Tokens)

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

/**
 * Verifies a Google token (JWT ID Token or raw Access Token).
 * If it's a JWT, uses Google's tokeninfo.
 * If it's an Access Token, uses Google's userinfo endpoint.
 */
const verifyFirebaseToken = async (token) => {
  if (!token) return null;

  try {
    // Check if token looks like a JWT ID Token (starts with eyJ)
    if (token.startsWith('eyJ')) {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
      );

      if (!response.ok) {
        throw new Error('Google tokeninfo verification failed');
      }

      const payload = await response.json();
      if (payload.error) {
        throw new Error(`Invalid Google token: ${payload.error_description || payload.error}`);
      }

      if (GOOGLE_CLIENT_ID && payload.aud !== GOOGLE_CLIENT_ID) {
        throw new Error('Google token was not issued for this application');
      }

      return {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        sub: payload.sub,
        email_verified: true
      };
    } else {
      // Treat as Access Token — fetch profile from userinfo API
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Google userinfo verification failed');
      }

      const payload = await response.json();
      return {
        email: payload.email,
        name: payload.name || payload.given_name,
        picture: payload.picture,
        sub: payload.sub,
        email_verified: true
      };
    }
  } catch (err) {
    console.warn('Google token verification warning:', err.message);
    return null;
  }
};

module.exports = { verifyFirebaseToken };
