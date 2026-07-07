// Firebase Configuration
// Initialize Firebase and export auth + Firestore instances
import { initializeApp } from "firebase/app";
import { initializeAuth, getAuth, Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
// On native: use AsyncStorage so login persists across app restarts
// On web: use default browser persistence
let auth: Auth;

if (Platform.OS === "web") {
    auth = getAuth(app);
} else {
    // getReactNativePersistence exists at runtime in firebase/auth but
    // TypeScript types may not include it in all versions.
    const reactNativeAuth = require("firebase/auth");
    const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;

    auth = initializeAuth(app, {
        persistence: reactNativeAuth.getReactNativePersistence(AsyncStorage),
    });
}

export { auth };
export const db = getFirestore(app);
export default app;
