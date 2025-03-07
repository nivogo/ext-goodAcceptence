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
  addMissingBox
} from "../lib/firestore";
import BackButton from "../components/BackButton";
import styles from "../styles/OnKabul.module.css";

const API_BASE = "https://accept.hayatadondur.com/acceptance/index.php";

export default function OnKabulPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { showNotification } = useNotification();
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [groupedShipments, setGroupedShipments] = useState([]);
  const [boxInput, setBoxInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Sadece kullanıcının to_sap_location_id’sine ve on_kabul_durumu "0" olan gönderileri çekiyoruz.
  const fetchShipments = async () => {
    if (user && userData && userData.to_sap_location_id) {
      setLoading(true);
      setError(null);
      try {
        const shipmentsList = await getShipmentsByPAADID(userData.to_sap_location_id);
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

  // İlk kontrol: Okutulan koli numarası BX veya TR ile başlamalıdır.
  if (!boxInput.startsWith("BX") && !boxInput.startsWith("TR")) {
    alert("Okuttuğunuz koli BX veya TR ile başlamalıdır.");
    return;
  }

  setLoading(true);
  try {
    // Girilen koli numarasına ait gönderileri getir.
    const boxShipments = await getShipmentByBox(boxInput);
    if (boxShipments.length === 0) {
      await addMissingBox(boxInput, userData.to_sap_location_id, userData.name);
      alert("Bu koli için lütfen satış ekibi ile iletişime geçin.");
    } else {
      // Aynı to_sap_location_id'ye ait gönderileri ve farklı to_sap_location_id'ye ait gönderileri ayıralım.
      const samePaad = boxShipments.filter(
        (shipment) => shipment.to_sap_location_id === userData.to_sap_location_id
      );
      const differentPaad = boxShipments.filter(
        (shipment) => shipment.to_sap_location_id !== userData.to_sap_location_id
      );

      if (samePaad.length > 0) {
        // Eğer aynı mağazaya ait gönderiler varsa, bunların on_kabul_durumu "0" mı kontrol edelim.
        const notScanned = samePaad.filter(
          (shipment) => shipment.on_kabul_durumu === "0"
        );
        if (notScanned.length === 0) {
          showNotification("Bu koli daha önce okutulmuştur.", "error");
        } else {
          // Henüz okutulmamış olanlar için on_kabul_durumu güncelle.
          await Promise.all(
            notScanned.map((shipment) =>
              updateOnKabulFields(shipment.id, userData.name, userData.to_sap_location_id)
            )
          );
          showNotification("Koli başarıyla okutuldu!", "success");
        }
      }
      if (differentPaad.length > 0) {
        // Eğer okutulan koli, başka bir mağazaya aitse,
        // markExtraBox fonksiyonu kullanılarak on_kabul_durumu "2" yapılır.
        await Promise.all(
          differentPaad.map((shipment) =>
            markExtraBox(shipment.id, userData.name, userData.to_sap_location_id)
          )
        );
        showNotification("Koli başarıyla okutuldu!", "success");
      }
      // İşlem sonrası verileri güncelle.
      await fetchShipments();
    }
  } catch (error) {
    console.error("Ön Kabul Güncelleme Hatası:", error);
    showNotification("Ön kabul işlemi sırasında bir hata oluştu.", "error");
    await fetchShipments();
  }
  setLoading(false);
  setBoxInput("");
};

// Yeni: Belirtilen shipment id için tamamlama güncellemesi yapan fonksiyon.
  const completeShipment = async (shipmentId) => {
    const currentTime = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    const bodyData = {
      where: { id: shipmentId },
      data: {
        mal_kabul_durumu: 4,
        mal_kabul_yapan_kisi: userData.name,
        mal_kabul_saati: currentTime,
        adres: "FARK",
        adresleme_yapan_kisi: userData.name,
        adresleme_saati: currentTime,
        on_kabul_durumu: 4,
        on_kabul_yapan_kisi: userData.name,
        on_kabul_saati: currentTime,
        accept_wh_id: userData.to_sap_location_id,
        accept_datetime: currentTime,
        pre_accept_wh_id: userData.to_sap_location_id,
        pre_accept_datetime: currentTime,
        box_closed: true,
        box_closed_datetime: currentTime,
        shipment_closed: true,
        shipment_closed_datetime: currentTime,
      },
    };

    const response = await fetch(API_BASE, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${localStorage.getItem("basicAuth")}`,
      },
      body: JSON.stringify(bodyData),
    });
    if (!response.ok) {
      throw new Error(`Güncelleme başarısız oldu (ID: ${shipmentId})`);
    }
  };

  // Yeni: Tüm listede bulunan gönderiler için tamamlama işlemini yapan fonksiyon.
  const handleCompleteShipments = async () => {
    setLoading(true);
    try {
      await Promise.all(
        shipments.map((shipment) => completeShipment(shipment.id))
      );
      showNotification("Tüm sevkiyatlar başarıyla tamamlandı.", "success");
      setShowCompleteConfirm(false);
      await fetchShipments();
    } catch (error) {
      console.error("Tamamlama Hatası:", error);
      showNotification(`Sevkiyat tamamlama hatası: ${error.message}`, "error");
    }
    setLoading(false);
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
        Mağaza: {userData.storeName} (PAAD ID: {userData.to_sap_location_id})
      </p>
      {/* Başarılı Koliler Butonu */}
      <button
        onClick={() => router.push("/basariliKoliler")}
        className={styles.successButton}
      >
        Başarılı Koliler
      </button>
      
       <button
        onClick={() => setShowCompleteConfirm(true)}
        className={styles.submitButton}
        style={{ marginTop: "1rem", backgroundColor: "#6f42c1" }}
      >
        Sevkiyatları Tamamla
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
        
      {/* Onay Popup'ı */}
      {showCompleteConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
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
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <p>
              Sevkiyatı tamamlama işlemi geri alınamaz. Sevkiyatı tamamlamak
              istediğinize emin misiniz?
            </p>
            <div style={{ marginTop: "1rem" }}>
              <button
                onClick={handleCompleteShipments}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginRight: "1rem",
                }}
              >
                Sevkiyatı Tamamla
              </button>
              <button
                onClick={() => setShowCompleteConfirm(false)}
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
}
