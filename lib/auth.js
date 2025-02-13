// lib/auth.js

const API_BASE = "/api/index.php";

/**
 * REST API üzerinden kullanıcı girişi yapar.
 * Beklenti: API, { token, user } şeklinde dönüş yapar.
 */
export const loginUser = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Giriş yapılamadı");
    }
    return data; // { token, user }
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
