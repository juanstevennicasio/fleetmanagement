import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
let auth;
let db: any;

try {
    if (getApps().length === 0) {
        // Only initialize if config is present, otherwise mock or warn
        if (firebaseConfig.apiKey) {
            app = initializeApp(firebaseConfig);
        } else {
            console.warn("Firebase config missing. Using mock DB.");
            // Create a dummy app object if needed or just leave undefined
        }
    } else {
        app = getApp();
    }

    if (app) {
        auth = getAuth(app);
        db = getFirestore(app);
    } else {
        // Mock DB object to prevent crashes in services that import 'db'
        db = {} as any;
        // auth will remain undefined if app is not initialized
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
    db = {} as any;
    // auth will remain undefined on error
}

export { app, auth, db };
