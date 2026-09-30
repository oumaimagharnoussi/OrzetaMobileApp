import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Accueil */}
        <Stack.Screen name="index" />

        {/* Anciennes pages */}
        <Stack.Screen name="traitement" />
        <Stack.Screen name="pdf" />

        {/* Authentification */}
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/forgot-password" />
        <Stack.Screen name="auth/reset-password" />

        {/* Commercial */}
        <Stack.Screen name="commercial/index" />
        <Stack.Screen name="commercial/visiteurs" />

        {/* Admin */}
        <Stack.Screen name="admin/index" />
        <Stack.Screen name="admin/commerciaux" />
        <Stack.Screen name="admin/visiteurs" />
      </Stack>
    </AuthProvider>
  );
}