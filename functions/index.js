// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sql = require('mssql');

admin.initializeApp();
const db = admin.firestore();

// SQL Konfigürasyonu: Config'den alınan değerler
const sqlConfig = {
    user: functions.config().sql.user,
    password: functions.config().sql.password,
    server: functions.config().sql.server, // '37.75.12.58'
    port: parseInt(functions.config().sql.port, 10), // 199
    database: functions.config().sql.database,
    options: {
        encrypt: false, // SSL kullanıyorsanız true yapın
        trustServerCertificate: true // SSL sertifikası için
    }
};

// Schedule Function: Her gün belirli bir saatte çalışacak
exports.syncSqlData = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    try {
        // SQL'e bağlan
        let pool = await sql.connect(sqlConfig);
        
        // SQL Sorgusu
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

        // Firestore'a yazma
        const batch = db.batch();
        const shipmentsRef = db.collection('shipments');

        rows.forEach((row) => {
            const docRef = shipmentsRef.doc(); // Otomatik ID
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

        pool.close();
        return null;
    } catch (error) {
        console.error('Sync Hatası:', error);
        throw new functions.https.HttpsError('internal', 'Sync Hatası', error);
    }
});
