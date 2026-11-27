import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';

export type GenderType = 'Male' | 'Female' | 'Prefer not to say';

export interface UserProfile {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: GenderType;
  inGameName: string;
  signedInAt: string;
  role?: 'admin' | 'operator';
  status?: 'active' | 'suspended';
  authUid?: string;
}

const USER_STORAGE_KEY = '@pubg_armory_user_profile';
const FIRESTORE_USERS_COLLECTION = 'operators';

export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return false;
    const emailQuery = query(
      collection(db, FIRESTORE_USERS_COLLECTION),
      where('email', '==', cleanEmail)
    );
    const snap = await getDocs(emailQuery);
    return !snap.empty;
  } catch {
    return false;
  }
}

export async function checkIgnExists(ign: string): Promise<boolean> {
  try {
    const cleanIGN = ign.trim().toLowerCase();
    if (!cleanIGN) return false;
    const ignQuery = query(
      collection(db, FIRESTORE_USERS_COLLECTION),
      where('inGameNameLower', '==', cleanIGN)
    );
    const snap = await getDocs(ignQuery);
    return !snap.empty;
  } catch {
    return false;
  }
}

export const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'admin@gunlab.com',
  inGameName: 'admin',
  password: 'admin123',
  firstName: 'System',
  lastName: 'Admin',
};

/**
 * Fetch cached user profile from local device storage
 */
export async function getStoredUserProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch (err) {
    console.error('Error fetching stored profile:', err);
    return null;
  }
}

/**
 * Register a new Operator account with Firebase Authentication & Firestore
 */
export async function registerOperator(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: GenderType;
  inGameName: string;
}): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanFirstName = params.firstName.trim();
    const cleanLastName = params.lastName.trim();
    const cleanIGN = params.inGameName.trim();
    const docId = cleanIGN.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!/^[A-Za-z\s]{2,}$/.test(cleanFirstName) || !/^[A-Za-z\s]{2,}$/.test(cleanLastName)) {
      return {
        success: false,
        error: 'First and Last Name must be at least 2 characters and contain letters only (no numbers or special characters).',
      };
    }

    if (
      cleanIGN.toLowerCase() === DEFAULT_ADMIN_CREDENTIALS.inGameName.toLowerCase() ||
      cleanEmail === DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase()
    ) {
      return { success: false, error: 'This In-Game Name or Email is reserved for system administration.' };
    }

    // 1. Check if Email or IGN is already taken in Firestore
    try {
      const emailQuery = query(
        collection(db, FIRESTORE_USERS_COLLECTION),
        where('email', '==', cleanEmail)
      );
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        return { success: false, error: 'This email address is already registered.' };
      }

      const q = query(
        collection(db, FIRESTORE_USERS_COLLECTION),
        where('inGameNameLower', '==', cleanIGN.toLowerCase())
      );
      const ignSnap = await getDocs(q);
      if (!ignSnap.empty) {
        return { success: false, error: 'In-Game Name (IGN) is already taken by another operator.' };
      }
    } catch (e) {
      // If offline or permission check, continue
    }

    // 2. Create user in Firebase Authentication
    let authUid = '';
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, params.password);
      authUid = userCredential.user.uid;
    } catch (authErr: any) {
      let msg = authErr?.message || 'Authentication error';
      if (authErr?.code === 'auth/email-already-in-use') {
        msg = 'This email address is already in use by another account.';
      } else if (authErr?.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (authErr?.code === 'auth/invalid-email') {
        msg = 'The email address is invalid.';
      }
      return { success: false, error: msg };
    }

    // 3. Construct Operator Profile
    const profile: UserProfile = {
      id: docId,
      email: cleanEmail,
      firstName: params.firstName.trim(),
      lastName: params.lastName.trim(),
      age: params.age,
      gender: params.gender,
      inGameName: cleanIGN,
      role: 'operator',
      status: 'active',
      signedInAt: new Date().toISOString(),
      authUid,
    };

    // 4. Save to Firestore operators collection
    try {
      const userDocRef = doc(db, FIRESTORE_USERS_COLLECTION, docId);
      await setDoc(userDocRef, {
        ...profile,
        inGameNameLower: cleanIGN.toLowerCase(),
      });
    } catch (dbErr: any) {
      console.warn('Firestore write warning:', dbErr);
    }

    // 5. Sign out from Firebase Auth so the user must explicitly log in
    try {
      await signOut(auth);
    } catch (e) {
      // Ignore signOut errors if offline
    }

    return { success: true, profile };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Registration failed' };
  }
}

/**
 * Log in Operator with either Email OR In-Game Name and Password
 */
export async function loginOperator(params: {
  identifier: string; // Email OR In-Game Name
  password: string;
}): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    const rawId = params.identifier.trim();
    const isDefaultAdminIdentifier =
      rawId.toLowerCase() === DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase() ||
      rawId.toLowerCase() === DEFAULT_ADMIN_CREDENTIALS.inGameName.toLowerCase();
    let targetEmail = isDefaultAdminIdentifier
      ? DEFAULT_ADMIN_CREDENTIALS.email
      : rawId.toLowerCase();

    // If identifier is not an email (no '@') and not the default admin, look up email from Firestore by inGameName
    if (!rawId.includes('@') && !isDefaultAdminIdentifier) {
      try {
        const q = query(
          collection(db, FIRESTORE_USERS_COLLECTION),
          where('inGameNameLower', '==', rawId.toLowerCase())
        );
        const querySnap = await getDocs(q);

        if (querySnap.empty) {
          // Also try direct document ID lookup
          const docRef = doc(db, FIRESTORE_USERS_COLLECTION, rawId.toLowerCase().replace(/[^a-z0-9_-]/g, '_'));
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            return { success: false, error: 'No operator found with that In-Game Name (IGN).' };
          }
          targetEmail = docSnap.data().email;
        } else {
          targetEmail = querySnap.docs[0].data().email;
        }
      } catch (e: any) {
        return { success: false, error: 'Could not resolve In-Game Name. Please log in using your Email.' };
      }
    }

    // Sign in with Firebase Authentication (auto-provision default admin on first login)
    let authUid = '';
    try {
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, params.password);
      authUid = userCredential.user.uid;
    } catch (authErr: any) {
      const canProvisionDefaultAdmin =
        isDefaultAdminIdentifier &&
        params.password === DEFAULT_ADMIN_CREDENTIALS.password &&
        (authErr?.code === 'auth/user-not-found' || authErr?.code === 'auth/invalid-credential');

      if (canProvisionDefaultAdmin) {
        try {
          const created = await createUserWithEmailAndPassword(
            auth,
            DEFAULT_ADMIN_CREDENTIALS.email,
            DEFAULT_ADMIN_CREDENTIALS.password
          );
          authUid = created.user.uid;

          const adminProfile: UserProfile = {
            id: 'admin',
            email: DEFAULT_ADMIN_CREDENTIALS.email,
            firstName: DEFAULT_ADMIN_CREDENTIALS.firstName,
            lastName: DEFAULT_ADMIN_CREDENTIALS.lastName,
            age: 25,
            gender: 'Prefer not to say',
            inGameName: DEFAULT_ADMIN_CREDENTIALS.inGameName,
            role: 'admin',
            status: 'active',
            signedInAt: new Date().toISOString(),
            authUid,
          };

          try {
            await setDoc(doc(db, FIRESTORE_USERS_COLLECTION, 'admin'), {
              ...adminProfile,
              inGameNameLower: DEFAULT_ADMIN_CREDENTIALS.inGameName.toLowerCase(),
            });
          } catch (dbErr) {
            console.warn('Could not save default admin profile to Firestore:', dbErr);
          }

          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminProfile));
          return { success: true, profile: adminProfile };
        } catch (provisionErr: any) {
          return { success: false, error: provisionErr?.message || 'Failed to initialize default admin account.' };
        }
      }

      let msg = 'Invalid credentials. Please verify your email/IGN and password.';
      if (authErr?.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (authErr?.code === 'auth/user-not-found') {
        msg = 'No account found with that email or In-Game Name.';
      } else if (authErr?.code === 'auth/wrong-password' || authErr?.code === 'auth/invalid-credential') {
        msg = 'Incorrect email/IGN or password. Please try again.';
      } else if (authErr?.code === 'auth/user-disabled') {
        msg = 'This account has been disabled.';
      } else if (authErr?.code === 'auth/too-many-requests') {
        msg = 'Access temporarily locked due to many failed attempts. Try again later.';
      } else if (authErr?.code === 'auth/network-request-failed') {
        msg = 'Network error. Please check your internet connection.';
      }
      return { success: false, error: msg };
    }

    // Fetch full operator profile from Firestore
    let loadedProfile: UserProfile | null = null;
    try {
      const q = query(
        collection(db, FIRESTORE_USERS_COLLECTION),
        where('email', '==', targetEmail)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        loadedProfile = { ...snap.docs[0].data(), id: snap.docs[0].id } as UserProfile;
      }
    } catch (e) {
      console.warn('Could not read Firestore profile after login:', e);
    }

    // Fallback profile if Firestore read failed
    if (!loadedProfile) {
      loadedProfile = {
        email: targetEmail,
        firstName: isDefaultAdminIdentifier ? DEFAULT_ADMIN_CREDENTIALS.firstName : 'Operator',
        lastName: isDefaultAdminIdentifier ? DEFAULT_ADMIN_CREDENTIALS.lastName : '',
        age: 20,
        gender: 'Prefer not to say',
        inGameName: isDefaultAdminIdentifier
          ? DEFAULT_ADMIN_CREDENTIALS.inGameName
          : rawId.includes('@')
            ? targetEmail.split('@')[0]
            : rawId,
        signedInAt: new Date().toISOString(),
        authUid,
        role: isDefaultAdminIdentifier ? 'admin' : 'operator',
        status: 'active',
      };
    }

    if (loadedProfile.status === 'suspended') {
      await signOut(auth);
      return { success: false, error: 'This operator account has been suspended by an Administrator.' };
    }

    // Save active session locally
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loadedProfile));

    return { success: true, profile: loadedProfile };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Login failed' };
  }
}

/**
 * Send password reset email to user
 */
export async function sendOperatorPasswordReset(identifier: string): Promise<{ success: boolean; error?: string }> {
  try {
    const rawId = identifier.trim();
    let targetEmail = rawId.toLowerCase();

    // If identifier is an IGN without '@', resolve email from Firestore
    if (!rawId.includes('@')) {
      const q = query(
        collection(db, FIRESTORE_USERS_COLLECTION),
        where('inGameNameLower', '==', rawId.toLowerCase())
      );
      const querySnap = await getDocs(q);
      if (querySnap.empty) {
        return { success: false, error: 'No operator found with that In-Game Name.' };
      }
      targetEmail = querySnap.docs[0].data().email;
    }

    await sendPasswordResetEmail(auth, targetEmail);
    return { success: true };
  } catch (err: any) {
    let msg = err?.message || 'Failed to send reset email';
    if (err?.code === 'auth/user-not-found') {
      msg = 'No user account found with that email.';
    } else if (err?.code === 'auth/invalid-email') {
      msg = 'Please enter a valid email address.';
    }
    return { success: false, error: msg };
  }
}

/**
 * Clear local session & sign out from Firebase Auth
 */
export async function clearUserProfile(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    try {
      await signOut(auth);
    } catch (e) {
      // Ignore if offline
    }
    return true;
  } catch (err) {
    console.error('Error clearing profile:', err);
    return false;
  }
}

/* ==================================================================== */
/* Admin Management Database Operations (Firestore)                     */
/* ==================================================================== */

export async function fetchAllOperators(): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, FIRESTORE_USERS_COLLECTION), orderBy('signedInAt', 'desc'));
    const snapshot = await getDocs(q);
    const users: UserProfile[] = [];
    snapshot.forEach((d) => {
      users.push({ ...d.data(), id: d.id } as UserProfile);
    });
    return users;
  } catch (err) {
    console.error('Error fetching all operators from Firebase:', err);
    return [];
  }
}

export function subscribeToOperators(onUpdate: (users: UserProfile[]) => void) {
  try {
    const q = query(collection(db, FIRESTORE_USERS_COLLECTION), orderBy('signedInAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const users: UserProfile[] = [];
        snapshot.forEach((d) => {
          users.push({ ...d.data(), id: d.id } as UserProfile);
        });
        onUpdate(users);
      },
      (error) => {
        console.warn('Real-time listener notice:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to operators:', err);
    return () => {};
  }
}

export async function updateOperatorRole(userId: string, role: 'admin' | 'operator'): Promise<boolean> {
  try {
    const docRef = doc(db, FIRESTORE_USERS_COLLECTION, userId);
    await updateDoc(docRef, { role });
    return true;
  } catch (err) {
    console.error('Error updating role:', err);
    return false;
  }
}

export async function toggleOperatorStatus(userId: string, currentStatus?: 'active' | 'suspended'): Promise<boolean> {
  try {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const docRef = doc(db, FIRESTORE_USERS_COLLECTION, userId);
    await updateDoc(docRef, { status: newStatus });
    return true;
  } catch (err) {
    console.error('Error updating status:', err);
    return false;
  }
}

export async function deleteOperator(userId: string): Promise<boolean> {
  try {
    const docRef = doc(db, FIRESTORE_USERS_COLLECTION, userId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Error deleting operator:', err);
    return false;
  }
}
