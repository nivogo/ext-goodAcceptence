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
  const [error, setError] = useState(null);
  const [boxInput, setBoxInput] = useState("");
  const { showNotification } = useNotification();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  /**
   * Başarılı kolileri çekme ve gruplandırma fonksiyonu:
   * - getBoxesForBasariliKoliler fonksiyonundan gelen shipment’lar arasında
   *   yalnızca on_kabul_durumu "1" veya "2" olanları ve pre_accept_wh_id, kullanıcının paad_id’sine eşit olanları,
   *   ayrıca box_closed false olanları alıyoruz.
   * - Her koli için toplam ürün adedi (totalCount) ve okutulan ürün sayısı (scannedCount)
   *   hesaplanıyor.
   */
  const fetchBoxes = async () => {
    if (user && userData && userData.paad_id) {
      setLoading(true);
      setError(null);
      try {
        const fetchedBoxes = await getBoxesForBasariliKoliler(userData.paad_id);
        // Filtre: yalnızca on_kabul_durumu "1" veya "2", pre_accept_wh_id kullanıcının paad_id'si 
        // ve box_closed false olan shipment’lar
        const validShipments = fetchedBoxes.filter((shipment) => {
          return (
            (String(shipment.on_kabul_durumu) === "1" ||
              String(shipment.on_kabul_durumu) === "2") &&
            shipment.pre_accept_wh_id === userData.paad_id &&
            !shipment.box_closed
          );
        });
        // Gruplandırma: Her koli için toplam ürün adedi (totalCount) ve okutulan ürün sayısı (scannedCount)
        const grouped = {};
        validShipments.forEach((shipment) => {
          const boxKey = shipment.box;
          const quantity = Number(shipment.quantity_of_product) || 0;
          if (!grouped[boxKey]) {
            grouped[boxKey] = {
              box: boxKey,
              shipment_no: shipment.shipment_no || "-",
              shipment_date: shipment.shipment_date || "-",
              totalCount: 0,
              scannedCount: 0,
              from_location: shipment.from_location || "-",
            };
          }
          grouped[boxKey].totalCount += quantity;
          // scannedCount, sadece mal_kabul_durumu "1" olanların toplamı olsun.
          if (String(shipment.mal_kabul_durumu) === "1") {
            grouped[boxKey].scannedCount += quantity;
          }
        });
        setBoxes(Object.values(grouped));
      } catch (err) {
        console.error("Mal Kabul Kolileri Çekme Hatası:", err);
        setError("Mal kabul kolileri alınırken bir hata oluştu.");
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

  const handleBoxSubmit = (e) => {
    e.preventDefault();
    if (!boxInput) return;
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
        <button type="submit" className={styles.submitButton} disabled={loading}>
          Detay Görüntüle
        </button>
      </form>
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
