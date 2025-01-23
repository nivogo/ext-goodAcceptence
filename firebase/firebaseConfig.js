// firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Örnek environment değişkenleri (Next.js için NEXT_PUBLIC_ prefix'leri kullanıyoruz)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Set Auth Persistence to 'local' to keep the user logged in until they sign out
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    // Persistence ayarı başarıyla yapıldı
    console.log("Auth persistence set to local.");
  })
  .catch((error) => {
    console.error("Auth Persistence Ayarlama Hatası:", error);
  });

// Initialize Firestore
const db = getFirestore(app);

// Export Auth ve Firestore referansları
export { auth, db };
