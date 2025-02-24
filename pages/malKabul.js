// pages/malKabul.js
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
        // Grup işlemi: Aynı koli numarasına sahip kayıtları birleştiriyoruz.
        // Ürün adedi: İlk satırdaki quantity_of_product değeri (örneğin 8),
        // Okutulan ürün sayısı (scannedCount): o koli içinde mal_kabul_durumu "1" veya "2" olan kayıtların sayısı.
        const grouped = {};
        fetchedBoxes.forEach((shipment) => {
          const boxId = shipment.box;
          // Eğer daha önce bu koli için kayıt oluşturulmamışsa, ilk satırdaki ürün adedini al.
          if (!grouped[boxId]) {
            grouped[boxId] = {
              box: boxId,
              totalCount: shipment.quantity_of_product, // İlk kayıttaki ürün adedi (örneğin 8)
              scannedCount: 0,
              from_location: shipment.from_location || "-",
              // "valid" alanı; eğer bu koli içerisinde en az bir satırda mal kabul durumu "1" veya "2" varsa true olacak.
              valid: false,
            };
          }
          // Eğer bu satırda mal kabul durumu "1" veya "2" ise
          if (shipment.mal_Kabul_durumu === "1" || shipment.mal_Kabul_durumu === "2") {
            grouped[boxId].scannedCount++;
            grouped[boxId].valid = true;
          }
        });
        // Sadece valid (yani mal kabul durumu 1 veya 2 olan) kayıtları alalım.
        const finalBoxes = Object.values(grouped).filter(box => box.valid);
        setGroupedBoxes(finalBoxes);
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
      <p>Toplam Koli Sayısı: {groupedBoxes.length}</p>
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
