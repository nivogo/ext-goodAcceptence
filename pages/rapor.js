// pages/rapor.js
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext"; // Güncellenmiş import
import BackButton from "../components/BackButton";

const Rapor = () => {
  const router = useRouter();
  const { user, userData } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user || !userData) {
    return <p>Yükleniyor...</p>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <BackButton />
      <h1>Rapor Sayfası</h1>
      <p>Bu sayfa henüz geliştirilmemiştir.</p>
    </div>
  );
};

export default Rapor;
