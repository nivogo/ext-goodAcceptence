// pages/index.js
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useRouter } from "next/router";
import BackButton from "../components/BackButton"; // BackButton bileşenini import et

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState(""); // email yerine username kullanıyoruz
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Kullanıcı adına "@nivogo.com" ekleyin
      const email = `${username}@nivogo.com`;
      await signInWithEmailAndPassword(auth, email, password);
      // Giriş başarılı olursa dashboard'a yönlendir
      router.push("/mainPage");
    } catch (error) {
      console.error("Login Error:", error);
      alert("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
    }
  };

  return (
    <div style={{ margin: "2rem" }}>
      <BackButton /> {/* Geri butonunu ekleyin */}
      <h1>Giriş Yap</h1>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", width: "300px" }}>
        <input
          type="text"
          placeholder="Kullanıcı Adı" // Placeholder'ı güncelledik
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ marginBottom: "1rem" }}
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ marginBottom: "1rem" }}
        />
        <button type="submit">Giriş Yap</button>
      </form>
    </div>
  );
}
