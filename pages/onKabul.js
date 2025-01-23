// pages/onKabul.js
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getShipmentsByStoreId, updateOnKabulFields } from "../lib/firestore";
import BackButton from "../components/BackButton";

export default function OnKabulPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [boxInput, setBoxInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Veri çekme fonksiyonu
  const fetchShipments = async () => {
    if (user && userData && userData.storeId) {
      setRefreshing(true);
      setError(null);
      try {
        const shipmentsList = await getShipmentsByStoreId(userData.storeId);
        setShipments(shipmentsList);
      } catch (err) {
        console.error("Veri Çekme Hatası:", err);
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
  }, [user, userData, router]);

  const formatDate = (date) => {
    if (!date) return "-";
    if (date.toDate) {
      return date.toDate().toLocaleString();
    }
    const parsedDate = new Date(date);
    return isNaN(parsedDate) ? "-" : parsedDate.toLocaleString();
  };

  const handleBoxSubmit = async (e) => {
    e.preventDefault();
    if (!boxInput) return;

    try {
      const matchingDocs = shipments.filter((doc) => doc.box === boxInput);

      if (matchingDocs.length > 0) {
        await Promise.all(
          matchingDocs.map((docItem) =>
            updateOnKabulFields(docItem.id, userData.name)
          )
        );

        const updatedShipments = shipments.map((item) => {
          if (item.box === boxInput) {
            return {
              ...item,
              onKabulDurumu: "Okutma Başarılı",
              onKabulYapanKisi: userData.name,
              onKabulSaati: new Date().toISOString(),
            };
          }
          return item;
        });
        setShipments(updatedShipments);

        alert("Koli numarası başarıyla okutuldu!");
      } else {
        alert("Girilen koli numarası, bu mağaza için mevcut değil.");
      }
      setBoxInput("");
    } catch (error) {
      console.error("Ön Kabul Güncelleme Hatası:", error);
      alert("Ön kabul işlemi sırasında bir hata oluştu.");
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
      <h1>Hoş Geldiniz, {userData.name}</h1>
      <p>
        Mağaza: {userData.storeName} (Store ID: {userData.storeId})
      </p>

      {/* Yenile Butonu */}
      <button
        onClick={fetchShipments}
        style={refreshButtonStyle}
        disabled={refreshing}
      >
        {refreshing ? "Yükleniyor..." : "Yenile"}
      </button>

      {/* Hata Mesajı */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Koli Arama Input */}
      <form
        onSubmit={handleBoxSubmit}
        style={{ marginBottom: "1rem", marginTop: "1rem" }}
      >
        <input
          type="text"
          placeholder="Koli numarası giriniz"
          value={boxInput}
          onChange={(e) => setBoxInput(e.target.value)}
          required
          style={inputStyle}
        />
        <button type="submit" style={submitButtonStyle}>
          Onayla
        </button>
      </form>

      {/* Toplam Koli Sayısı */}
      <p>Toplam Koli Adedi: {shipments.length}</p>

      {/* Liste Tablosu */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th>Sıra No</th>
            <th>Gönderici Lokasyon Adı</th>
            <th>Alıcı Lokasyon Adı</th>
            <th>Koli Numarası</th>
            <th>Sevk Tarihi</th>
            <th>Sevkiyat Numarası</th>
            <th>Ürün Adedi</th>
            <th>Ön Kabul Durumu</th>
            <th>Ön Kabul Yapan Kişi</th>
            <th>Ön Kabul Saati</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>{item.from_location}</td>
              <td>{item.to_location}</td>
              <td>{item.box}</td>
              <td>{item.shipment_date}</td>
              <td>{item.shipment_no}</td>
              <td>{item.quantityof_order}</td>
              <td>{item.onKabulDurumu || "-"}</td>
              <td>{item.onKabulYapanKisi || "-"}</td>
              <td>{formatDate(item.onKabulSaati)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const containerStyle = {
  margin: "2rem",
};

const refreshButtonStyle = {
  padding: "0.5rem 1rem",
  margin: "1rem 0",
  backgroundColor: "#28a745",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const inputStyle = {
  padding: "0.5rem",
  marginRight: "1rem",
  border: "1px solid #ccc",
  borderRadius: "4px",
  width: "200px",
};

const submitButtonStyle = {
  padding: "0.5rem 1rem",
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "1rem",
};

tableStyle.th = {
  border: "1px solid #ddd",
  padding: "8px",
  backgroundColor: "#f2f2f2",
};

tableStyle.td = {
  border: "1px solid #ddd",
  padding: "8px",
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
