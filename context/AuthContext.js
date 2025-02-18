// context/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Oturum açılmış bilgileri localStorage'dan alırken JSON.parse hatalarını yakalayın
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserData = localStorage.getItem("userData");

    if (storedToken && storedUserData && storedUserData !== "undefined") {
      setToken(storedToken);
      try {
        const parsedData = JSON.parse(storedUserData);
        setUserData(parsedData);
      } catch (error) {
        console.error("Error parsing userData from localStorage:", error);
        // Hatalı veriyi temizleyin
        localStorage.removeItem("userData");
      }
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    setToken(token);
    setUserData(userData);
    localStorage.setItem("token", token);
    localStorage.setItem("userData", JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUserData(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
  };

  if (loading) {
    return <p>Yükleniyor...</p>;
  }

  return (
    <AuthContext.Provider value={{ token, userData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
