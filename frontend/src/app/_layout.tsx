import "../services/consoleProduction";
import "../services/alerteWeb";

import React, { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { ActivityIndicator, Image, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "../context/AuthContext";
import { Couleurs } from "../constants/couleurs";

function RootNavigation() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (loading) return;

    const firstSegment = segments[0];
    const isAuthPage = firstSegment === "auth";
    const isAdminPage = firstSegment === "admin";
    const isCommercialPage = firstSegment === "commercial";

    // PAS CONNECTÉ
    if (!user) {
      if (!isAuthPage) router.replace("/auth/login");
      return;
    }

    // ADMIN : pas de pages commerciales, ni login, ni accueil commercial
    if (user.role === "admin") {
      if (isCommercialPage || isAuthPage || !firstSegment) {
        router.replace("/admin");
      }
      return;
    }

    // COMMERCIAL : pas d'administration ni de pages auth
    if (user.role === "commercial") {
      if (isAdminPage || isAuthPage) router.replace("/");
    }
  }, [user, loading, segments]);

  // Vercel Analytics : chargé après l'affichage, sur le web seulement
  useEffect(() => {
    if (Platform.OS !== "web" || __DEV__) return;

    import("@vercel/analytics")
      .then(({ inject }) => inject())
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <View style={styles.chargement}>
        <Image
          source={require("../../assets/images/logo-olived-black.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={Couleurs.olive} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        // Les pages n'ont pas d'en-tête : sans ces marges, le haut des
        // pages passait sous l'encoche / la barre d'état du téléphone
        contentStyle: {
          backgroundColor: Couleurs.fond,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="traitement" />
      <Stack.Screen name="pdf" />
      <Stack.Screen name="archives" />

      <Stack.Screen name="auth/login" options={{ animation: "fade" }} />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="auth/forgot-password" />
      <Stack.Screen name="auth/reset-password" />

      <Stack.Screen name="commercial/index" />

      <Stack.Screen name="admin/index" options={{ animation: "fade" }} />
      <Stack.Screen name="admin/commerciaux" />
      <Stack.Screen name="admin/ajouter-commercial" />
      <Stack.Screen name="admin/visiteurs" />
      <Stack.Screen name="admin/moteur" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  chargement: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    backgroundColor: Couleurs.fond,
  },
  logo: {
    width: 180,
    height: 60,
  },
});
