// report.js
import { db } from "./firebaseConfig.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

export function initReportUI() {
  const btnRapor = document.getElementById("btnRapor");
  if (btnRapor) {
    btnRapor.addEventListener("click", exportXlsx);
  }
}

async function exportXlsx() {
  // "Sevk Numarası", "Sevk Tarihi", "Koli Numarası", ...
  const snap = await getDocs(collection(db, "shipments")); 
  let rows = [];

  snap.forEach((docSnap) => {
    const d = docSnap.data();
    rows.push({
      "Sevk Numarası": d.sevkiyatNumarasi,
      "Sevk Tarihi": d.sevkiyatTarihi,
      "Koli Numarası": d.koliNumarasi,
      "Ürün Kodu": d.urunNumarasi,
      // "Gönderici Lokasyon Adı": ...
      // "Koli Okutma Tarihi": ...
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rapor");
  XLSX.writeFile(wb, "rapor.xlsx");
}
