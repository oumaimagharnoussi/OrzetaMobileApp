import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import { router } from "expo-router";

import { forgotPassword } from "../../services/api";

export default function ForgotPassword() {

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleForgotPassword() {

    if (!email.trim()) {
      Alert.alert(
        "Erreur",
        "Veuillez saisir votre email."
      );
      return;
    }

    try {

      setLoading(true);

      const data = await forgotPassword(
        email.trim()
      );

      Alert.alert(
        "Réinitialisation",
        data.message ||
          "Si cet email existe, un lien a été envoyé."
      );

    } catch (error) {

      Alert.alert(
        "Erreur",
        error.message
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Mot de passe oublié
      </Text>

      <Text style={styles.description}>
        Entrez votre adresse email pour recevoir
        un lien de réinitialisation.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleForgotPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            Envoyer
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("/auth/login")}
      >
        <Text style={styles.link}>
          Retour à la connexion
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
  },

  title: {
    fontSize: 27,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },

  description: {
    textAlign: "center",
    color: "#666",
    marginBottom: 25,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
  },

  button: {
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  link: {
    textAlign: "center",
    marginTop: 20,
  },
});