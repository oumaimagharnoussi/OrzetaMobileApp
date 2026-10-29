// ============================================================
// ÉLÉMENTS COMMUNS DES PAGES D'AUTHENTIFICATION
// (créer un compte, mot de passe oublié) : même carte, mêmes
// champs et même bouton que la page de connexion.
// ============================================================

import React, { forwardRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Couleurs, ombre } from "../constants/couleurs";

// Page centrée avec la carte blanche, le logo et le titre
export function PageAuth({ titre, sousTitre, children }) {
  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.conteneur}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.carte}>
          <Image
            source={require("../../assets/images/logo-olived-black.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          {!!titre && <Text style={styles.titre}>{titre}</Text>}
          {!!sousTitre && <Text style={styles.sousTitre}>{sousTitre}</Text>}

          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Champ avec libellé, icône, bordure olive au focus, message
// d'erreur et (pour les mots de passe) bouton afficher / masquer
export const ChampAuth = forwardRef(function ChampAuth(
  { label, icone, erreur, motDePasse, aide, editable = true, ...props },
  ref
) {
  const [focus, setFocus] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.bloc}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.champ,
          focus && styles.champActif,
          !!erreur && styles.champErreur,
        ]}
      >
        <Ionicons name={icone} size={20} color={Couleurs.texteDoux} />

        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor="#9AA08E"
          secureTextEntry={motDePasse && !visible}
          autoCorrect={false}
          editable={editable}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          {...props}
        />

        {motDePasse && (
          <Pressable
            style={styles.oeil}
            onPress={() => setVisible((v) => !v)}
            disabled={!editable}
            hitSlop={6}
            accessibilityLabel={
              visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
            }
          >
            <Ionicons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={Couleurs.texteDoux}
            />
          </Pressable>
        )}
      </View>

      {!!erreur && (
        <View style={styles.erreurLigne}>
          <Ionicons name="alert-circle" size={15} color={Couleurs.danger} />
          <Text style={styles.erreurTexte}>{erreur}</Text>
        </View>
      )}

      {!erreur && !!aide && <Text style={styles.aide}>{aide}</Text>}
    </View>
  );
});

// Bouton principal olive, avec indicateur de chargement
export function BoutonAuth({ texte, texteChargement, chargement, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={chargement}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.bouton,
        pressed && styles.appuye,
        chargement && styles.boutonChargement,
      ]}
    >
      {chargement ? (
        <View style={styles.ligne}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.boutonTexte}>{texteChargement || texte}</Text>
        </View>
      ) : (
        <Text style={styles.boutonTexte}>{texte}</Text>
      )}
    </Pressable>
  );
}

// Lien texte olive (ex. « Retour à la connexion »)
export function LienAuth({ texte, icone, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="link"
      hitSlop={6}
      style={({ pressed }) => [styles.lien, pressed && styles.appuye]}
    >
      {!!icone && <Ionicons name={icone} size={17} color={Couleurs.olive} />}
      <Text style={styles.lienTexte}>{texte}</Text>
    </Pressable>
  );
}

// Encadré d'information ou d'erreur générale
export function MessageAuth({ type = "info", children }) {
  const erreur = type === "erreur";

  return (
    <View style={[styles.message, erreur ? styles.messageErreur : styles.messageInfo]}>
      <Ionicons
        name={erreur ? "alert-circle-outline" : "information-circle-outline"}
        size={20}
        color={erreur ? Couleurs.danger : Couleurs.oliveFonce}
      />
      <Text style={[styles.messageTexte, erreur && { color: Couleurs.danger }]}>
        {children}
      </Text>
    </View>
  );
}

// Écran de réussite (grande icône, titre, explication)
export function SuccesAuth({ icone = "checkmark-circle", titre, children }) {
  return (
    <View style={styles.succes}>
      <View style={styles.succesIcone}>
        <Ionicons name={icone} size={44} color={Couleurs.olive} />
      </View>
      <Text style={styles.titre}>{titre}</Text>
      <Text style={styles.succesTexte}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Couleurs.fond,
  },
  conteneur: {
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
  titre: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: Couleurs.texte,
  },
  sousTitre: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: Couleurs.texteDoux,
    marginTop: 4,
    marginBottom: 24,
  },

  bloc: {
    marginBottom: 16,
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
    backgroundColor: "#FBFBF8",
  },
  champActif: {
    borderColor: Couleurs.olive,
    backgroundColor: "#fff",
  },
  champErreur: {
    borderColor: Couleurs.danger,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    paddingRight: 14,
    fontSize: 16,
    color: Couleurs.texte,
    outlineStyle: "none",
  },
  oeil: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  erreurLigne: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  erreurTexte: {
    flex: 1,
    fontSize: 13,
    color: Couleurs.danger,
  },
  aide: {
    fontSize: 12,
    color: Couleurs.texteDoux,
    marginTop: 6,
  },

  bouton: {
    backgroundColor: Couleurs.olive,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  boutonChargement: {
    opacity: 0.75,
  },
  boutonTexte: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  ligne: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  appuye: {
    opacity: 0.8,
  },

  lien: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 22,
    alignSelf: "center",
  },
  lienTexte: {
    color: Couleurs.olive,
    fontWeight: "700",
    fontSize: 14,
  },

  message: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  messageInfo: {
    backgroundColor: Couleurs.oliveClair,
  },
  messageErreur: {
    backgroundColor: Couleurs.dangerClair,
  },
  messageTexte: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: Couleurs.oliveFonce,
  },

  succes: {
    alignItems: "center",
    marginBottom: 8,
  },
  succesIcone: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Couleurs.oliveClair,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  succesTexte: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: Couleurs.texteDoux,
    marginTop: 8,
    marginBottom: 6,
  },
});
