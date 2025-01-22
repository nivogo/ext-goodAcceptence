// src/data/shipmentData.js
import { db } from "../../firebaseConfig.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// storeId bazında belge çekme
export async function getShipmentsForStore(storeId) {
  const colRef = collection(db, "shipment_data");
  const qRef = query(colRef, where("storeId", "==", storeId));
  const snap = await getDocs(qRef);
  const dataList = [];
  snap.forEach(docSnap => {
    let d = docSnap.data();
    d._id = docSnap.id;
    dataList.push(d);
  });
  return dataList;
}
