import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================================
// URL BACKEND
// ============================================================

// PC + téléphone sur le même Wi-Fi
export const API_URL = "http://192.168.1.146:5000";

// Pour le web local, tu peux utiliser :
// export const API_URL = "http://localhost:5000";


// ============================================================
// REQUÊTE API
// ============================================================

export async function apiFetch(endpoint, options = {}) {
  try {
    // Récupérer le token enregistré lors du login
    const token = await AsyncStorage.getItem("token");

    console.log("======================================");
    console.log("API REQUEST");
    console.log("URL :", `${API_URL}${endpoint}`);
    console.log("TOKEN :", token ? "PRÉSENT" : "ABSENT");
    console.log("======================================");

    // Headers
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    // Ajouter automatiquement le JWT
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Requête
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Lire la réponse
    let data;

    try {
      data = await response.json();
    } catch (error) {
      data = {
        success: false,
        message: "Réponse invalide du serveur",
      };
    }

    console.log("======================================");
    console.log("API RESPONSE");
    console.log("STATUS :", response.status);
    console.log("DATA :", data);
    console.log("======================================");

    // Erreur HTTP
    if (!response.ok) {
      throw new Error(
        data.message ||
          data.error ||
          `Erreur serveur (${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("======================================");
    console.error("❌ API ERROR");
    console.error("ENDPOINT :", endpoint);
    console.error("MESSAGE :", error.message);
    console.error("======================================");

    throw error;
  }
}


// ============================================================
// LOGIN
// ============================================================

export async function login(email, password) {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  // Sauvegarder le JWT
  if (data.token) {
    await AsyncStorage.setItem("token", data.token);

    console.log("✅ TOKEN SAUVEGARDÉ");
  } else {
    console.warn("⚠️ Aucun token reçu après le login");
  }

  // Sauvegarder l'utilisateur
  if (data.user) {
    await AsyncStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );

    console.log("✅ USER SAUVEGARDÉ :", data.user);
  }

  return data;
}


// ============================================================
// LOGOUT
// ============================================================

export async function logout() {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");

  console.log("✅ Déconnexion effectuée");
}


// ============================================================
// UTILISATEUR CONNECTÉ
// ============================================================

export async function getMe() {
  return await apiFetch("/api/auth/me");
}


// ============================================================
// REGISTER
// ============================================================

export async function register(userData) {
  return await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}


// ============================================================
// MOT DE PASSE OUBLIÉ
// ============================================================

export async function forgotPassword(email) {
  return await apiFetch("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({
      email,
    }),
  });
}


// ============================================================
// RESET PASSWORD
// ============================================================

export async function resetPassword(token, password) {
  return await apiFetch("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token,
      password,
    }),
  });
}