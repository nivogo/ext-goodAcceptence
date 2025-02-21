// pages/adresleme.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
// REST API üzerinden veri çekecek fonksiyonlar:
import { getShipmentsByAdres, getShipmentByQR, updateAdres } from "../lib/firestore";
import BackButton from "../components/BackButton";
import styles from "../styles/Adresleme.module.css";
import FocusLockInput from "../components/FocusLockInput";

export default function AdreslemePage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { showNotification } = useNotification();

  const [selectedOption, setSelectedOption] = useState("Reyondan Depoya");
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [qrInput, setQrInput] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/");
    } else {
      fetchShipments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption, user]);

  const fetchShipments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Seçilen dropdown değerine göre "adres" sorgusu
      const adresValue = selectedOption === "Reyondan Depoya" ? "Reyon" : "Depo";
      const results = await getShipmentsByAdres(adresValue);
      setShipments(results);
    } catch (error) {
      console.error("Adresleme Veri Çekme Hatası:", error);
    }
    setLoading(false);
  };

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

  const getTitleText = () => {
    return selectedOption === "Reyondan Depoya" ? "Reyondaki Ürün Adedi" : "Depodaki Ürün Adedi";
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const parsedDate = new Date(date);
    return isNaN(parsedDate) ? "-" : parsedDate.toLocaleString();
  };

  // QR okutarak adres güncelleme işlemi
  const handleQrSubmit = async (e) => {
    e.preventDefault();
    if (!qrInput) return;

    try {
      // 1) QR veritabanında mevcut mu?
      const matched = await getShipmentByQR(qrInput);
      if (matched.length === 0) {
        showNotification("Bu QR koduna ait bir ürün bulunamadı.", "error");
        return;
      }

      // 2) İlk kaydı al
      const shipment = matched[0];

      // Mağaza kontrolü
      if (shipment.paad_id !== Number(userData.paad_id)) {
        showNotification("Bu ürün farklı bir mağazaya ait!", "error");
        return;
      }

      // Adres kontrolü (Reyon/Depo)
      const expectedAdres = selectedOption === "Reyondan Depoya" ? "Reyon" : "Depo";
      if (shipment.adres !== expectedAdres) {
        showNotification(`Bu ürünün adres bilgisi "${shipment.adres}" durumda!`, "error");
        return;
      }

      // Ön kabul, mal kabul kontrolü
      if (!shipment.on_kabul_durumu) {
        showNotification("Ön Kabul işlemi yapılmamış!", "error");
        return;
      }
      if (!shipment.mal_kabul_durumu) {
        showNotification("Mal Kabul işlemi yapılmamış!", "error");
        return;
      }

      // Adres güncellemesi: Yeni adres, mevcut seçeneğin tersidir
      const newAdres = selectedOption === "Reyondan Depoya" ? "Depo" : "Reyon";

      // Firebase Firestore yerine REST API çağrısı:
      await updateAdres(shipment.id, newAdres, userData.name);

      showNotification("Adres bilgisi başarıyla güncellendi.", "success");
      setQrInput("");
      fetchShipments();
    } catch (err) {
      console.error("QR ile adres güncelleme hatası:", err);
      showNotification("Adresleme sırasında bir hata oluştu.", "error");
    }
  };

  if (!user) {
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
      <h1>Adresleme</h1>
      {userData && (
        <p>
          Mağaza: {userData.storeName} (PAAD ID: {userData.paad_id})
        </p>
      )}
      <div className={styles.dropdownWrapper}>
        <select className={styles.dropdown} value={selectedOption} onChange={handleOptionChange}>
          <option value="Reyondan Depoya">Reyondan Depoya</option>
          <option value="Depodan Reyona">Depodan Reyona</option>
        </select>
      </div>
      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <>
          <p>{getTitleText()}: {shipments.length}</p>
          <form onSubmit={handleQrSubmit} className={styles.qrForm}>
            <FocusLockInput
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onEnter={handleQrSubmit}
              placeholder="QR kodu giriniz"
              className={styles.qrInput}
              autoFocus={true}
              required
              enableKeyboard={keyboardOpen}
            />
            <button type="submit" className={styles.qrSubmitButton}>
              Adres Güncelle
            </button>
          </form>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Sıra No</th>
                  <th className={styles.th}>QR</th>
                  <th className={styles.th}>Adres</th>
                  <th className={styles.th}>Adresleme Yapan Kişi</th>
                  <th className={styles.th}>Adresleme Saati</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((item, index) => (
                  <tr key={item.id}>
                    <td className={styles.td}>{index + 1}</td>
                    <td className={styles.td}>{item.qr || "-"}</td>
                    <td className={styles.td}>{item.adres || "-"}</td>
                    <td className={styles.td}>{item.adresleme_yapan_kisi || "-"}</td>
                    <td className={styles.td}>
                      {item.adresleme_saati ? formatDate(item.adresleme_saati) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
