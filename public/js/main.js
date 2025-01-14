/****************************************/
/* main.js                              */
/****************************************/
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

/** 
 * 1) Firebase Config (KENDİ PROJE BİLGİLERİNİZLE GÜNCELLEYİN)
 */
const firebaseConfig = {
  apiKey: "AIzaSyBiWW3DjGHCA-gb6uFZzc0PiWMz5OWiTTs",
  authDomain: "nivo-transfer.firebaseapp.com",
  projectId: "nivo-transfer",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "1053874989257",
  appId: "APP_ID"
};

// 2) Firebase'i Başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3) Global Değişkenler
let currentSessionId = null;
let currentSessionStatus = null; // 'ongoing' | 'completed'

// 4) Sayfa Yüklenince
window.addEventListener("load", function() {
  initUI();
  checkLoginStateOnLoad();
});

/****************************************/
/* Giriş/Çıkış Fonksiyonları            */
/****************************************/
function initUI() {
  // Giriş Butonu
  document.getElementById("btnLogin").addEventListener("click", async () => {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    const loginMsg = document.getElementById("login-msg");

    if (!username || !password) {
      loginMsg.textContent = "Kullanıcı adı ve şifre giriniz.";
      return;
    }

    // Firestore'da doc(db, "users", username) => user belgesi
    const userDocRef = doc(db, "users", username);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      loginMsg.textContent = "Kullanıcı bulunamadı.";
      return;
    }

    const userData = userSnap.data();
    // NOT: Gerçekte password'u hash'li tutmalısınız! Burada basitçe eşleştiriyoruz.
    if (userData.password === password) {
      // Giriş başarılı
      localStorage.setItem("username", username);
      loginMsg.textContent = "";
      document.getElementById("login-section").classList.add("hidden");
      document.getElementById("logout-section").classList.remove("hidden");
      document.getElementById("qr-section").classList.remove("hidden");

      document.getElementById("welcome-msg").textContent = `Hoşgeldin, ${username}`;

      // Kamerayı başlat (QR Okuma)
      startCamera();
    } else {
      // Şifre hatalı
      loginMsg.textContent = "Şifre hatalı.";
    }
  });

  // Çıkış Butonu
  document.getElementById("btnLogout").addEventListener("click", () => {
    localStorage.clear();
    resetUIToLoggedOut();
  });

  // Yeni Liste
  document.getElementById("btnCreateSession").addEventListener("click", createNewSession);
  
  // Listeyi Gönder (Tamamla)
  document.getElementById("btnCompleteSession").addEventListener("click", completeSession);

  // Önceki Listeler
  document.getElementById("btnLoadSessions").addEventListener("click", loadMySessions);
}

function resetUIToLoggedOut() {
  document.getElementById("login-section").classList.remove("hidden");
  document.getElementById("logout-section").classList.add("hidden");
  document.getElementById("qr-section").classList.add("hidden");
  document.getElementById("login-msg").textContent = "";
  document.getElementById("login-username").value = "";
  document.getElementById("login-password").value = "";
  document.getElementById("sessionInfo").textContent = "";
  document.getElementById("productTableBody").innerHTML = "";
  document.getElementById("previousSessions").innerHTML = "";
  document.getElementById("welcome-msg").textContent = "";
  document.getElementById("result").textContent = "";
  currentSessionId = null;
  currentSessionStatus = null;
}

/****************************************/
/* Sayfa Yüklendiğinde Login Kontrolü   */
/****************************************/
function checkLoginStateOnLoad() {
  const username = localStorage.getItem("username");
  if (username) {
    // Oturum açık görünüyor
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("logout-section").classList.remove("hidden");
    document.getElementById("qr-section").classList.remove("hidden");
    document.getElementById("welcome-msg").textContent = `Hoşgeldin, ${username}`;
    startCamera();
  } else {
    resetUIToLoggedOut();
  }
}

/****************************************/
/* Kamera (QR Okuma)                    */
/****************************************/
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

/****************************************/
/* Yeni Liste Başlat (scanningSessions) */
/****************************************/
async function createNewSession() {
  const username = localStorage.getItem("username");
  if (!username) {
    document.getElementById("result").textContent = "Önce giriş yapmalısınız!";
    return;
  }

  const now = new Date().toISOString().replace("T", " ").split(".")[0];
  const sessionName = `Mağaza ${now}`; // veya storeName + now

  // Firestore'a ekle
  const ref = await addDoc(collection(db, "scanningSessions"), {
    username: username,
    sessionName: sessionName,
    status: "ongoing",
    createdAt: serverTimestamp()
  });

  currentSessionId = ref.id;
  currentSessionStatus = "ongoing";

  document.getElementById("sessionInfo").textContent =
    `Yeni Liste: ${sessionName} (ID: ${currentSessionId})`;

  document.getElementById("productTableBody").innerHTML = "";
  document.getElementById("btnCompleteSession").style.display = "inline-block";
  document.getElementById("result").textContent = "";
}

/****************************************/
/* QR Kod Okundu                        */
/****************************************/
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

  // Aynı kod tabloda var mı? (Basit check)
  const rows = document.querySelectorAll("#productTableBody tr");
  for (const r of rows) {
    if (r.cells[0].textContent === decodedText) {
      document.getElementById("result").textContent = "Bu QR kod zaten listede!";
      return;
    }
  }

  // Firestore'a ekle (alt koleksiyon scannedItems)
  const scannedRef = collection(db, "scanningSessions", currentSessionId, "scannedItems");
  await addDoc(scannedRef, {
    qrCode: decodedText,
    status: "İlk Okutma Yapıldı",
    scannedAt: serverTimestamp()
  });

  document.getElementById("result").textContent = `Eklendi: ${decodedText}`;
  loadSessionItems(currentSessionId);
}

/****************************************/
/* Liste Tamamla (status='completed')   */
/****************************************/
async function completeSession() {
  if (!currentSessionId) return;

  await updateDoc(doc(db, "scanningSessions", currentSessionId), {
    status: "completed"
  });
  currentSessionStatus = "completed";
  document.getElementById("btnCompleteSession").style.display = "none";
  document.getElementById("result").textContent = "Liste tamamlandı!";

  // (İsteğe bağlı) alt koleksiyonda "İlk Okutma Yapıldı" -> "liste kaydedildi" güncellenebilir
  loadSessionItems(currentSessionId);
}

/****************************************/
/* Listeyi Yükle (sessionId -> items)   */
/****************************************/
async function loadSessionItems(sessionId) {
  const tableBody = document.getElementById("productTableBody");
  tableBody.innerHTML = "";

  const scannedRef = collection(db, "scanningSessions", sessionId, "scannedItems");
  const itemsSnap = await getDocs(scannedRef);
  itemsSnap.forEach((docSnap) => {
    const item = docSnap.data();
    const tr = document.createElement("tr");

    // QR kod
    const tdQr = document.createElement("td");
    tdQr.textContent = item.qrCode;
    tr.appendChild(tdQr);

    // Durum
    const tdSt = document.createElement("td");
    tdSt.textContent = item.status;
    tr.appendChild(tdSt);

    // İşlem (Sil)
    const tdAct = document.createElement("td");
    if (currentSessionStatus === "ongoing" && item.status === "İlk Okutma Yapıldı") {
      // Basit "Sil" => Durumu "Silindi" yapma
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

/****************************************/
/* Önceki Listeler (scanningSessions)   */
/****************************************/
async function loadMySessions() {
  const username = localStorage.getItem("username");
  if (!username) {
    document.getElementById("result").textContent = "Giriş yapmalısınız!";
    return;
  }
  const q = query(
    collection(db, "scanningSessions"),
    where("username", "==", username),
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
