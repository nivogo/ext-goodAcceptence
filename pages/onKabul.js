// pages/onKabul.js

// ... (diğer importlar)
import { getAllShipments } from "../lib/firestore"; // Yeni bir fonksiyon eklemek için

export default function OnKabulPage() {
  // ... (mevcut kod)

  // Yeni State: Tüm kolileri tutmak için
  const [allShipments, setAllShipments] = useState([]);

  // Veri çekme fonksiyonu güncellendi
  const fetchShipments = async () => {
    if (user && userData && userData.storeId) {
      setRefreshing(true);
      setError(null);
      try {
        const shipmentsList = await getShipmentsByStoreId(userData.storeId);
        const allShipmentsList = await getAllShipments(); // Tüm kolileri al
        setShipments(shipmentsList);
        setAllShipments(allShipmentsList);
      } catch (err) {
        console.error("Veri Çekme Hatası:", err);
        setError("Veriler alınırken bir hata oluştu.");
      }
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Koli numarası girilene kadar "****" göster
  return (
    <div className={styles.container}>
      {/* ... (mevcut kod) */}

      {/* Liste Tablosu */}
      <table className={styles.table}>
        <thead>
          <tr>
            {/* ... (mevcut başlıklar) */}
            <th className={styles.th}>Koli Numarası</th>
            <th className={styles.th}>Ürün Adedi</th>
            {/* ... (diğer başlıklar) */}
          </tr>
        </thead>
        <tbody>
          {shipments.map((item, index) => (
            <tr key={item.id}>
              {/* ... (mevcut hücreler) */}
              <td className={styles.td}>
                {item.isApproved ? item.box : "****"}
              </td>
              <td className={styles.td}>
                {item.isApproved ? item.quantityof_order : "****"}
              </td>
              {/* ... (diğer hücreler) */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// lib/firestore.js'de yeni fonksiyon eklenmeli

// lib/firestore.js

// ... (mevcut importlar)
import { collection, getDocs } from "firebase/firestore";

// Tüm kolileri çekme fonksiyonu
export const getAllShipments = async () => {
  try {
    const q = collection(db, "shipment_data");
    const querySnapshot = await getDocs(q);
    const shipments = [];
    querySnapshot.forEach((doc) => {
      shipments.push({ id: doc.id, ...doc.data() });
    });
    return shipments;
  } catch (error) {
    console.error("getAllShipments Hatası:", error);
    return [];
  }
};
