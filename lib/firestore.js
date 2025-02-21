// lib/firestore.js

const API_BASE = "https://accept.hayatadondur.com/acceptance/index.php";

/**
 * GET istekleri için verilen alanları (fields) query string olarak oluşturur.
 * Örneğin, { qr: "123" } -> "qr=123"
 */
const getQueryString = (fields) => {
  const params = new URLSearchParams();
  Object.keys(fields).forEach((key) => {
    if (fields[key] !== undefined && fields[key] !== null) {
      params.set(key, fields[key]);
    }
  });
  return params.toString();
};

/**
 * Her istek öncesinde kullanıcı girişini (authorization) yenilemek için çağrılır.
 */
const refreshAuthorization = async () => {
  const basicAuth = localStorage.getItem("basicAuth");
  if (!basicAuth) {
    throw new Error("Kimlik doğrulama bilgileri bulunamadı.");
  }
  const bodyData = {
    where: { id: -1 },
    data: { paad_id: -1 },
  };
  const response = await fetch(`${API_BASE}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${basicAuth}`,
    },
    body: JSON.stringify(bodyData),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Kullanıcı girişi yenilenemedi.");
  }
};

/* ================= GET METODLARI ================= */

/**
 * Kullanıcı verisini REST API üzerinden çekme.
 * Eğer uid sağlanırsa, URL query parametresi olarak ?uid=<value> eklenir.
 */
export const getUserData = async (uid) => {
  try {
    await refreshAuthorization();
    const queryString = getQueryString(uid ? { uid } : {});
    const response = await fetch(`${API_BASE}?${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${localStorage.getItem("basicAuth")}`,
      },
    });
    const json = await response.json();
    return json;
  } catch (error) {
    console.error("getUserData Hatası:", error);
    return null;
  }
};

/**
 * QR koduna göre shipment verilerini arama.
 * URL’ye ?qr=<value> eklenir.
 */
export const searchShipmentsByQR = async (qr) => {
  try {
    await refreshAuthorization();
    const queryString = getQueryString({ qr });
    const response = await fetch(`${API_BASE}?${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${localStorage.getItem("basicAuth")}`,
      },
    });
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
    await refreshAuthorization();
    const queryString = getQueryString({});
    const response = await fetch(`${API_BASE}?${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${localStorage.getItem("basicAuth")}`,
      },
    });
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getAllShipments Hatası:", error);
    return [];
  }
};

/**
 * Belirli adres değerine göre shipment verilerini çekme.
 * URL’ye ?adres=<adresValue> eklenir.
 */
export const getShipmentsByAdres = async (adresValue) => {
  try {
    await refreshAuthorization();
    const queryString = getQueryString({ adres: adresValue });
    const response = await fetch(`${API_BASE}?${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${localStorage.getItem("basicAuth")}`,
      },
    });
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getShipmentsByAdres Hatası:", error);
    return [];
  }
};

/**
 * QR koduna göre gönderiyi çekme.
 * URL’ye ?qr=<qr> eklenir.
 */
export const getShipmentByQR = async (qr) => {
  try {
    await refreshAuthorization();
    const queryString = getQueryString({ qr });
    const response = await fetch(`${API_BASE}?${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${localStorage.getItem("basicAuth")}`,
      },
    });
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getShipmentByQR Hatası:", error);
    return [];
  }
};

/**
 * PAAD_ID'ye göre gönderimleri çekme.
 * URL’ye ?paad_id=<paad_id> eklenir.
 */
export const getShipmentsByPAADID = async (paad_id) => {
  try {
    await refreshAuthorization();
    const queryString = getQueryString({ paad_id });
    const response = await fetch(`${API_BASE}?${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${localStorage.getItem("basicAuth")}`,
      },
    });
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getShipmentsByPAADID Hatası:", error);
    throw error;
  }
};

/**
 * Belirli koli numarasına göre gönderileri çekme.
 * URL’ye ?box=<box> eklenir.
 */
export const getShipmentByBox = async (box) => {
  try {
    await refreshAuthorization();
    const queryString = getQueryString({ box });
    const response = await fetch(`${API_BASE}?${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${localStorage.getItem("basicAuth")}`,
      },
    });
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getShipmentByBox Hatası:", error);
    return [];
  }
};

/**
 * PAAD_ID'ye göre başarılı kolileri çekme.
 * URL’ye ?paad_id=<paad_id> eklenir.
 */
export const getBoxesForBasariliKoliler = async (paad_id) => {
  try {
    await refreshAuthorization();
    const queryString = getQueryString({ paad_id });
    const response = await fetch(`${API_BASE}?${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${localStorage.getItem("basicAuth")}`,
      },
    });
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getBoxesForBasariliKoliler Hatası:", error);
    throw error;
  }
};

/**
 * "Okutma Başarılı" durumundaki kolileri çekme.
 * URL’ye ?paad_id=<paad_id> eklenir.
 */
export const getSuccessfulBoxes = async (paad_id) => {
  try {
    await refreshAuthorization();
    const queryString = getQueryString({ paad_id });
    const response = await fetch(`${API_BASE}?${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${localStorage.getItem("basicAuth")}`,
      },
    });
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getSuccessfulBoxes Hatası:", error);
    return [];
  }
};

/**
 * onKabulDurumu dolu kolileri çekme.
 * URL’ye ?paad_id=<paad_id> eklenir.
 */
export const getBoxesWithOnKabulDurumu = async (paad_id) => {
  try {
    await refreshAuthorization();
    const queryString = getQueryString({ paad_id });
    const response = await fetch(`${API_BASE}?${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${localStorage.getItem("basicAuth")}`,
      },
    });
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getBoxesWithOnKabulDurumu Hatası:", error);
    throw error;
  }
};

/* ================= PUT METODLARI ================= */

/**
 * Belirli bir gönderi dokümanında Mal Kabul alanlarını güncelleme.
 * Body yapısı: { where: { id: <docId> }, data: { malKabulYapanKisi, malKabulSaati } }
 */
export const updateMalKabulFields = async (docId, username) => {
  try {
    await refreshAuthorization();
    const bodyData = {
      where: { id: docId },
      data: { malKabulYapanKisi: username, malKabulSaati: new Date().toISOString() },
    };
    const response = await fetch(`${API_BASE}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${localStorage.getItem("basicAuth")}`,
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
 * Belirli bir gönderi dokümanında ön kabul alanlarını güncelleme.
 * Body yapısı: { where: { id: <docId> }, data: { onKabulYapanKisi, onKabulSaati } }
 */
export const updateOnKabulFields = async (docId, username) => {
  try {
    await refreshAuthorization();
    const bodyData = {
      where: { id: docId },
      data: { onKabulYapanKisi: username, onKabulSaati: new Date().toISOString() },
    };
    const response = await fetch(`${API_BASE}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${localStorage.getItem("basicAuth")}`,
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
 * Body yapısı: { where: { id: <docId> }, data: { extraBoxMarkedBy, extraBoxMarkedAt } }
 */
export const markExtraBox = async (docId, username) => {
  try {
    await refreshAuthorization();
    const bodyData = {
      where: { id: docId },
      data: { extraBoxMarkedBy: username, extraBoxMarkedAt: new Date().toISOString() },
    };
    const response = await fetch(`${API_BASE}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${localStorage.getItem("basicAuth")}`,
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
 * Adres güncellemesi.
 * Body yapısı: { where: { id: <docId> }, data: { adres, adreslemeYapanKisi, adreslemeSaati } }
 */
export const updateAdres = async (docId, newAdres, username) => {
  try {
    await refreshAuthorization();
    const bodyData = {
      where: { id: docId },
      data: {
        adres: newAdres,
        adreslemeYapanKisi: username,
        adreslemeSaati: new Date().toISOString(),
      },
    };
    const response = await fetch(`${API_BASE}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${localStorage.getItem("basicAuth")}`,
      },
      body: JSON.stringify(bodyData),
    });
    if (!response.ok) {
      throw new Error("updateAdres API güncellemesi başarısız oldu");
    }
  } catch (error) {
    console.error("updateAdres Hatası:", error);
    throw error;
  }
};

/* ================= POST METODU ================= */

/**
 * Yeni bir shipment ekleme.
 * Body yapısı: { data: { paad_id, qr, created_at } }
 */
export const addShipment = async (shipmentData) => {
  try {
    await refreshAuthorization();
    const bodyData = { data: shipmentData };
    const response = await fetch(`${API_BASE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${localStorage.getItem("basicAuth")}`,
      },
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
