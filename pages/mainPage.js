// pages/mainPage.js
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import BackButton from "../components/BackButton";
import { useEffect } from "react";

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
    <div style={containerStyle}>
      <BackButton />
      <h1>Hoş Geldiniz, {userData.name}</h1>
      <p>Mağaza: {userData.storeName} (Store ID: {userData.storeId})</p>
      <div style={buttonContainerStyle}>
        <button onClick={() => router.push("/onKabul")} style={navButtonStyle}>
          Ön Kabul
        </button>
        <button onClick={() => router.push("/malKabul")} style={navButtonStyle}>
          Mal Kabul
        </button>
        <button onClick={() => router.push("/rapor")} style={navButtonStyle}>
          Rapor
        </button>
        <button onClick={handleSignOut} style={signOutButtonStyle}>
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}

const containerStyle = {
  margin: "2rem",
  textAlign: "center",
};

const buttonContainerStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "1rem",
  marginTop: "1rem",
  flexWrap: "wrap",
};

const navButtonStyle = {
  padding: "0.75rem 1.5rem",
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "1rem",
};

const signOutButtonStyle = {
  ...navButtonStyle,
  backgroundColor: "#dc3545",
};
