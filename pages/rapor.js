// pages/rapor.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getRaporData } from "../lib/firestore";
import BackButton from "../components/BackButton";
import styles from "../styles/Rapor.module.css";

const Rapor = () => {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [raporData, setRaporData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Veri çekme fonksiyonu
  const fetchRaporData = async () => {
    if (user && userData && userData.storeId) {
      setRefreshing(true);
      setError(null);
      try {
        const data = await getRaporData(userData.storeId);
        setRaporData(data);
      } catch (err) {
        console.error("Rapor Veri Çekme Hatası:", err);
        setError("Rapor verileri alınırken bir hata oluştu.");
      }
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && userData) {
      fetchRaporData();
    } else {
      setLoading(false);
      router.push("/");
    }
  }, [user, userData, router]);

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
        Mağaza: {userData.storeName} (Store ID: {userData.storeId})
      </p>

      {/* Yenile Butonu */}
      <button
        onClick={fetchRaporData}
        className={styles.refreshButton}
        disabled={refreshing}
      >
        {refreshing ? "Yükleniyor..." : "Yenile"}
      </button>

      {/* Hata Mesajı */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Rapor Tablosu */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Sıra No</th>
            <th className={styles.th}>Rapor Başlığı</th>
            <th className={styles.th}>Detay</th>
            <th className={styles.th}>Tarih</th>
          </tr>
        </thead>
        <tbody>
          {raporData.map((item, index) => (
            <tr key={item.id}>
              <td className={styles.td}>{index + 1}</td>
              <td className={styles.td}>{item.rapor_basligi}</td>
              <td className={styles.td}>{item.detay}</td>
              <td className={styles.td}>{item.tarih}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Rapor;
