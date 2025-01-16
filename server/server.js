// server.js
require("dotenv").config();  // .env dosyasını yükler
const express = require("express");
const admin = require("firebase-admin");
const { syncSqlToFirestore } = require("./sqlToFirestore");

const app = express();

// 1) Firebase Admin'i başlat
admin.initializeApp({
  // GOOGLE_APPLICATION_CREDENTIALS environment değişkenini kullanır
  credential: admin.credential.applicationDefault()
});
const db = admin.firestore();

// 2) Basit test endpoint
app.get("/", (req, res) => {
  res.send("SQL-Firestore Sync Sunucu Çalışıyor...");
});

// 3) SQL'den Firestore'a veri çek endpoint
app.get("/sync", async (req, res) => {
  try {
    await syncSqlToFirestore(db);
    res.send("SQL verileri Firestore'a aktarıldı!");
  } catch (err) {
    console.error("Sync hatası:", err);
    res.status(500).send("Sync hatası: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
