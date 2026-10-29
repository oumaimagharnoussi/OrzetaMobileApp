import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================================
// URL BACKEND
// ============================================================

// Serveur Render par défaut. Pour tester avec le serveur local, lancer
// l'app avec la variable EXPO_PUBLIC_API_URL, par exemple :
//   EXPO_PUBLIC_API_URL=http://localhost:5000          (web sur le PC)
//   EXPO_PUBLIC_API_URL=http://192.168.1.146:5000      (téléphone, même Wi-Fi)
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://orzetamobileapp.onrender.com";

// Le serveur Render gratuit peut mettre ~50 s à se réveiller :
// au-delà de ce délai, on abandonne la requête au lieu d'attendre sans fin
const DELAI_MAX_REQUETE = 60000;

// Journaux détaillés uniquement en développement : afficher chaque
// réponse (listes de visiteurs, commandes…) ralentit l'application
const journal = (...args) => {
  if (__DEV__) console.log(...args);
};


// ============================================================
// TOKEN (gardé en mémoire pour éviter de relire le stockage
// à chaque requête)
// ============================================================

let tokenEnMemoire;

async function lireToken() {
  if (tokenEnMemoire === undefined) {
    tokenEnMemoire = await AsyncStorage.getItem("token");
  }
  return tokenEnMemoire;
}

export async function enregistrerSession(token, user) {
  tokenEnMemoire = token || null;

  const paires = [];
  if (token) paires.push(["token", token]);
  if (user) paires.push(["user", JSON.stringify(user)]);

  if (paires.length) await AsyncStorage.multiSet(paires);
}

// Session enregistrée sur l'appareil (lecture en un seul appel)
export async function lireSessionLocale() {
  const [[, token], [, user]] = await AsyncStorage.multiGet([
    "token",
    "user",
  ]);

  tokenEnMemoire = token || null;

  let utilisateur = null;
  try {
    utilisateur = user ? JSON.parse(user) : null;
  } catch {
    utilisateur = null;
  }

  return { token, user: utilisateur };
}


// ============================================================
// REQUÊTE API
// ============================================================

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), DELAI_MAX_REQUETE);

  try {
    const token = await lireToken();

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    journal("API →", options.method || "GET", url);

    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || controleur.signal,
      });
    } catch (error) {
      const erreur = new Error(
        error?.name === "AbortError"
          ? "Le serveur met trop de temps à répondre. Réessayez dans un instant."
          : "Impossible de contacter le serveur. Vérifiez votre connexion."
      );
      erreur.reseau = true;
      throw erreur;
    }

    let data;
    try {
      data = await response.json();
    } catch {
      data = {
        success: false,
        message: "Réponse invalide du serveur",
      };
    }

    journal("API ←", response.status, endpoint);

    if (!response.ok) {
      const erreur = new Error(
        data.message ||
          data.error ||
          `Erreur serveur (${response.status})`
      );
      erreur.status = response.status;
      throw erreur;
    }

    return data;
  } catch (error) {
    if (__DEV__) {
      console.error("❌ API", endpoint, ":", error.message);
    }
    throw error;
  } finally {
    clearTimeout(minuteur);
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

  if (data.token || data.user) {
    await enregistrerSession(data.token, data.user);
  }

  return data;
}


// ============================================================
// LOGOUT
// ============================================================

export async function logout() {
  tokenEnMemoire = null;
  await AsyncStorage.multiRemove(["token", "user"]);
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
