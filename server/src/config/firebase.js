const admin = require('firebase-admin');

let firebaseApp = null;

const getFirebaseAdmin = () => {
  if (firebaseApp) return firebaseApp;

  // Check if service account JSON is available via env
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin initialized with service account');
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', err.message);
    }
  } else if (process.env.FIREBASE_PROJECT_ID) {
    // Minimal init — can verify tokens if project ID matches
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
    console.log('Firebase Admin initialized with individual env vars');
  } else {
    console.warn('WARNING: No Firebase Admin credentials found. Social login token verification disabled.');
    return null;
  }

  return firebaseApp;
};

const verifyFirebaseToken = async (idToken) => {
  const app = getFirebaseAdmin();
  if (!app) {
    // If Firebase Admin not configured, skip verification (dev mode)
    console.warn('Firebase Admin not configured — skipping token verification (dev mode)');
    return null;
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (err) {
    throw new Error('Invalid Firebase token: ' + err.message);
  }
};

module.exports = { verifyFirebaseToken, getFirebaseAdmin };
