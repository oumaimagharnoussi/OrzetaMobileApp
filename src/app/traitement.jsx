import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

const API_URL = "http://192.168.1.146:5000";

export default function Traitement() {
  const { id } = useLocalSearchParams();
  const [sending, setSending] = useState(false);

  const handleEnvoyerEmail = async () => {
    if (!id) {
      Alert.alert("Erreur", "Identifiant du visiteur introuvable.");
      return;
    }

    try {
      setSending(true);

      const response = await fetch(
        `${API_URL}/api/visiteurs/${id}/email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      console.log("Réponse email :", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Impossible d'envoyer l'email."
        );
      }

      Alert.alert(
        "Email envoyé",
        "L'email a été envoyé au visiteur avec succès."
      );
    } catch (error) {
      console.error("ERREUR EMAIL :", error);

      Alert.alert(
        "Erreur",
        error.message || "Impossible d'envoyer l'email."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handleEnvoyerEmail}
        disabled={sending}
      >
        <Text style={styles.buttonText}>
          {sending ? "Envoi en cours..." : "Envoyer un email au visiteur"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 20,
  },

  button: {
    backgroundColor: "#EE672A",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});