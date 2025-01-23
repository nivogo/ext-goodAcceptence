// pages/onKabul.js
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext"; // Güncellenmiş import
import { getShipmentsByStoreId, updateOnKabulFields } from "../lib/firestore";
import BackButton from "../components/BackButton";

export default function OnKabulPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [boxInput, setBoxInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      if (user && userData && userData.storeId) {
        const shipmentsList = await getShipmentsByStoreId(userData.storeId);
        setShipments(shipmentsList);
      }
      setLoading(false);
    };

    if (user && userData) {
      fetchShipments();
    } else {
      setLoading(false);
      router.push("/");
    }
  }, [user, userData, router]);

  const formatDate = (date) => {
    if (!date) return "-";
    if (date.toDate) {
      return date.toDate().toLocaleString();
    }
    const parsedDate = new Date(date);
    return isNaN(parsedDate) ? "-" : parsedDate.toLocaleString();
  };

  const handleBoxSubmit = async (e) => {
    e.preventDefault();
    if (!boxInput) return;

    try {
      const matchingDocs = shipments.filter((doc) => doc.box === boxInput);

      if (matchingDocs.length > 0) {
        await Promise.all(
          matchingDocs.map((docItem) =>
            updateOnKabulFields(docItem.id, userData.name)
          )
        );

        const updatedShipments = shipments.map((item) => {
          if (item.box === boxInput) {
            return {
              ...item,
              onKabulDurumu: "Okutma Başarılı",
              onKabulYapanKisi: userData.name,
              onKabulSaati: new Date().toISOString(),
            };
          }
          return item;
        });
        setShipments(updatedShipments);

        alert("Koli numarası başarıyla okutuldu!");
      } else {
        alert("Girilen koli numarası, bu mağaza için mevcut değil.");
      }
      setBoxInput("");
    } catch (error) {
      console.error("Ön Kabul Güncelleme Hatası:", error);
      alert("Ön kabul işlemi sırasında bir hata oluştu.");
    }
  };

  if (loading) {
    return <p>Yükleniyor...</p>;
  }

  if (!user || !userData) {
    return null;
  }

  return (
    <div style={{ margin: "2rem" }}>
      <BackButton />
      <h1>Hoş Geldiniz, {userData.name}</h1>
      <p>Mağaza: {userData.storeName} (Store ID: {userData.storeId})</p>

      <form onSubmit={handleBoxSubmit} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Koli numarası giriniz"
          value={boxInput}
          onChange={(e) => setBoxInput(e.target.value)}
          style={{ marginRight: "1rem" }}
        />
        <button type="submit">Onayla</button>
      </form>

      <p>Toplam Koli Adedi: {shipments.length}</p>

      <table border="1" cellPadding="5" cellSpacing="0">
        <thead>
          <tr>
            <th>Sıra No</th>
            <th>Gönderici Lokasyon Adı</th>
            <th>Alıcı Lokasyon Adı</th>
            <th>Koli Numarası</th>
            <th>Sevk Tarihi</th>
            <th>Sevkiyat Numarası</th>
            <th>Ürün Adedi</th>
            <th>Ön Kabul Durumu</th>
            <th>Ön Kabul Yapan Kişi</th>
            <th>Ön Kabul Saati</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>{item.from_location}</td>
              <td>{item.to_location}</td>
              <td>{item.box}</td>
              <td>{item.shipment_date}</td>
              <td>{item.shipment_no}</td>
              <td>{item.quantityof_order}</td>
              <td>{item.onKabulDurumu || "-"}</td>
              <td>{item.onKabulYapanKisi || "-"}</td>
              <td>{formatDate(item.onKabulSaati)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
