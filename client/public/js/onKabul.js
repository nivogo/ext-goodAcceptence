// onKabul.js
import { db, auth } from "./firebaseConfig.js";
import { collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

export function initOnKabulUI() {
  const btnOnKabul = document.getElementById("btnOnKabul");
  const onKabulSection = document.getElementById("onKabul-section");
  const homeSection = document.getElementById("home-section");
  const btnOnKabulGeri = document.getElementById("btnOnKabulGeri");
  const onKabulKoliInput = document.getElementById("onKabulKoliInput");
  const onKabulKoliOkutBtn = document.getElementById("onKabulKoliOkutBtn");

  // Buton -> Ön Kabul Ekranına geç
  btnOnKabul.addEventListener("click", () => {
    homeSection.classList.add("hidden");
    onKabulSection.classList.remove("hidden");
    loadOnKabulList();
  });

  // Geri butonu
  btnOnKabulGeri.addEventListener("click", () => {
    onKabulSection.classList.add("hidden");
    homeSection.classList.remove("hidden");
  });

  // Koli okut
  onKabulKoliOkutBtn.addEventListener("click", () => {
    let inputVal = onKabulKoliInput.value.trim();
    if (!inputVal) return;
    // 1 sn gecikme
    setTimeout(() => {
      // "Okutma" logic
      handleOnKabulKoli(inputVal);
    }, 1000);
  });
}

// Listeyi Yükle (AlıcıLokasyonID == user.storeId)
async function loadOnKabulList() {
  const user = auth.currentUser;
  if (!user) return;

  // /users/{uid} -> storeId
  // veriyi /shipments'tan al, "aliciLokasyonID == storeId" && sevkiyatTarihi > 15.01.2025
  // ...
  // tabloya yaz, maskeli. Sıra No, koli ****, ürün adedi ****, durum ""

  // document.getElementById("onKabulKoliCount").textContent = items.length;
}

// Koli Okutma
async function handleOnKabulKoli(koliNo) {
  // tabloyu güncelle: durum "Okutma Başarılı" ya da "Fazla Koli"
  // eğer "Okutma Başarılı" ise maskesi aç (koli no, ürün adedi).
  // eğer "Fazla" ise tabloya ekle, "Fazla Koli" durumu
  // "Okutma Başarılı" olanları listeden kaldır vs.
}
