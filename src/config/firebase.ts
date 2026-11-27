import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// PUBG Mobile GunLab Firebase Configuration from google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyDOQA_MCb9BosDsSyj17oFev4bOY4tnO3I",
  authDomain: "pubgmgunlab.firebaseapp.com",
  projectId: "pubgmgunlab",
  storageBucket: "pubgmgunlab.firebasestorage.app",
  messagingSenderId: "407813192244",
  appId: "1:407813192244:android:f4184715ad320cccad2861"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
