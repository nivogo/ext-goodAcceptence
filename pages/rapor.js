// pages/rapor.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getAllShipments,
  getTop100Shipments, // Doğru fonksiyon import edildi
} from "../lib/firestore";
import BackButton from "../components/BackButton";
import styles from "../styles/Rapor.module.css";
import * as XLSX from "xlsx"; // Excel indirme için xlsx paketini kullanıyoruz

const Rapor = () => {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [allShipments, setAllShipments] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Veri çekme fonksiyonu
  const fetchShipments = async () => {
    if (user && userData && userData.paad_id) {
      setRefreshing(true);
      setError(null);
      try {
        const allShipmentsData = await getAllShipments(); // Tüm gönderileri çekiyoruz
        setAllShipments(allShipmentsData);
        setShipments(allShipmentsData); // İlk başta tüm gönderileri gösteriyoruz
      } catch (err) {
        console.error("Rapor Veri Çekme Hatası:", err);
        setError("Veriler alınırken bir hata oluştu.");
      }
      setRefreshing(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userData, router]);

  // Arama Fonksiyonu: Client-Side Filtreleme
  useEffect(() => {
    const performSearch = () => {
      if (searchInput.trim() === "") {
        setShipments(allShipments); // Arama boşsa tüm gönderileri göster
      } else {
        const lowercasedInput = searchInput.toLowerCase();
        const filtered = allShipments.filter((shipment) =>
          Object.values(shipment).some((value) =>
            value
              ? value
                  .toString()
                  .toLowerCase()
                  .includes(lowercasedInput)
              : false
          )
        );
        setShipments(filtered);
      }
    };

    performSearch();
  }, [searchInput, allShipments]);

  // Excel İndirme Fonksiyonu
  const handleDownloadExcel = () => {
    if (allShipments.length === 0) {
      alert("İndirilecek veri bulunmamaktadır.");
      return;
    }

    // Excel dosyası için gerekli veriyi hazırlama
    const worksheetData = allShipments.map((shipment) => ({
      "Sevkiyat Numarası": shipment.shipment_no || "-",
      "Sevkiyat Tarihi": shipment.shipment_date
        ? new Date(shipment.shipment_date).toLocaleDateString()
        : "-",
      "Gönderici Lokasyon Adı": shipment.from_location || "-",
      "Gönderici Lokasyon ID": shipment.from_locationid || "-",
      "Alıcı Lokasyon Adı": shipment.to_location || "-",
      "Alıcı Lokasyon ID": shipment.paad_id || "-",
      "Koli Numarası": shipment.box || "-",
      QR: shipment.QR || "-",
      "Sipariş Tipi": shipment.WAOT_CODE || "-",
      on_kabul_durumu: shipment.on_kabul_durumu || "-",
      on_kabul_saati: shipment.on_kabul_saati
        ? new Date(shipment.on_kabul_saati.seconds * 1000).toLocaleString()
        : "-",
      on_kabul_yapan_kisi: shipment.on_kabul_yapan_kisi || "-",
      mal_kabul_durumu: shipment.mal_kabul_durumu || "-",
      mal_kabul_saati: shipment.mal_kabul_saati
        ? new Date(shipment.mal_kabul_saati.seconds * 1000).toLocaleString()
        : "-",
      mal_kabul_yapan_kisi: shipment.mal_kabul_yapan_kisi || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shipment_Data");
    XLSX.writeFile(workbook, "shipment_data.xlsx");
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
      <h1>Rapor Sayfası</h1>
      <p>
        Mağaza: {userData.storeName} (PAAD ID: {userData.paad_id})
      </p>

      {/* Hata Mesajı */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Arama Input Alanı */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Herhangi bir alanla ara (ör. abc)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Excel İndir Butonu */}
      <button onClick={handleDownloadExcel} className={styles.excelButton}>
        Excel İndir
      </button>

      {/* Rapor Tablosu */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Sevkiyat Numarası</th>
              <th className={styles.th}>Sevkiyat Tarihi</th>
              <th className={styles.th}>Gönderici Lokasyon Adı</th>
              <th className={styles.th}>Gönderici Lokasyon ID</th>
              <th className={styles.th}>Alıcı Lokasyon Adı</th>
              <th className={styles.th}>Alıcı Lokasyon ID</th>
              <th className={styles.th}>Koli Numarası</th>
              <th className={styles.th}>QR</th>
              <th className={styles.th}>Sipariş Tipi</th>
              <th className={styles.th}>Ön Kabul Durumu</th>
              <th className={styles.th}>Ön Kabul Saati</th>
              <th className={styles.th}>Ön Kabul Yapan Kişi</th>
              <th className={styles.th}>Mal Kabul Durumu</th>
              <th className={styles.th}>Mal Kabul Saati</th>
              <th className={styles.th}>Mal Kabul Yapan Kişi</th>
              <th className={styles.th}>Adres</th>
              <th className={styles.th}>Adresleme Saati</th>
              <th className={styles.th}>Adresleme Yapan Kişi</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((shipment, index) => (
              <tr key={shipment.id}>
                <td className={styles.td}>{shipment.shipment_no || "-"}</td>
                <td className={styles.td}>{shipment.shipment_date ? new Date(shipment.shipment_date).toLocaleDateString(): "-"}</td>
                <td className={styles.td}>{shipment.from_location || "-"}</td>
                <td className={styles.td}>{shipment.from_locationid || "-"}</td>
                <td className={styles.td}>{shipment.to_location || "-"}</td>
                <td className={styles.td}>{shipment.paad_id || "-"}</td>
                <td className={styles.td}>{shipment.box || "-"}</td>
                <td className={styles.td}>{shipment.QR || "-"}</td>
                <td className={styles.td}>{shipment.WAOT_CODE || "-"}</td>
                <td className={styles.td}>{shipment.on_kabul_durumu || "-"}</td>
                <td className={styles.td}>{shipment.on_kabul_saati ? new Date(shipment.on_kabul_saati.seconds * 1000).toLocaleString(): "-"}</td>
                <td className={styles.td}>{shipment.on_kabul_yapan_kisi || "-"}</td>
                <td className={styles.td}>{shipment.mal_kabul_durumu || "-"}</td>
                <td className={styles.td}>{shipment.mal_kabul_saati ? new Date(shipment.mal_kabul_saati.seconds * 1000).toLocaleString(): "-"}</td>
                <td className={styles.td}>{shipment.mal_kabul_yapan_kisi || "-"}</td>
                <td className={styles.td}>{shipment.adres || "-"}</td>
                <td className={styles.td}>{shipment.adresleme_saati ? new Date(shipment.adresleme_saati.seconds * 1000).toLocaleString(): "-"}</td>
                <td className={styles.td}>{shipment.adresleme_yapan_kisi || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Rapor;
