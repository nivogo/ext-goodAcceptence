// lib/firestore.js
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
  setDoc,
  serverTimestamp,
  limit as firestoreLimit,
} from "firebase/firestore";

/**
 * Kullanıcı verisini çekme
 * @param {string} uid - Kullanıcının UID'si
 * @returns {object|null} - Kullanıcı verisi veya null
 */
export const getUserData = async (uid) => {
  try {
    const q = query(collection(db, "users"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { ...userDoc.data(), id: userDoc.id };
    }
    return null;
  } catch (error) {
    console.error("getUserData Hatası:", error);
    return null;
  }
};

/**
 * Top 100 shipment_data verisini çekme
 * @returns {Array} - Shipment verileri
 */
export const getTop100Shipments = async () => {
  try {
    const q = query(collection(db, "shipment_data"), firestoreLimit(100));
    const querySnapshot = await getDocs(q);
    const shipments = [];
    querySnapshot.forEach((doc) => {
      shipments.push({ id: doc.id, ...doc.data() });
    });
    return shipments;
  } catch (error) {
    console.error("getTop100Shipments Hatası:", error);
    return [];
  }
};

/**
 * QR bazlı arama yapma
 * @param {string} qr - QR kodu
 * @returns {Array} - Eşleşen shipment verileri
 */
export const searchShipmentsByQR = async (qr) => {
  try {
    const q = query(
      collection(db, "shipment_data"),
      where("QR", "==", qr)
    );
    const querySnapshot = await getDocs(q);
    const shipments = [];
    querySnapshot.forEach((doc) => {
      shipments.push({ id: doc.id, ...doc.data() });
    });
    return shipments;
  } catch (error) {
    console.error("searchShipmentsByQR Hatası:", error);
    return [];
  }
};

/**
 * Tüm shipment_data verilerini çekme (sınırsız)
 * @returns {Array} - Tüm shipment verileri
 */
export const getAllShipments = async () => {
  try {
    const q = query(collection(db, "shipment_data"));
    const querySnapshot = await getDocs(q);
    const shipments = [];
    querySnapshot.forEach((doc) => {
      shipments.push({ id: doc.id, ...doc.data() });
    });
    return shipments;
  } catch (error) {
    console.error("getAllShipments Hatası:", error);
    return [];
  }
};

/**
 * PAAD_ID'ye göre gönderimleri çekme
 * @param {number|string} PAAD_ID - PAAD ID
 * @returns {Array} - Eşleşen shipment verileri
 */
export const getShipmentsByPAADID = async (PAAD_ID) => {
  try {
    const q = query(
      collection(db, "shipment_data"),
      where("PAAD_ID", "==", Number(PAAD_ID))
    );
    const querySnapshot = await getDocs(q);
    const shipments = [];
    querySnapshot.forEach((doc) => {
      shipments.push({ id: doc.id, ...doc.data() });
    });
    return shipments;
  } catch (error) {
    console.error("getShipmentsByPAADID Hatası:", error);
    throw error; // Throw error to be handled by the calling function
  }
};

/**
 * "Okutma Başarılı" olan kolileri çekme
 * @param {number|string} PAAD_ID - Kullanıcının PAAD ID'si
 * @returns {Array} - Başarılı koliler
 */
export const getSuccessfulBoxes = async (PAAD_ID) => {
  try {
    const q = query(
      collection(db, "shipment_data"),
      where("PAAD_ID", "==", Number(PAAD_ID)),
      where("onKabulDurumu", "==", "Okutma Başarılı")
    );
    const querySnapshot = await getDocs(q);
    const successfulBoxes = [];
    querySnapshot.forEach((doc) => {
      successfulBoxes.push({ id: doc.id, ...doc.data() });
    });
    return successfulBoxes;
  } catch (error) {
    console.error("getSuccessfulBoxes Hatası:", error);
    return [];
  }
};

/**
 * Belirli docId'li shipment_data dokümanında ön kabul alanlarını güncelle
 * @param {string} docId - Doküman ID'si
 * @param {string} username - Güncelleyen kullanıcı adı
 */
export const updateOnKabulFields = async (docId, username) => {
  try {
    const docRef = doc(db, "shipment_data", docId);
    await updateDoc(docRef, {
      onKabulDurumu: "Okutma Başarılı",
      onKabulYapanKisi: username,
      onKabulSaati: serverTimestamp(),
      isApproved: true, // Onaylanmış olarak işaretle
    });
  } catch (error) {
    console.error("updateOnKabulFields Hatası:", error);
    throw error;
  }
};

/**
 * Tüm shipment_data verilerini çekme
 * @returns {Array} - Tüm shipment verileri
 */
export const getShipmentByBox = async (box) => {
  try {
    const q = query(collection(db, "shipment_data"), where("box", "==", box));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const shipments = [];
      querySnapshot.forEach((doc) => {
        shipments.push({ id: doc.id, ...doc.data() });
      });
      return shipments;
    }
    return [];
  } catch (error) {
    console.error("getShipmentByBox Hatası:", error);
    return [];
  }
};

/**
 * Fazla koli olarak işaretleme
 * @param {string} docId - Doküman ID'si
 * @param {string} username - Güncelleyen kullanıcı adı
 */
export const markExtraBox = async (docId, username) => {
  try {
    const docRef = doc(db, "shipment_data", docId);
    await updateDoc(docRef, {
      onKabulDurumu: "Fazla Koli-Hatalı Mağaza",
      onKabulYapanKisi: username,
      onKabulSaati: serverTimestamp(),
    });
  } catch (error) {
    console.error("markExtraBox Hatası:", error);
    throw error;
  }
};

/**
 * Mal Kabul verilerini çekme
 * @param {number|string} PAAD_ID - PAAD ID
 * @returns {Array} - Mal Kabul verileri
 */
export const getMalKabulData = async (PAAD_ID) => {
  try {
    const q = query(
      collection(db, "mal_kabul_data"),
      where("PAAD_ID", "==", Number(PAAD_ID))
    );
    const snap = await getDocs(q);
    const result = [];
    snap.forEach((doc) => {
      result.push({ id: doc.id, ...doc.data() });
    });
    return result;
  } catch (error) {
    console.error("getMalKabulData Hatası:", error);
    return [];
  }
};

/**
 * Rapor verilerini çekme
 * @param {number|string} PAAD_ID - PAAD ID
 * @returns {Array} - Rapor verileri
 */
export const getRaporData = async (PAAD_ID) => {
  try {
    const q = query(
      collection(db, "rapor_data"),
      where("PAAD_ID", "==", Number(PAAD_ID))
    );
    const snap = await getDocs(q);
    const result = [];
    snap.forEach((doc) => {
      result.push({ id: doc.id, ...doc.data() });
    });
    return result;
  } catch (error) {
    console.error("getRaporData Hatası:", error);
    return [];
  }
};

/**
 * Yeni kullanıcı oluşturma fonksiyonu
 * @param {object} userData - Kullanıcı verileri
 * @returns {string} - Oluşturulan kullanıcı doküman ID'si
 */
export const createUser = async (userData) => {
  try {
    const userRef = doc(collection(db, "users"));
    await setDoc(userRef, {
      PAAD_ID: Number(userData.PAAD_ID),
      createdAt: serverTimestamp(),
      name: userData.name,
      password: userData.password, // Güvenlik açısından şifreyi burada saklamamak daha iyi olabilir
      storeName: userData.storeName,
      uid: userData.uid,
      username: userData.username,
    });
    return userRef.id;
  } catch (error) {
    console.error("createUser Hatası:", error);
    throw error;
  }
};

/**
 * Yeni bir shipment ekleme
 * @param {object} shipmentData - Shipment verileri
 * @returns {string} - Oluşturulan shipment doküman ID'si
 */
export const addShipment = async (shipmentData) => {
  try {
    const shipmentRef = doc(collection(db, "shipment_data"));
    await setDoc(shipmentRef, {
      PAAD_ID: Number(shipmentData.PAAD_ID),
      QR: shipmentData.QR,
      WAOT_CODE: shipmentData.WAOT_CODE,
      barcode: shipmentData.barcode,
      box: shipmentData.box,
      brand: shipmentData.brand,
      color: shipmentData.color,
      detail_category: shipmentData.detail_category,
      from_location: shipmentData.from_location,
      from_locationid: shipmentData.from_locationid,
      main_category: shipmentData.main_category,
      quantityof_box: shipmentData.quantityof_box,
      quantityof_product: shipmentData.quantityof_product,
      shipment_date: shipmentData.shipment_date,
      shipment_no: shipmentData.shipment_no,
      size: shipmentData.size,
      sub_category: shipmentData.sub_category,
      to_location: shipmentData.to_location,
      createdAt: serverTimestamp(),
    });
    return shipmentRef.id;
  } catch (error) {
    console.error("addShipment Hatası:", error);
    throw error;
  }
};
