import React, { useState } from "react";
import { Image } from "react-native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";

import { router } from "expo-router";

import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

      console.log("Réponse login :", data);

      if (!data.success) {
        Alert.alert(
          "Connexion",
          data.message || "Erreur de connexion"
        );
        return;
      }

      // ======================================================
      // REDIRECTION SELON LE ROLE
      // ======================================================

      if (data.user.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }

    } catch (error) {
      console.log("Erreur login :", error);

      Alert.alert(
        "Connexion impossible",
        error.message || "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>

<Image
  source={require("../../../assets/images/logo-olived-black.png")}
  style={styles.logo}
  resizeMode="contain"
/>

      <Text style={styles.subtitle}>
        Connexion
      </Text>

      {/* EMAIL */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* MOT DE PASSE */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
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

      {/* BOUTON CONNEXION */}
      <TouchableOpacity
        style={styles.button}
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

      {/* MOT DE PASSE OUBLIE */}
      <TouchableOpacity
        onPress={() =>
          router.push("/auth/forgot-password")
        }
      >
        <Text style={styles.link}>
          Mot de passe oublié ?
        </Text>
      </TouchableOpacity>

      {/* CREER UN COMPTE */}
      <TouchableOpacity
        onPress={() =>
          router.push("/auth/register")
        }
      >
        <Text style={styles.register}>
          Créer un compte
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
    backgroundColor: "#fff",
  },

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

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
  },

  // ======================================================
  // CHAMP MOT DE PASSE
  // ======================================================

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

  // ======================================================
  // BOUTON
  // ======================================================

  button: {
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // ======================================================
  // LIENS
  // ======================================================

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
  logo: {
    width: 180,
    height: 60,
    alignSelf: "center",
    marginBottom: 5,
  },
});