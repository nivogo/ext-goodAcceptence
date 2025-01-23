// pages/mainPage.js
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useEffect, useState } from "react";
import { getUserData } from "../lib/firestore";
import BackButton from "../components/BackButton"; // BackButton bileşenini ekleyin

export default function MainPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); 
  const [loading, setLoading] = useState(true); // Loading state ekleyin

  useEffect(() => {
    // Kullanıcı bilgilerini alıyoruz
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const data = await getUserData(firebaseUser.uid);
        setUserData(data);
        setLoading(false);
      } else {
        // Eğer kullanıcı yoksa giriş sayfasına yönlendir
        setLoading(false);
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Çıkış Hatası:", error);
      alert("Çıkış işlemi sırasında bir hata oluştu.");
    }
  };

  if (loading) {
    return <p>Yükleniyor...</p>; // Kullanıcı bilgisi gelmeden yükleniyor göstergesi
  }

  if (!user || !userData) {
    return null; // Kullanıcı yoksa hiçbir şey gösterme (giriş sayfasına yönlendiriliyor)
  }

  return (
    <div style={{ margin: "2rem" }}>
      <BackButton /> {/* Geri butonunu ekleyin */}
      <h1>Hoş Geldiniz, {userData.name}</h1>
      <p>Mağaza: {userData.storeName} (Store ID: {userData.storeId})</p>
      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <button onClick={() => router.push("/onKabul")}>Ön Kabul</button>
        <button onClick={() => router.push("/malKabul")}>Mal Kabul</button>
        <button onClick={() => router.push("/rapor")}>Rapor</button>
        <button onClick={handleSignOut}>Çıkış Yap</button>
      </div>
    </div>
  );
}
