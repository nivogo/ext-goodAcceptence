// pages/malKabul.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import FocusLockInput from "../components/FocusLockInput";
import { useAuth } from "../context/AuthContext";
import { 
  getBoxesForBasariliKoliler, 
  getBoxesForBasariliKolilerByPreAccept 
} from "../lib/firestore";
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

const fetchBoxes = async () => {
  if (user && userData && userData.paad_id) {
    setLoading(true);
    setError(null);
    try {
      // İki kaynaktan veri çekiyoruz
      const boxesByPaad = await getBoxesForBasariliKoliler(userData.paad_id);
      const boxesByPreAccept = await getBoxesForBasariliKolilerByPreAccept(userData.paad_id);

      // Verileri birleştirip loglayalım
      const mergedBoxes = [...boxesByPaad, ...boxesByPreAccept];
      console.log("Merged Boxes:", mergedBoxes);

      // Çift kayıtları kaldırmak için unique sevkiyatları alıyoruz (id bazında)
      const uniqueShipments = mergedBoxes.reduce((acc, curr) => {
        if (!acc.some(item => item.id === curr.id)) {
          acc.push(curr);
        }
        return acc;
      }, []);

      // on_kabul_durumu "1" veya "2" olanları filtrele
      const validShipments = uniqueShipments.filter((shipment) => {
        const status = String(shipment.on_kabul_durumu);
        return status === "1" || status === "2";
      });
      console.log("Valid Shipments (on_kabul_durumu 1 veya 2):", validShipments);

      // Koli numarasına göre gruplandırma
      const grouped = {};
      validShipments.forEach((shipment) => {
        const boxKey = shipment.box || "Bilinmeyen Koli"; // box yoksa varsayılan değer
        if (!grouped[boxKey]) {
          grouped[boxKey] = {
            box: boxKey,
            shipment_no: shipment.shipment_no || "-",
            shipment_date: shipment.shipment_date || "-",
            totalCount: 0,    // Toplam ürün adedi (sevkiyat bazında)
            scannedCount: 0,  // Mal kabulü yapılmış ürün adedi
            from_location: shipment.from_location || "-",
          };
        }
        // Her sevkiyat bir ürün olarak sayılacak, quantity_of_product yoksa 1 varsayalım
        const qty = Number(shipment.quantity_of_product) || 1;
        grouped[boxKey].totalCount += 1; // Her sevkiyat bir ürün, qty toplamı yerine sevkiyat sayısını artırıyoruz
        // mal_kabul_durumu "1" ise okutulmuş ürün adedini artır
        if (["1", "3"].includes(String(shipment.mal_kabul_durumu))) {
          grouped[boxKey].scannedCount += 1; // Her "1" için bir ürün say
        }
      });

      const groupedBoxes = Object.values(grouped);
      console.log("Grouped Boxes:", groupedBoxes);
      setBoxes(groupedBoxes);
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
      showNotification("Girdiğiniz koli numarası mevcut değil.", "error");
    }
    setBoxInput("");
  };

  const formatDate = (date) => {
    if (!date) return "-";
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
