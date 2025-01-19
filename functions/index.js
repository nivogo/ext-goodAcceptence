// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sql = require('mssql');

admin.initializeApp();
const db = admin.firestore();

// SQL Konfigürasyonu: Config'den alınan değerler
// Örn: firebase functions:config:set sql.server="37.75.12.58" vb.
const sqlConfig = {
    user: functions.config().sql.user,
    password: functions.config().sql.password,
    server: functions.config().sql.server, // '37.75.12.58'
    port: parseInt(functions.config().sql.port, 10),
    database: functions.config().sql.database,
    options: {
      encrypt: false,             // SSL varsa true
      trustServerCertificate: true
    }
};

// HTTP Tetiklemeli Fonksiyon
exports.syncSqlData = functions.https.onRequest(async (req, res) => {
    try {
        // 1) SQL'e Bağlan
        let pool = await sql.connect(sqlConfig);

        // 2) Sorgu
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
        let result = await pool.request().query(queryStr);
        let rows = result.recordset;

        console.log(`Toplam satır: ${rows.length}`);

        // 3) Firestore'a yazma
        const batch = db.batch();
        const shipmentsRef = db.collection('shipments');

        rows.forEach((row) => {
            const docRef = shipmentsRef.doc(); // otomatik ID
            batch.set(docRef, {
                sevkiyatTarihi: row.SevkiyatTarihi,
                sevkiyatNumarasi: row.SevkiyatNumarasi,
                gondericiLokasyonAdi: row.GondericiLokasyonAdi,
                gondericiLokasyonID: row.GondericiLokasyonID,
                aliciLokasyonAdi: row.AliciLokasyonAdi,
                aliciLokasyonID: row.AliciLokasyonID,
                koliNumarasi: row.KoliNumarasi,
                urunNumarasi: row.UrunNumarasi,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();
        console.log('Veriler Firestore’a yazıldı.');

        // SQL bağlantısını kapat
        pool.close();

        // Kullanıcıya yanıt
        res.status(200).send(`Sync başarılı: ${rows.length} satır aktarıldı.`);
    } catch (error) {
        console.error('Sync Hatası:', error);
        res.status(500).send('Sync Hatası: ' + error.toString());
    }
});
