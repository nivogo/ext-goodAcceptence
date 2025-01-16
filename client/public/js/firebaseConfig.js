// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBiWW3DjGHCA-gb6uFZzc0PiWMz5OWiTTs",
  authDomain: "nivo-transfer.firebaseapp.com",
  projectId: "nivo-transfer",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "1053874989257",
  appId: "APP_ID"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
