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
  const [showCloseConfirm, setShowCloseConfirm] = useState(false); // Popup için state

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
    // Kullanıcı ve veri hazır olduğunda yalnızca veriyi çek
    if (user && userData && box) {
      fetchShipments();
    } else if (!loading && (!user || !userData)) {
      // Yükleme bittiyse ve hala kullanıcı yoksa giriş sayfasına yönlendir
      router.push("/");
    }
  }, [user, userData, box, router]);

  const handleQRSubmit = async (e) => {
    e.preventDefault();
    if (!qrInput) return;

    if (!qrInput.startsWith("NVG")) {
      alert("Okuttuğunuz ürün NVG ile başlamalı.");
      return;
    }

    setUpdating(true);
    try {
      if (!userData || !userData.paad_id || !userData.name) {
        throw new Error("Kullanıcı bilgileri eksik. Lütfen tekrar giriş yapın.");
      }

      const existingQR = await getShipmentByQR(qrInput);
      console.log("getShipmentByQR sonucu:", existingQR);
      const currentTime = new Date().toISOString();

      if (existingQR.length > 0) {
        const record = existingQR[0];

        if (String(record.mal_kabul_durumu) === "1") {
          showNotification("Bu NVG daha önce okutulmuştur.", "warning");
          setQrInput("");
          setUpdating(false);
          return;
        }

        const isInCurrentBox = shipments.some((s) => s.qr === qrInput);
        if (isInCurrentBox) {
          console.log("Listede bulunan QR güncelleniyor:", qrInput);
          await updateMalKabulFields(record.id, userData.name, userData.paad_id);
          showNotification("QR başarıyla okutuldu.", "success");
        } else if (record.paad_id === userData.paad_id) {
          console.log("Farklı koliye ait QR güncelleniyor:", qrInput);
          await updateMalKabulFields(record.id, userData.name, userData.paad_id);
          showNotification(
            `Bu ürün ${record.box} kolisine aittir. O koli için mal kabul işlemi gerçekleştirilmiştir.`,
            "warning"
          );
        } else {
          console.log("Farklı mağazaya ait QR güncelleniyor:", qrInput);
          await updateQRForDifferent(record.id, userData.name, userData.paad_id);
          showNotification(
            `Bu ürün ${record.box} kolisine ve ${record.to_location} mağazasına aittir. Ancak size gönderildiği için sizin stoğunuza eklenmiştir.`,
            "error"
          );
        }
      } else {
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
      await fetchShipments();
    }
    setUpdating(false);
  };

  // Koli kapatma işlemi
  const handleCloseBox = async () => {
    setShowCloseConfirm(false); // Popup'u kapat
    setUpdating(true);
    try {
      if (!userData || !userData.paad_id || !userData.name) {
        throw new Error("Kullanıcı bilgileri eksik. Lütfen tekrar giriş yapın.");
      }

      const currentTime = new Date().toISOString();

      // Tüm sevkiyatların güncellenmesi için Promise.all
      await Promise.all(
        shipments.map(async (shipment) => {
          const bodyData = {
            where: { id: shipment.id },
            data: {
              box_closed: true,
              box_closed_datetime: currentTime,
              ...(shipment.mal_kabul_durumu === "Baslanmadi" && {
                mal_kabul_durumu: "4",
                mal_kabul_yapan_kisi: userData.name,
                mal_kabul_saati: currentTime,
                accept_wh_id: userData.paad_id,
                accept_datetime: currentTime,
                adres: "FARK",
                adresleme_yapan_kisi: userData.name,
                adresleme_saati: currentTime,
              }),
            },
          };

          const response = await fetch("https://accept.hayatadondur.com/acceptance/index.php", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Basic ${localStorage.getItem("basicAuth")}`,
            },
            body: JSON.stringify(bodyData),
          });

          if (!response.ok) {
            throw new Error(`Koli kapatma işlemi başarısız: Sevkiyat ID ${shipment.id}`);
          }
        })
      );

      showNotification("Koli başarıyla kapatıldı.", "success");
      await fetchShipments(); // Verileri güncelle
      router.push("/malKabul"); // Koli kapandıktan sonra MalKabul sayfasına yönlendir
    } catch (error) {
      console.error("Koli Kapatma Hatası:", error.message, error.stack);
      showNotification(`Koli kapatma sırasında bir hata oluştu: ${error.message}`, "error");
      await fetchShipments();
    }
    setUpdating(false);
  };

  const maskQRCode = (qr, shipment) => {
    return ["1", "2", "3"].includes(String(shipment.mal_kabul_durumu)) ? qr : "****";
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
      {/* Koli Kapat Butonu */}
      <button
        onClick={() => setShowCloseConfirm(true)}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#dc3545",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          margin: "1rem 0",
        }}
        disabled={updating}
      >
        Koli Kapat
      </button>
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
      {/* Koli Kapat Onay Popup */}
      {showCloseConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "8px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            <p>
              Kapatılan koli işlemi geri alınamaz. Devam etmek istediğinize emin misiniz?
            </p>
            <div style={{ marginTop: "1rem" }}>
              <button
                onClick={handleCloseBox}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#dc3545",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginRight: "1rem",
                }}
              >
                Koliyi Kapat
              </button>
              <button
                onClick={() => setShowCloseConfirm(false)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#6c757d",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MalKabulDetay;
