import React, { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import {
  ActivityIndicator,
  View,
} from "react-native";

import {
  AuthProvider,
  useAuth,
} from "../context/AuthContext";
import { Analytics } from "@vercel/analytics/next"
function RootNavigation() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) {
      return;
    }

    const firstSegment = segments[0];

    const isAuthPage =
      firstSegment === "auth";

    const isAdminPage =
      firstSegment === "admin";

    const isCommercialPage =
      firstSegment === "commercial";

    // =====================================================
    // PAS CONNECTÉ
    // =====================================================

    if (!user) {

      if (!isAuthPage) {
        router.replace("/auth/login");
      }

      return;
    }

    // =====================================================
    // UTILISATEUR CONNECTÉ
    // =====================================================

    // -----------------------------------------------------
    // ADMIN
    // -----------------------------------------------------

    if (user.role === "admin") {

      // L'admin ne doit pas accéder aux pages commerciales
      if (isCommercialPage) {
        router.replace("/admin");
        return;
      }

      // L'admin ne doit pas retourner sur login/register
      if (isAuthPage) {
        router.replace("/admin");
        return;
      }

      // Si l'admin arrive sur /
      if (!firstSegment) {
        router.replace("/admin");
        return;
      }

      return;
    }

    // -----------------------------------------------------
    // COMMERCIAL
    // -----------------------------------------------------

    if (user.role === "commercial") {

      // Le commercial ne doit pas accéder à l'admin
      if (isAdminPage) {
        router.replace("/");
        return;
      }

      // Le commercial ne doit pas accéder aux pages auth
      if (isAuthPage) {
        router.replace("/");
        return;
      }

      return;
    }

  }, [user, loading, segments]);

  // =====================================================
  // CHARGEMENT
  // =====================================================

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color="#333"
        />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >

      {/* ============================== */}
      {/* HOME */}
      {/* ============================== */}

      <Stack.Screen
        name="index"
      />

      <Stack.Screen
        name="traitement"
      />

      <Stack.Screen
        name="pdf"
      />

      {/* ============================== */}
      {/* AUTH */}
      {/* ============================== */}

      <Stack.Screen
        name="auth/login"
      />

      <Stack.Screen
        name="auth/register"
      />

      <Stack.Screen
        name="auth/forgot-password"
      />

      <Stack.Screen
        name="auth/reset-password"
      />

      {/* ============================== */}
      {/* COMMERCIAL */}
      {/* ============================== */}

      <Stack.Screen
        name="commercial/index"
      />

      <Stack.Screen
        name="commercial/visiteurs"
      />

      {/* ============================== */}
      {/* ADMIN */}
      {/* ============================== */}

      <Stack.Screen
        name="admin/index"
      />

      <Stack.Screen
        name="admin/commerciaux"
      />

      <Stack.Screen
        name="admin/ajouter-commercial"
      />

      <Stack.Screen
        name="admin/visiteurs"
      />

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