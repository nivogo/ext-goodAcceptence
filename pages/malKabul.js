// pages/malKabul.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getShipmentsByPAADID, getBoxesForBasariliKoliler } from "../lib/firestore";
import BackButton from "../components/BackButton";
import styles from "../styles/MalKabul.module.css";

const MalKabul = () => {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [boxes, setBoxes] = useState([]);
  const [successfulBoxes, setSuccessfulBoxes] = useState([]); // Başarılı koliler
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [boxInput, setBoxInput] = useState("");

  /**
   * Tüm kolileri çekme ve gruplandırma fonksiyonu
   */
  const fetchBoxes = async () => {
    if (user && userData && userData.PAAD_ID) {
      setRefreshing(true);
      setError(null);
      try {
        // Tüm kolileri çek
        const shipments = await getShipmentsByPAADID(userData.PAAD_ID);
        // Koli numarasına göre gruplandır
        const grouped = {};
        shipments.forEach((shipment) => {
          if (!grouped[shipment.box]) {
            grouped[shipment.box] = {
              box: shipment.box,
              shipment_no: shipment.shipment_no || "-",
              quantity: shipment.quantityof_product,
            };
          }
        });
        setBoxes(Object.values(grouped));

        // Başarılı kolileri çek
        const successBoxes = await getBoxesForBasariliKoliler(userData.PAAD_ID);
        setSuccessfulBoxes(successBoxes);
      } catch (err) {
        console.error("Mal Kabul Kolileri Çekme Hatası:", err);
        setError("Koliler alınırken bir hata oluştu.");
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
  }, [user, userData]);

  /**
   * Koli numarası girilip submit edildiğinde detay sayfasına yönlendirme
   */
  const handleBoxSubmit = (e) => {
    e.preventDefault();
    if (!boxInput) return;
    // Koli numarası mevcut mu kontrol et
    const exists = boxes.some((box) => box.box === boxInput);
    if (exists) {
      router.push(`/malKabulDetay?box=${encodeURIComponent(boxInput)}`);
    } else {
      alert("Girdiğiniz koli numarası mevcut değil.");
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
      <h1>Mal Kabul Kolileri</h1>
      <p>
        Mağaza: {userData.storeName} (PAAD ID: {userData.PAAD_ID})
      </p>

      {/* Başarılı Koliler Bölümü */}
      <section className={styles.successSection}>
        <h2>Başarılı Koliler</h2>
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

        {/* Koliler Tablosu */}
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Sıra No</th>
              <th className={styles.th}>Koli Numarası</th>
              <th className={styles.th}>Ürün Adedi</th>
            </tr>
          </thead>
          <tbody>
            {successfulBoxes.map((box, index) => (
              <tr key={box.box}>
                <td className={styles.td}>{index + 1}</td>
                <td className={styles.td}>{box.box}</td>
                <td className={styles.td}>{box.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Genel Koliler Bölümü */}
      <section className={styles.generalSection}>
        <h2>Genel Koliler</h2>

        {/* Koli Arama Formu */}
        <form onSubmit={handleBoxSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Koli numarası giriniz"
            value={boxInput}
            onChange={(e) => setBoxInput(e.target.value)}
            required
            className={styles.input}
          />
          <button type="submit" className={styles.submitButton}>
            Detay Görüntüle
          </button>
        </form>

        {/* Toplam Koli Sayısı */}
        <p>Toplam Koli Sayısı: {boxes.length}</p>

        {/* Koliler Tablosu */}
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Sıra No</th>
              <th className={styles.th}>Koli Numarası</th>
              <th className={styles.th}>Ürün Adedi</th>
            </tr>
          </thead>
          <tbody>
            {boxes.map((box, index) => (
              <tr key={box.box}>
                <td className={styles.td}>{index + 1}</td>
                <td className={styles.td}>{box.box}</td>
                <td className={styles.td}>{box.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default MalKabul;
