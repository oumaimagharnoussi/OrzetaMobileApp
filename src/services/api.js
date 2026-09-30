import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================================
// URL BACKEND
// ============================================================

// PC + téléphone sur le même Wi-Fi
// Remplace par l'IP de ton PC
export const API_URL = "http://192.168.1.146:5000";

// Pour le web local :
// export const API_URL = "http://localhost:5000";


// ============================================================
// REQUÊTE API
// ============================================================

export async function apiFetch(endpoint, options = {}) {
    const token = await AsyncStorage.getItem("token");
  
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
  
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  
    let data;
  
    try {
      data = await response.json();
    } catch {
      data = {
        success: false,
        message: "Réponse invalide du serveur",
      };
    }
  
    console.log("API RESPONSE:", response.status, data);
  
    if (!response.ok) {
      throw new Error(
        data.message || `Erreur serveur (${response.status})`
      );
    }
  
    return data;
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

  if (data.token) {
    await AsyncStorage.setItem("token", data.token);
  }

  if (data.user) {
    await AsyncStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );
  }

  return data;
}


// ============================================================
// LOGOUT
// ============================================================

export async function logout() {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");
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