// ============================================================
// EN-TÊTE DES PAGES D'ADMINISTRATION
// Bouton retour, titre, sous-titre et actions à droite
// (actualiser, ajouter…), identique sur toutes les pages admin.
// ============================================================

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { Couleurs } from "../constants/couleurs";

// Bouton rond avec une icône (retour, actualiser…)
export function BoutonIcone({ icone, onPress, label, disabled, couleur }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.boutonIcone,
        pressed && styles.appuye,
        disabled && styles.desactive,
      ]}
    >
      <Ionicons name={icone} size={21} color={couleur || Couleurs.texte} />
    </Pressable>
  );
}

// Bouton principal olive (ex. « Ajouter »)
export function BoutonPrincipal({ icone, texte, onPress, disabled, compact }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={texte}
      style={({ pressed }) => [
        styles.boutonPrincipal,
        pressed && styles.appuye,
        disabled && styles.desactive,
      ]}
    >
      {!!icone && <Ionicons name={icone} size={20} color="#fff" />}
      {!compact && <Text style={styles.boutonPrincipalTexte}>{texte}</Text>}
    </Pressable>
  );
}

export default function EnteteAdmin({
  titre,
  sousTitre,
  retour = "/admin",
  onRetour,
  retourDesactive,
  children,
}) {
  return (
    <View style={styles.entete}>
      <BoutonIcone
        icone="arrow-back"
        label="Retour"
        disabled={retourDesactive}
        onPress={onRetour || (() => router.replace(retour))}
      />

      <View style={styles.titres}>
        <Text style={styles.titre} numberOfLines={1}>
          {titre}
        </Text>
        {!!sousTitre && (
          <Text style={styles.sousTitre} numberOfLines={1}>
            {sousTitre}
          </Text>
        )}
      </View>

      {!!children && <View style={styles.actions}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  entete: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Couleurs.carte,
    borderBottomWidth: 1,
    borderBottomColor: Couleurs.bordure,
  },
  titres: {
    flex: 1,
  },
  titre: {
    fontSize: 21,
    fontWeight: "700",
    color: Couleurs.texte,
  },
  sousTitre: {
    marginTop: 2,
    fontSize: 13,
    color: Couleurs.texteDoux,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  boutonIcone: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Couleurs.fond,
    borderWidth: 1,
    borderColor: Couleurs.bordure,
    alignItems: "center",
    justifyContent: "center",
  },
  boutonPrincipal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minWidth: 42,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    backgroundColor: Couleurs.olive,
  },
  boutonPrincipalTexte: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  appuye: {
    opacity: 0.75,
  },
  desactive: {
    opacity: 0.5,
  },
});
