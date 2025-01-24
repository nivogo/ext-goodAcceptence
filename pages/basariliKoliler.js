// pages/basariliKoliler.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getBoxesForBasariliKoliler } from "../lib/firestore"; // Yeni fonksiyon import edildi
import BackButton from "../components/BackButton";
import styles from "../styles/BasariliKoliler.module.css";

const BasariliKoliler = () => {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchBoxes = async () => {
    if (user && userData && userData.PAAD_ID) {
      setRefreshing(true);
      setError(null);
      try {
        const fetchedBoxes = await getBoxesForBasariliKoliler(userData.PAAD_ID);
        // Koli numarasına göre gruplandır
        const grouped = {};
        fetchedBoxes.forEach((shipment) => {
          if (!grouped[shipment.box]) {
            grouped[shipment.box] = {
              box: shipment.box,
              shipment_no: shipment.shipment_no || "-", // Sevk Numarası
              shipment_date: shipment.shipment_date || "-", // Sevk Tarihi
              quantity: shipment.quantityof_product,
              to_location: shipment.to_location || "-", // Alıcı Lokasyon
              onKabulDurumu: shipment.onKabulDurumu,
              onKabulYapanKisi: shipment.onKabulYapanKisi,
              onKabulSaati: shipment.onKabulSaati,
              shipmentIds: [shipment.id],
            };
          } else {
            grouped[shipment.box].quantity += shipment.quantityof_product;
            grouped[shipment.box].shipmentIds.push(shipment.id);
          }
        });
        setBoxes(Object.values(grouped));
      } catch (err) {
        console.error("Başarılı Koliler Veri Çekme Hatası:", err);
        setError("Başarılı koliler alınırken bir hata oluştu.");
      }
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && userData) {
      fetchBoxes();
    } else {
      setLoading(false);
      router.push("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userData, router]);

  const formatDate = (date) => {
    if (!date) return "-";
    if (date.toDate) {
      return date.toDate().toLocaleString();
    }
    const parsedDate = new Date(date);
    return isNaN(parsedDate) ? "-" : parsedDate.toLocaleString();
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
      <h1>Başarılı Koliler</h1>
      <p>
        Mağaza: {userData.storeName} (PAAD ID: {userData.PAAD_ID})
      </p>

      {/* Yenile Butonu */}
      <button
        onClick={fetchBoxes}
        className={styles.refreshButton}
        disabled={refreshing}
      >
        {refreshing ? "Yükleniyor..." : "Yenile"}
      </button>

      {/* Hata Mesajı */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Toplam Koli Sayısı */}
      <p>Toplam Koli Adedi: {boxes.length}</p>

      {/* Liste Tablosu */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Sıra No</th>
            <th className={styles.th}>Sevk Numarası</th>
            <th className={styles.th}>Sevk Tarihi</th>
            <th className={styles.th}>Koli Numarası</th>
            <th className={styles.th}>Ürün Adedi</th>
            <th className={styles.th}>Alıcı Lokasyon</th>
            <th className={styles.th}>Ön Kabul Durumu</th>
            <th className={styles.th}>Ön Kabul Yapan Kişi</th>
            <th className={styles.th}>Ön Kabul Saati</th>
          </tr>
        </thead>
        <tbody>
          {boxes.map((box, index) => (
            <tr key={box.box}>
              <td className={styles.td}>{index + 1}</td>
              <td className={styles.td}>{box.shipment_no}</td>
              <td className={styles.td}>{formatDate(box.shipment_date)}</td>
              <td className={styles.td}>{box.box}</td>
              <td className={styles.td}>{box.quantity}</td>
              <td className={styles.td}>{box.to_location}</td>
              <td className={styles.td}>{box.onKabulDurumu || "-"}</td>
              <td className={styles.td}>{box.onKabulYapanKisi || "-"}</td>
              <td className={styles.td}>{formatDate(box.onKabulSaati)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BasariliKoliler;
