// Google Sign-In using Google Identity Services (GSI)
// Uses google.accounts.id.renderButton — most reliable, no popup blocking

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const isGoogleConfigured =
  !!CLIENT_ID &&
  CLIENT_ID !== 'your_google_client_id_here' &&
  CLIENT_ID.includes('.apps.googleusercontent.com');

// Decode JWT payload (client-side only, not for security)
const decodeJWT = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
};

/**
 * Initialize Google Sign-In and render the Google button into `element`.
 * Calls `onCredential({ credential, email, name, picture })` when user signs in.
 * Polls until window.google is available (script is async).
 */
export const initAndRenderGoogleButton = (element, onCredential) => {
  if (!isGoogleConfigured || !element) return;

  let attempts = 0;
  const MAX = 30; // poll up to 30×300ms = 9 seconds

  const tryInit = () => {
    attempts++;
    if (!window.google?.accounts?.id) {
      if (attempts < MAX) {
        setTimeout(tryInit, 300);
      } else {
        console.error('❌ Google Identity Services script failed to load after 9 seconds.');
      }
      return;
    }

    console.log('🏁 Initializing Google accounts ID with Client ID:', CLIENT_ID);
    try {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          console.log('✅ Google sign-in credential received');
          const payload = decodeJWT(response.credential);
          if (payload?.email) {
            onCredential({
              credential: response.credential,
              email: payload.email,
              name: payload.name || payload.email.split('@')[0],
              picture: payload.picture || null,
              email_verified: payload.email_verified,
            });
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Google button width must be between 200px and 400px
      const rawWidth = element.clientWidth || element.offsetWidth || 320;
      const width = Math.min(Math.max(rawWidth, 200), 400);
      console.log('🎨 Rendering Google button inside element with width:', width);

      window.google.accounts.id.renderButton(element, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: width,
      });
      console.log('🎉 Google button rendered successfully');
    } catch (err) {
      console.error('❌ Error during Google GSI initialization:', err);
    }
  };


  // Wait 400ms for DOM layout to settle, then start polling for GSI script
  setTimeout(tryInit, 400);
};

export const firebaseSignOut = async () => {};
