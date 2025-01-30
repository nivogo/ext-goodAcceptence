// pages/adresleme.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { getShipmentsByAdres } from "../lib/firestore";
import styles from "../styles/Adresleme.module.css";

export default function AdreslemePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [selectedOption, setSelectedOption] = useState("Reyondan Depoya");
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h1>Adresleme</h1>

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
                    <td className={styles.td}>{item.adreslemeYapanKisi || "-"}</td>
                    <td className={styles.td}> {item["adreslemeSaati"] ? formatDate(item["adreslemeSaati"]) : "-"} </td>
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
