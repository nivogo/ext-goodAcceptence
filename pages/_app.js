// pages/_app.js
import { AuthProvider } from "../context/AuthContext";
import { NotificationProvider } from "../context/NotificationContext";
import Notification from "../components/Notification";
import "../styles/globals.css"; // Eğer global stilleriniz varsa
import "../styles/Rapor.module.css"; // Rapor sayfası stilleri
import "../styles/BasariliKoliler.module.css"; // Başarılı Koliler sayfası stilleri

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Component {...pageProps} />
        {/* Her sayfada bildirimleri gösterecek bileşen */}
        <Notification />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default MyApp;
