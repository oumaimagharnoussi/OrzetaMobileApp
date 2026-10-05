import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ============================================================
  // CONNEXION
  // ============================================================

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert(
        "Erreur",
        "Veuillez remplir tous les champs."
      );
      return;
    }

    try {
      setLoading(true);

      const data = await login(
        email.trim(),
        password
      );

      console.log("=================================");
      console.log("RÉPONSE LOGIN");
      console.log("DATA :", data);
      console.log("TOKEN :", data?.token ? "PRÉSENT" : "ABSENT");
      console.log("USER :", data?.user);
      console.log("ROLE :", data?.user?.role);
      console.log("=================================");

      // ========================================================
      // VÉRIFICATION RÉPONSE
      // ========================================================

      if (!data || !data.success) {
        Alert.alert(
          "Connexion",
          data?.message || "Erreur de connexion"
        );
        return;
      }

      // ========================================================
      // VÉRIFICATION TOKEN
      // ========================================================

      if (!data.token) {
        console.warn(
          "⚠️ Aucun token reçu après la connexion."
        );
      }

      // ========================================================
      // VÉRIFICATION UTILISATEUR
      // ========================================================

      if (!data.user) {
        Alert.alert(
          "Connexion",
          "Les informations utilisateur sont manquantes."
        );
        return;
      }

      // ========================================================
      // REDIRECTION SELON LE ROLE
      // ========================================================

      if (data.user.role === "admin") {
        console.log("➡️ REDIRECTION ADMIN");
        router.replace("/admin");
      } else if (data.user.role === "commercial") {
        console.log("➡️ REDIRECTION COMMERCIAL");
        router.replace("/");
      } else {
        console.warn(
          "⚠️ ROLE INCONNU :",
          data.user.role
        );

        router.replace("/");
      }

    } catch (error) {
      console.error("=================================");
      console.error("❌ ERREUR LOGIN");
      console.error("MESSAGE :", error?.message);
      console.error("ERROR :", error);
      console.error("=================================");

      Alert.alert(
        "Connexion impossible",
        error?.message ||
          "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // INTERFACE
  // ============================================================

  return (
    <View style={styles.container}>

      {/* ======================================================
          LOGO
      ====================================================== */}

      <Image
        source={require("../../../assets/images/logo-olived-black.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.subtitle}>
        Connexion
      </Text>

      {/* ======================================================
          EMAIL
      ====================================================== */}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />

      {/* ======================================================
          MOT DE PASSE
      ====================================================== */}

      <View style={styles.passwordContainer}>

        <TextInput
          style={styles.passwordInput}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() =>
            setShowPassword(!showPassword)
          }
          disabled={loading}
        >
          <Ionicons
            name={
              showPassword
                ? "eye-off-outline"
                : "eye-outline"
            }
            size={23}
            color="#666"
          />
        </TouchableOpacity>

      </View>

      {/* ======================================================
          BOUTON CONNEXION
      ====================================================== */}

      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.buttonDisabled,
        ]}
        onPress={handleLogin}
        disabled={loading}
      >

        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            Se connecter
          </Text>
        )}

      </TouchableOpacity>

      {/* ======================================================
          MOT DE PASSE OUBLIÉ
      ====================================================== */}

      <TouchableOpacity
        onPress={() =>
          router.push("/auth/forgot-password")
        }
        disabled={loading}
      >
        <Text style={styles.link}>
          Mot de passe oublié ?
        </Text>
      </TouchableOpacity>

      {/* ======================================================
          CRÉER UN COMPTE
      ====================================================== */}

      <TouchableOpacity
        onPress={() =>
          router.push("/auth/register")
        }
        disabled={loading}
      >
        <Text style={styles.register}>
          Créer un compte
        </Text>
      </TouchableOpacity>

    </View>
  );
}


// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
    backgroundColor: "#fff",
  },

  // ==========================================================
  // LOGO
  // ==========================================================

  logo: {
    width: 180,
    height: 60,
    alignSelf: "center",
    marginBottom: 5,
  },

  // ==========================================================
  // TITRE
  // ==========================================================

  title: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 35,
  },

  // ==========================================================
  // EMAIL
  // ==========================================================

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
  },

  // ==========================================================
  // MOT DE PASSE
  // ==========================================================

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 15,
  },

  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },

  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  // ==========================================================
  // BOUTON
  // ==========================================================

  button: {
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // ==========================================================
  // LIENS
  // ==========================================================

  link: {
    textAlign: "center",
    marginTop: 20,
    textDecorationLine: "underline",
  },

  register: {
    textAlign: "center",
    marginTop: 30,
    fontWeight: "bold",
  },

});