// pages/_app.js
import { AuthProvider } from "../context/AuthContext";
import "../styles/globals.css"; // Eğer global stilleriniz varsa
import "../styles/Rapor.module.css"; // Rapor sayfası stilleri
import "../styles/BasariliKoliler.module.css"; // Başarılı Koliler sayfası stilleri

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
