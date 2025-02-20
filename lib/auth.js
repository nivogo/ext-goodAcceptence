// lib/auth.js

const API_BASE = "https://accept.hayatadondur.com/acceptance/index.php";

export const loginUser = async (username, password) => {
  try {
    // Basic Auth için Base64 kodlama
    const basicAuthCredentials = btoa(`${username}:${password}`);

    const bodyData = {
      "where": {
        "id": -1
      },
      "data": {
        "paad_id": -1
      },
    };

    const response = await fetch(`${API_BASE}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicAuthCredentials}`,
      },
      // API sadece header üzerinden doğrulama yapıyorsa body boş olabilir.
      body: JSON.stringify(bodyData),
    });

    console.log(response);

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
    // Başarılı girişte Basic Auth bilgisini saklayın
    localStorage.setItem("basicAuth", basicAuthCredentials);
    return data;
  } catch (error) {
    console.error("loginUser Hatası:", error);
    throw error;
  }
};

export const logoutUser = async (token) => {
  try {
    const response = await fetch(`${API_BASE}`, {
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
