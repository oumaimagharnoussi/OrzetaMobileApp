import React, {
    createContext,
    useContext,
    useEffect,
    useState,
  } from "react";
  
  import AsyncStorage from "@react-native-async-storage/async-storage";
  
  import {
    login as apiLogin,
    logout as apiLogout,
    getMe,
} from "../services/api";
  
  const AuthContext = createContext(null);
  
  export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
  
    // ==========================================================
    // CHARGER LA SESSION
    // ==========================================================
  
    useEffect(() => {
      loadUser();
    }, []);
  
    async function loadUser() {
      try {
        const token = await AsyncStorage.getItem("token");
  
        if (!token) {
          setUser(null);
          return;
        }
  
        const data = await getMe();
  
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          await apiLogout();
          setUser(null);
        }
      } catch (error) {
        console.log("SESSION ERROR:", error.message);
  
        await apiLogout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
  
    // ==========================================================
    // LOGIN
    // ==========================================================
  
    async function login(email, password) {
      const data = await apiLogin(email, password);
  
      if (data.success && data.user) {
        setUser(data.user);
      
        await AsyncStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }
  
      return data;
    }
  
    // ==========================================================
    // LOGOUT
    // ==========================================================
  
    async function logout() {
      await apiLogout();
      setUser(null);
    }
  
    return (
      <AuthContext.Provider
        value={{
          user,
          loading,
          login,
          logout,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }
  
  export function useAuth() {
    return useContext(AuthContext);
  }