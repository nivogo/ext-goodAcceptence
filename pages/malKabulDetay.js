import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import FocusLockInput from "../components/FocusLockInput";
import { useNotification } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import {
  getShipmentByBox,
  getShipmentByQR,
  updateMalKabulFields,  // Güncelleme fonksiyonunu, mal_kabul_durumu'nu 1 olarak ayarlayacak şekilde düzenleyin.
  updateQRForDifferent,   // Farklı mağazaya ait QR güncellemesi: mal_kabul_durumu 2.
  addMissingQR           // Veritabanında bulunmayan QR için yeni kayıt ekleyecek.
} from "../lib/firestore";
import BackButton from "../components/BackButton";
import styles from "../styles/MalKabulDetay.module.css";

const MalKabulDetay = () => {
  const router = useRouter();
  const { box } = router.query;
  const { user, userData } = useAuth();
  const { showNotification } = useNotification();
  const [shipments, setShipments] = useState([]);
  const [qrInput, setQrInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Seçilen koliye ait QR kayıtlarını çekiyoruz.
  const fetchShipments = async () => {
    if (user && userData && box) {
      setLoading(true);
      try {
        const boxShipments = await getShipmentByBox(box);
        setShipments(boxShipments);
      } catch (error) {
        console.error("Mal Kabul Detay Veri Çekme Hatası:", error);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && userData && box) {
      fetchShipments();
    } else {
      router.push("/");
    }
  }, [user, userData, box, router]);

  const handleQRSubmit = async (e) => {
    e.preventDefault();
    if (!qrInput) return;

    // QR kontrolü: Girilen QR kodu "NVG" ile başlamalı
    if (!qrInput.startsWith("NVG")) {
      alert("Okuttuğunuz ürün NVG ile başlamalı.");
      return;
    }

    setUpdating(true);
    try {
      const existingQR = await getShipmentByQR(qrInput);
      if (existingQR.length > 0) {
        const record = existingQR[0];
        if (record.paad_id === userData.paad_id) {
          // Güncelle: mal_kabul_durumu 1, diğer alanlar güncellensin.
          await updateMalKabulFields(record.id, userData.name);
          showNotification("QR başarıyla okutuldu.", "success");
        } else {
          // Farklı mağazaya ait: updateQRForDifferent, mal_kabul_durumu 2
          await updateQRForDifferent(record.id, userData.name, userData.paad_id);
          showNotification(
            `Bu ürün ${record.box} kolisine ve ${record.to_location} mağazasına aittir. Ancak size gönderildiği için stoğunuza eklenmiştir. Lütfen satış operasyona bildirin.`,
            "error"
          );
        }
      } else {
        // Eğer QR, o koli için veritabanında yoksa, addMissingQR ile yeni kayıt ekle.
        await addMissingQR(qrInput, box, userData.paad_id, userData.name);
        showNotification(`Bu ürün ${box} kolisine ait eklenmiştir.`, "error");
      }
      await fetchShipments();
      setQrInput("");
    } catch (error) {
      console.error("Mal Kabul QR Güncelleme Hatası:", error);
      showNotification("Mal kabul işlemi sırasında bir hata oluştu.", "error");
      await fetchShipments();
    }
    setUpdating(false);
  };

  // QR bilgisi, mal_kabul_durumu 1 ise gerçek, değilse "****" maskesi.
  const maskQRCode = (qr, shipment) => {
    return shipment.mal_kabul_durumu === 1 ? qr : "****";
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const parsedDate = new Date(date);
    return isNaN(parsedDate) ? "-" : parsedDate.toLocaleString();
  };

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Yükleniyor...</div>;
  }
  if (!user || !userData) return null;

  return (
    <div className={styles.container}>
      <BackButton />
      <div style={{ position: "absolute", top: 10, right: 10 }}>
        <button onClick={() => setKeyboardOpen(prev => !prev)}>
          {keyboardOpen ? "Kapat" : "Klavye Aç"}
        </button>
      </div>
      <h1>Koli Detayları</h1>
      <h2>Koli Numarası: {box}</h2>
      <form onSubmit={handleQRSubmit} className={styles.qrForm}>
        <FocusLockInput
          value={qrInput}
          onChange={(e) => setQrInput(e.target.value)}
          onEnter={handleQRSubmit}
          placeholder="NVG kodunu okutunuz"
          className={styles.qrInput}
          autoFocus={true}
          required
          enableKeyboard={keyboardOpen}
        />
        <button type="submit" className={styles.qrSubmitButton} disabled={updating}>
          {updating ? "İşlem Yapılıyor..." : "Mal Kabul Yap"}
        </button>
      </form>
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
                <td className={styles.td}>{maskQRCode(shipment.qr, shipment)}</td>
                <td className={styles.td}>{shipment.mal_kabul_durumu || "-"}</td>
                <td className={styles.td}>{shipment.mal_kabul_yapan_kisi || "-"}</td>
                <td className={styles.td}>
                  {shipment.mal_kabul_saati ? formatDate(shipment.mal_kabul_saati) : "-"}
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
