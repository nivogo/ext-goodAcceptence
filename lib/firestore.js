// lib/firestore.js
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
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

// Mağaza ID'sine göre sevk edilen kolileri çekme
export const getShipmentsByStoreId = async (storeId) => {
  try {
    const q = query(
      collection(db, "shipment_data"),
      where("storeId", "==", storeId)
    );
    const snap = await getDocs(q);
    const result = [];
    snap.forEach((doc) => {
      result.push({ id: doc.id, ...doc.data() });
    });
    return result;
  } catch (error) {
    console.error("getShipmentsByStoreId Hatası:", error);
    return [];
  }
};

// Tüm kolileri çekme
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

// Mal Kabul verilerini çekme (Mevcut Fonksiyon, Gerekirse Düzenleyebilirsiniz)
export const getMalKabulData = async (storeId) => {
  try {
    const q = query(
      collection(db, "mal_kabul_data"),
      where("storeId", "==", storeId)
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

// Rapor verilerini çekme (Mevcut Fonksiyon, Gerekirse Düzenleyebilirsiniz)
export const getRaporData = async (storeId) => {
  try {
    const q = query(
      collection(db, "rapor_data"),
      where("storeId", "==", storeId)
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
