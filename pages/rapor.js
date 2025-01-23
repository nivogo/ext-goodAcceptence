// pages/rapor.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getRaporData } from "../lib/firestore";
import BackButton from "../components/BackButton";

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
    <div style={containerStyle}>
      <BackButton />
      <h1>Rapor Sayfası</h1>
      <p>
        Mağaza: {userData.storeName} (Store ID: {userData.storeId})
      </p>

      {/* Yenile Butonu */}
      <button
        onClick={fetchRaporData}
        style={refreshButtonStyle}
        disabled={refreshing}
      >
        {refreshing ? "Yükleniyor..." : "Yenile"}
      </button>

      {/* Hata Mesajı */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Rapor Tablosu */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th>Sıra No</th>
            <th>Rapor Başlığı</th>
            <th>Detay</th>
            <th>Tarih</th>
          </tr>
        </thead>
        <tbody>
          {raporData.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>{item.rapor_basligi}</td>
              <td>{item.detay}</td>
              <td>{item.tarih}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const containerStyle = {
  padding: "2rem",
};

const refreshButtonStyle = {
  padding: "0.5rem 1rem",
  margin: "1rem 0",
  backgroundColor: "#17a2b8",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "1rem",
};

export const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "1rem",
};

export const thStyle = {
  border: "1px solid #ddd",
  padding: "8px",
  backgroundColor: "#f2f2f2",
};

export const tdStyle = {
  border: "1px solid #ddd",
  padding: "8px",
};

export default Rapor;
