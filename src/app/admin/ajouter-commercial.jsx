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
    // Validation
    if (
      !nom.trim() ||
      !prenom.trim() ||
      !email.trim() ||
      !password
    ) {
      Alert.alert(
        "Erreur",
        "Veuillez remplir tous les champs."
      );
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

      console.log("====================================");
      console.log("AJOUT COMMERCIAL");
      console.log("====================================");

      console.log({
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim(),
      });

      // =================================================
      // APPEL API
      // =================================================

      const data = await apiFetch(
        "/api/admin/commerciaux",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            nom: nom.trim(),
            prenom: prenom.trim(),
            email: email.trim(),
            password: password,
          }),
        }
      );

      console.log("RÉPONSE :", data);

      // =================================================
      // SUCCÈS
      // =================================================

      if (data.success) {
        Alert.alert(
          "Succès",
          "Le commercial a été ajouté avec succès.",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace("/admin/commerciaux");
              },
            },
          ]
        );

        return;
      }

      Alert.alert(
        "Erreur",
        data.message ||
          "Impossible d'ajouter le commercial."
      );

    } catch (error) {
      console.error(
        "❌ ERREUR AJOUT COMMERCIAL :",
        error
      );

      Alert.alert(
        "Erreur",
        error.message ||
          "Une erreur est survenue."
      );

    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <View style={styles.container}>

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <View style={styles.header}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.replace("/admin/commerciaux")
          }
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#222"
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
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

        {/* NOM */}

        <Text style={styles.label}>
          Nom
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Entrez le nom"
          value={nom}
          onChangeText={setNom}
          autoCapitalize="words"
        />

        {/* PRÉNOM */}

        <Text style={styles.label}>
          Prénom
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Entrez le prénom"
          value={prenom}
          onChangeText={setPrenom}
          autoCapitalize="words"
        />

        {/* EMAIL */}

        <Text style={styles.label}>
          Email
        </Text>

        <TextInput
          style={styles.input}
          placeholder="exemple@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* MOT DE PASSE */}

        <Text style={styles.label}>
          Mot de passe
        </Text>

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
            onPress={() =>
              setShowPassword(!showPassword)
            }
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

        {/* ================================================= */}
        {/* BOUTONS */}
        {/* ================================================= */}

        <View style={styles.buttonsContainer}>

          {/* ANNULER */}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() =>
              router.replace("/admin/commerciaux")
            }
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>
              Annuler
            </Text>
          </TouchableOpacity>

          {/* CRÉER */}

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleAddCommercial}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="person-add-outline"
                  size={20}
                  color="#fff"
                />

                <Text style={styles.createButtonText}>
                  Créer le commercial
                </Text>
              </>
            )}
          </TouchableOpacity>

        </View>

      </View>

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
    padding: 25,
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

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 18,
    backgroundColor: "#fff",
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
    marginBottom: 25,
    backgroundColor: "#fff",
  },

  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 14,
    fontSize: 16,
  },

  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  // =====================================================
  // BOUTONS
  // =====================================================

  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
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

  createButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});