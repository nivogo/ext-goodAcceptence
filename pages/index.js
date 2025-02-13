// pages/index.js

import { useState } from "react";
import { useRouter } from "next/router";
import { loginUser } from "../lib/auth";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState(""); // Kullanıcı adı (örneğin: "user1")
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // REST API login çağrısı
      const data = await loginUser(username, password);
      // data: { token, user: { name, storeName, PAAD_ID, ... } }
      login(data.token, data.user);
      router.push("/mainPage");
    } catch (error) {
      console.error("Login Error:", error);
      alert("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
    }
    setLoading(false);
  };

  return (
    <div style={containerStyle}>
      <h1>Giriş Yap</h1>
      <form onSubmit={handleLogin} style={formStyle}>
        <input
          type="text"
          placeholder="Kullanıcı Adı"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  backgroundColor: "#f0f2f5",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  width: "300px",
  padding: "2rem",
  backgroundColor: "#fff",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
};

const inputStyle = {
  padding: "0.5rem",
  marginBottom: "1rem",
  border: "1px solid #ccc",
  borderRadius: "4px",
};

const buttonStyle = {
  padding: "0.5rem",
  backgroundColor: "#0070f3",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};
