// auth.js
import { auth, db } from "./firebaseConfig.js";
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

export function initAuthUI() {
  const btnLogin = document.getElementById("btnLogin");
  const btnRegister = document.getElementById("btnRegister");
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

  btnRegister.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const loginMsg = document.getElementById("loginMsg");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Firestore'da /users/{uid} dokümanı
      await setDoc(doc(db, "users", cred.user.uid), {
        storeId: 1234, // Manuel atama
        createdAt: serverTimestamp()
      });
      loginMsg.textContent = "Kayıt başarılı!";
    } catch (err) {
      loginMsg.textContent = "Kayıt hatası: " + err.message;
    }
  });

  btnLogout.addEventListener("click", async () => {
    await signOut(auth);
  });
}

/** Auth state ile Home vs. Login alanını gizle/göster
    main.js içinde onAuthStateChanged kullanılabilir. **/
