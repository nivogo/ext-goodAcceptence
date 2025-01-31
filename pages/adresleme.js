// pages/adresleme.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import {
  getShipmentsByAdres,
  getShipmentByQR
} from "../lib/firestore"; // <-- getShipmentByQR import eklendi
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"; // <-- Güncelleme için eklendi
import { db } from "../firebase/firebaseConfig"; // <-- Firestore referansı
import BackButton from "../components/BackButton";
import styles from "../styles/Adresleme.module.css";
import FocusLockInput from "../components/FocusLockInput";

export default function AdreslemePage() {
  const router = useRouter();
  const { user, userData } = useAuth(); // <-- userData alındı
  const { showNotification } = useNotification(); // <-- Bildirim fonksiyonu

  const [selectedOption, setSelectedOption] = useState("Reyondan Depoya");
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // **QR girişi için local state**
  const [qrInput, setQrInput] = useState("");

  // Kullanıcı giriş kontrolü + veri çekme
  useEffect(() => {
    if (!user) {
      router.push("/");
    } else {
      fetchShipments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption, user]);

  // Firestore'dan verileri çekme
  const fetchShipments = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Seçilen dropdown değerine göre "adres" sorgusu
      const adresValue =
        selectedOption === "Reyondan Depoya" ? "Reyon" : "Depo";

      const results = await getShipmentsByAdres(adresValue);
      setShipments(results);
    } catch (error) {
      console.error("Adresleme Veri Çekme Hatası:", error);
    }
    setLoading(false);
  };

  // Dropdown değiştiğinde state güncelle
  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

  // Tablo başlığı için dinamik metin
  const getTitleText = () => {
    return selectedOption === "Reyondan Depoya"
      ? "Reyondaki Ürün Adedi"
      : "Depodaki Ürün Adedi";
  };

  // **Tarih formatlama (malKabulDetay.js’dekine benzer)**
  const formatDate = (date) => {
    if (!date) return "-";
    if (date.toDate) {
      return date.toDate().toLocaleString();
    }
    const parsedDate = new Date(date);
    return isNaN(parsedDate) ? "-" : parsedDate.toLocaleString();
  };

  // **Yeni fonksiyon: QR okutarak adres güncelleme**
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
      if (shipment.PAAD_ID !== Number(userData.PAAD_ID)) {
        showNotification("Bu ürün farklı bir mağazaya ait!", "error");
        return;
      }

      // Adres kontrolü (Reyon/Depo)
      const expectedAdres = selectedOption === "Reyondan Depoya" ? "Reyon" : "Depo";
      if (shipment.adres !== expectedAdres) {
        showNotification(`Bu ürünün adres bilgisi "${shipment.adres}" durumda!`, "error");
        return;
      }

      // Ön kabul, mal kabul kontrolü (dolu olmaları isteniyor)
      if (!shipment.onKabulDurumu) {
        showNotification("Ön Kabul işlemi yapılmamış!", "error");
        return;
      }
      if (!shipment.malKabulDurumu) {
        showNotification("Mal Kabul işlemi yapılmamış!", "error");
        return;
      }

      // Her şey uygunsa -> Adres'i güncelle
      const newAdres = selectedOption === "Reyondan Depoya" ? "Depo" : "Reyon";

      const docRef = doc(db, "shipment_data", shipment.id);
      await updateDoc(docRef, {
        adres: newAdres,
        adreslemeSaati: serverTimestamp(),
        adreslemeYapanKisi: userData.name
      });

      showNotification("Adres bilgisi başarıyla güncellendi.", "success");
      setQrInput(""); // input sıfırlama

      // Listeyi yenile (fetchShipments)
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
      {/* Geri butonu */}
      <BackButton />

      <div style={{ position: "absolute", top: 10, right: 10 }}>
        <button onClick={() => setKeyboardOpen(!keyboardOpen)}>
          {keyboardOpen ? "Kapat" : "Klavye Aç"}
        </button>
      </div>

      <h1>Adresleme</h1>
      {/* Mağaza - PAAD ID bilgisi */}
      {userData && (
        <p>
          Mağaza: {userData.storeName} (PAAD ID: {userData.PAAD_ID})
        </p>
      )}

      {/* Dropdown */}
      <div className={styles.dropdownWrapper}>
        <select
          className={styles.dropdown}
          value={selectedOption}
          onChange={handleOptionChange}
        >
          <option value="Reyondan Depoya">Reyondan Depoya</option>
          <option value="Depodan Reyona">Depodan Reyona</option>
        </select>
      </div>

      {/* Yükleniyor durumu */}
      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <>
          {/* Seçili duruma göre ürün adet bilgisi */}
          <p>
            {getTitleText()}: {shipments.length}
          </p>

          {/* QR Input Formu */}
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
            <button
              type="submit"
              className={styles.qrSubmitButton}
            >
              Adres Güncelle
            </button>
          </form>

          {/* Liste Tablosu */}
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
                    <td className={styles.td}>{item.QR || "-"}</td>
                    <td className={styles.td}>{item.adres || "-"}</td>
                    <td className={styles.td}>
                      {item.adreslemeYapanKisi || "-"}
                    </td>
                    <td className={styles.td}>
                      {item.adreslemeSaati
                        ? formatDate(item.adreslemeSaati)
                        : "-"}
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
