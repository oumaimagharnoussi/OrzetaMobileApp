import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";

// ============================================================
// API
// ============================================================

const API_URL =
  "http://192.168.1.146:5000";

// ============================================================
// TRAITEMENT
// ============================================================

export default function Traitement() {
  const { id } = useLocalSearchParams();

  const [qualification, setQualification] =
    useState(0);

  const [
    savingQualification,
    setSavingQualification,
  ] = useState(false);

  // ==========================================================
  // ENREGISTRER QUALIFICATION
  // ==========================================================

  const handleEnregistrerQualification =
    async () => {
      console.log("");
      console.log(
        "================================="
      );
      console.log(
        "CLIC SUR ENREGISTRER"
      );
      console.log(
        "================================="
      );

      console.log(
        "ID :",
        id
      );

      console.log(
        "QUALIFICATION :",
        qualification
      );

      console.log(
        "TYPE QUALIFICATION :",
        typeof qualification
      );

      console.log(
        "API_URL :",
        API_URL
      );

      // ------------------------------------------------------
      // Vérifier ID
      // ------------------------------------------------------

      if (!id) {
        Alert.alert(
          "Erreur",
          "Identifiant du visiteur introuvable."
        );

        return;
      }

      // ------------------------------------------------------
      // Vérifier qualification
      // ------------------------------------------------------

      if (
        qualification < 1 ||
        qualification > 5
      ) {
        Alert.alert(
          "Attention",
          "Veuillez sélectionner une note de 1 à 5 étoiles."
        );

        return;
      }

      try {
        setSavingQualification(true);

        // ----------------------------------------------------
        // URL
        // ----------------------------------------------------

        const url =
          `${API_URL}/api/visiteurs/${id}/qualification`;

        console.log(
          "URL PUT :",
          url
        );

        // ----------------------------------------------------
        // FETCH
        // ----------------------------------------------------

        const response =
          await fetch(
            url,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                qualification:
                  Number(
                    qualification
                  ),
              }),
            }
          );

        console.log(
          "STATUS HTTP :",
          response.status
        );

        // ----------------------------------------------------
        // Réponse serveur
        // ----------------------------------------------------

        const data =
          await response.json();

        console.log(
          "RÉPONSE SERVEUR :",
          data
        );

        // ----------------------------------------------------
        // Vérification
        // ----------------------------------------------------

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Impossible d'enregistrer la qualification."
          );
        }

        console.log(
          "================================="
        );

        console.log(
          "✅ QUALIFICATION ENREGISTRÉE"
        );

        console.log(
          "ID :",
          data.data?.id
        );

        console.log(
          "Qualification DB :",
          data.data?.qualification
        );

        console.log(
          "================================="
        );

        Alert.alert(
          "Succès",
          `Qualification ${qualification}/5 enregistrée avec succès.`
        );

      } catch (error) {
        console.error(
          "================================="
        );

        console.error(
          "❌ ERREUR ENREGISTREMENT QUALIFICATION"
        );

        console.error(
          error
        );

        console.error(
          "================================="
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

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
    >
      {/* ================================================== */}
      {/* TITRE */}
      {/* ================================================== */}

      <Text style={styles.title}>
        Traitement du visiteur
      </Text>

      <Text style={styles.subtitle}>
        ID visiteur : {id || "N/A"}
      </Text>

      {/* ================================================== */}
      {/* QUALIFICATION */}
      {/* ================================================== */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Qualification du visiteur
        </Text>

        <Text style={styles.description}>
          Veuillez sélectionner une note
          de 1 à 5 étoiles.
        </Text>

        {/* ================================================= */}
        {/* ÉTOILES */}
        {/* ================================================= */}

        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map(
            (etoile) => (
              <TouchableOpacity
                key={etoile}
                onPress={() =>
                  setQualification(
                    etoile
                  )
                }
                activeOpacity={0.7}
                disabled={
                  savingQualification
                }
              >
                <Text
                  style={[
                    styles.star,
                    etoile <=
                      qualification
                      ? styles.starSelected
                      : styles.starEmpty,
                  ]}
                >
                  {etoile <=
                  qualification
                    ? "★"
                    : "☆"}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {/* ================================================= */}
        {/* NOTE */}
        {/* ================================================= */}

        <Text style={styles.note}>
          {qualification > 0
            ? `${qualification}/5`
            : "Aucune qualification sélectionnée"}
        </Text>

        {/* ================================================= */}
        {/* BOUTON */}
        {/* ================================================= */}

        <TouchableOpacity
          style={[
            styles.button,
            savingQualification &&
              styles.buttonDisabled,
          ]}
          onPress={
            handleEnregistrerQualification
          }
          disabled={
            savingQualification
          }
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {savingQualification
              ? "Enregistrement..."
              : "Enregistrer la qualification"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ================================================== */}
      {/* INFORMATIONS */}
      {/* ================================================== */}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          Information
        </Text>

        <Text style={styles.infoText}>
          La qualification sélectionnée
          sera enregistrée dans la base
          de données du visiteur.
        </Text>
      </View>

      {/* ================================================== */}
      {/* RETOUR */}
      {/* ================================================== */}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() =>
          router.back()
        }
      >
        <Text style={styles.backButtonText}>
          Retour
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#F7F7F7",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222222",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 30,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,

    elevation: 3,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222222",
    textAlign: "center",
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
    marginBottom: 20,
  },

  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 15,
  },

  star: {
    fontSize: 48,
    marginHorizontal: 5,
  },

  starSelected: {
    color: "#EE672A",
  },

  starEmpty: {
    color: "#BBBBBB",
  },

  note: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 25,
  },

  button: {
    backgroundColor: "#EE672A",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
  },

  infoText: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 21,
  },

  backButton: {
    borderWidth: 1,
    borderColor: "#EE672A",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 30,
  },

  backButtonText: {
    color: "#EE672A",
    fontSize: 16,
    fontWeight: "600",
  },
});