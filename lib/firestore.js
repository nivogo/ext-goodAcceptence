// lib/firestore.js
import { db } from "../firebase/firebaseConfig";
import { collection, doc, getDoc, getDocs, query, where, updateDoc, serverTimestamp } from "firebase/firestore";

export async function getUserData(uid) {
  // users koleksiyonundaki kullanıcı verilerini çek
  const docRef = doc(db, "users", uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}

export async function getShipmentsByStoreId(storeId) {
  // storeId eşleşen shipment_data dokümanlarını çek
  const q = query(collection(db, "shipment_data"), where("storeId", "==", storeId));
  const snap = await getDocs(q);
  const result = [];
  snap.forEach((doc) => {
    result.push({ id: doc.id, ...doc.data() });
  });
  return result;
}

export async function updateOnKabulFields(docId, username) {
  // Belirli docId'li shipment_data dokümanında ön kabul alanlarını güncelle
  const docRef = doc(db, "shipment_data", docId);
  await updateDoc(docRef, {
    onKabulDurumu: "Okutma Başarılı",
    onKabulYapanKisi: username,
    onKabulSaati: serverTimestamp(),
  });
}
