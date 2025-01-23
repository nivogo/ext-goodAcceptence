// pages/onKabul.js
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getShipmentsByStoreId,
  getAllShipments,
  getShipmentByBox,
  updateOnKabulFields,
  markExtraBox,
} from "../lib/firestore";
import BackButton from "../components/BackButton";
import styles from "../styles/OnKabul.module.css";

export default function OnKabulPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [allShipments, setAllShipments] = useState([]);
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
        const allShipmentsList = await getAllShipments();
        // "Okutma Başarılı" olmayanları filtrele
        const filteredShipments = shipmentsList
          .filter((shipment) => shipment.onKabulDurumu !== "Okutma Başarılı")
          .sort((a, b) => {
            if (!a.onKabulDurumu && b.onKabulDurumu) return -1;
            if (a.onKabulDurumu && !b.onKabulDurumu) return 1;
            return 0;
          });
        setShipments(filteredShipments);
        setAllShipments(allShipmentsList);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Önce daha önce okutulmuş olup olmadığını kontrol et
        const alreadyApproved = matchingDocs.some(
          (docItem) => docItem.onKabulDurumu === "Okutma Başarılı"
        );

        if (alreadyApproved) {
          alert("Bu koli daha önce okutulmuştur.");
          return;
        }

        // Onayla ve güncelle
        await Promise.all(
          matchingDocs.map((docItem) =>
            updateOnKabulFields(docItem.id, userData.name)
          )
        );

        // Güncellenmiş verileri yansıt
        const updatedShipments = shipments
          .map((item) => {
            if (item.box === boxInput) {
              return {
                ...item,
                onKabulDurumu: "Okutma Başarılı",
                onKabulYapanKisi: userData.name,
                onKabulSaati: new Date().toISOString(),
                isApproved: true,
              };
            }
            return item;
          })
          .filter((item) => item.onKabulDurumu !== "Okutma Başarılı"); // "Okutma Başarılı" olanları listeden çıkar
        setShipments(updatedShipments);

        alert("Koli numarası başarıyla okutuldu!");
      } else {
        // Başka mağazalarda olup olmadığını kontrol et
        const otherShipments = await getShipmentByBox(boxInput);
        if (otherShipments.length > 0) {
          // Hatalı mağazayı belirlemek için ilk bulduğu mağazayı kullan
          const targetStore = otherShipments[0].storeName || "bilinmeyen";

          // Tüm bulduğu kolileri işaretle
          await Promise.all(
            otherShipments.map((shipment) =>
              markExtraBox(shipment.id, userData.name)
            )
          );

          alert(
            `Okuttuğunuz koli ${targetStore} mağazasına gönderilmiştir ve hatalı bir şekilde size teslim edilmiştir. Lütfen Satış Operasyon ile iletişime geçin.`
          );
        } else {
          // Koli numarası "TR" veya "BX" ile başlamıyor mu kontrol et
          if (!boxInput.startsWith("TR") && !boxInput.startsWith("BX")) {
            alert(
              "Böyle bir koli sevkiyat listelerinde bulunamadı. Lütfen Satış Operasyon ile iletişime geçin."
            );
            return;
          }

          // Eğer "TR" veya "BX" ile başlıyorsa ve listede yoksa
          alert(
            "Böyle bir koli sevkiyat listelerinde bulunamadı. Lütfen Satış Operasyon ile iletişime geçin."
          );
        }
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
    <div className={styles.container}>
      <BackButton />
      <h1>Hoş Geldiniz, {userData.name}</h1>
      <p>
        Mağaza: {userData.storeName} (Store ID: {userData.storeId})
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

      {/* Koli Arama Input */}
      <form onSubmit={handleBoxSubmit} className={styles.form}>
        <input
          type="text"
          placeholder="Koli numarası giriniz"
          value={boxInput}
          onChange={(e) => setBoxInput(e.target.value)}
          required
          className={styles.input}
        />
        <button type="submit" className={styles.submitButton}>
          Onayla
        </button>
      </form>

      {/* Toplam Koli Sayısı */}
      <p>Toplam Koli Adedi: {shipments.length}</p>

      {/* Liste Tablosu */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Sıra No</th>
            <th className={styles.th}>Gönderici Lokasyon Adı</th>
            <th className={styles.th}>Alıcı Lokasyon Adı</th>
            <th className={styles.th}>Koli Numarası</th>
            <th className={styles.th}>Sevk Tarihi</th>
            <th className={styles.th}>Sevkiyat Numarası</th>
            <th className={styles.th}>Ürün Adedi</th>
            <th className={styles.th}>Ön Kabul Durumu</th>
            <th className={styles.th}>Ön Kabul Yapan Kişi</th>
            <th className={styles.th}>Ön Kabul Saati</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((item, index) => (
            <tr key={item.id}>
              <td className={styles.td}>{index + 1}</td>
              <td className={styles.td}>{item.from_location}</td>
              <td className={styles.td}>{item.to_location}</td>
              <td className={styles.td}>
                {item.onKabulDurumu === "Okutma Başarılı" ? item.box : "****"}
              </td>
              <td className={styles.td}>
                {item.shipment_date
                  ? new Date(item.shipment_date).toLocaleDateString()
                  : "-"}
              </td>
              <td className={styles.td}>{item.shipment_no || "-"}</td>
              <td className={styles.td}>
                {item.onKabulDurumu === "Okutma Başarılı"
                  ? item.quantityof_order
                  : "****"}
              </td>
              <td className={styles.td}>{item.onKabulDurumu || "-"}</td>
              <td className={styles.td}>{item.onKabulYapanKisi || "-"}</td>
              <td className={styles.td}>{formatDate(item.onKabulSaati)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
