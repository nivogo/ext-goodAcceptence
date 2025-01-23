// pages/mainPage.js
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useAuth } from "../_app"; // Auth Hook'u kullanıyoruz
import BackButton from "../components/BackButton";

export default function MainPage() {
  const router = useRouter();
  const { user, userData } = useAuth();

  // Kullanıcı yoksa (giriş yapılmamışsa) giriş sayfasına yönlendir
  useEffect(() => {
    if (!user && !loading) {
      router.push("/");
    }
  }, [user, router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Çıkış Hatası:", error);
      alert("Çıkış işlemi sırasında bir hata oluştu.");
    }
  };

  if (!user || !userData) {
    return <p>Yükleniyor...</p>;
  }

  return (
    <div style={{ margin: "2rem" }}>
      <BackButton />
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
