// pages/malKabulDetay.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import FocusLockInput from "../components/FocusLockInput";
import { useNotification } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import {
  getShipmentByBox,
  getShipmentByQR,
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

  const { showNotification } = useNotification();

  const [keyboardOpen, setKeyboardOpen] = useState(false);

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
      const matchedShipments = await getShipmentByQR(qrInput);

      if (matchedShipments.length === 0) {
        alert("Okutulan QR koda ait bir ürün bulunamadı. Önce başka bir koliye ait olup olmadığını kontrol edin ardından lütfen Satış Operasyon ile iletişime geçin.");
        setUpdating(false);
        return;
      }

      const shipment = matchedShipments[0];

      if (shipment["mal_Kabul_durumu"] === "Okutma Başarılı") {
        showNotification("Bu ürüne daha önce Mal Kabul yapılmıştır.", "error");
        setUpdating(false);
        return;
      }

      // "Mal Kabul" işlemini gerçekleştirme
      await updateMalKabulFields(shipment.id, userData.name);
      showNotification("Mal Kabul işlemi başarıyla gerçekleştirildi.", "success");

      // Gönderiyi güncelleyerek listede değişiklik yap
      setShipments((prev) =>
        prev.map((s) =>
          s.id === shipment.id
            ? {
                ...s,
                "mal_Kabul_durumu": "Okutma Başarılı",
                "mal_kabul_yapan_kisi": userData.name,
                "mal_kabul_saati": new Date(),
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
    // Eğer Mal Kabul Durumu "Okutma Başarılı" ise QR kodunu göster, değilse maskeli göster
    return shipment["mal_kabul_durumu"] === "Okutma Başarılı" ? qr : "****";
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
      <h1>Koli Detayları</h1>
      <h2>Koli Numarası: {box}</h2>

      {/* Hata Mesajı */}
      {error && <p className={styles.error}>{error}</p>}

      {/* QR Kodu Giriş Formu */}
      <form onSubmit={handleMalKabulWithQR} className={styles.qrForm}>
        <FocusLockInput
          value={qrInput}
          onChange={(e) => setQrInput(e.target.value)}
          onEnter={handleMalKabulWithQR}
          placeholder="NVG Kodu Okutunuz"
          className={styles.qrInput}
          autoFocus={true}
          required
          enableKeyboard={keyboardOpen}
      />
        <button type="submit" className={styles.qrSubmitButton} disabled={updating}>
          {updating ? "İşlem Yapılıyor..." : "Mal Kabul Yap"}
        </button>
      </form>

      {/* Gönderiler Tablosu */}
      <div className={styles.tableWrapper}>
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
                  {shipment["mal_Kabul_durumu"] || "-"}
                </td>
                <td className={styles.td}>
                  {shipment["mal_kabul_yapan_kisi"] || "-"}
                </td>
                <td className={styles.td}>
                  {shipment["mal_kabul_saati"]
                    ? formatDate(shipment["mal_kabul_saati"])
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MalKabulDetay;
