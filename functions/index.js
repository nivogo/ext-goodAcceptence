// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sql = require('mssql');

// 1) Firebase Admin başlat
admin.initializeApp();
const db = admin.firestore();

// 2) SQL bağlantı bilgileri (functions.config().sql.*)
const sqlConfig = {
  user: functions.config().sql.user,       // "sa" gibi
  password: functions.config().sql.password, // "Be1bt.com" gibi
  server: functions.config().sql.server,     // "37.75.12.58"
  port: parseInt(functions.config().sql.port, 10), // 199
  database: functions.config().sql.database, // "NivogoTest2"
  options: {
    // MSSQL sunucunuz SSL gerektirmiyorsa false,
    // yoksa true. Aşağıdaki trustServerCertificate bazen gerekli.
    encrypt: false,           
    trustServerCertificate: true
  }
};

// 3) HTTP tetiklemeli fonksiyon (manuel tetiklemek için Postman/cURL vb.)
exports.syncSqlData = functions.https.onRequest(async (req, res) => {
  try {
    // a) SQL'e bağlan
    const pool = await sql.connect(sqlConfig);

    // b) Sorgu
    const queryStr = `
      SELECT
        lastName,
        firstName,
        empID
      FROM OHEM
      WHERE empID = '45'
    `;
    const result = await pool.request().query(queryStr);
    const rows = result.recordset;

    console.log(`Toplam satır: ${rows.length}`);

    // c) Firestore'a yazma
    const shipmentsRef = db.collection('testuser');
    const batch = db.batch();

    rows.forEach((row) => {
      const docRef = shipmentsRef.doc(); // Otomatik ID
      batch.set(docRef, {
        lastName: row.lastName,
        firstName: row.firstName,
        empID: row.empID,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    console.log('Veriler Firestore’a yazıldı.');

    // d) SQL bağlantısını kapatma (async)
    await pool.close();

    // e) Yanıt
    return res.status(200).send(`Sync tamamlandı. ${rows.length} satır aktarıldı.`);

  } catch (error) {
    console.error('Sync Hatası:', error);
    return res.status(500).send('Sync Hatası: ' + error.toString());
  }
});
