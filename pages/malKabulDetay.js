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
   * Mal Kabul işlemini gerçekleştirme
   */
  const handleMalKabul = async (shipmentId) => {
    setUpdating(true);
    try {
      await updateMalKabulFields(shipmentId, userData.name);
      alert("Mal Kabul işlemi başarıyla gerçekleştirildi.");
      // Gönderiyi güncelleyerek listede değişiklik yap
      setShipments((prev) =>
        prev.map((shipment) =>
          shipment.id === shipmentId
            ? {
                ...shipment,
                "Mal Kabul Durumu": "Onaylandı",
                "Mal Kabul Yapan Kişi": userData.name,
                "Mal Kabul Saati": new Date(),
              }
            : shipment
        )
      );
    } catch (error) {
      console.error("Mal Kabul Güncelleme Hatası:", error);
      alert("Mal Kabul işlemi sırasında bir hata oluştu.");
    }
    setUpdating(false);
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
      <h1>Koli Detayları</h1>
      <h2>Koli Numarası: {box}</h2>

      {/* Hata Mesajı */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Gönderiler Tablosu */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Sıra No</th>
            <th className={styles.th}>QR</th>
            <th className={styles.th}>Mal Kabul Durumu</th>
            <th className={styles.th}>Mal Kabul Yapan Kişi</th>
            <th className={styles.th}>Mal Kabul Saati</th>
            <th className={styles.th}>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment, index) => (
            <tr key={shipment.id}>
              <td className={styles.td}>{index + 1}</td>
              <td className={styles.td}>{shipment.QR || "-"}</td>
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
              <td className={styles.td}>
                {shipment["Mal Kabul Durumu"] ? (
                  "İşlem Yapıldı"
                ) : (
                  <button
                    onClick={() => handleMalKabul(shipment.id)}
                    className={styles.updateButton}
                    disabled={updating}
                  >
                    {updating ? "Güncelleniyor..." : "Mal Kabul Yap"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MalKabulDetay;
