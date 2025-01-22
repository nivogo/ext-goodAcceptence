// auth.js
import { auth, db } from "./firebaseConfig.js";
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

export function initAuthUI() {
  const btnLogin = document.getElementById("btnLogin");
  const btnLogout = document.getElementById("btnLogout");

  btnLogin.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const loginMsg = document.getElementById("loginMsg");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      loginMsg.textContent = "Giriş başarılı!";
    } catch (err) {
      loginMsg.textContent = "Giriş hatası: " + err.message;
    }
  });

  btnLogout.addEventListener("click", async () => {
    await signOut(auth);
  });
}

/** Auth state ile Home vs. Login alanını gizle/göster
    main.js içinde onAuthStateChanged kullanılabilir. **/
