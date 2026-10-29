import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  login as apiLogin,
  logout as apiLogout,
  getMe,
  enregistrerSession,
  lireSessionLocale,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================================
  // CHARGER LA SESSION
  // L'utilisateur enregistré sur l'appareil est affiché tout de
  // suite (pas d'attente du serveur Render qui peut dormir ~50 s),
  // puis la session est vérifiée en arrière-plan.
  // ==========================================================

  useEffect(() => {
    let actif = true;

    (async () => {
      let session = { token: null, user: null };

      try {
        session = await lireSessionLocale();
      } catch {
        // stockage illisible : on repart d'une session vide
      }

      if (!actif) return;

      if (!session.token) {
        setUser(null);
        setLoading(false);
        return;
      }

      if (session.user) {
        setUser(session.user);
        setLoading(false);
      }

      try {
        const data = await getMe();

        if (!actif) return;

        if (data.success && data.user) {
          setUser(data.user);
          enregistrerSession(session.token, data.user).catch(() => {});
        } else {
          await apiLogout();
          setUser(null);
        }
      } catch (error) {
        if (!actif) return;

        // Token refusé (expiré, compte supprimé…) : déconnexion.
        // Simple problème de réseau : on garde la session locale.
        if (error.status === 401 || error.status === 403 || !session.user) {
          await apiLogout();
          setUser(null);
        }
      } finally {
        if (actif) setLoading(false);
      }
    })();

    return () => {
      actif = false;
    };
  }, []);

  // ==========================================================
  // LOGIN
  // ==========================================================

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);

    if (data.success && data.user) {
      setUser(data.user);
    }

    return data;
  }, []);

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const valeur = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return (
    <AuthContext.Provider value={valeur}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
