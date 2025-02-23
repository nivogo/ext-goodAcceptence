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
    if (user && userData && userData.paad_id) {
      setRefreshing(true);
      setError(null);
      try {
        try {
        const fetchedBoxes = await getBoxesForBasariliKoliler(userData.paad_id);
        // API'den gelen veriler zaten ilgili paad_id'ye göre çağrılıyorsa, ek olarak on_kabul_durumu kontrolü yapalım:
        const filteredShipments = fetchedBoxes.filter(
          (shipment) =>
            (shipment.on_kabul_durumu === "1" || shipment.on_kabul_durumu === "2") &&
            shipment.paad_id === userData.paad_id
        );
        // Koli numarasına göre gruplandır
        const grouped = {};
        fetchedBoxes.forEach((shipment) => {
          if (!grouped[shipment.box]) {
            grouped[shipment.box] = {
              box: shipment.box,
              shipment_no: shipment.shipment_no || "-", // Sevk Numarası
              shipment_date: shipment.shipment_date || "-", // Sevk Tarihi
              quantity: shipment.quantity_of_product, // Sadece ilk shipment'tan alınır
              to_location: shipment.to_location || "-", // Alıcı Lokasyon
              onKabulDurumu: shipment.on_kabul_durumu,
              onKabulYapanKisi: shipment.on_kabul_yapan_kisi,
              onKabulSaati: shipment.on_kabul_saati,
              shipmentIds: [shipment.id],
            };
          } else {
            // Quantity'i toplamayın, sadece shipment IDs'ini ekleyin
            grouped[shipment.box].shipmentIds.push(shipment.id);
            // İsteğe bağlı: Diğer alanların tutarlılığını kontrol edin
            // Örneğin, tüm shipment'lar aynı to_location'a sahip mi?
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
        Mağaza: {userData.storeName} (PAAD ID: {userData.paad_id})
      </p>

      {/* Hata Mesajı */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Toplam Koli Sayısı */}
      <p>Toplam Koli Adedi: {boxes.length}</p>

      {/* Liste Tablosu */}
      <div className={styles.tableWrapper}>
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
    </div>
  );
};

export default BasariliKoliler;
