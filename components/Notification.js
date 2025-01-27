// components/Notification.js
import { useNotification } from "../context/NotificationContext";
import styles from "../styles/Notification.module.css";

export default function Notification() {
  const { notification } = useNotification();

  // Eğer mesaj boş ise hiçbir şey dönmeyelim
  if (!notification.message) return null;

  // notification.type "success" veya "error" olabilir
  return (
    <div
      className={`${styles.notification} ${
        notification.type === "success" ? styles.success : styles.error
      }`}
    >
      {notification.message}
    </div>
  );
}
