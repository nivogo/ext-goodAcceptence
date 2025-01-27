// pages/onKabul.js
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import FocusLockInput from "../components/FocusLockInput"; // Yolunuzu ayarlayın
import {
  getShipmentsByPAADID,
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

  // Koli numarasına göre gruplandırılmış gönderileri saklamak için state
  const [groupedShipments, setGroupedShipments] = useState([]);

  // Veri çekme fonksiyonu
  const fetchShipments = async () => {
    if (user && userData && userData.PAAD_ID) {
      setRefreshing(true);
      setError(null);
      try {
        const shipmentsList = await getShipmentsByPAADID(userData.PAAD_ID);
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

        // Gönderileri koli numarasına göre gruplandır
        const grouped = {};
        filteredShipments.forEach((shipment) => {
          if (!grouped[shipment.box]) {
            grouped[shipment.box] = {
              box: shipment.box,
              shipment_no: shipment.shipment_no || "-", // Sevk Numarası
              shipment_date: shipment.shipment_date || "-", // Sevk Tarihi
              quantity: shipment.quantityof_product,
              onKabulDurumu: shipment.onKabulDurumu,
              onKabulYapanKisi: shipment.onKabulYapanKisi,
              onKabulSaati: shipment.onKabulSaati,
              from_location: shipment.from_location || "-", // Gönderici Lokasyon Adı
              isApproved: shipment.isApproved,
              shipmentIds: [shipment.id], // Aynı koliye ait tüm doküman ID'leri
            };
          } else {
            // Eğer koli zaten varsa, sadece quantity'yi güncelle
            grouped[shipment.box].quantity += shipment.quantityof_product;
            grouped[shipment.box].shipmentIds.push(shipment.id);
          }
        });
        // Diziye dönüştür
        setGroupedShipments(Object.values(grouped));
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

    setLoading(true); // Yükleniyor durumunu göstermek için
    try {
      // 1. Veritabanından doğrudan girilen koliye ait tüm gönderileri çek
      const boxShipments = await getShipmentByBox(boxInput);

      if (boxShipments.length > 0) {
        // 2. Koliye ait gönderilerin PAAD_ID'sini kontrol et
        const isDifferentPAAD = boxShipments.some(
          (shipment) => shipment.PAAD_ID !== userData.PAAD_ID
        );

        if (isDifferentPAAD) {
          // 3. PAAD_ID farklıysa, koliyi "Fazla Koli-Hatalı Mağaza" olarak işaretle
          await Promise.all(
            boxShipments.map((shipment) =>
              markExtraBox(shipment.id, userData.name)
            )
          );

          alert(
            `Okuttuğunuz koli farklı bir mağazaya ait olduğu için "Fazla Koli-Hatalı Mağaza" olarak işaretlendi. Lütfen Satış Operasyon ile iletişime geçin.`
          );
        } else {
          // 4. PAAD_ID aynıysa, "Okutma Durumu" kontrolü yap
          const alreadyApproved = boxShipments.some(
            (shipment) => shipment.onKabulDurumu === "Okutma Başarılı"
          );

          if (alreadyApproved) {
            showNotification("Bu koli daha önce okutulmuştur.", "error");
          } else {
            // 5. "Okutma Başarılı" değilse, tüm gönderilerin durumunu güncelle
            await Promise.all(
              boxShipments.map((shipment) =>
                updateOnKabulFields(shipment.id, userData.name)
              )
            );
            showNotification("Koli başarıyla okutuldu!", "success");
          }
        }

        // 6. Verileri tekrar çekerek arayüzü güncelle
        await fetchShipments();
      } else {
        // 7. Koli numarasıyla eşleşen gönderi yoksa, başka mağazalarda olup olmadığını kontrol et
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
          if (
            !boxInput.startsWith("TR") &&
            !boxInput.startsWith("BX")
          ) {
            alert(
              "TR veya BX ile başlayan koli etiketi okutmalısınız. Eğer hata olduğunu düşünüyorsanız Satış Operasyon ile iletişime geçin."
            );
            setLoading(false);
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
    setLoading(false); // Yükleniyor durumunu kaldırmak için
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
        Mağaza: {userData.storeName} (PAAD ID: {userData.PAAD_ID})
      </p>

      {/* Başarılı Koliler Butonu */}
      <button
        onClick={() => router.push("/basariliKoliler")}
        className={styles.successButton}
      >
        Başarılı Koliler
      </button>

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
        <FocusLockInput
          value={boxInput}
          onChange={(e) => setBoxInput(e.target.value)}
          onEnter={handleBoxSubmit}
          placeholder="Koli numarası giriniz"
          className={styles.input}
          autoFocus={true}
          required
        />
        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? "İşlem Yapılıyor..." : "Onayla"}
        </button>
      </form>

      {/* Toplam Koli Sayısı */}
      <p>Toplam Koli Adedi: {groupedShipments.length}</p>

      {/* Liste Tablosu */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Sıra No</th>
            <th className={styles.th}>Sevk Numarası</th>
            <th className={styles.th}>Sevk Tarihi</th>
            <th className={styles.th}>Koli Numarası</th>
            <th className={styles.th}>Ürün Adedi</th>
            <th className={styles.th}>Gönderici Lokasyon Adı</th>
          </tr>
        </thead>
        <tbody>
          {groupedShipments.map((box, index) => (
            <tr key={box.box}>
              <td className={styles.td}>{index + 1}</td>
              <td className={styles.td}>{box.shipment_no}</td>
              <td className={styles.td}>{formatDate(box.shipment_date)}</td>
              <td className={styles.td}>****</td> {/* Koli Numarası Maskeli */}
              <td className={styles.td}>****</td> {/* Ürün Adedi Maskeli */}
              <td className={styles.td}>{box.from_location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
