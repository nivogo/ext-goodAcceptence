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

export const getBoxesForBasariliKolilerByPreAccept = async (paad_id) => {
  try {
    await refreshAuthorization();
    const url = buildUrl({ pre_accept_wh_id: paad_id });
    console.log("getBoxesForBasariliKolilerByPreAccept: URL", url);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic ".concat(localStorage.getItem("basicAuth"))
      }
    });
    const json = await response.json();
    console.log("getBoxesForBasariliKolilerByPreAccept: JSON", json);
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("getBoxesForBasariliKolilerByPreAccept Hatası:", error);
    return [];
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
export const updateMalKabulFields = async (id, username, paad_id) => {
  try {
    await refreshAuthorization();
    const bodyData = {
      where: { id: id },
      data: {
        mal_Kabul_durumu: 1,
        mal_kabul_yapan_kisi: username,
        mal_kabul_saati: new Date().toISOString(),
        accept_wh_id: paad_id,
        accept_datetime: new Date().toISOString(),
        adres: "REYON",
        adresleme_saati: new Date().toISOString(),
        adresleme_yapan_kisi: username
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
export const updateOnKabulFields = async (id, username, paad_id) => {
  try {
    await refreshAuthorization();
    console.log("updateOnKabulFields: paad_id gönderiliyor:", paad_id);
    const bodyData = {
      where: { id: id },
      data: {
        on_kabul_durumu: 1,
        on_kabul_yapan_kisi: username,
        on_kabul_saati: new Date().toISOString(),
        pre_accept_wh_id: paad_id,
        pre_accept_datetime: new Date().toISOString(),
        adres: "DEPO",
        adresleme_saati: new Date().toISOString(),
        adresleme_yapan_kisi: username
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
export const markExtraBox = async (id, username, paad_id) => {
  try {
    await refreshAuthorization();
    console.log("markExtraBox: paad_id gönderiliyor:", paad_id);
    const bodyData = {
      where: { id },
      data: {
        on_kabul_durumu: 2, // Koli başka bir mağazaya aitse "2" olarak işaretle
        on_kabul_yapan_kisi: username, 
        on_kabul_saati: new Date().toISOString(),
        pre_accept_wh_id: paad_id,
        pre_accept_datetime: new Date().toISOString(),
        adres: "DEPO",
        adresleme_saati: new Date().toISOString(),
        adresleme_yapan_kisi: username
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

export const updateQRForDifferent = async (id, username, paad_id) => {
  try {
    await refreshAuthorization();
    console.log("updateQRForDifferent: paad_id gönderiliyor:", paad_id);
    const bodyData = {
      where: { id },
      data: {
        mal_kabul_durumu: "2", // Farklı mağazaya ait olduğu için "2"
        mal_kabul_yapan_kisi: username,
        mal_kabul_saati: new Date().toISOString(),
        accept_wh_id: paad_id, // Kullanıcının paad_id'si
        accept_datetime: new Date().toISOString(),
        adres: "REYON",
        adresleme_yapan_kisi: username,
        adresleme_saati: new Date().toISOString()
      }
    };
    console.log("updateQRForDifferent: Body data prepared:", bodyData);
    
    const response = await fetch(API_BASE, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic ".concat(localStorage.getItem("basicAuth"))
      },
      body: JSON.stringify(bodyData)
    });
    
    console.log("updateQRForDifferent: Response received:", response);
    
    if (!response.ok) {
      throw new Error("updateQRForDifferent API güncellemesi başarısız oldu");
    }
  } catch (error) {
    console.error("updateQRForDifferent Hatası:", error);
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

export const addMissingBox = async (box, paad_id, username) => {
  try {
    await refreshAuthorization();
    console.log("addMissingBox: Authorization refreshed.");

    // Yeni shipment verisi: Eksik olan koli için gerekli alanlar
    const shipmentData = {
        box: box,
        paad_id: paad_id,
        on_kabul_durumu: 3, // 3: Eksik koli için işaretleme
        on_kabul_yapan_kisi: username,
        on_kabul_saati: new Date().toISOString(),
        pre_accept_wh_id: paad_id,         // pre_accept_wh_id, okutmayı yapanın paad_id'si
        pre_accept_datetime: new Date().toISOString(),
        box_exist: "false",   // Yeni eklenen koli, veri tabanında mevcut değil
        adres: "DEPO",
        adresleme_saati: new Date().toISOString(),
        adresleme_yapan_kisi: username
    };
    const bodyData = { data: shipmentData };
    console.log("addMissingBox: Body data prepared:", bodyData);

    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic ".concat(localStorage.getItem("basicAuth"))
      },
      body: JSON.stringify(bodyData),
    });

    console.log("addMissingBox: Response received:", response);

    if (!response.ok) {
      throw new Error("addMissingBox API güncellemesi başarısız oldu");
    }

    const json = await response.json();
    console.log("addMissingBox: JSON parsed:", json);
    return json;
  } catch (error) {
    console.error("addMissingBox Hatası:", error);
    throw error;
  }
};


// Yeni fonksiyon: Okutulan QR veritabanında yoksa yeni satır ekle (QR bazlı)
export const addMissingQR = async (qr, box, paad_id, username) => {
  try {
    await refreshAuthorization();
    console.log("addMissingQR: Authorization refreshed.");
    const shipmentData = {
      qr: qr,
      box: box,
      paad_id: paad_id,
      on_kabul_durumu: 1,
      on_kabul_yapan_kisi: username,
      on_kabul_saati: new Date().toISOString(),
      pre_accept_wh_id: paad_id,
      pre_accept_datetime: new Date().toISOString(),
      box_exist: "true",
      qr_exist: "false",
      mal_kabul_durumu: 3,
      mal_kabul_yapan_kisi: username,
      mal_kabul_saati: new Date().toISOString(),
      accept_wh_id: paad_id,
      accept_datetime: new Date().toISOString(),
      adres: "REYON",
      adresleme_yapan_kisi: username,
      adresleme_saati: new Date().toISOString()
    };
    const bodyData = { data: shipmentData };
    console.log("addMissingQR: Body data prepared:", bodyData);
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + localStorage.getItem("basicAuth")
      },
      body: JSON.stringify(bodyData),
    });
    console.log("addMissingQR: Response received:", response);
    if (!response.ok) {
      throw new Error("addMissingQR API güncellemesi başarısız oldu");
    }
    const json = await response.json();
    console.log("addMissingQR: JSON parsed:", json);
    return json;
  } catch (error) {
    console.error("addMissingQR Hatası:", error);
    throw error;
  }
};
