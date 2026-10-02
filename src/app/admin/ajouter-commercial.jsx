import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch } from "../../services/api";

export default function AjouterCommercial() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // =====================================================
  // AJOUTER COMMERCIAL
  // =====================================================

  async function handleAddCommercial() {
    // =====================================================
    // NETTOYAGE DES VALEURS
    // =====================================================

    const nomValue = nom.trim();
    const prenomValue = prenom.trim();
    const emailValue = email.trim().toLowerCase();
    const passwordValue = password.trim();

    // =====================================================
    // VALIDATION
    // Nom, prénom et email obligatoires
    // Mot de passe facultatif
    // =====================================================

    if (!nomValue || !prenomValue || !emailValue) {
      Alert.alert(
        "Erreur",
        "Veuillez remplir le nom, le prénom et l'email."
      );
      return;
    }

    // =====================================================
    // VALIDATION EMAIL
    // =====================================================

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailValue)) {
      Alert.alert(
        "Erreur",
        "Veuillez saisir une adresse email valide."
      );
      return;
    }

    // =====================================================
    // MOT DE PASSE FACULTATIF
    // S'il est renseigné => minimum 8 caractères
    // =====================================================

    if (
      passwordValue !== "" &&
      passwordValue.length < 8
    ) {
      Alert.alert(
        "Erreur",
        "Si vous renseignez un mot de passe, il doit contenir au moins 8 caractères."
      );
      return;
    }

    try {
      setLoading(true);

      // =====================================================
      // VALEUR ENVOYÉE AU BACKEND
      // Vide => null
      // Renseigné => mot de passe
      // =====================================================

      const passwordToSend =
        passwordValue !== ""
          ? passwordValue
          : null;

      console.log(
        "===================================="
      );

      console.log(
        "AJOUT COMMERCIAL"
      );

      console.log(
        "===================================="
      );

      console.log({
        nom: nomValue,
        prenom: prenomValue,
        email: emailValue,
        password:
          passwordToSend !== null
            ? "********"
            : null,
      });

      // =====================================================
      // APPEL API
      // =====================================================

      const data = await apiFetch(
        "/api/admin/commerciaux",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            nom: nomValue,
            prenom: prenomValue,
            email: emailValue,
            password: passwordToSend,
          }),
        }
      );

      console.log(
        "===================================="
      );

      console.log(
        "RÉPONSE API"
      );

      console.log(
        "===================================="
      );

      console.log(data);

      // =====================================================
      // SUCCÈS
      // =====================================================

      if (data.success) {
        Alert.alert(
          "Succès",
          "Le commercial a été ajouté avec succès.\n\nLe compte est actuellement inactif.",
          [
            {
              text: "OK",

              onPress: () => {
                router.replace(
                  "/admin/commerciaux"
                );
              },
            },
          ]
        );

        return;
      }

      // =====================================================
      // ERREUR API
      // =====================================================

      Alert.alert(
        "Erreur",
        data.message ||
          "Impossible d'ajouter le commercial."
      );

    } catch (error) {
      console.error(
        "===================================="
      );

      console.error(
        "❌ ERREUR AJOUT COMMERCIAL"
      );

      console.error(
        "===================================="
      );

      console.error(error);

      Alert.alert(
        "Erreur",
        error.message ||
          "Une erreur est survenue lors de l'ajout du commercial."
      );

    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // RETOUR
  // =====================================================

  function handleBack() {
    if (loading) {
      return;
    }

    router.replace(
      "/admin/commerciaux"
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
      >

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={loading}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#222"
            />
          </TouchableOpacity>

          <View
            style={
              styles.headerTitleContainer
            }
          >
            <Text style={styles.title}>
              Ajouter un commercial
            </Text>

            <Text style={styles.subtitle}>
              Créer un nouveau compte commercial
            </Text>
          </View>

        </View>

        {/* ================================================= */}
        {/* FORMULAIRE */}
        {/* ================================================= */}

        <View style={styles.form}>

          {/* ================================================= */}
          {/* NOM */}
          {/* ================================================= */}

          <Text style={styles.label}>
            Nom
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Entrez le nom"
            placeholderTextColor="#999"
            value={nom}
            onChangeText={setNom}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!loading}
          />

          {/* ================================================= */}
          {/* PRÉNOM */}
          {/* ================================================= */}

          <Text style={styles.label}>
            Prénom
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Entrez le prénom"
            placeholderTextColor="#999"
            value={prenom}
            onChangeText={setPrenom}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!loading}
          />

          {/* ================================================= */}
          {/* EMAIL */}
          {/* ================================================= */}

          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            style={styles.input}
            placeholder="exemple@email.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {/* ================================================= */}
          {/* MOT DE PASSE */}
          {/* ================================================= */}

          <View
            style={
              styles.passwordLabelContainer
            }
          >

            <Text style={styles.label}>
              Mot de passe
            </Text>

            <Text
              style={styles.optionalText}
            >
              Facultatif
            </Text>

          </View>

          <View
            style={
              styles.passwordContainer
            }
          >

            <TextInput
              style={styles.passwordInput}
              placeholder="Mot de passe (facultatif)"
              placeholderTextColor="#999"
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
                setShowPassword(
                  !showPassword
                )
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

          <Text style={styles.helpText}>
            Vous pouvez laisser ce champ vide.
            Si vous renseignez un mot de passe,
            il doit contenir au moins 8 caractères.
          </Text>

          {/* ================================================= */}
          {/* INFORMATION COMPTE */}
          {/* ================================================= */}

          <View
            style={
              styles.infoContainer
            }
          >

            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#555"
            />

            <Text
              style={styles.infoText}
            >
              Le compte sera créé comme{" "}
              <Text
                style={styles.infoBold}
              >
                inactif
              </Text>
              . L'administrateur pourra
              l'activer depuis la liste des
              commerciaux.
            </Text>

          </View>

          {/* ================================================= */}
          {/* BOUTONS */}
          {/* ================================================= */}

          <View
            style={
              styles.buttonsContainer
            }
          >

            {/* ANNULER */}

            <TouchableOpacity
              style={
                styles.cancelButton
              }
              onPress={handleBack}
              disabled={loading}
            >

              <Text
                style={
                  styles.cancelButtonText
                }
              >
                Annuler
              </Text>

            </TouchableOpacity>

            {/* CRÉER */}

            <TouchableOpacity
              style={[
                styles.createButton,
                loading &&
                  styles.disabledButton,
              ]}
              onPress={
                handleAddCommercial
              }
              disabled={loading}
            >

              {loading ? (
                <>
                  <ActivityIndicator
                    color="#fff"
                    size="small"
                  />

                  <Text
                    style={
                      styles.createButtonText
                    }
                  >
                    Création...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="person-add-outline"
                    size={20}
                    color="#fff"
                  />

                  <Text
                    style={
                      styles.createButtonText
                    }
                  >
                    Créer le commercial
                  </Text>
                </>
              )}

            </TouchableOpacity>

          </View>

        </View>

      </ScrollView>

    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },

  scrollContent: {
    padding: 25,
    paddingBottom: 40,
  },

  // =====================================================
  // HEADER
  // =====================================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  headerTitleContainer: {
    flex: 1,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
  },

  subtitle: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
  },

  // =====================================================
  // FORMULAIRE
  // =====================================================

  form: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 25,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    maxWidth: 650,
    width: "100%",
    alignSelf: "center",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 7,
  },

  passwordLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  optionalText: {
    fontSize: 12,
    color: "#888",
    marginBottom: 7,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 18,
    backgroundColor: "#fff",
    color: "#222",
  },

  // =====================================================
  // MOT DE PASSE
  // =====================================================

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: "#fff",
  },

  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#222",
  },

  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  helpText: {
    fontSize: 12,
    color: "#888",
    lineHeight: 18,
    marginBottom: 20,
  },

  // =====================================================
  // INFORMATION
  // =====================================================

  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 25,
    gap: 8,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
  },

  infoBold: {
    fontWeight: "700",
    color: "#333",
  },

  // =====================================================
  // BOUTONS
  // =====================================================

  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
  },

  cancelButton: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  cancelButtonText: {
    color: "#333",
    fontSize: 15,
    fontWeight: "600",
  },

  createButton: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#222",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  disabledButton: {
    opacity: 0.7,
  },

  createButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

});