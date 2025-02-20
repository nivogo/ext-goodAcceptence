// context/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// 1 hafta = 7 gün * 24 saat * 60 dakika * 60 saniye * 1000 milisaniye
const EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [user, setUser] = useState(null); // Eklenen kullanıcı state'i
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const storedToken = localStorage.getItem("token");
  const storedUserData = localStorage.getItem("userData");
  const loginExpiration = localStorage.getItem("loginExpiration");

  // Token kontrolünü kaldırıp, kullanıcı verisini kontrol edelim
  if (storedUserData && storedUserData !== "undefined" && loginExpiration) {
    if (Date.now() < parseInt(loginExpiration, 10)) {
      setToken(storedToken); // token boş olsa bile
      try {
        const parsedData = JSON.parse(storedUserData);
        setUserData(parsedData);
        setUser(parsedData);
      } catch (error) {
        console.error("Error parsing userData from localStorage:", error);
        localStorage.removeItem("userData");
      }
    } else {
      // Giriş süresi doldu, localStorage temizlensin
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      localStorage.removeItem("loginExpiration");
    }
  }
  setLoading(false);
}, []);

  const login = (token, userData) => {
    setToken(token);
    setUserData(userData);
    setUser(userData);
    localStorage.setItem("token", token);
    localStorage.setItem("userData", JSON.stringify(userData));
    localStorage.setItem("loginExpiration", (Date.now() + EXPIRATION_TIME).toString());
  };

  const logout = () => {
    setToken(null);
    setUserData(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    localStorage.removeItem("loginExpiration");
  };

  if (loading) {
    return <p>Yükleniyor...</p>;
  }

  return (
    <AuthContext.Provider value={{ token, user, userData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
