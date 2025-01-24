// pages/malKabulDetay.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getShipmentByBox,
  updateMalKabulFields,
} from "../lib/firestore";
import BackButton from "../components/BackButton";
import styles from "../styles/MalKabulDetay.module.css";

const MalKabulDetay = () => {
  const router = useRouter();
  const { box } = router.query;
  const { user, userData } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [qrInput, setQrInput] = useState("");

  /**
   * Belirli bir koliye ait gönderileri çekme
   */
  const fetchShipments = async () => {
    if (user && userData && box) {
      setLoading(true);
      setError(null);
      try {
        const boxShipments = await getShipmentByBox(box);
        setShipments(boxShipments);
      } catch (err) {
        console.error("Mal Kabul Detay Veri Çekme Hatası:", err);
        setError("Veriler alınırken bir hata oluştu.");
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && userData && box) {
      fetchShipments();
    } else {
      setLoading(false);
      router.push("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userData, box, router]);

  /**
   * Mal Kabul işlemini QR kodu ile gerçekleştirme
   */
  const handleMalKabulWithQR = async (e) => {
    e.preventDefault();
    if (!qrInput) return;

    setUpdating(true);
    setError(null);
    try {
      // QR koduna göre gönderiyi bulma
      const matchedShipments = shipments.filter(
        (shipment) => shipment.QR === qrInput
      );

      if (matchedShipments.length === 0) {
        alert("Girilen QR koduna ait bir gönderi bulunamadı.");
        setUpdating(false);
        return;
      }

      const shipment = matchedShipments[0];

      if (shipment["Mal Kabul Durumu"] === "Onaylandı") {
        alert("Bu gönderi zaten Mal Kabul edilmiştir.");
        setUpdating(false);
        return;
      }

      // "Mal Kabul" işlemini gerçekleştirme
      await updateMalKabulFields(shipment.id, userData.name);
      alert("Mal Kabul işlemi başarıyla gerçekleştirildi.");

      // Gönderiyi güncelleyerek listede değişiklik yap
      setShipments((prev) =>
        prev.map((s) =>
          s.id === shipment.id
            ? {
                ...s,
                "Mal Kabul Durumu": "Onaylandı",
                "Mal Kabul Yapan Kişi": userData.name,
                "Mal Kabul Saati": new Date(),
              }
            : s
        )
      );

      // Input alanını temizleme
      setQrInput("");
    } catch (error) {
      console.error("Mal Kabul Güncelleme Hatası:", error);
      alert("Mal Kabul işlemi sırasında bir hata oluştu.");
    }
    setUpdating(false);
  };

  /**
   * Tarih formatlama fonksiyonu
   */
  const formatDate = (date) => {
    if (!date) return "-";
    if (date.toDate) {
      return date.toDate().toLocaleString();
    }
    const parsedDate = new Date(date);
    return isNaN(parsedDate) ? "-" : parsedDate.toLocaleString();
  };

  /**
   * QR Kodunu Maskeleme Fonksiyonu
   * @param {string} qr - QR kodu değeri
   * @param {object} shipment - Gönderi objesi
   * @returns {string} - Maskelenmiş veya gerçek QR kodu
   */
  const maskQRCode = (qr, shipment) => {
    // Eğer Mal Kabul Durumu "Onaylandı" ise QR kodunu göster, değilse maskeli göster
    return shipment["Mal Kabul Durumu"] === "Onaylandı" ? qr : "****";
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
      <h1>Koli Detayları</h1>
      <h2>Koli Numarası: {box}</h2>

      {/* Hata Mesajı */}
      {error && <p className={styles.error}>{error}</p>}

      {/* QR Kodu Giriş Formu */}
      <form onSubmit={handleMalKabulWithQR} className={styles.qrForm}>
        <input
          type="text"
          placeholder="QR kodunu giriniz"
          value={qrInput}
          onChange={(e) => setQrInput(e.target.value)}
          required
          className={styles.qrInput}
        />
        <button type="submit" className={styles.qrSubmitButton} disabled={updating}>
          {updating ? "İşlem Yapılıyor..." : "Mal Kabul Yap"}
        </button>
      </form>

      {/* Gönderiler Tablosu */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Sıra No</th>
            <th className={styles.th}>QR</th>
            <th className={styles.th}>Mal Kabul Durumu</th>
            <th className={styles.th}>Mal Kabul Yapan Kişi</th>
            <th className={styles.th}>Mal Kabul Saati</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment, index) => (
            <tr key={shipment.id}>
              <td className={styles.td}>{index + 1}</td>
              <td className={styles.td}>{maskQRCode(shipment.QR, shipment)}</td>
              <td className={styles.td}>
                {shipment["Mal Kabul Durumu"] || "-"}
              </td>
              <td className={styles.td}>
                {shipment["Mal Kabul Yapan Kişi"] || "-"}
              </td>
              <td className={styles.td}>
                {shipment["Mal Kabul Saati"]
                  ? formatDate(shipment["Mal Kabul Saati"])
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MalKabulDetay;
