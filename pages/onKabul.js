import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import FocusLockInput from "../components/FocusLockInput"; // Yolunuzu ayarlayın
import {
  getShipmentsByPAADID,
  getShipmentByBox,
  updateOnKabulFields,
  markExtraBox,
} from "../lib/firestore";
import BackButton from "../components/BackButton";
import styles from "../styles/OnKabul.module.css";

export default function OnKabulPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [boxInput, setBoxInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();
  const [groupedShipments, setGroupedShipments] = useState([]);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Sadece kullanıcının paad_id'sine göre gönderileri çekiyoruz.
  const fetchShipments = async () => {
    if (user && userData && userData.paad_id) {
      setLoading(true);
      setError(null);
      try {
        const shipmentsList = await getShipmentsByPAADID(userData.paad_id);
        // "Okutma Başarılı" olmayanları filtreleyip koli numarasına göre gruplayalım.
        const filteredShipments = shipmentsList.filter(
          (shipment) => shipment.on_kabul_durumu !== "Okutma Başarılı"
        );
        // Koli numarasına göre gruplandırma
        const grouped = {};
        filteredShipments.forEach((shipment) => {
          if (!grouped[shipment.box]) {
            grouped[shipment.box] = {
              box: shipment.box,
              shipment_no: shipment.shipment_no || "-", // Sevk Numarası
              shipment_date: shipment.shipment_date || "-", // Sevk Tarihi
              quantity: shipment.quantity_of_product, // Ürün adedi
              on_kabul_durumu: shipment.on_kabul_durumu,
              on_kabul_yapan_kisi: shipment.on_kabul_yapan_kisi,
              on_kabul_saati: shipment.on_kabul_saati,
              from_location: shipment.from_location || "-", // Gönderici Lokasyon
              shipmentIds: [shipment.id],
            };
          } else {
            grouped[shipment.box].quantity += shipment.quantity_of_product;
            grouped[shipment.box].shipmentIds.push(shipment.id);
          }
        });
        setShipments(filteredShipments);
        setGroupedShipments(Object.values(grouped));
      } catch (err) {
        console.error("Veri Çekme Hatası:", err);
        setError("Veriler alınırken bir hata oluştu.");
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && userData) {
      fetchShipments();
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

  const handleBoxSubmit = async (e) => {
    e.preventDefault();
    if (!boxInput) return;
    // Doğrudan girilen koli numarasına ait gönderileri çekelim
    const boxShipments = await getShipmentByBox(boxInput);
    if (boxShipments.length > 0) {
      // Gönderilerin paad_id'sini kontrol edelim
      const isDifferentPAAD = boxShipments.some(
        (shipment) => shipment.paad_id !== userData.paad_id
      );
      if (isDifferentPAAD) {
        // PAAD_ID farklıysa, koli "Fazla Koli-Hatalı Mağaza" olarak işaretlenecek
        await Promise.all(
          boxShipments.map((shipment) =>
            markExtraBox(shipment.id, userData.name)
          )
        );
        alert(
          `Okuttuğunuz koli farklı bir mağazaya ait olduğu için "Fazla Koli-Hatalı Mağaza" olarak işaretlendi. Lütfen Satış Operasyon ile iletişime geçin.`
        );
      } else {
        // PAAD_ID aynıysa, "Okutma Durumu" kontrolü yap
        const alreadyApproved = boxShipments.some(
          (shipment) => shipment.on_kabul_durumu === "Okutma Başarılı"
        );
        if (alreadyApproved) {
          showNotification("Bu koli daha önce okutulmuştur.", "error");
        } else {
          // Tüm gönderilerin durumunu güncelle
          await Promise.all(
            boxShipments.map((shipment) =>
              updateOnKabulFields(shipment.id, userData.name)
            )
          );
          showNotification("Koli başarıyla okutuldu!", "success");
        }
      }
      // Verileri yeniden çekelim
      await fetchShipments();
    } else {
      alert("Girdiğiniz koli numarası bulunamadı.");
    }
    setBoxInput("");
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
      <h1>On Kabul</h1>
      <p>
        Mağaza: {userData.storeName} (PAAD ID: {userData.paad_id})
      </p>
      {/* Hata Mesajı */}
      {error && <p className={styles.error}>{error}</p>}
      {/* Koli Arama Input */}
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
          {loading ? "İşlem Yapılıyor..." : "Onayla"}
        </button>
      </form>
      {/* Grup Halindeki Kolilerin Listesi */}
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
            </tr>
          </thead>
          <tbody>
            {groupedShipments.map((box, index) => (
              <tr key={box.box}>
                <td className={styles.td}>{index + 1}</td>
                <td className={styles.td}>{box.shipment_no}</td>
                <td className={styles.td}>{formatDate(box.shipment_date)}</td>
                <td className={styles.td}>****</td> {/* Koli numarası maskeli */}
                <td className={styles.td}>****</td> {/* Ürün adedi maskeli */}
                <td className={styles.td}>{box.from_location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
