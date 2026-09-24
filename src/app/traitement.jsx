import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";

const API_URL = "http://192.168.1.146:5000";

export default function Traitement() {
  const router = useRouter();
  // =====================================================
  // RÉCUPÉRER L'ID DU VISITEUR
  // =====================================================
  const { id } = useLocalSearchParams();

  // =====================================================
  // STATES
  // =====================================================
  const [sending, setSending] = useState(false);
  const [savingQualification, setSavingQualification] = useState(false);
  const [qualification, setQualification] = useState(0);

  // =====================================================
  // ENREGISTRER LA QUALIFICATION
  // =====================================================
  const handleEnregistrerQualification = async () => {
    if (!id) {
      Alert.alert(
        "Erreur",
        "Identifiant du visiteur introuvable."
      );
      return;
    }

    if (qualification === 0) {
      Alert.alert(
        "Attention",
        "Veuillez sélectionner une note de 1 à 5 étoiles."
      );
      return;
    }

    try {
      setSavingQualification(true);

      console.log("ID visiteur :", id);
      console.log("Qualification :", qualification);

      const response = await fetch(
        `${API_URL}/api/visiteurs/${id}/qualification`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            qualification: qualification,
          }),
        }
      );

      const data = await response.json();

      console.log("Réponse qualification :", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Erreur lors de l'enregistrement de la qualification."
        );
      }

      Alert.alert(
        "Succès",
        "Qualification enregistrée avec succès."
      );
    } catch (error) {
      console.error(
        "ERREUR QUALIFICATION :",
        error
      );

      Alert.alert(
        "Erreur",
        error.message ||
          "Impossible d'enregistrer la qualification."
      );
    } finally {
      setSavingQualification(false);
    }
  };

  // =====================================================
  // ENVOYER EMAIL
  // =====================================================
  const handleEnvoyerEmail = async () => {
    if (!id) {
      Alert.alert(
        "Erreur",
        "Identifiant du visiteur introuvable."
      );
      return;
    }

    try {
      setSending(true);

      console.log("Envoi email pour visiteur :", id);

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
          data.message ||
            "Impossible d'envoyer l'email."
        );
      }

      Alert.alert(
        "Email envoyé",
        "L'email a été envoyé au visiteur avec succès."
      );
    } catch (error) {
      console.error(
        "ERREUR EMAIL :",
        error
      );

      Alert.alert(
        "Erreur",
        error.message ||
          "Impossible d'envoyer l'email."
      );
    } finally {
      setSending(false);
    }
  };

  // =====================================================
  // AFFICHAGE
  // =====================================================
  return (
    <View style={styles.container}>

      {/* =================================================
          QUALIFICATION DU VISITEUR
      ================================================== */}
      <View style={styles.ratingContainer}>

        <Text style={styles.ratingTitle}>
          Qualification du visiteur
        </Text>

        {/* ÉTOILES */}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((etoile) => (
            <TouchableOpacity
              key={etoile}
              onPress={() =>
                setQualification(etoile)
              }
              activeOpacity={0.7}
            >
              <Text style={styles.star}>
                {etoile <= qualification
                  ? "★"
                  : "☆"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TEXTE NOTE */}
        <Text style={styles.ratingText}>
          {qualification === 0
            ? "Sélectionner une note"
            : `${qualification} / 5 étoiles`}
        </Text>
      </View>

      {/* =================================================
          BOUTON ENREGISTRER QUALIFICATION
      ================================================== */}
      <TouchableOpacity
        style={[
          styles.button,
          savingQualification &&
            styles.buttonDisabled,
        ]}
        onPress={
          handleEnregistrerQualification
        }
        disabled={savingQualification}
      >
        <Text style={styles.buttonText}>
          {savingQualification
            ? "Enregistrement..."
            : "Enregistrer la qualification"}
        </Text>
      </TouchableOpacity>

      {/* =================================================
          BOUTON ENVOYER EMAIL
      ================================================== */}
      <TouchableOpacity
        style={[
          styles.button,
          sending &&
            styles.buttonDisabled,
        ]}
        onPress={handleEnvoyerEmail}
        disabled={sending}
      >
        <Text style={styles.buttonText}>
          {sending
            ? "Envoi en cours..."
            : "Envoyer un email au visiteur"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
  style={styles.button}
  onPress={() =>
    router.push({
      pathname: "/pdf",
      params: {
        id: String(id),
      },
    })
  }
>
  <Text style={styles.buttonText}>
    Voir la fiche PDF
  </Text>
</TouchableOpacity>

    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 20,
  },

  ratingContainer: {
    alignItems: "center",
    marginVertical: 25,
  },

  ratingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333333",
  },

  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  star: {
    fontSize: 42,
    color: "#EE672A",
    marginHorizontal: 5,
  },

  ratingText: {
    fontSize: 16,
    marginTop: 8,
    color: "#555555",
  },

  button: {
    width: "90%",
    backgroundColor: "#EE672A",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});