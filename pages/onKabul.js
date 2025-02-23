// pages/onKabul.js
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import FocusLockInput from "../components/FocusLockInput";
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
  const { showNotification } = useNotification();
  const [shipments, setShipments] = useState([]);
  const [groupedShipments, setGroupedShipments] = useState([]);
  const [boxInput, setBoxInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Sadece kullanıcının paad_id’sine ve on_kabul_durumu "0" olan gönderileri çekiyoruz.
  const fetchShipments = async () => {
    if (user && userData && userData.paad_id) {
      setLoading(true);
      setError(null);
      try {
        const shipmentsList = await getShipmentsByPAADID(userData.paad_id);
        // Yalnızca on_kabul_durumu "0" olanları filtrele
        const filteredShipments = shipmentsList.filter(
          (shipment) => shipment.on_kabul_durumu === "0"
        );
        // Koli numarasına göre gruplandırma (maskelenmiş bilgileri göstermek için)
        const grouped = {};
        filteredShipments.forEach((shipment) => {
          if (!grouped[shipment.box]) {
            grouped[shipment.box] = {
              box: shipment.box,
              shipment_no: shipment.shipment_no || "-", // Sevk Numarası
              shipment_date: shipment.shipment_date || "-", // Sevk Tarihi
              quantity: shipment.quantity_of_product, // Ürün adedi (maskelenecek)
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

    // İlk olarak, okutulan koli numarası BX veya TR ile başlamalıdır.
    if (!boxInput.startsWith("BX") && !boxInput.startsWith("TR")) {
      alert("Okuttuğunuz koli BX veya TR ile başlamalıdır.");
      return;
    }

    setLoading(true);
    try {
      // Girilen koli numarasına ait gönderileri getir.
      const boxShipments = await getShipmentByBox(boxInput);
      if (boxShipments.length === 0) {
        alert("Böyle bir koli bulunamamaktadır.");
      } else {
        // Aynı paad_id’ye sahip gönderileri ve farklı paad_id’ye sahip olanları ayıralım.
        const samePaad = boxShipments.filter(
          (shipment) => shipment.paad_id === userData.paad_id
        );
        const differentPaad = boxShipments.filter(
          (shipment) => shipment.paad_id !== userData.paad_id
        );

        if (samePaad.length > 0) {
          // Eğer on_kabul_durumu "0" ise, okutma işlemi yapılır.
          const notScanned = samePaad.filter(
            (shipment) => shipment.on_kabul_durumu === "0"
          );
          const alreadyScanned = samePaad.filter(
            (shipment) => shipment.on_kabul_durumu === "1"
          );

          if (notScanned.length > 0) {
            await Promise.all(
              notScanned.map((shipment) =>
                updateOnKabulFields(shipment.id, userData.name)
              )
            );
            showNotification("Koli başarıyla okutuldu!", "success");
          } else if (alreadyScanned.length > 0) {
            showNotification("Bu koli daha önce okutulmuştur.", "error");
          }
        } else if (differentPaad.length > 0) {
          // Eğer okutulan koli, farklı paad_id’ye aitse, on_kabul_durumu "2" olarak işaretle.
          await Promise.all(
            differentPaad.map((shipment) =>
              markExtraBox(shipment.id, userData.name)
            )
          );
          alert("Okuttuğunuz koli farklı bir mağazaya ait olduğu için işaretlendi.");
        }
        // İşlem sonunda, verileri yeniden çek.
        await fetchShipments();
      }
    } catch (error) {
      console.error("Ön Kabul Güncelleme Hatası:", error);
      alert("Ön kabul işlemi sırasında bir hata oluştu.");
      await fetchShipments();
    }
    setLoading(false);
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
      <h1>Hoş Geldiniz, {userData.name}</h1>
      <h1>Ön Kabul</h1>
      <p>
        Mağaza: {userData.storeName} (PAAD ID: {userData.paad_id})
      </p>
      {/* Başarılı Koliler Butonu */}
      <button
        onClick={() => router.push("/basariliKoliler")}
        className={styles.successButton}
      >
        Başarılı Koliler
      </button>
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
