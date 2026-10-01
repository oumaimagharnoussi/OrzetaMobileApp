import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function ResetPassword() {
  const router = useRouter();

  const { token } = useLocalSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  console.log("====================================");
  console.log("RESET PASSWORD SCREEN");
  console.log("TOKEN :", token);
  console.log("====================================");

  const handleResetPassword = async () => {
    console.log("====================================");
    console.log("🔵 BOUTON RESET CLIQUÉ");
    console.log("====================================");

    setSuccessMessage("");

    console.log("Password :", password ? "******" : "VIDE");
    console.log(
      "Confirm Password :",
      confirmPassword ? "******" : "VIDE"
    );

    // ============================
    // VALIDATION
    // ============================

    if (!password || !confirmPassword) {
      console.log("❌ Champs vides");

      Alert.alert(
        "Erreur",
        "Veuillez remplir tous les champs."
      );

      return;
    }

    const passwordClean = password.trim();
const confirmPasswordClean = confirmPassword.trim();

console.log("====================================");
console.log("🔍 COMPARAISON MOTS DE PASSE");
console.log("Password brut :", JSON.stringify(password));
console.log("Confirm brut :", JSON.stringify(confirmPassword));
console.log("Password clean :", JSON.stringify(passwordClean));
console.log(
  "Confirm clean :",
  JSON.stringify(confirmPasswordClean)
);
console.log(
  "Longueur password :",
  passwordClean.length
);
console.log(
  "Longueur confirmation :",
  confirmPasswordClean.length
);
console.log(
  "Identiques :",
  passwordClean === confirmPasswordClean
);
console.log("====================================");
console.log(
    "PASSWORD = [" + password + "]"
  );
  
  console.log(
    "CONFIRM = [" + confirmPassword + "]"
  );
if (passwordClean !== confirmPasswordClean) {
  console.log("❌ Les mots de passe ne correspondent pas");

  Alert.alert(
    "Erreur",
    "Les mots de passe ne correspondent pas."
  );

  return;
}

    if (password.length < 6) {
      console.log("❌ Mot de passe trop court");

      Alert.alert(
        "Erreur",
        "Le mot de passe doit contenir au moins 6 caractères."
      );

      return;
    }

    if (!token) {
      console.log("❌ TOKEN MANQUANT");

      Alert.alert(
        "Erreur",
        "Le lien de réinitialisation est invalide ou expiré."
      );

      return;
    }

    console.log("✅ Validation frontend OK");
    console.log("🔑 Token :", token);

    try {
      setLoading(true);

      const API_URL =
        "http://192.168.1.146:5000/api/auth/reset-password";

      console.log("====================================");
      console.log("📡 ENVOI REQUÊTE");
      console.log("URL :", API_URL);
      console.log("METHOD : POST");
      console.log("BODY :");
      console.log({
        token: token,
        password: "******",
      });
      console.log("====================================");

      const response = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
            token: token,
            password: passwordClean,
          }),
      });

      console.log("====================================");
      console.log("📥 RÉPONSE SERVEUR");
      console.log("STATUS :", response.status);
      console.log("OK :", response.ok);
      console.log("STATUS TEXT :", response.statusText);
      console.log("====================================");

      const responseText = await response.text();

      console.log("📄 RÉPONSE BRUTE :");
      console.log(responseText);

      let data;

      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.log("❌ La réponse n'est pas du JSON");
        console.log("Erreur JSON :", jsonError);

        throw new Error(
          "Le serveur a retourné une réponse invalide."
        );
      }

      console.log("📦 DATA SERVEUR :");
      console.log(data);

      if (!response.ok) {
        console.log("❌ ERREUR SERVEUR");

        throw new Error(
          data.message ||
            data.error ||
            "Impossible de réinitialiser le mot de passe."
        );
      }

      // ============================
      // SUCCÈS
      // ============================

      console.log("====================================");
      console.log("✅ MOT DE PASSE MODIFIÉ AVEC SUCCÈS");
      console.log("====================================");

      setSuccessMessage(
        "✓ Mot de passe modifié avec succès !"
      );

      setPassword("");
      setConfirmPassword("");

      console.log(
        "⏳ Redirection vers /auth/login dans 3 secondes..."
      );

      setTimeout(() => {
        console.log("➡️ REDIRECTION VERS /auth/login");

        router.replace("/auth/login");
      }, 3000);

    } catch (error) {
      console.log("====================================");
      console.log("❌ ERREUR RESET PASSWORD");
      console.log("====================================");

      console.log("Error :", error);
      console.log("Message :", error?.message);

      Alert.alert(
        "Erreur",
        error?.message ||
          "Une erreur est survenue lors de la réinitialisation."
      );
    } finally {
      setLoading(false);

      console.log("🏁 FIN DE LA REQUÊTE");
    }
  };

  return (
    <View style={styles.container}>

      {/* TITRE */}

      <Text style={styles.title}>
        Réinitialiser le mot de passe
      </Text>

      <Text style={styles.subtitle}>
        Entrez votre nouveau mot de passe.
      </Text>

      {/* TOKEN - TEMPORAIRE POUR DEBUG */}

      <Text style={styles.tokenText}>
        Token reçu : {token ? "Oui" : "Non"}
      </Text>

      {/* MESSAGE SUCCÈS */}

      {successMessage !== "" && (
        <View style={styles.successBox}>

          <Text style={styles.successText}>
            {successMessage}
          </Text>

          <Text style={styles.redirectText}>
            Redirection vers la connexion dans 3 secondes...
          </Text>

        </View>
      )}

      {/* PASSWORD */}

      <TextInput
  style={styles.input}
  placeholder="Nouveau mot de passe"
  secureTextEntry={true}
  value={password}
  onChangeText={(value) => {
    console.log(
      "PASSWORD SAISI :",
      JSON.stringify(value)
    );

    setPassword(value);
  }}
  autoCapitalize="none"
  autoCorrect={false}
/>

<TextInput
  style={styles.input}
  placeholder="Confirmer le mot de passe"
  secureTextEntry={true}
  value={confirmPassword}
  onChangeText={(value) => {
    console.log(
      "CONFIRMATION SAISIE :",
      JSON.stringify(value)
    );

    setConfirmPassword(value);
  }}
  autoCapitalize="none"
  autoCorrect={false}
/>

      {/* BOUTON */}

      <TouchableOpacity
        style={[
          styles.button,
          (loading || successMessage !== "") &&
            styles.buttonDisabled,
        ]}
        onPress={handleResetPassword}
        disabled={loading || successMessage !== ""}
      >
        <Text style={styles.buttonText}>
          {loading
            ? "Modification..."
            : "Réinitialiser"}
        </Text>
      </TouchableOpacity>

      {/* RETOUR */}

      <TouchableOpacity
        onPress={() => {
          console.log(
            "➡️ Retour vers /auth/login"
          );

          router.replace("/auth/login");
        }}
        disabled={loading}
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
    paddingHorizontal: 30,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },

  tokenText: {
    textAlign: "center",
    color: "#777",
    fontSize: 12,
    marginBottom: 20,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fff",
  },

  button: {
    height: 50,
    borderRadius: 8,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  link: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 15,
    color: "#333",
    textDecorationLine: "underline",
  },

  successBox: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },

  successText: {
    color: "#2E7D32",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },

  redirectText: {
    color: "#555",
    textAlign: "center",
    fontSize: 13,
    marginTop: 8,
  },
});