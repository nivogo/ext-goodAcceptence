// pages/onKabul.js
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getShipmentsByStoreId, updateOnKabulFields } from "../lib/firestore";
import BackButton from "../components/BackButton";
import styles from "../styles/OnKabul.module.css";

export default function OnKabulPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [boxInput, setBoxInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Veri çekme fonksiyonu
  const fetchShipments = async () => {
    if (user && userData && userData.storeId) {
      setRefreshing(true);
      setError(null);
      try {
        const shipmentsList = await getShipmentsByStoreId(userData.storeId);
        setShipments(shipmentsList);
      } catch (err) {
        console.error("Veri Çekme Hatası:", err);
        setError("Veriler alınırken bir hata oluştu.");
      }
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
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
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  if (!user || !userData) {
    return null;
  }

  return (
    <div className={styles.container}>
      <BackButton />
      <h1>Hoş Geldiniz, {userData.name}</h1>
      <p>
        Mağaza: {userData.storeName} (Store ID: {userData.storeId})
      </p>

      {/* Yenile Butonu */}
      <button
        onClick={fetchShipments}
        className={styles.refreshButton}
        disabled={refreshing}
      >
        {refreshing ? "Yükleniyor..." : "Yenile"}
      </button>

      {/* Hata Mesajı */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Koli Arama Input */}
      <form onSubmit={handleBoxSubmit} style={{ marginBottom: "1rem", marginTop: "1rem" }}>
        <input
          type="text"
          placeholder="Koli numarası giriniz"
          value={boxInput}
          onChange={(e) => setBoxInput(e.target.value)}
          required
          className={styles.input}
        />
        <button type="submit" className={styles.submitButton}>
          Onayla
        </button>
      </form>

      {/* Toplam Koli Sayısı */}
      <p>Toplam Koli Adedi: {shipments.length}</p>

      {/* Liste Tablosu */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Sıra No</th>
            <th className={styles.th}>Gönderici Lokasyon Adı</th>
            <th className={styles.th}>Alıcı Lokasyon Adı</th>
            <th className={styles.th}>Koli Numarası</th>
            <th className={styles.th}>Sevk Tarihi</th>
            <th className={styles.th}>Sevkiyat Numarası</th>
            <th className={styles.th}>Ürün Adedi</th>
            <th className={styles.th}>Ön Kabul Durumu</th>
            <th className={styles.th}>Ön Kabul Yapan Kişi</th>
            <th className={styles.th}>Ön Kabul Saati</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((item, index) => (
            <tr key={item.id}>
              <td className={styles.td}>{index + 1}</td>
              <td className={styles.td}>{item.from_location}</td>
              <td className={styles.td}>{item.to_location}</td>
              <td className={styles.td}>{item.box}</td>
              <td className={styles.td}>{item.shipment_date}</td>
              <td className={styles.td}>{item.shipment_no}</td>
              <td className={styles.td}>{item.quantityof_order}</td>
              <td className={styles.td}>{item.onKabulDurumu || "-"}</td>
              <td className={styles.td}>{item.onKabulYapanKisi || "-"}</td>
              <td className={styles.td}>{formatDate(item.onKabulSaati)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
