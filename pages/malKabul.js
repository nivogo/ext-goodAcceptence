// pages/malKabul.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMalKabulData, updateMalKabulFields } from "../lib/firestore";
import BackButton from "../components/BackButton";

const MalKabul = () => {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [malKabulData, setMalKabulData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Veri çekme fonksiyonu
  const fetchMalKabulData = async () => {
    if (user && userData && userData.storeId) {
      setRefreshing(true);
      setError(null);
      try {
        const data = await getMalKabulData(userData.storeId);
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
    <div style={containerStyle}>
      <BackButton />
      <h1>Mal Kabul Sayfası</h1>
      <p>
        Mağaza: {userData.storeName} (Store ID: {userData.storeId})
      </p>

      {/* Yenile Butonu */}
      <button
        onClick={fetchMalKabulData}
        style={refreshButtonStyle}
        disabled={refreshing}
      >
        {refreshing ? "Yükleniyor..." : "Yenile"}
      </button>

      {/* Hata Mesajı */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Veri Tablosu */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th>Sıra No</th>
            <th>Ürün Adı</th>
            <th>Miktar</th>
            <th>Durum</th>
            <th>Güncelle</th>
          </tr>
        </thead>
        <tbody>
          {malKabulData.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>{item.urun_adi}</td>
              <td>{item.miktar}</td>
              <td>{item.malKabulDurumu || "-"}</td>
              <td>
                <button
                  onClick={() => handleUpdate(item.id)}
                  style={updateButtonStyle}
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

const containerStyle = {
  padding: "2rem",
};

const refreshButtonStyle = {
  padding: "0.5rem 1rem",
  margin: "1rem 0",
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const updateButtonStyle = {
  padding: "0.3rem 0.6rem",
  backgroundColor: "#ffc107",
  color: "#000",
  border: "none",
  borderRadius: "3px",
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

export default MalKabul;
