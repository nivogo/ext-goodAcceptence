// pages/malKabul.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import FocusLockInput from "../components/FocusLockInput"; // Yolunuzu ayarlayın
import { useAuth } from "../context/AuthContext";
import { getBoxesForBasariliKoliler } from "../lib/firestore"; // Fonksiyon import edildi
import BackButton from "../components/BackButton";
import { useNotification } from "../context/NotificationContext";
import styles from "../styles/MalKabul.module.css";

const MalKabul = () => {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [boxInput, setBoxInput] = useState("");

  const { showNotification } = useNotification();

  /**
   * Başarılı kolileri çekme ve gruplandırma fonksiyonu
   */
  const fetchBoxes = async () => {
    if (user && userData && userData.PAAD_ID) {
      setRefreshing(true);
      setError(null);
      try {
        const fetchedBoxes = await getBoxesForBasariliKoliler(userData.PAAD_ID);

        // Koli numarasına göre gruplandırma
        const grouped = {};
        fetchedBoxes.forEach((shipment) => {
          // Eğer bu koli daha önce yoksa ekleyelim
          if (!grouped[shipment.box]) {
            grouped[shipment.box] = {
              box: shipment.box,
              totalCount: 0,      // Tüm doküman sayısı
              scannedCount: 0,    // Okutulan (Mal Kabul Durumu dolu) doküman sayısı
            };
          }

          // Her doküman 1 adet anlamına geldiği için totalCount++
          grouped[shipment.box].totalCount++;

          // Eğer malKabulDurumu doluysa scannedCount++
          if (shipment.malKabulDurumu) {
            grouped[shipment.box].scannedCount++;
          }
        });

        // Objeyi diziye dönüştür
        let boxArray = Object.values(grouped);

        // Ürün Adedi != Okutulan Ürünler olanları en üstte olacak şekilde sıralama
        boxArray.sort((a, b) => {
          const aComplete = a.totalCount === a.scannedCount;
          const bComplete = b.totalCount === b.scannedCount;
          if (!aComplete && bComplete) return -1;
          if (aComplete && !bComplete) return 1;
          return 0;
        });

        setBoxes(boxArray);
      } catch (err) {
        console.error("Mal Kabul Kolileri Çekme Hatası:", err);
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
      <h1>Mal Kabul Kolileri</h1>
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

      {/* Koli Arama Formu */}
      <form onSubmit={handleBoxSubmit} className={styles.form}>
        <FocusLockInput
          value={boxInput}
          onChange={(e) => setBoxInput(e.target.value)}
          onEnter={handleBoxSubmit}
          placeholder="Koli numarası giriniz"
          className={styles.input}
          autoFocus={true}
          required
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
            {/* Doküman bazlı adet (toplam doküman sayısı) */}
            <th className={styles.th}>Ürün Adedi</th>
            {/* Doküman bazlı okutulan adet (malKabulDurumu dolu doküman sayısı) */}
            <th className={styles.th}>Okutulan Ürünler</th>
          </tr>
        </thead>
        <tbody>
          {boxes.map((box, index) => (
            <tr key={box.box}>
              <td className={styles.td}>{index + 1}</td>
              <td className={styles.td}>{box.box}</td>
              {/* totalCount = doküman sayısı */}
              <td className={styles.td}>{box.totalCount}</td>
              {/* scannedCount = malKabulDurumu dolu doküman sayısı */}
              <td className={styles.td}>{box.scannedCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MalKabul;
