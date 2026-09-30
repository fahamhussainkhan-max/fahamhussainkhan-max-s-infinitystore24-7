import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: (import.meta.env?.VITE_FIREBASE_API_KEY as string)?.trim() || "AIzaSyDdcQK_lBTMN9hfhkjmvJyw-3fy6-q_wCo",
  authDomain: (import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN as string)?.trim() || "infinity-store-otp.firebaseapp.com",
  projectId: (import.meta.env?.VITE_FIREBASE_PROJECT_ID as string)?.trim() || "infinity-store-otp",
  storageBucket: (import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET as string)?.trim() || "infinity-store-otp.firebasestorage.app",
  messagingSenderId: (import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string)?.trim() || "142972553473",
  appId: (import.meta.env?.VITE_FIREBASE_APP_ID as string)?.trim() || "1:142972553473:web:1da2403ecc084b6c92e900",
  measurementId: (import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID as string)?.trim() || "G-6L9LP9KP0M"
};

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export { RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
