// pages/onKabul.js
import { useEffect, useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { useRouter } from "next/router";
import { getUserData, getShipmentsByStoreId, updateOnKabulFields } from "../lib/firestore";
import BackButton from "../components/BackButton";

export default function OnKabulPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);            // Firebase Auth kullanıcısı
  const [userData, setUserData] = useState(null);    // users koleksiyonundaki veriler (storeId, name vb.)
  const [shipments, setShipments] = useState([]);    // shipment_data verileri
  const [boxInput, setBoxInput] = useState("");      // Koli numarası arama input'u
  const [loading, setLoading] = useState(true);      // Loading state

  useEffect(() => {
    // Authentication durumunu dinle
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Firestore'dan userData'yı çek
        const data = await getUserData(firebaseUser.uid);
        setUserData(data);

        if (data && data.storeId) {
          // storeId'ye göre shipment_data'ları çek
          const shipmentsList = await getShipmentsByStoreId(data.storeId);
          setShipments(shipmentsList);
        }
        setLoading(false);
      } else {
        // Giriş yoksa login sayfasına yönlendir
        setLoading(false);
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Tarih formatlama fonksiyonu
  const formatDate = (date) => {
    if (!date) return "-";
    // Eğer date bir Firestore Timestamp ise
    if (date.toDate) {
      return date.toDate().toLocaleString();
    }
    // Eğer date bir string ise
    const parsedDate = new Date(date);
    return isNaN(parsedDate) ? "-" : parsedDate.toLocaleString();
  };

  // Koli numarasını enter ile arayıp/güncelleme işlemi
  const handleBoxSubmit = async (e) => {
    e.preventDefault();
    if (!boxInput) return;

    try {
      // Kullanıcının storeId'sine ait (shipments state'inde) box eşleşen dokümanlar
      const matchingDocs = shipments.filter((doc) => doc.box === boxInput);

      if (matchingDocs.length > 0) {
        // Her eşleşen dokümanda ön kabul alanlarını güncelle
        await Promise.all(
          matchingDocs.map((docItem) =>
            updateOnKabulFields(docItem.id, userData.name) // userData.username yerine userData.name
          )
        );

        // Ekrandaki listeyi güncellemek için veriyi tekrar çekebilir 
        // veya sadece client tarafında state güncellemesi yapabilirsiniz.
        const updatedShipments = shipments.map((item) => {
          if (item.box === boxInput) {
            return {
              ...item,
              onKabulDurumu: "Okutma Başarılı",
              onKabulYapanKisi: userData.name, // userData.username yerine userData.name
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
    return <p>Yükleniyor...</p>;
  }

  if (!user || !userData) {
    return null; // veya bir loading göstergesi
  }

  return (
    <div style={{ margin: "2rem" }}>
      <BackButton /> {/* Geri butonunu ekleyin */}
      <h1>Hoş Geldiniz, {userData.name}</h1>
      <p>Mağaza: {userData.storeName} (Store ID: {userData.storeId})</p>

      {/* Koli Arama Input */}
      <form onSubmit={handleBoxSubmit} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Koli numarası giriniz"
          value={boxInput}
          onChange={(e) => setBoxInput(e.target.value)}
          style={{ marginRight: "1rem" }}
        />
        <button type="submit">Onayla</button>
      </form>

      {/* Toplam Koli Sayısı */}
      <p>Toplam Koli Adedi: {shipments.length}</p>

      {/* Liste Tablosu */}
      <table border="1" cellPadding="5" cellSpacing="0">
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
              <td>
                {formatDate(item.onKabulSaati)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
