/**************************************************/
/*  main.js                                       */
/**************************************************/

// 1) Firebase SDK import (ES6 Modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// 2) Firebase Config -> BURAYI KENDİ PROJENİZE GÖRE DÜZENLEYİN
const firebaseConfig = {
  apiKey: "AIzaSyBiWW3DjGHCA-gb6uFZzc0PiWMz5OWiTTs",
  authDomain: "nivo-transfer.firebaseapp.com",
  projectId: "nivo-transfer",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "1053874989257",
  appId: "APP_ID"
};

// 3) Uygulamayı başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 4) Global değişkenler
let currentSessionId = null;
let currentSessionStatus = null; // 'ongoing' veya 'completed'
let storeName = "Mağaza";         // İsteğe göre Firestore'dan çekilebilir

// 5) Sayfa yüklendiğinde olaylar
window.addEventListener("load", () => {
  initUI();

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Kullanıcı giriş yapmış
      document.getElementById("login-section").classList.add("hidden");
      document.getElementById("logout-section").classList.remove("hidden");
      document.getElementById("qr-section").classList.remove("hidden");

      startCamera();
      // (Opsiyonel) Burada user profili (storeName) Firestore'dan çekilebilir
    } else {
      // Kullanıcı çıkış yapmış
      document.getElementById("login-section").classList.remove("hidden");
      document.getElementById("logout-section").classList.add("hidden");
      document.getElementById("qr-section").classList.add("hidden");
    }
  });
});

/**************************************************/
/* UI INIT: Login/Register/Logout vb.             */
/**************************************************/
function initUI() {
  // Giriş yap
  document.getElementById("btnLogin").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const msgDiv = document.getElementById("msg");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      msgDiv.textContent = "Giriş başarılı!";
    } catch (err) {
      msgDiv.textContent = "Giriş hatası: " + err.message;
    }
  });

  // Kayıt ol
  document.getElementById("btnRegister").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const msgDiv = document.getElementById("msg");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      msgDiv.textContent = "Kayıt başarılı!";
      // İsteğe bağlı: /users/<uid> doc oluşturarak storeName vs. ekleyebilirsiniz
      await setDoc(doc(db, "users", cred.user.uid), {
        storeName: "DenemeMagaza",
        createdAt: serverTimestamp()
      });
    } catch (err) {
      msgDiv.textContent = "Kayıt hatası: " + err.message;
    }
  });

  // Çıkış
  document.getElementById("btnLogout").addEventListener("click", async () => {
    await signOut(auth);
  });

  // Yeni liste başlat
  document.getElementById("btnCreateSession").addEventListener("click", createNewSession);

  // Listeyi gönder (tamamla)
  document.getElementById("btnCompleteSession").addEventListener("click", completeSession);

  // Önceki listelerim
  document.getElementById("btnLoadSessions").addEventListener("click", loadMySessions);
}

/**************************************************/
/* Kamera Başlat (html5-qrcode)                   */
/**************************************************/
function startCamera() {
  const reader = new Html5Qrcode("reader");
  Html5Qrcode.getCameras()
    .then((cameras) => {
      if (cameras && cameras.length) {
        let cameraId = cameras[0].id;
        reader.start(
          cameraId,
          { fps: 10, qrbox: 250 },
          (decodedText) => handleQrDecoded(decodedText),
          (error) => console.warn(error)
        );
      }
    })
    .catch((err) => console.error("Kamera hatası:", err));
}

/**************************************************/
/* Yeni Liste (Oturum) Oluştur                    */
/**************************************************/
async function createNewSession() {
  const user = auth.currentUser;
  if (!user) {
    document.getElementById("result").textContent = "Giriş yapmadınız!";
    return;
  }
  const now = new Date().toISOString().split(".")[0].replace("T", " ");
  const sessionName = storeName + " " + now; // "Mağaza 2025-01-13 12:34:56"

  // Firestore'a ekle
  const ref = await addDoc(collection(db, "scanningSessions"), {
    userUid: user.uid,
    sessionName: sessionName,
    status: "ongoing",
    createdAt: serverTimestamp()
  });

  currentSessionId = ref.id;
  currentSessionStatus = "ongoing";

  document.getElementById("sessionInfo").textContent =
    `Yeni Liste: ${sessionName} (ID: ${currentSessionId})`;
  
  // tabloları temizleyelim
  document.getElementById("productTableBody").innerHTML = "";
  document.getElementById("btnCompleteSession").style.display = "inline-block";
}

/**************************************************/
/* QR Kod Okundu                                  */
/**************************************************/
async function handleQrDecoded(decodedText) {
  if (!currentSessionId) {
    document.getElementById("result").textContent = "Önce liste başlatın!";
    return;
  }
  if (currentSessionStatus === "completed") {
    document.getElementById("result").textContent = "Bu liste tamamlandı.";
    return;
  }

  // NVG kontrolü
  const lower = decodedText.toLowerCase();
  if (!lower.startsWith("nvg")) {
    const confirmMsg = `Kod: ${decodedText}\nNVG ile başlamıyor. Eklemek istiyor musunuz?`;
    if (!confirm(confirmMsg)) {
      document.getElementById("result").textContent = "Eklenmedi (NVG dışı).";
      return;
    }
  }

  // Aynı kodu tabloda arayalım (basit kontrol).
  const rows = document.querySelectorAll("#productTableBody tr");
  for (const r of rows) {
    if (r.cells[0].textContent === decodedText) {
      document.getElementById("result").textContent = "Bu QR kod zaten listede!";
      return;
    }
  }

  // Firestore'a ekle (alt koleksiyon "scannedItems")
  const scannedRef = collection(db, "scanningSessions", currentSessionId, "scannedItems");
  await addDoc(scannedRef, {
    qrCode: decodedText,
    status: "İlk Okutma Yapıldı",
    scannedAt: serverTimestamp()
  });

  document.getElementById("result").textContent = `Eklendi: ${decodedText}`;
  loadSessionItems(currentSessionId);
}

/**************************************************/
/* Liste Tamamla (status='completed')            */
/**************************************************/
async function completeSession() {
  if (!currentSessionId) return;

  await updateDoc(doc(db, "scanningSessions", currentSessionId), {
    status: "completed"
  });
  currentSessionStatus = "completed";
  document.getElementById("btnCompleteSession").style.display = "none";
  document.getElementById("result").textContent = "Liste tamamlandı!";

  // (İsteğe bağlı) alt koleksiyon status='İlk Okutma Yapıldı' -> 'liste kaydedildi'
  // Tek tek update edilebilir, ya da bulut fonksiyonu ile toplu update yapabilirsiniz.

  loadSessionItems(currentSessionId);
}

/**************************************************/
/* Kendi Oturumlarımı Yükle (Kullanıcıya Ait)     */
/**************************************************/
async function loadMySessions() {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "scanningSessions"),
    where("userUid", "==", user.uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);

  const div = document.getElementById("previousSessions");
  div.innerHTML = "<h3>Önceki Oturumlar</h3>";

  snap.forEach((docSnap) => {
    const s = docSnap.data();
    const linkDiv = document.createElement("div");
    linkDiv.innerHTML = `
      <a href="#" style="color:blue;text-decoration:underline;">
        ${docSnap.id} - ${s.sessionName} (Durum: ${s.status})
      </a>
    `;
    linkDiv.addEventListener("click", () => {
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
    div.appendChild(linkDiv);
  });
}

/**************************************************/
/* Belirli Bir Oturumun QR Kodlarını Yükle        */
/**************************************************/
async function loadSessionItems(sessionId) {
  const tableBody = document.getElementById("productTableBody");
  tableBody.innerHTML = "";

  const scannedRef = collection(db, "scanningSessions", sessionId, "scannedItems");
  const itemsSnap = await getDocs(scannedRef);
  itemsSnap.forEach((dSnap) => {
    const item = dSnap.data();
    const tr = document.createElement("tr");

    // QR kod
    const tdQr = document.createElement("td");
    tdQr.textContent = item.qrCode;
    tr.appendChild(tdQr);

    // Durum
    const tdSt = document.createElement("td");
    tdSt.textContent = item.status;
    tr.appendChild(tdSt);

    // İşlem
    const tdAct = document.createElement("td");
    if (currentSessionStatus === "ongoing" && item.status === "İlk Okutma Yapıldı") {
      const btnDel = document.createElement("button");
      btnDel.textContent = "Sil";
      btnDel.addEventListener("click", async () => {
        // "Silindi" olarak güncelle
        await updateDoc(doc(db, "scanningSessions", sessionId, "scannedItems", dSnap.id), {
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
