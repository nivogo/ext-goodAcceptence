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
  updateQRForDifferent,
  addMissingQR,
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

  const fetchShipments = async () => {
    if (user && userData && box) {
      setLoading(true);
      try {
        const boxShipments = await getShipmentByBox(box);
        setShipments(boxShipments);
      } catch (error) {
        console.error("Mal Kabul Detay Veri Çekme Hatası:", error.message, error.stack);
        showNotification("Veriler yüklenirken bir hata oluştu.", "error");
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

    // Kontrol: QR kodu "NVG" ile başlamalı
    if (!qrInput.startsWith("NVG")) {
      alert("Okuttuğunuz ürün NVG ile başlamalı.");
      return;
    }

    setUpdating(true);
    try {
      // Kullanıcı verisi kontrolü
      if (!userData || !userData.paad_id || !userData.name) {
        throw new Error("Kullanıcı bilgileri eksik. Lütfen tekrar giriş yapın.");
      }

      const existingQR = await getShipmentByQR(qrInput);
      console.log("getShipmentByQR sonucu:", existingQR);
      const currentTime = new Date().toISOString();

      if (existingQR.length > 0) {
        const record = existingQR[0];

        // Daha önce okutulmuş mu kontrolü
        if (String(record.mal_kabul_durumu) === "1") {
          showNotification("Bu NVG daha önce okutulmuştur.", "warning");
          setQrInput("");
          setUpdating(false);
          return; // İşlemi durdur, veritabanında değişiklik yapma
        }

        // 1. Durum: QR listede var mı?
        const isInCurrentBox = shipments.some((s) => s.qr === qrInput);
        if (isInCurrentBox) {
          console.log("Listede bulunan QR güncelleniyor:", qrInput);
          await updateMalKabulFields(record.id, userData.name, userData.paad_id);
          showNotification("QR başarıyla okutuldu.", "success");
        } 
        // 2. Durum: Kullanıcının paad_id'si ile eşleşiyor ama bu kolide değil
        else if (record.paad_id === userData.paad_id) {
          console.log("Farklı koliye ait QR güncelleniyor:", qrInput);
          await updateMalKabulFields(record.id, userData.name, userData.paad_id);
          showNotification(
            `Bu ürün ${record.box} kolisine aittir. O koli için mal kabul işlemi gerçekleştirilmiştir.`,
            "warning"
          );
        } 
        // 3. Durum: Farklı paad_id ile eşleşiyor
        else {
          console.log("Farklı mağazaya ait QR güncelleniyor:", qrInput);
          await updateQRForDifferent(record.id, userData.name, userData.paad_id);
          showNotification(
            `Bu ürün ${record.box} kolisine ve ${record.to_location} mağazasına aittir. Ancak size gönderildiği için sizin stoğunuza eklenmiştir. Lütfen bu ürünü satış operasyona bildirin.`,
            "error"
          );
        }
      } 
      // 4. Durum: QR veritabanında yok
      else {
        console.log("Yeni QR ekleniyor:", qrInput);
        await addMissingQR(qrInput, box, userData.paad_id, userData.name);
        showNotification(
          `Bu ürün ${box} kolisine ait olarak eklendi.`,
          "error"
        );
      }

      await fetchShipments();
      setQrInput("");
    } catch (error) {
      console.error("Mal Kabul QR Güncelleme Hatası Detayı:", error.message, error.stack);
      showNotification(
        `Mal kabul işlemi sırasında bir hata oluştu: ${error.message}`,
        "error"
      );
      await fetchShipments(); // Hata olsa bile verileri güncelle
    }
    setUpdating(false);
  };

  // Eğer mal_kabul_durumu 1 ise QR gerçek, değilse "****" maskesi.
  const maskQRCode = (qr, shipment) => {
    return shipment.mal_kabul_durumu === "1" ? qr : "****";
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
        <button onClick={() => setKeyboardOpen((prev) => !prev)}>
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
