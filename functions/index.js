// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");

// Örnek: MSSQL entegrasyonu yapmak istiyorsanız
// const sql = require("mssql");  // vb. kütüphaneler

// 1) Firebase Admin başlat
admin.initializeApp(); 
const db = admin.firestore();

// 2) Express uygulaması
const app = express();

// Basit test route
app.get("/", (req, res) => {
  res.send("Merhaba, Firebase Functions üzerinde Express!");
});

// Örnek bir /sync route (SQL'le entegre edecekseniz burada MSSQL sorgu yapıp Firestore’a yazabilirsiniz)
app.get("/sync", async (req, res) => {
  try {
    // 1) MSSQL'e bağlan -> veriyi çek
    // 2) Firestore'a yaz
    // ...
    res.send("SQL -> Firestore senkronizasyon tamam!");
  } catch (err) {
    res.status(500).send("Hata: " + err.message);
  }
});

// 3) Firebase Functions: express app'i onRequest ile dışa aktar
exports.app = functions.https.onRequest(app);
