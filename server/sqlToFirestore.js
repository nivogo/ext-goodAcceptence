// sqlToFirestore.js
require("dotenv").config();
const sql = require("mssql");  // MS SQL
// MySQL kullanacaksanız "mysql2" import edebilirsiniz

// Bu fonksiyon veritabanına bağlanıp "SevkiyatTarihi > 15.01.2025" verilerini çekecek
async function syncSqlToFirestore(db) {
  // 1) SQL Bağlantısı
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,  // "192.168.1.10"
    database: process.env.DB_DATABASE,
    options: {
      trustServerCertificate: true  // SSL
    }
  };

  console.log("SQL'e bağlanılıyor...");
  let pool = await sql.connect(config);

  // 2) Sorgu -> Sevkiyat Tarihi 15 Ocak 2025'ten büyük
  const queryStr = `
    SELECT
      SevkiyatTarihi,
      SevkiyatNumarasi,
      GondericiLokasyonAdi,
      GondericiLokasyonID,
      AliciLokasyonAdi,
      AliciLokasyonID,
      KoliNumarasi,
      UrunNumarasi
    FROM Sevkiyat
    WHERE SevkiyatTarihi > '2025-01-15'
  `;

  console.log("Sorgu çalıştırılıyor...");
  let result = await pool.request().query(queryStr);
  let rows = result.recordset;

  console.log(`Toplam satır: ${rows.length}`);

  // 3) Firestore'a yaz
  // db -> admin.firestore()
  const batch = db.batch();  // Toplu yazma (isteğe bağlı)
  rows.forEach((row) => {
    const docRef = db.collection("shipments").doc();  // auto-ID
    // docRef.set(...) yerine batch.set(docRef, {...})
    batch.set(docRef, {
      sevkiyatTarihi: row.SevkiyatTarihi,       // DateTime
      sevkiyatNumarasi: row.SevkiyatNumarasi,
      gondericiLokasyonAdi: row.GondericiLokasyonAdi,
      gondericiLokasyonID: row.GondericiLokasyonID,
      aliciLokasyonAdi: row.AliciLokasyonAdi,
      aliciLokasyonID: row.AliciLokasyonID,
      koliNumarasi: row.KoliNumarasi,
      urunNumarasi: row.UrunNumarasi,
      createdAt: new Date()
    });
  });

  console.log("Batch commit ediliyor...");
  await batch.commit();

  console.log("Sync işlemi tamamlandı!");
  // Bağlantıyı kapat
  pool.close();
}

module.exports = { syncSqlToFirestore };
