// lib/auth.js

const API_BASE = "/api/index.php";

export const loginUser = async (username, password) => {
  try {
    // Kullanıcı adı ve şifre kombinasyonunu Base64 ile kodlayın
    const basicAuthCredentials = btoa(`${username}:${password}`);

    const response = await fetch(`${API_BASE}?action=login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicAuthCredentials}`,
      },
      // API, Basic Auth kullandığı için body'ye ihtiyaç duymayabilir.
      // Eğer gerekiyorsa, body kısmına boş bir obje gönderebilirsiniz.
      body: JSON.stringify({}),
    });
    const data = await response.json();
    console.log("Login API Response:", data);
    if (!data.success) {
      throw new Error(data.message || "Giriş yapılamadı");
    }
    return data;
  } catch (error) {
    console.error("loginUser Hatası:", error);
    throw error;
  }
};
/**
 * REST API üzerinden kullanıcı çıkışı yapar.
 */
export const logoutUser = async (token) => {
  try {
    const response = await fetch(`${API_BASE}?action=logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Çıkış yapılamadı");
    }
    return data;
  } catch (error) {
    console.error("logoutUser Hatası:", error);
    throw error;
  }
};
