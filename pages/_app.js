// pages/_app.js
import { useEffect, useState, createContext, useContext } from "react";
import { auth } from "../firebase/firebaseConfig";
import { getUserData } from "../lib/firestore";
import { onAuthStateChanged } from "firebase/auth";

// Auth Context Oluşturma
const AuthContext = createContext(null);

// Auth Context'i Kullanmak İçin Hook
export const useAuth = () => useContext(AuthContext);

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const data = await getUserData(firebaseUser.uid);
        setUserData(data);
        setLoading(false);
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <p>Yükleniyor...</p>;
  }

  return (
    <AuthContext.Provider value={{ user, userData }}>
      <Component {...pageProps} />
    </AuthContext.Provider>
  );
}

export default MyApp;
