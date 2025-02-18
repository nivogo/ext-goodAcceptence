// lib/firestore.js

const API_BASE = "/api/index.php";

/**
 * Kullanıcı verisini REST API üzerinden çekme.
 * Beklenti: API, uid ile eşleşen kullanıcıyı JSON formatında döndürüyor.
 */
export const getUserData = async (uid) => {
  try {
    const response = await fetch(`${API_BASE}?action=getUserData&uid=${uid}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("getUserData Hatası:", error);
    return null;
  }
};

export const loginUser = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (!data.success) {
      // API'nin döndürdüğü hata mesajını fırlatıyoruz
      throw new Error(data.message || "Giriş yapılamadı");
    }
    return data;
  } catch (error) {
    console.error("loginUser Hatası:", error);
    throw error;
  }
};


/**
 * QR koduna göre shipment verilerini arama.
 */
export const searchShipmentsByQR = async (qr) => {
  try {
    const response = await fetch(
      `${API_BASE}?action=searchShipmentsByQR&qr=${encodeURIComponent(qr)}`
    );
    const data = await response.json();
    return data;
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
    const data = await response.json();
    return data;
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
    const response = await fetch(
      `${API_BASE}?action=getShipmentsByAdres&adres=${encodeURIComponent(adresValue)}`
    );
    const data = await response.json();
    return data;
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
    const data = await response.json();
    return data;
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
    const response = await fetch(
      `${API_BASE}?action=getShipmentByQR&qr=${encodeURIComponent(qr)}`
    );
    const data = await response.json();
    return data;
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
    const response = await fetch(
      `${API_BASE}?action=getShipmentsByPAADID&PAAD_ID=${encodeURIComponent(PAAD_ID)}`
    );
    const data = await response.json();
    return data;
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
    const response = await fetch(
      `${API_BASE}?action=getShipmentByBox&box=${encodeURIComponent(box)}`
    );
    const data = await response.json();
    return data;
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
    const response = await fetch(
      `${API_BASE}?action=getBoxesForBasariliKoliler&PAAD_ID=${encodeURIComponent(PAAD_ID)}`
    );
    const data = await response.json();
    return data;
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
    const response = await fetch(
      `${API_BASE}?action=updateMalKabulFields&docId=${encodeURIComponent(docId)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      }
    );
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
    const response = await fetch(
      `${API_BASE}?action=getSuccessfulBoxes&PAAD_ID=${encodeURIComponent(PAAD_ID)}`
    );
    const data = await response.json();
    return data;
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
    const response = await fetch(
      `${API_BASE}?action=getBoxesWithOnKabulDurumu&PAAD_ID=${encodeURIComponent(PAAD_ID)}`
    );
    const data = await response.json();
    return data;
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
    const response = await fetch(
      `${API_BASE}?action=updateOnKabulFields&docId=${encodeURIComponent(docId)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      }
    );
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
    const response = await fetch(
      `${API_BASE}?action=markExtraBox&docId=${encodeURIComponent(docId)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      }
    );
    if (!response.ok) {
      throw new Error("markExtraBox API güncellemesi başarısız oldu");
    }
  } catch (error) {
    console.error("markExtraBox Hatası:", error);
    throw error;
  }
};

/**
 * Rapor verilerini çekme.
 */
export const getRaporData = async (PAAD_ID) => {
  try {
    const response = await fetch(
      `${API_BASE}?action=getRaporData&PAAD_ID=${encodeURIComponent(PAAD_ID)}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("getRaporData Hatası:", error);
    return [];
  }
};

/**
 * Yeni kullanıcı oluşturma.
 */
export const createUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE}?action=createUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    // API, oluşturulan kullanıcı doküman ID'sini "userId" alanı altında döndürüyor varsayılıyor
    return data.userId;
  } catch (error) {
    console.error("createUser Hatası:", error);
    throw error;
  }
};

/**
 * Yeni bir shipment ekleme.
 */
export const addShipment = async (shipmentData) => {
  try {
    const response = await fetch(`${API_BASE}?action=addShipment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(shipmentData),
    });
    const data = await response.json();
    // API, oluşturulan shipment doküman ID'sini "shipmentId" olarak döndürüyor varsayılıyor
    return data.shipmentId;
  } catch (error) {
    console.error("addShipment Hatası:", error);
    throw error;
  }
};
