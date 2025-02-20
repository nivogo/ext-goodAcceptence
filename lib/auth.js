// lib/auth.js

const API_BASE = "/api/index.php";

export const loginUser = async (username, password) => {
  try {
    // Basic Auth için Base64 kodlama
    const basicAuthCredentials = btoa(`${username}:${password}`);

    const bodyData = {
  {
    "where": {
        "box" : 0
    }
},
};
    
    const response = await fetch(`https://accept.hayatadondur.com/acceptance/index.php`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicAuthCredentials}`,
      },
      // API sadece header üzerinden doğrulama yapıyorsa body boş olabilir.
      body: JSON.stringify(bodyData),
    });

    console.log(response);

    // Yanıt gövdesini metin olarak alıp boş mu kontrol edin.
    const text = await response.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("JSON ayrıştırma hatası:", parseError);
        throw new Error("Gelen yanıt JSON formatında değil.");
      }
    } else {
      console.warn("Yanıt gövdesi boş.");
    }

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
