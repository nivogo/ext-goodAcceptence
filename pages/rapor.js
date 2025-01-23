// pages/rapor.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getAllShipments,
  getTop100Shipments,
  searchShipmentsByQR,
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
    if (user && userData && userData.PAAD_ID) {
      setRefreshing(true);
      setError(null);
      try {
        const topShipments = await getTop100Shipments();
        setShipments(topShipments);
        const allShipmentsData = await getAllShipments();
        setAllShipments(allShipmentsData);
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

  // QR Arama Fonksiyonu
  useEffect(() => {
    const performSearch = async () => {
      if (searchInput.length >= 5) {
        setRefreshing(true);
        setError(null);
        try {
          const searchResults = await searchShipmentsByQR(searchInput);
          setShipments(searchResults);
        } catch (err) {
          console.error("QR Arama Hatası:", err);
          setError("QR araması yapılırken bir hata oluştu.");
        }
        setRefreshing(false);
      } else if (searchInput.length === 0) {
        // Arama temizlendiğinde tekrar top 100 getir
        fetchShipments();
      }
    };

    performSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

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
      "Alıcı Lokasyon ID": shipment.PAAD_ID || "-",
      "Koli Numarası": shipment.box || "-",
      QR: shipment.QR || "-",
      "Sipariş Tipi": shipment.WAOT_CODE || "-",
      OnKabulDurumu: shipment.onKabulDurumu || "-",
      OnKabulSaati: shipment.onKabulSaati
        ? new Date(shipment.onKabulSaati.seconds * 1000).toLocaleString()
        : "-",
      OnKabulYapanKisi: shipment.onKabulYapanKisi || "-",
      MalKabulDurumu: shipment.malKabulDurumu || "-",
      MalKabulSaati: shipment.malKabulSaati
        ? new Date(shipment.malKabulSaati.seconds * 1000).toLocaleString()
        : "-",
      MalKabulYapanKisi: shipment.malKabulYapanKisi || "-",
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
        Mağaza: {userData.storeName} (PAAD ID: {userData.PAAD_ID})
      </p>

      {/* Yenile Butonu */}
      <button
        onClick={fetchShipments}
        className={styles.refreshButton}
        disabled={refreshing}
      >
        {refreshing ? "Yükleniyor..." : "Yenile"}
      </button>

      {/* Hata Mesajı */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Arama Input Alanı */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="QR kodu ile ara (en az 5 karakter)"
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
            <th className={styles.th}>OnKabulDurumu</th>
            <th className={styles.th}>OnKabulSaati</th>
            <th className={styles.th}>OnKabulYapanKisi</th>
            <th className={styles.th}>MalKabulDurumu</th>
            <th className={styles.th}>MalKabulSaati</th>
            <th className={styles.th}>MalKabulYapanKisi</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment, index) => (
            <tr key={shipment.id}>
              <td className={styles.td}>{shipment.shipment_no || "-"}</td>
              <td className={styles.td}>
                {shipment.shipment_date
                  ? new Date(shipment.shipment_date).toLocaleDateString()
                  : "-"}
              </td>
              <td className={styles.td}>{shipment.from_location || "-"}</td>
              <td className={styles.td}>{shipment.from_locationid || "-"}</td>
              <td className={styles.td}>{shipment.to_location || "-"}</td>
              <td className={styles.td}>{shipment.PAAD_ID || "-"}</td>
              <td className={styles.td}>{shipment.box || "-"}</td>
              <td className={styles.td}>{shipment.QR || "-"}</td>
              <td className={styles.td}>{shipment.WAOT_CODE || "-"}</td>
              <td className={styles.td}>{shipment.onKabulDurumu || "-"}</td>
              <td className={styles.td}>
                {shipment.onKabulSaati
                  ? new Date(shipment.onKabulSaati.seconds * 1000).toLocaleString()
                  : "-"}
              </td>
              <td className={styles.td}>{shipment.onKabulYapanKisi || "-"}</td>
              <td className={styles.td}>{shipment.malKabulDurumu || "-"}</td>
              <td className={styles.td}>
                {shipment.malKabulSaati
                  ? new Date(shipment.malKabulSaati.seconds * 1000).toLocaleString()
                  : "-"}
              </td>
              <td className={styles.td}>{shipment.malKabulYapanKisi || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Rapor;
