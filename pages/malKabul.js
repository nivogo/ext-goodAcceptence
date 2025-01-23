// pages/malKabul.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react"; // useEffect ve useState import edildi
import { useAuth } from "../context/AuthContext";
import { getMalKabulData, updateMalKabulFields } from "../lib/firestore";
import BackButton from "../components/BackButton";
import styles from "../styles/MalKabul.module.css";

const MalKabul = () => {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [malKabulData, setMalKabulData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Veri çekme fonksiyonu
  const fetchMalKabulData = async () => {
    if (user && userData && userData.PAAD_ID) {
      setRefreshing(true);
      setError(null);
      try {
        const data = await getMalKabulData(userData.PAAD_ID);
        setMalKabulData(data);
      } catch (err) {
        console.error("Mal Kabul Veri Çekme Hatası:", err);
        setError("Mal kabul verileri alınırken bir hata oluştu.");
      }
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && userData) {
      fetchMalKabulData();
    } else {
      setLoading(false);
      router.push("/");
    }
  }, [user, userData, router]);

  const handleUpdate = async (docId) => {
    try {
      await updateMalKabulFields(docId, userData.name);
      fetchMalKabulData(); // Güncel verileri tekrar çek
      alert("Mal kabul başarıyla güncellendi!");
    } catch (error) {
      console.error("Mal Kabul Güncelleme Hatası:", error);
      alert("Mal kabul güncellenirken bir hata oluştu.");
    }
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
      <h1>Mal Kabul Sayfası</h1>
      <p>
        Mağaza: {userData.storeName} (PAAD ID: {userData.PAAD_ID})
      </p>

      {/* Yenile Butonu */}
      <button
        onClick={fetchMalKabulData}
        className={styles.refreshButton}
        disabled={refreshing}
      >
        {refreshing ? "Yükleniyor..." : "Yenile"}
      </button>

      {/* Hata Mesajı */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Veri Tablosu */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Sıra No</th>
            <th className={styles.th}>Ürün Adı</th>
            <th className={styles.th}>Miktar</th>
            <th className={styles.th}>Durum</th>
            <th className={styles.th}>Güncelle</th>
          </tr>
        </thead>
        <tbody>
          {malKabulData.map((item, index) => (
            <tr key={item.id}>
              <td className={styles.td}>{index + 1}</td>
              <td className={styles.td}>{item.urun_adi}</td>
              <td className={styles.td}>{item.miktar}</td>
              <td className={styles.td}>{item.malKabulDurumu || "-"}</td>
              <td className={styles.td}>
                <button
                  onClick={() => handleUpdate(item.id)}
                  className={styles.updateButton}
                >
                  Güncelle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MalKabul;
