import dotenv from "dotenv";
dotenv.config();

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  clientId: process.env.FIREBASE_CLIENT_ID,
};

// Check if Firebase credentials are valid (not placeholder values)
const isValidCredentials =
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes("your-project-id") &&
  firebaseConfig.privateKey &&
  !firebaseConfig.privateKey.includes("YOUR_PRIVATE_KEY") &&
  firebaseConfig.clientEmail &&
  !firebaseConfig.clientEmail.includes("xxxxx");

let firebaseApp;
let messaging;

try {
  if (isValidCredentials && getApps().length === 0) {
    firebaseApp = initializeApp({
      credential: cert(firebaseConfig),
    });
    messaging = getMessaging(firebaseApp);
    console.log("✓ Firebase initialized successfully");
  } else if (isValidCredentials && getApps().length > 0) {
    firebaseApp = getApps()[0];
    messaging = getMessaging(firebaseApp);
  } else {
    console.warn("⚠ Firebase credentials are not configured. Push notifications will be disabled.");
  }
} catch (error) {
  console.error("✗ Firebase initialization error:", error.message);
  console.warn("⚠ Push notifications will be disabled.");
}

export { firebaseApp, messaging }; 