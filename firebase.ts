import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDviqojIgxay_08BoxpG-kIRXzPa8IcxQo",
  authDomain: "zlenext.firebaseapp.com",
  projectId: "zlenext",
  storageBucket: "zlenext.firebasestorage.app",
  messagingSenderId: "73313501676",
  appId: "1:73313501676:web:a5cf0d50e36707933c40c9",
  measurementId: "G-P47VK9YCYG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;