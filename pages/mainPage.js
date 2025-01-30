// pages/mainPage.js
import { useRouter } from "next/router";
import { useEffect } from "react"; // useEffect import edildi
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import BackButton from "../components/BackButton";
import styles from "../styles/MainPage.module.css";

export default function MainPage() {
  const router = useRouter();
  const { user, userData } = useAuth();

  useEffect(() => {
    if (!user) {
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
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Hoş Geldiniz, {userData.name}</h1>
      <p>Mağaza: {userData.storeName} (PAAD ID: {userData.PAAD_ID})</p>
      <div className={styles.buttonContainer}>
        <button onClick={() => router.push("/onKabul")} className={styles.navButton}>
          Ön Kabul
        </button>
        <button onClick={() => router.push("/malKabul")} className={styles.navButton}>
          Mal Kabul
        </button>
        <button onClick={() => router.push("/adresleme")} className={styles.navButton}>
          Adresleme
        </button>
        <button onClick={() => router.push("/rapor")} className={styles.navButton}>
          Rapor
        </button>
        <button onClick={handleSignOut} className={styles.signOutButton}>
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}
