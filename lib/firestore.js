// lib/firestore.js

const API_BASE = "/api/index.php";

/**
 * Kullanıcı verisini REST API üzerinden çekme.
 * Beklenti: API, uid ile eşleşen kullanıcıyı JSON formatında döndürüyor.
 * (Bu fonksiyon API cevabında "user" anahtarını döndürüyorsa, değiştirmedik.)
 */
export const getUserData = async (uid) => {
  try {
    const response = await fetch(`${API_BASE}?action=getUserData&uid=${uid}`);
    const json = await response.json();
    return json; // Burada API cevabı user bilgilerini içeriyor
  } catch (error) {
    console.error("getUserData Hatası:", error);
    return null;
  }
};

/**
 * QR koduna göre shipment verilerini arama.
 */
export const searchShipmentsByQR = async (qr) => {
  try {
    const whereClause = { qr };
    const response = await fetch(
      `${API_BASE}?action=searchShipmentsByQR&where=${encodeURIComponent(JSON.stringify(whereClause))}`
    );
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("searchShipmentsByQR Hatası:", error);
    return [];
  }
};

/**
 * Tüm shipment verilerini çekme.
 */
export const getAllShipments = async () => {
  try {
    const response = await fetch(`${API_BASE}?action=getAllShipments`);
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getAllShipments Hatası:", error);
    return [];
  }
};

/**
 * Belirli adres değerine göre shipment verilerini çekme.
 */
export const getShipmentsByAdres = async (adresValue) => {
  try {
    const whereClause = { adres: adresValue };
    const response = await fetch(
      `${API_BASE}?action=getShipmentsByAdres&where=${encodeURIComponent(JSON.stringify(whereClause))}`
    );
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getShipmentsByAdres Hatası:", error);
    return [];
  }
};

/**
 * İlk 100 shipment verisini çekme.
 */
export const getTop100Shipments = async () => {
  try {
    const response = await fetch(`${API_BASE}?action=getTop100Shipments`);
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getTop100Shipments Hatası:", error);
    return [];
  }
};

/**
 * QR koduna göre gönderiyi çekme.
 */
export const getShipmentByQR = async (qr) => {
  try {
    const whereClause = { qr };
    const response = await fetch(
      `${API_BASE}?action=getShipmentByQR&where=${encodeURIComponent(JSON.stringify(whereClause))}`
    );
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getShipmentByQR Hatası:", error);
    return [];
  }
};

/**
 * PAAD_ID'ye göre gönderimleri çekme.
 */
export const getShipmentsByPAADID = async (PAAD_ID) => {
  try {
    const whereClause = { paad_id: PAAD_ID };
    const response = await fetch(
      `${API_BASE}?action=getShipmentsByPAADID&where=${encodeURIComponent(JSON.stringify(whereClause))}`
    );
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getShipmentsByPAADID Hatası:", error);
    throw error;
  }
};

/**
 * Belirli koli numarasına göre gönderileri çekme.
 */
export const getShipmentByBox = async (box) => {
  try {
    const whereClause = { box };
    const response = await fetch(
      `${API_BASE}?action=getShipmentByBox&where=${encodeURIComponent(JSON.stringify(whereClause))}`
    );
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getShipmentByBox Hatası:", error);
    return [];
  }
};

/**
 * PAAD_ID veya onKabulDurumu bilgisine göre başarılı kolileri çekme.
 */
export const getBoxesForBasariliKoliler = async (PAAD_ID) => {
  try {
    const whereClause = { paad_id: PAAD_ID };
    const response = await fetch(
      `${API_BASE}?action=getBoxesForBasariliKoliler&where=${encodeURIComponent(JSON.stringify(whereClause))}`
    );
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getBoxesForBasariliKoliler Hatası:", error);
    throw error;
  }
};

/**
 * Belirli bir gönderi dokümanında Mal Kabul alanlarını güncelleme.
 * Bu işlem için PUT isteği ile API'ye güncelleme bilgisi gönderilir.
 */
export const updateMalKabulFields = async (docId, username) => {
  try {
    const bodyData = {
      where: { docId },
      data: { username }
    };
    const response = await fetch(`${API_BASE}?action=updateMalKabulFields`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });
    if (!response.ok) {
      throw new Error("updateMalKabulFields API güncellemesi başarısız oldu");
    }
    console.log(`Gönderi ID: ${docId} için Mal Kabul alanları başarıyla güncellendi.`);
  } catch (error) {
    console.error("updateMalKabulFields Hatası:", error);
    throw error;
  }
};

/**
 * "Okutma Başarılı" durumundaki kolileri çekme.
 */
export const getSuccessfulBoxes = async (PAAD_ID) => {
  try {
    const whereClause = { paad_id: PAAD_ID };
    const response = await fetch(
      `${API_BASE}?action=getSuccessfulBoxes&where=${encodeURIComponent(JSON.stringify(whereClause))}`
    );
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getSuccessfulBoxes Hatası:", error);
    return [];
  }
};

/**
 * onKabulDurumu dolu kolileri çekme.
 */
export const getBoxesWithOnKabulDurumu = async (PAAD_ID) => {
  try {
    const whereClause = { paad_id: PAAD_ID };
    const response = await fetch(
      `${API_BASE}?action=getBoxesWithOnKabulDurumu&where=${encodeURIComponent(JSON.stringify(whereClause))}`
    );
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getBoxesWithOnKabulDurumu Hatası:", error);
    throw error;
  }
};

/**
 * Belirli bir gönderi dokümanında ön kabul alanlarını güncelleme.
 */
export const updateOnKabulFields = async (docId, username) => {
  try {
    const bodyData = {
      where: { docId },
      data: { username }
    };
    const response = await fetch(`${API_BASE}?action=updateOnKabulFields`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });
    if (!response.ok) {
      throw new Error("updateOnKabulFields API güncellemesi başarısız oldu");
    }
  } catch (error) {
    console.error("updateOnKabulFields Hatası:", error);
    throw error;
  }
};

/**
 * Fazla koli olarak işaretleme.
 */
export const markExtraBox = async (docId, username) => {
  try {
    const bodyData = {
      where: { docId },
      data: { username }
    };
    const response = await fetch(`${API_BASE}?action=markExtraBox`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });
    if (!response.ok) {
      throw new Error("markExtraBox API güncellemesi başarısız oldu");
    }
  } catch (error) {
    console.error("markExtraBox Hatası:", error);
    throw error;
  }
};

/**
 * Yeni bir shipment ekleme.
 */
export const addShipment = async (shipmentData) => {
  try {
    const bodyData = { data: shipmentData };
    const response = await fetch(`${API_BASE}?action=addShipment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });
    const json = await response.json();
    // API, oluşturulan shipment doküman ID'sini "shipmentId" olarak döndürüyor varsayılıyor
    return json.shipmentId;
  } catch (error) {
    console.error("addShipment Hatası:", error);
    throw error;
  }
};
