// ============================================================
// TABLEAU DE BORD (accueil administrateur / commercial)
// En-tête avec logo et salutation, puis une carte par rubrique.
// ============================================================

import React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Couleurs, ombre, LARGEUR_MAX } from "../constants/couleurs";

export default function TableauDeBord({
  titre,
  user,
  rubriques,
  onLogout,
}) {
  const initiales =
    `${user?.prenom?.[0] || ""}${user?.nom?.[0] || ""}`.toUpperCase() || "?";

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.contenu}
    >
      <View style={styles.colonne}>
        <View style={styles.entete}>
          <Image
            source={require("../../assets/images/logo-olived-black.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Pressable
            onPress={onLogout}
            style={({ pressed }) => [
              styles.deconnexion,
              pressed && styles.appuye,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Déconnexion"
          >
            <Ionicons name="log-out-outline" size={18} color={Couleurs.danger} />
            <Text style={styles.deconnexionTexte}>Déconnexion</Text>
          </Pressable>
        </View>

        <View style={styles.profil}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexte}>{initiales}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.titre}>{titre}</Text>
            <Text style={styles.bonjour} numberOfLines={1}>
              Bonjour {user?.prenom} {user?.nom}
            </Text>
            {!!user?.email && (
              <Text style={styles.email} numberOfLines={1}>
                {user.email}
              </Text>
            )}
          </View>
        </View>

        {rubriques.map((rubrique) => (
          <Pressable
            key={rubrique.titre}
            onPress={rubrique.onPress}
            style={({ pressed }) => [styles.carte, pressed && styles.appuye]}
            accessibilityRole="button"
          >
            <View style={styles.icone}>
              <Ionicons name={rubrique.icone} size={24} color={Couleurs.olive} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.carteTitre}>{rubrique.titre}</Text>
              {!!rubrique.description && (
                <Text style={styles.carteDescription}>
                  {rubrique.description}
                </Text>
              )}
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={Couleurs.texteDoux}
            />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Couleurs.fond,
  },
  contenu: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: "center",
  },
  colonne: {
    width: "100%",
    maxWidth: LARGEUR_MAX,
  },
  entete: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  logo: {
    width: 130,
    height: 44,
  },
  deconnexion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Couleurs.dangerClair,
  },
  deconnexionTexte: {
    color: Couleurs.danger,
    fontWeight: "600",
  },
  profil: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Couleurs.olive,
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTexte: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  titre: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  bonjour: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
    marginTop: 4,
  },
  email: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginTop: 2,
  },
  carte: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Couleurs.carte,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Couleurs.bordure,
    padding: 16,
    marginBottom: 12,
    ...ombre,
  },
  icone: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Couleurs.oliveClair,
    alignItems: "center",
    justifyContent: "center",
  },
  carteTitre: {
    fontSize: 16,
    fontWeight: "700",
    color: Couleurs.texte,
  },
  carteDescription: {
    fontSize: 13,
    color: Couleurs.texteDoux,
    marginTop: 3,
  },
  appuye: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
