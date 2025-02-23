// lib/firestore.js

const API_BASE = "https://accept.hayatadondur.com/acceptance/index.php";

/**
 * GET istekleri için URL'ye query parametreleri ekler.
 * Eğer fields boş ise doğrudan API_BASE döner.
 */
const buildUrl = (fields) => {
  console.log("buildUrl: Gelen fields:", fields);
  const query = Object.keys(fields)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(fields[key])}`)
    .join('&');
  console.log("buildUrl: Oluşturulan query string:", query);
  const url = query ? `${API_BASE}?${query}` : API_BASE;
  console.log("buildUrl: Oluşturulan URL:", url);
  return url;
};

/**
 * Her istek öncesinde temel kimlik doğrulamasını (authorization) yeniler.
 * (PUT isteği ile "id: -1", "paad_id: -1" gönderilir.)
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
  const response = await fetch(API_BASE, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic ".concat(basicAuth)
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
 * Kullanıcı verisini çekme.
 * Eğer uid sağlanırsa, URL’ye ?uid=<value> eklenir.
 */
export const getUserData = async (username) => {
  try {
    await refreshAuthorization();
    const url = buildUrl(username ? { username } : {});
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic ".concat(localStorage.getItem("basicAuth"))
      }
    });
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : json;
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
    const url = buildUrl({ qr });
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic ".concat(localStorage.getItem("basicAuth"))
      }
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
export const getAllShipments = async (paad_id) => {
  try {
    console.log("getAllShipments: Refreshing authorization...");
    await refreshAuthorization();
    console.log("getAllShipments: Authorization refreshed.");

    // Filtre olmadığı için boş nesne gönderiyoruz
    const url = buildUrl({ paad_id });
    console.log("getAllShipments: Fetching all shipments from", url);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic ".concat(localStorage.getItem("basicAuth"))
      }
    });
    console.log("getAllShipments: Response received:", response);

    const json = await response.json();
    console.log("getAllShipments: JSON parsed:", json);

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
    const url = buildUrl({ adres: adresValue });
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic ".concat(localStorage.getItem("basicAuth"))
      }
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
 * URL’ye ?qr=<value> eklenir.
 */
export const getShipmentByQR = async (qr) => {
  try {
    await refreshAuthorization();
    const url = buildUrl({ qr });
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic ".concat(localStorage.getItem("basicAuth"))
      }
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
    const url = buildUrl({ paad_id });
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic ".concat(localStorage.getItem("basicAuth"))
      }
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
 * URL’ye ?box=<value> eklenir.
 */
export const getShipmentByBox = async (box) => {
  try {
    await refreshAuthorization();
    const url = buildUrl({ box });
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic ".concat(localStorage.getItem("basicAuth"))
      }
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
    const url = buildUrl({ paad_id });
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic ".concat(localStorage.getItem("basicAuth"))
      }
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
    const url = buildUrl({ paad_id });
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic ".concat(localStorage.getItem("basicAuth"))
      }
    });
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getSuccessfulBoxes Hatası:", error);
    return [];
  }
};

/**
 * on_kabul_durumu dolu kolileri çekme.
 * URL’ye ?paad_id=<paad_id> eklenir.
 */
export const getBoxesWithOnKabulDurumu = async (paad_id) => {
  try {
    await refreshAuthorization();
    const url = buildUrl({ paad_id });
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic ".concat(localStorage.getItem("basicAuth"))
      }
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
 * Body: { where: { id: <id> }, data: { mal_Kabul_durumu, mal_kabul_yapan_kisi, mal_kabul_saati } }
 */
export const updateMalKabulFields = async (id, username) => {
  try {
    await refreshAuthorization();
    const bodyData = {
      where: { id: id },
      data: {
        mal_Kabul_durumu: "Okutma Başarılı",
        mal_kabul_yapan_kisi: username,
        mal_kabul_saati: new Date().toISOString(),
      },
    };
    const response = await fetch(API_BASE, {
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
    console.log(`Gönderi ID: ${id} için Mal Kabul alanları başarıyla güncellendi.`);
  } catch (error) {
    console.error("updateMalKabulFields Hatası:", error);
    throw error;
  }
};

/**
 * Belirli bir gönderi dokümanında ön kabul alanlarını güncelleme.
 * Body: { where: { id: <id> }, data: { on_kabul_yapan_kisi, on_kabul_saati } }
 */
export const updateOnKabulFields = async (id, username) => {
  try {
    await refreshAuthorization();
    const bodyData = {
      where: { id: id },
      data: {
        on_kabul_durumu: 1,
        on_kabul_yapan_kisi: username,
        on_kabul_saati: new Date().toISOString(),
      },
    };
    const response = await fetch(API_BASE, {
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
 * Body: { where: { id: <id> }, data: { extraBoxMarkedBy, extraBoxMarkedAt } }
 */
export const markExtraBox = async (id, username) => {
  try {
    await refreshAuthorization();
    const bodyData = {
      where: { id },
      data: {
        on_kabul_durumu: 2, // Koli başka bir mağazaya aitse "2" olarak işaretle
        on_kabul_yapan_kisi: username, 
        on_kabul_saati: new Date().toISOString(),
      },
    };
    const response = await fetch(API_BASE, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic ".concat(localStorage.getItem("basicAuth"))
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
 * Body: { where: { id: <id> }, data: { adres, adresleme_yapan_kisi, adresleme_saati } }
 */
export const updateAdres = async (id, newAdres, username) => {
  try {
    await refreshAuthorization();
    const bodyData = {
      where: { id: id },
      data: {
        adres: newAdres,
        adresleme_yapan_kisi: username,
        adresleme_saati: new Date().toISOString(),
      },
    };
    const response = await fetch(API_BASE, {
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
 * Body: { data: { paad_id, qr, created_at } }
 */
export const addShipment = async (shipmentData) => {
  try {
    await refreshAuthorization();
    const bodyData = { data: shipmentData };
    const response = await fetch(API_BASE, {
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
