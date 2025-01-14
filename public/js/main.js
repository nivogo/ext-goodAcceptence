/**************************************************/
/*  main.js  (Firebase + QR + SheetJS Export)     */
/**************************************************/

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

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBiWW3DjGH...TTs",
  authDomain: "nivo-transfer.firebaseapp.com",
  projectId: "nivo-transfer",
  storageBucket: "nivo-transfer.appspot.com",
  messagingSenderId: "1053874989257",
  appId: "1:1053874989257:web:xxxxxx"
};

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global
let currentSessionId = null;
let currentSessionStatus = null; // 'ongoing' | 'completed'
let storeName = "Mağaza";

// Basic onLoad
window.addEventListener("load", () => {
  initUI();

  onAuthStateChanged(auth, (user) => {
    if (user) {
      document.getElementById("login-section").classList.add("hidden");
      document.getElementById("logout-section").classList.remove("hidden");
      document.getElementById("qr-section").classList.remove("hidden");
      startCamera();
    } else {
      document.getElementById("login-section").classList.remove("hidden");
      document.getElementById("logout-section").classList.add("hidden");
      document.getElementById("qr-section").classList.add("hidden");
    }
  });
});

/**************************************************/
/* initUI: butonlar                               */
/**************************************************/
function initUI() {
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

  document.getElementById("btnRegister").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const msgDiv = document.getElementById("msg");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      msgDiv.textContent = "Kayıt başarılı!";
      await setDoc(doc(db, "users", cred.user.uid), {
        storeName: "DenemeMagaza",
        createdAt: serverTimestamp()
      });
    } catch (err) {
      msgDiv.textContent = "Kayıt hatası: " + err.message;
    }
  });

  document.getElementById("btnLogout").addEventListener("click", async () => {
    await signOut(auth);
  });

  document.getElementById("btnCreateSession").addEventListener("click", createNewSession);
  document.getElementById("btnCompleteSession").addEventListener("click", completeSession);
  document.getElementById("btnLoadSessions").addEventListener("click", loadMySessions);

  // YENİ: Rapor Al (XLSX) butonu
  document.getElementById("btnExportXlsx").addEventListener("click", exportXlsx);
}

/**************************************************/
/* Kamera Başlat                                  */
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
          (error) => {}
        );
      }
    })
    .catch((err) => console.error("Kamera hatası:", err));
}

/**************************************************/
/* Yeni Liste                                     */
/**************************************************/
async function createNewSession() {
  const user = auth.currentUser;
  if (!user) {
    document.getElementById("result").textContent = "Önce giriş yapmalısınız!";
    return;
  }
  const now = new Date().toISOString().split(".")[0].replace("T", " ");
  const sessionName = storeName + " " + now;

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

  document.getElementById("productTableBody").innerHTML = "";
  document.getElementById("btnCompleteSession").style.display = "inline-block";
  document.getElementById("result").textContent = "Yeni liste oluşturuldu.";
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

  // NVG kontrol
  const lower = decodedText.toLowerCase();
  if (!lower.startsWith("nvg")) {
    const confirmMsg = `Kod: ${decodedText}\nNVG ile başlamıyor. Eklemek istiyor musunuz?`;
    if (!confirm(confirmMsg)) {
      document.getElementById("result").textContent = "Eklenmedi (NVG dışı).";
      return;
    }
  }

  // tabloda aynı kod var mı?
  const rows = document.querySelectorAll("#productTableBody tr");
  for (const r of rows) {
    if (r.cells[0].textContent === decodedText) {
      document.getElementById("result").textContent = "Bu QR kod zaten listede!";
      return;
    }
  }

  // Firestore'a ekle
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
/* Liste Tamamla                                  */
/**************************************************/
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

/**************************************************/
/* Oturumları Yükle                               */
/**************************************************/
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

  const div = document.getElementById("previousSessions");
  div.innerHTML = "<h3>Önceki Oturumlar</h3>";

  snap.forEach((docSnap) => {
    const s = docSnap.data();
    const linkDiv = document.createElement("div");
    linkDiv.style.margin = "4px 0";
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
/* Oturumun QR Kodlarını Yükle                    */
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

/**************************************************/
/* RAPOR AL (XLSX) - SheetJS                      */
/**************************************************/
async function exportXlsx() {
  // Tüm scanningSessions verisini çekelim (isteğe göre filtreleyebilirsiniz)
  const sessionsSnap = await getDocs(collection(db, "scanningSessions"));

  // Bu dizi, Excel satırlarını tutacak (her alt item bir satır)
  let rows = [];
  // Başlık: { qrCode, durum, okutmaTarihi, userId, listeId }

  for (const sessionDoc of sessionsSnap.docs) {
    const sessionData = sessionDoc.data();
    const sessionId = sessionDoc.id;
    const userId = sessionData.userUid || "";

    // Alt koleksiyon
    const itemsSnap = await getDocs(
      collection(db, "scanningSessions", sessionId, "scannedItems")
    );

    itemsSnap.forEach((itemDoc) => {
      const item = itemDoc.data();
      const qrCode = item.qrCode || "";
      const durum = item.status || "";
      let okutmaTarihi = "";
      if (item.scannedAt) {
        const ts = item.scannedAt.toDate();
        okutmaTarihi = formatDate(ts);  // aşağıda ufak fonksiyon
      }

      rows.push({
        "QR Kod": qrCode,
        "Durum": durum,
        "Okutma Tarihi": okutmaTarihi,
        "User ID": userId,
        "Liste ID": sessionId
      });
    });
  }

  // SheetJS ile Workbook/Worksheet
  // window.XLSX, sheetjs cdn yüklendiğinde global XLSX objesi olur
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rapor");

  // Dosyayı indir
  XLSX.writeFile(wb, "rapor.xlsx");
}

function formatDate(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const HH = String(dateObj.getHours()).padStart(2, "0");
  const MM = String(dateObj.getMinutes()).padStart(2, "0");
  const SS = String(dateObj.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
}
