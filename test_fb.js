const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyDOQA_MCb9BosDsSyj17oFev4bOY4tnO3I",
  authDomain: "pubgmgunlab.firebaseapp.com",
  projectId: "pubgmgunlab",
  storageBucket: "pubgmgunlab.firebasestorage.app",
  messagingSenderId: "407813192244",
  appId: "1:407813192244:android:f4184715ad320cccad2861"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testConnection() {
  console.log("Testing Firebase Auth & Firestore on pubgmgunlab...");
  try {
    const authRes = await signInAnonymously(auth);
    console.log("Firebase Auth success, uid:", authRes.user.uid);
  } catch (e) {
    console.error("Firebase Auth error:", e.code, e.message);
  }

  try {
    const testDoc = doc(db, 'operators', 'test_ping');
    await setDoc(testDoc, { ping: true, time: new Date().toISOString() });
    console.log("Firestore write SUCCESS!");
    const snap = await getDocs(collection(db, 'operators'));
    console.log("Firestore read SUCCESS, total docs:", snap.size);
  } catch (e) {
    console.error("Firestore error:", e.code, e.message);
  }
}

testConnection().then(() => process.exit(0)).catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
