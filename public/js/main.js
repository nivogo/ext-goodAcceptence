/********************************************/
/* main.js                                  */
/********************************************/
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

/** 1) Firebase Config (KENDİ PROJE BİLGİLERİNİZLE GÜNCELLEYİN) **/
const firebaseConfig = {
  apiKey: "AIzaSyBiWW3DjGHCA-gb6uFZzc0PiWMz5OWiTTs",
  authDomain: "nivo-transfer.firebaseapp.com",
  projectId: "nivo-transfer",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "1053874989257",
  appId: "APP_ID"
};

// 2) Uygulamayı Başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global Değişkenler
let currentSessionId = null;
let currentSessionStatus = null;  // "ongoing" | "completed"

/********************************************/
/* Sayfa Yüklenince                          */
/********************************************/
window.addEventListener("load", () => {
  initUI();

  // Auth durumu değiştikçe (login/logout)
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Giriş başarılı
      document.getElementById("login-section").classList.add("hidden");
      document.getElementById("logout-section").classList.remove("hidden");
      document.getElementById("qr-section").classList.remove("hidden");
      document.getElementById("welcome-msg").textContent = `Hoşgeldiniz, UID: ${user.uid}`;

      startCamera();
    } else {
      // Çıkış yapıldı veya henüz login değil
      resetUItoLoggedOut();
    }
  });
});

/********************************************/
/* UI - Login, Logout, Butonlar             */
/********************************************/
function initUI() {
  // Giriş Butonu
  document.getElementById("btnLogin").addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const loginMsg = document.getElementById("login-msg");
    if (!username || !password) {
      loginMsg.textContent = "Kullanıcı adı veya şifre boş olamaz.";
      return;
    }

    // 1) "mehmet" => "mehmet@myapp.com" gibi mail formatına dönüştür
    //    Domain tamamen size kalmış, "mehmet@myapp.com" veya "mehmet@whatever.org"
    const fakeEmail = `${username}@nivogo.com`;

    try {
      // 2) Firebase Auth'ta "email + password"
      await signInWithEmailAndPassword(auth, fakeEmail, password);
      loginMsg.textContent = "";
    } catch (err) {
      loginMsg.textContent = "Giriş başarısız: " + err.message;
    }
  });

  // Çıkış Butonu
  document.getElementById("btnLogout").addEventListener("click", async () => {
    await signOut(auth);
  });

  // Yeni Liste
  document.getElementById("btnCreateSession").addEventListener("click", createNewSession);

  // Listeyi Gönder
  document.getElementById("btnCompleteSession").addEventListener("click", completeSession);

  // Önceki Listeler
  document.getElementById("btnLoadSessions").addEventListener("click", loadMySessions);
}

/********************************************/
/* Reset UI to Logged Out                   */
/********************************************/
function resetUItoLoggedOut() {
  document.getElementById("login-section").classList.remove("hidden");
  document.getElementById("logout-section").classList.add("hidden");
  document.getElementById("qr-section").classList.add("hidden");

  document.getElementById("login-msg").textContent = "";
  document.getElementById("welcome-msg").textContent = "";
  document.getElementById("sessionInfo").textContent = "";
  document.getElementById("result").textContent = "";
  document.getElementById("productTableBody").innerHTML = "";
  document.getElementById("previousSessions").innerHTML = "";
  currentSessionId = null;
  currentSessionStatus = null;
}

/********************************************/
/* QR Okuma Kamerası                        */
/********************************************/
function startCamera() {
  const reader = new Html5Qrcode("reader");
  Html5Qrcode.getCameras()
    .then((cameras) => {
      if (cameras && cameras.length) {
        let cameraId = cameras[0].id;
        reader.start(
          cameraId,
          { fps:10, qrbox:250 },
          (decodedText) => handleQrDecoded(decodedText),
          (error) => console.warn(error)
        );
      }
    })
    .catch((err) => console.error("Kamera hatası:", err));
}

/********************************************/
/* Yeni Liste (scanningSessions)           */
/********************************************/
async function createNewSession() {
  const user = auth.currentUser;
  if (!user) {
    document.getElementById("result").textContent = "Önce giriş yapmalısınız!";
    return;
  }

  const now = new Date().toISOString().replace("T"," ").split(".")[0];
  const sessionName = `Liste ${now}`;

  // Firestore'a ekle (user.uid ile eşleştiriyoruz)
  const ref = await addDoc(collection(db, "scanningSessions"), {
    userUid: user.uid,
    sessionName: sessionName,
    status: "ongoing",
    createdAt: serverTimestamp()
  });

  currentSessionId = ref.id;
  currentSessionStatus = "ongoing";

  document.getElementById("sessionInfo").textContent =
    `Yeni Liste: ${sessionName} (ID: ${ref.id})`;
  document.getElementById("productTableBody").innerHTML = "";
  document.getElementById("btnCompleteSession").style.display = "inline-block";
  document.getElementById("result").textContent = "";
}

/********************************************/
/* QR Kod Okundu                            */
/********************************************/
async function handleQrDecoded(decodedText) {
  if (!currentSessionId) {
    document.getElementById("result").textContent = "Önce liste başlatın!";
    return;
  }
  if (currentSessionStatus === "completed") {
    document.getElementById("result").textContent = "Bu liste tamamlandı.";
    return;
  }

  // NVG ile başlıyor mu?
  const lower = decodedText.toLowerCase();
  if (!lower.startsWith("nvg")) {
    const confirmMsg = `Kod: ${decodedText}\nNVG ile başlamıyor. Eklemek istiyor musunuz?`;
    if (!confirm(confirmMsg)) {
      document.getElementById("result").textContent = "Eklenmedi (NVG dışı).";
      return;
    }
  }

  // Tabloda aynı kod var mı? (basit check)
  const rows = document.querySelectorAll("#productTableBody tr");
  for (const r of rows) {
    if (r.cells[0].textContent === decodedText) {
      document.getElementById("result").textContent = "Bu QR zaten listede!";
      return;
    }
  }

  // Firestore'a ekle (alt koleksiyon)
  const scannedRef = collection(db, "scanningSessions", currentSessionId, "scannedItems");
  await addDoc(scannedRef, {
    qrCode: decodedText,
    status: "İlk Okutma Yapıldı",
    scannedAt: serverTimestamp()
  });

  document.getElementById("result").textContent = `Eklendi: ${decodedText}`;
  loadSessionItems(currentSessionId);
}

/********************************************/
/* Liste Tamamla (status='completed')       */
/********************************************/
async function completeSession() {
  if (!currentSessionId) return;

  await updateDoc(doc(db, "scanningSessions", currentSessionId), {
    status: "completed"
  });
  currentSessionStatus = "completed";
  document.getElementById("btnCompleteSession").style.display = "none";
  document.getElementById("result").textContent = "Liste tamamlandı!";
  loadSessionItems(currentSessionId);
}

/********************************************/
/* Belirli Bir Session'ın Kodlarını Yükle   */
/********************************************/
async function loadSessionItems(sessionId) {
  const tableBody = document.getElementById("productTableBody");
  tableBody.innerHTML = "";

  const scannedRef = collection(db, "scanningSessions", sessionId, "scannedItems");
  const snap = await getDocs(scannedRef);
  snap.forEach((docSnap) => {
    const item = docSnap.data();

    const tr = document.createElement("tr");

    const tdQr = document.createElement("td");
    tdQr.textContent = item.qrCode;
    tr.appendChild(tdQr);

    const tdSt = document.createElement("td");
    tdSt.textContent = item.status;
    tr.appendChild(tdSt);

    const tdAct = document.createElement("td");
    if (currentSessionStatus === "ongoing" && item.status === "İlk Okutma Yapıldı") {
      const btnDel = document.createElement("button");
      btnDel.textContent = "Sil";
      btnDel.addEventListener("click", async () => {
        await updateDoc(doc(db, "scanningSessions", sessionId, "scannedItems", docSnap.id), {
          status: "Silindi"
        });
        loadSessionItems(sessionId);
      });
      tdAct.appendChild(btnDel);
    }
    tr.appendChild(tdAct);

    tableBody.appendChild(tr);
  });
}

/********************************************/
/* Önceki Listeler                          */
/********************************************/
async function loadMySessions() {
  const user = auth.currentUser;
  if (!user) {
    document.getElementById("result").textContent = "Önce giriş yapmalısınız!";
    return;
  }

  const q = query(
    collection(db, "scanningSessions"),
    where("userUid", "==", user.uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);

  const prevDiv = document.getElementById("previousSessions");
  prevDiv.innerHTML = "<h3>Önceki Oturumlar</h3>";

  snap.forEach((docSnap) => {
    const s = docSnap.data();
    const div = document.createElement("div");
    div.style.margin = "4px 0";
    div.innerHTML = `
      <a href="#" style="color:blue;text-decoration:underline;">
        ${docSnap.id} - ${s.sessionName} (Durum: ${s.status})
      </a>
    `;
    div.addEventListener("click", () => {
      currentSessionId = docSnap.id;
      currentSessionStatus = s.status;
      document.getElementById("sessionInfo").textContent =
        `Seçilen Liste: ${s.sessionName} (ID: ${docSnap.id}, Durum: ${s.status})`;

      if (s.status === "ongoing") {
        document.getElementById("btnCompleteSession").style.display = "inline-block";
      } else {
        document.getElementById("btnCompleteSession").style.display = "none";
      }

      loadSessionItems(docSnap.id);
    });
    prevDiv.appendChild(div);
  });
}
