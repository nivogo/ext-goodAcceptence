import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import FocusLockInput from "../components/FocusLockInput";
import { useAuth } from "../context/AuthContext";
import { getBoxesForBasariliKoliler } from "../lib/firestore";
import BackButton from "../components/BackButton";
import { useNotification } from "../context/NotificationContext";
import styles from "../styles/MalKabul.module.css";

const MalKabul = () => {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { showNotification } = useNotification();
  const [groupedBoxes, setGroupedBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [boxInput, setBoxInput] = useState("");

  const fetchBoxes = async () => {
    if (user && userData && userData.paad_id) {
      setLoading(true);
      try {
        const fetchedBoxes = await getBoxesForBasariliKoliler(userData.paad_id);
        // Filtre: yalnızca on_kabul_durumu 1 veya 2 olan ve pre_accept_wh_id eşleşenler
        const validShipments = fetchedBoxes.filter(shipment =>
          (shipment.on_kabul_durumu === 1 || shipment.on_kabul_durumu === 2) &&
          shipment.pre_accept_wh_id === userData.paad_id
        );
        // Grup: Her koli için; ürün adedi, okutulan ürün sayısı (mal_kabul_durumu === 1)
        // Not: Eğer API aynı koli için birden fazla satır döndürüyorsa, ilk satırdaki ürün adedi kullanılsın.
        const grouped = {};
        validShipments.forEach(shipment => {
          if (!grouped[shipment.box]) {
            grouped[shipment.box] = {
              box: shipment.box,
              totalCount: Number(shipment.quantity_of_product) || 0,
              scannedCount: shipment.mal_kabul_durumu === 1 ? 1 : 0,
              from_location: shipment.from_location || "-"
            };
          } else {
            // Eğer scannedCount henüz 0 ise ve bu satırda mal_kabul_durumu 1 ise, 1 yap.
            if (grouped[shipment.box].scannedCount === 0 && shipment.mal_kabul_durumu === 1) {
              grouped[shipment.box].scannedCount = 1;
            }
          }
        });
        setGroupedBoxes(Object.values(grouped));
      } catch (error) {
        console.error("Mal Kabul Kolileri Çekme Hatası:", error);
        showNotification("Mal kabul kolileri alınırken bir hata oluştu.", "error");
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
    const exists = groupedBoxes.find(box => box.box === boxInput);
    if (exists) {
      router.push(`/malKabulDetay?box=${encodeURIComponent(boxInput)}`);
    } else {
      alert("Girdiğiniz koli numarası mevcut değil.");
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Yükleniyor...</div>;
  }
  if (!user || !userData) return null;

  return (
    <div className={styles.container}>
      <BackButton />
      <h1>Mal Kabul Kolileri</h1>
      <p>Mağaza: {userData.storeName} (PAAD ID: {userData.paad_id})</p>
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
            {groupedBoxes.map((box, index) => (
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
