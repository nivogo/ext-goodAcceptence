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

// Kullanıcı verisini çekme
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

// Top 100 shipment_data verisini çekme
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

// QR bazlı arama yapma
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

// Tüm shipment_data verilerini çekme (sınırsız)
export const getAllShipments = async () => {
  try {
    const q = collection(db, "shipment_data");
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

// Belirli docId'li shipment_data dokümanında ön kabul alanlarını güncelle
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

// Diğer mağazalardaki kolileri kontrol etme
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

// Fazla koli olarak işaretleme
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

// Mal Kabul verilerini çekme
export const getMalKabulData = async (PAAD_ID) => {
  try {
    const q = query(
      collection(db, "mal_kabul_data"),
      where("PAAD_ID", "==", PAAD_ID)
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

// Rapor verilerini çekme
export const getRaporData = async (PAAD_ID) => {
  try {
    const q = query(
      collection(db, "rapor_data"),
      where("PAAD_ID", "==", PAAD_ID)
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

// Yeni kullanıcı oluşturma fonksiyonu
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

// Yeni bir shipment ekleme
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
