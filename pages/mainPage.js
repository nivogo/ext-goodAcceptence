// pages/mainPage.js
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useEffect, useState } from "react";
import { getUserData } from "../lib/firestore";

export default function mainPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); 

  useEffect(() => {
    // Kullanıcı bilgilerini alıyoruz
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        // Eğer kullanıcı yoksa giriş sayfasına yönlendir
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (!user) return null; // Kullanıcı bilgisi gelmeden hiçbir şey gösterme

  return (
    <div style={{ margin: "2rem" }}>
      <h1>Hoş Geldiniz, {userData?.name || "Kullanıcı"}</h1>
      <p>Mağaza: {userData?.storeName || "Mağaza" } Store ID: {userData?.storeId || "Mağaza ID" }</p>
      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <button onClick={() => router.push("/onKabul")}>Ön Kabul</button>
        <button onClick={() => router.push("/malKabul")}>Mal Kabul</button>
        <button onClick={() => router.push("/rapor")}>Rapor</button>
        <button onClick={handleSignOut}>Çıkış Yap</button>
      </div>
    </div>
  );
}
