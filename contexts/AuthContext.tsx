// Google Authentication Context
// Handles sign-in/sign-out state, Google OAuth flow, and auto-provisioning
// new users in Firestore upon first login.
//
// Web:    Uses Firebase's signInWithPopup.
// Native: Uses @react-native-google-signin/google-signin + Firebase signInWithCredential.

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Platform } from "react-native";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

let GoogleSignin: any = null;

if (Platform.OS !== "web") {
  GoogleSignin = require("@react-native-google-signin/google-signin").GoogleSignin;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    // androidClientId is not needed in configure for GoogleSignin, it picks it up automatically or uses webClientId to request the token.
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextType {
  /** The currently signed-in Firebase user, or null if signed out. */
  user: FirebaseUser | null;
  /** True while the auth state is being resolved on app launch. */
  isLoading: boolean;
  /** Initiates the Google sign-in flow. */
  signInWithGoogle: () => Promise<void>;
  /** Signs the user out of Firebase. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Listen to Firebase auth state changes ──────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  /**
   * Check if the user already exists in Firestore.
   * If not, create a new user document from their Google profile.
   */
  async function ensureUserDocument(firebaseUser: FirebaseUser) {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? "",
        displayName: firebaseUser.displayName ?? "",
        photoURL: firebaseUser.photoURL ?? "",
        createdAt: Timestamp.now(),
      });
      console.log(
        "Created new user document for:",
        firebaseUser.displayName
      );
    }
  }

  // ── Sign-in (platform-specific) ───────────────────────────────────────────

  const signInWithGoogle = useCallback(async () => {
    try {
      if (Platform.OS === "web") {
        // Web: Use Firebase's signInWithPopup directly
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        await ensureUserDocument(result.user);
      } else {
        // Native: Use @react-native-google-signin/google-signin
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();
        const idToken = response.data?.idToken;

        if (!idToken) {
          throw new Error("No ID token found from Google Sign-In");
        }

        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        await ensureUserDocument(result.user);
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  }, []);

  async function logout() {
    try {
      if (Platform.OS !== "web") {
        // Optional: clear Google session so next login prompts for account
        try {
            await GoogleSignin.revokeAccess();
            await GoogleSignin.signOut();
        } catch (e) {
            console.log("Google sign out error", e);
        }
      }
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/** Custom hook to access the auth context from any component. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
