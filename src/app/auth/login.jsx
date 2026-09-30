import React, { useState } from "react";

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

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        router.replace("/commercial");
      }

    } catch (error) {
      console.log(error);

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

      <Text style={styles.title}>
        OLIVED
      </Text>

      <Text style={styles.subtitle}>
        Connexion
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

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

      <TouchableOpacity
        onPress={() => router.push("/auth/forgot-password")}
      >
        <Text style={styles.link}>
          Mot de passe oublié ?
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/auth/register")}
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