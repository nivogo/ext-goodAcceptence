// main.js
import { auth } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";

import { initAuthUI } from "./auth.js";
import { initOnKabulUI } from "./onKabul.js";
import { initMalKabulUI } from "./malKabul.js";
import { initReportUI } from "./report.js";

initAuthUI();
initOnKabulUI();
initMalKabulUI();
initReportUI();

// Ekran elementlerini al
const loginSection = document.getElementById("login-section");
const homeSection = document.getElementById("home-section");
const btnRapor = document.getElementById("btnRapor");

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.classList.add("hidden");
    homeSection.classList.remove("hidden");
    // eğer user.uid === "ebyIhAoAzDeioorJRmuiVCRxw0N2" ise btnRapor.style.display="inline-block"
    if (user.uid === "ebyIhAoAzDeioorJRmuiVCRxw0N2") {
      btnRapor.style.display = "inline-block";
    } else {
      btnRapor.style.display = "none";
    }
  } else {
    loginSection.classList.remove("hidden");
    homeSection.classList.add("hidden");
  }
});
