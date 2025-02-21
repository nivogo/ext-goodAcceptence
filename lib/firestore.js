// lib/firestore.js

const API_BASE = "https://accept.hayatadondur.com/acceptance/index.php";

/**
 * GET istekleri için "where" koşulunu URL query parametresi olarak oluşturur.
 */
const getQueryStringForWhere = (whereClause) => {
  const queryParams = new URLSearchParams();
  queryParams.set("where", JSON.stringify(whereClause));
  return queryParams.toString();
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
 */
export const getUserData = async (uid) => {
  try {
    await refreshAuthorization();
    const queryString = getQueryStringForWhere(uid ? { uid } : {});
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
 */
export const searchShipmentsByQR = async (qr) => {
  try {
    await refreshAuthorization();
    const queryString = getQueryStringForWhere({ qr });
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
    const queryString = getQueryStringForWhere({});
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
 */
export const getShipmentsByAdres = async (adresValue) => {
  try {
    await refreshAuthorization();
    const queryString = getQueryStringForWhere({ adres: adresValue });
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
 */
export const getShipmentByQR = async (qr) => {
  try {
    await refreshAuthorization();
    const queryString = getQueryStringForWhere({ qr });
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
 */
export const getShipmentsByPAADID = async (paad_id) => {
  try {
    await refreshAuthorization();
    const queryString = getQueryStringForWhere({ paad_id });
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
 */
export const getShipmentByBox = async (box) => {
  try {
    await refreshAuthorization();
    const queryString = getQueryStringForWhere({ box });
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
 * PAAD_ID veya onKabulDurumu bilgisine göre başarılı kolileri çekme.
 */
export const getBoxesForBasariliKoliler = async (paad_id) => {
  try {
    await refreshAuthorization();
    const queryString = getQueryStringForWhere({ paad_id });
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
 */
export const getSuccessfulBoxes = async (paad_id) => {
  try {
    await refreshAuthorization();
    const queryString = getQueryStringForWhere({ paad_id });
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
 */
export const getBoxesWithOnKabulDurumu = async (paad_id) => {
  try {
    await refreshAuthorization();
    const queryString = getQueryStringForWhere({ paad_id });
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
 * Güncelleme için body yapısı: { where: { id: <docId> }, data: { <alanlar> } }
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
 * Adres güncellemesi (ör. adres, adresleme yapan kişi, adresleme saati)
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
 * POST için body yapısı: { data: { paad_id, qr, created_at } }
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
