// pages/_app.js
import { AuthProvider } from "../context/AuthContext";
import "../styles/globals.css"; // Eğer global stilleriniz varsa

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
