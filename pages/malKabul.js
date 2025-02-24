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
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  /**
   * Başarılı kolileri çekme ve gruplandırma fonksiyonu
   */
  const fetchBoxes = async () => {
    if (user && userData && userData.paad_id) {
      setRefreshing(true);
      setError(null);
      try {
        // Tüm ilgili kolileri getiriyoruz.
        const fetchedBoxes = await getBoxesForBasariliKoliler(userData.paad_id);
        // Filtre: yalnızca on_kabul_durumu 1 veya 2 olan ve pre_accept_wh_id, kullanıcının paad_id'sine eşit olanları alalım.
        const validShipments = fetchedBoxes.filter((shipment) => {
          const status = Number(shipment.on_kabul_durumu);
          const preAccept = Number(shipment.pre_accept_wh_id);
          const userPaad = Number(userData.paad_id);
          return (status === 1 || status === 2) && (preAccept === userPaad);
        });

        // Şimdi, validShipments'ı koli numarasına göre gruplandıralım:
        const grouped = {};
        validShipments.forEach((shipment) => {
          if (!grouped[shipment.box]) {
            grouped[shipment.box] = {
              box: shipment.box,
              totalCount: 0,
              scannedCount: 0,
            };
          }
          // Her shipment 1 adet ürün olarak kabul ediliyor:
          grouped[shipment.box].totalCount++;
          // scannedCount: mal_kabul_durumu 1 olanları sayıyoruz
          if (Number(shipment.mal_kabul_durumu) === 1) {
            grouped[shipment.box].scannedCount++;
          }
        });

        setBoxes(Object.values(grouped));
      } catch (err) {
        console.error("Mal Kabul Kolileri Çekme Hatası:", err);
        setError("Mal kabul kolileri alınırken bir hata oluştu.");
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
      <div style={{ position: "absolute", top: 10, right: 10 }}>
        <button onClick={() => setKeyboardOpen(!keyboardOpen)}>
          {keyboardOpen ? "Kapat" : "Klavye Aç"}
        </button>
      </div>
      <h1>Mal Kabul Kolileri</h1>
      <p>
        Mağaza: {userData.storeName} (PAAD ID: {userData.paad_id})
      </p>
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
          enableKeyboard={keyboardOpen}
        />
        <button type="submit" className={styles.submitButton}>
          Detay Görüntüle
        </button>
      </form>
      {/* Toplam Koli Sayısı */}
      <p>Toplam Koli Sayısı: {boxes.length}</p>
      {/* Koliler Tablosu */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Sıra No</th>
              <th className={styles.th}>Koli Numarası</th>
              <th className={styles.th}>Ürün Adedi</th>
              <th className={styles.th}>Okutulan Ürünler</th>
            </tr>
          </thead>
          <tbody>
            {boxes.map((box, index) => (
              <tr key={box.box}>
                <td className={styles.td}>{index + 1}</td>
                <td className={styles.td}>{box.box}</td>
                <td className={styles.td}>{box.totalCount}</td>
                <td className={styles.td}>{box.scannedCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MalKabul;
