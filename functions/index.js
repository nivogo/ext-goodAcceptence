// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sql = require('mssql');

admin.initializeApp();
const db = admin.firestore();

// 1) Manuel olarak SQL bilgilerini kodda gömüyoruz (ÖRNEK)
const sqlConfig = {
  user: "sa",
  password: "Be1bt.com",
  server: "37.75.12.58",
  port: 1433,
  database: "NivogoTest2",
  options: {
    encrypt: false,             // sunucunuz SSL kullanıyorsa true
    trustServerCertificate: true
  }
};

// 2) HTTP tetiklemeli fonksiyon (manuel tetiklemek için)
exports.syncSqlData = functions.https.onRequest(async (req, res) => {
  try {
    // SQL'e bağlan
    let pool = await sql.connect(sqlConfig);

    // Sorgu
    const queryStr = `
      SELECT
        lastName,
        firstName,
        empID,
      FROM OHEM
      WHERE empID = '45'
    `;
    let result = await pool.request().query(queryStr);
    let rows = result.recordset;

    console.log(`Toplam satır: ${rows.length}`);

    // Firestore'a yazma
    const shipmentsRef = db.collection('testuser');
    const batch = db.batch();
    rows.forEach((row) => {
      const docRef = shipmentsRef.doc(); // otomatik ID
      batch.set(docRef, {
        lastName: row.lastName,
        firstName: row.firstName,
        empID: row.empID,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();
    console.log('Veriler Firestore’a yazıldı.');

    pool.close();
    return res.status(200).send(`Sync tamamlandı. ${rows.length} satır aktarıldı.`);
  } catch (error) {
    console.error('Sync Hatası:', error);
    return res.status(500).send('Sync Hatası: ' + error.toString());
  }
});
