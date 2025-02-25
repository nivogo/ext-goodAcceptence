// pages/basariliKoliler.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  getBoxesForBasariliKoliler, 
  getBoxesForBasariliKolilerByPreAccept 
} from "../lib/firestore";
import BackButton from "../components/BackButton";
import styles from "../styles/BasariliKoliler.module.css";

const BasariliKoliler = () => {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [groupedShipments, setGroupedShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBoxes = async () => {
    if (user && userData && userData.paad_id) {
      setLoading(true);
      setError(null);
      try {
        // İki ayrı sorgu ile verileri çekiyoruz:
        const boxesByPaad = await getBoxesForBasariliKoliler(userData.paad_id);
        const boxesByPreAccept = await getBoxesForBasariliKolilerByPreAccept(userData.paad_id);
        
        // İki sonucu birleştiriyoruz (çift kayıt varsa kaldırıyoruz):
        const mergedBoxes = [...boxesByPaad, ...boxesByPreAccept];
        const uniqueBoxes = mergedBoxes.reduce((acc, curr) => {
          if (!acc.find(item => item.box === curr.box)) {
            acc.push(curr);
          }
          return acc;
        }, []);

        // Şimdi gruplandırma işlemi: Her koli için istenen sütunlar (maskesiz gösterilecek)
        const grouped = {};
        uniqueBoxes.forEach((shipment) => {
          if (!grouped[shipment.box]) {
            grouped[shipment.box] = {
              box: shipment.box,
              shipment_no: shipment.shipment_no || "-",
              shipment_date: shipment.shipment_date || "-",
              quantity: shipment.quantity_of_product,
              to_location: shipment.to_location || "-",
              from_location: shipment.from_location || "-",
              onKabulDurumu: shipment.on_kabul_durumu,
              onKabulYapanKisi: shipment.on_kabul_yapan_kisi,
              onKabulSaati: shipment.on_kabul_saati,
              shipmentIds: [shipment.id],
            };
          } else {
            grouped[shipment.box].shipmentIds.push(shipment.id);
          }
        });

        // Sadece on_kabul_durumu "1" veya "2" olanları alıyoruz.
        const finalGrouped = Object.values(grouped).filter(
          (item) => item.onKabulDurumu === "1" || item.onKabulDurumu === "2" || item.onKabulDurumu === "3"
        );
        setGroupedShipments(finalGrouped);
      } catch (err) {
        console.error("Başarılı Koliler Veri Çekme Hatası:", err);
        setError("Başarılı koliler alınırken bir hata oluştu.");
      }
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
  }, [user, userData, router]);

  const formatDate = (date) => {
    if (!date) return "-";
    const parsedDate = new Date(date);
    return isNaN(parsedDate) ? "-" : parsedDate.toLocaleString();
  };
  
  const formatOnKabulDurumu = (status) => {
  switch (status) {
    case "1":
      return "Okutma Başarılı";
    case "2":
      return "Okutma Başarılı (Fazla Koli)";
    case "3":
      return "Okutma Başarılı (Sistem Dışı Koli)";
    default:
      return status || "-";
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
      <h1>Başarılı Koliler</h1>
      <p>
        Mağaza: {userData.storeName} (PAAD ID: {userData.paad_id})
      </p>
      {error && <p className={styles.error}>{error}</p>}
      <p>Toplam Koli Adedi: {groupedShipments.length}</p>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Sıra No</th>
              <th className={styles.th}>Sevk Numarası</th>
              <th className={styles.th}>Sevk Tarihi</th>
              <th className={styles.th}>Koli Numarası</th>
              <th className={styles.th}>Ürün Adedi</th>
              <th className={styles.th}>Gönderici Lokasyon</th>
              <th className={styles.th}>Ön Kabul Durumu</th>
              <th className={styles.th}>Ön Kabul Yapan Kişi</th>
              <th className={styles.th}>Ön Kabul Saati</th>
            </tr>
          </thead>
          <tbody>
            {groupedShipments.map((box, index) => (
              <tr key={box.box}>
                <td className={styles.td}>{index + 1}</td>
                <td className={styles.td}>{box.shipment_no}</td>
                <td className={styles.td}>{formatDate(box.shipment_date)}</td>
                <td className={styles.td}>{box.box}</td>
                <td className={styles.td}>{box.quantity}</td>
                <td className={styles.td}>{box.from_location}</td>
                <td className={styles.td}>{formatOnKabulDurumu(box.onKabulDurumu) || "-"}</td>
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
