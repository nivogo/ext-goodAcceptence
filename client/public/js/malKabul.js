// malKabul.js
import { db, auth } from "./firebaseConfig.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

export function initMalKabulUI() {
  const btnMalKabul = document.getElementById("btnMalKabul");
  const malKabulSection = document.getElementById("malKabul-section");
  const homeSection = document.getElementById("home-section");
  const btnMalKabulGeri = document.getElementById("btnMalKabulGeri");

  btnMalKabul.addEventListener("click", () => {
    homeSection.classList.add("hidden");
    malKabulSection.classList.remove("hidden");
    loadMalKabulList();
  });

  btnMalKabulGeri.addEventListener("click", () => {
    malKabulSection.classList.add("hidden");
    homeSection.classList.remove("hidden");
  });
}

async function loadMalKabulList() {
  // "Okutma Başarılı" veya "Fazla Koli" durumuna gelen koliler
  // tabloya doldur
}
