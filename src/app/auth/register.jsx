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
import { register } from "../../services/api";

export default function Register() {

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!nom.trim() || !prenom.trim() || !email.trim() || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }
  
    if (password.length < 8) {
      Alert.alert(
        "Erreur",
        "Le mot de passe doit contenir au moins 8 caractères."
      );
      return;
    }
  
    try {
      setLoading(true);
  
      console.log("➡️ INSCRIPTION...", {
        nom,
        prenom,
        email,
      });
  
      const data = await register({
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim(),
        password,
      });
  
      console.log("✅ RÉPONSE REGISTER :", data);
  
      if (data.success === true) {
        router.replace("/auth/login");
        return;
      }
  
      Alert.alert(
        "Inscription",
        data.message || "L'inscription a échoué."
      );
  
    } catch (error) {
      console.error("❌ REGISTER ERROR :", error);
  
      Alert.alert(
        "Erreur",
        error.message || "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Créer un compte
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nom"
        value={nom}
        onChangeText={setNom}
      />

      <TextInput
        style={styles.input}
        placeholder="Prénom"
        value={prenom}
        onChangeText={setPrenom}
      />

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
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            Créer le compte
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
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
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
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