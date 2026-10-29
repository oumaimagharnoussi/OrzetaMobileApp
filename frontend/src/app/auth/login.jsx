import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../context/AuthContext";
import { Couleurs, ombre } from "../../constants/couleurs";

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState(null);
  const motDePasseRef = React.useRef(null);

  // ============================================================
  // CONNEXION
  // ============================================================

  async function handleLogin() {
    if (loading) return;

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

      // ========================================================
      // VÉRIFICATION RÉPONSE
      // ========================================================

      if (!data || !data.success) {
        Alert.alert(
          "Connexion",
          data?.message || "Erreur de connexion"
        );
        return;
      }

      // ========================================================
      // VÉRIFICATION TOKEN
      // ========================================================

      if (!data.token) {
        console.warn(
          "⚠️ Aucun token reçu après la connexion."
        );
      }

      // ========================================================
      // VÉRIFICATION UTILISATEUR
      // ========================================================

      if (!data.user) {
        Alert.alert(
          "Connexion",
          "Les informations utilisateur sont manquantes."
        );
        return;
      }

      // ========================================================
      // REDIRECTION SELON LE ROLE
      // ========================================================

      if (data.user.role === "admin") {
        router.replace("/admin");
      } else if (data.user.role === "commercial") {
        router.replace("/");
      } else {
        console.warn(
          "⚠️ ROLE INCONNU :",
          data.user.role
        );

        router.replace("/");
      }

    } catch (error) {
      Alert.alert(
        "Connexion impossible",
        error?.message ||
          "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // INTERFACE
  // ============================================================

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.carte}>

          <Image
            source={require("../../../assets/images/logo-olived-black.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>
            Accédez à votre espace OLIVED
          </Text>

          {/* EMAIL */}

          <Text style={styles.label}>Email</Text>
          <View
            style={[
              styles.champ,
              focus === "email" && styles.champActif,
            ]}
          >
            <Ionicons name="mail-outline" size={20} color={Couleurs.texteDoux} />
            <TextInput
              style={styles.input}
              placeholder="nom@exemple.com"
              placeholderTextColor="#9AA08E"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onFocus={() => setFocus("email")}
              onBlur={() => setFocus(null)}
              onSubmitEditing={() => motDePasseRef.current?.focus()}
              editable={!loading}
            />
          </View>

          {/* MOT DE PASSE */}

          <Text style={styles.label}>Mot de passe</Text>
          <View
            style={[
              styles.champ,
              focus === "password" && styles.champActif,
            ]}
          >
            <Ionicons name="lock-closed-outline" size={20} color={Couleurs.texteDoux} />
            <TextInput
              ref={motDePasseRef}
              style={styles.input}
              placeholder="Votre mot de passe"
              placeholderTextColor="#9AA08E"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onFocus={() => setFocus("password")}
              onBlur={() => setFocus(null)}
              onSubmitEditing={handleLogin}
              editable={!loading}
            />

            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
              accessibilityLabel={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={Couleurs.texteDoux}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/auth/forgot-password")}
            disabled={loading}
            style={styles.oubliBouton}
          >
            <Text style={styles.link}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* BOUTON CONNEXION */}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.chargement}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.buttonText}>Connexion…</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          {loading && (
            <Text style={styles.reveil}>
              Le premier accès de la journée peut prendre quelques secondes
              (réveil du serveur).
            </Text>
          )}

          {/* CRÉER UN COMPTE */}

          <View style={styles.inscription}>
            <Text style={styles.inscriptionTexte}>Pas encore de compte ?</Text>
            <TouchableOpacity
              onPress={() => router.push("/auth/register")}
              disabled={loading}
            >
              <Text style={styles.register}>Créer un compte</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Couleurs.fond,
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  carte: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: Couleurs.carte,
    borderRadius: 20,
    padding: 28,
    ...ombre,
  },

  logo: {
    width: 170,
    height: 56,
    alignSelf: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: Couleurs.texte,
  },

  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: Couleurs.texteDoux,
    marginTop: 4,
    marginBottom: 26,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Couleurs.texte,
    marginBottom: 6,
  },

  champ: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: Couleurs.bordure,
    borderRadius: 12,
    paddingLeft: 14,
    marginBottom: 16,
    backgroundColor: "#FBFBF8",
  },

  champActif: {
    borderColor: Couleurs.olive,
    backgroundColor: "#fff",
  },

  input: {
    flex: 1,
    paddingVertical: 13,
    paddingRight: 14,
    fontSize: 16,
    color: Couleurs.texte,
    outlineStyle: "none",
  },

  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  oubliBouton: {
    alignSelf: "flex-end",
    marginTop: -6,
    marginBottom: 20,
  },

  link: {
    color: Couleurs.olive,
    fontWeight: "600",
    fontSize: 14,
  },

  button: {
    backgroundColor: Couleurs.olive,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.75,
  },

  chargement: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  reveil: {
    textAlign: "center",
    fontSize: 12,
    color: Couleurs.texteDoux,
    marginTop: 10,
  },

  inscription: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 26,
  },

  inscriptionTexte: {
    color: Couleurs.texteDoux,
  },

  register: {
    color: Couleurs.olive,
    fontWeight: "700",
  },

});
