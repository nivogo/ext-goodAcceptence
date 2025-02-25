// context/NotificationContext.js
import { createContext, useState, useContext } from "react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    message: "",
    type: "", // "success" | "error" vb.
  });

  /**
   * Bildirimi belirli bir süre için gösterir (örn. 3 saniye).
   * type: "success" veya "error" gibi mesajın türünü belirlemek için kullanılır.
   */
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    // 7 saniye sonra bildirimi kapatalım
    setTimeout(() => {
      setNotification({ message: "", type: "" });
    }, 7000);
  };

  return (
    <NotificationContext.Provider value={{ notification, showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
