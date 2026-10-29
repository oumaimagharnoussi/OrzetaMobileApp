import React from "react";
import { router } from "expo-router";

import { useAuth } from "../../context/AuthContext";
import TableauDeBord from "../../components/tableau-de-bord";

export default function CommercialHome() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/auth/login");
  }

  return (
    <TableauDeBord
      titre="Espace Commercial"
      user={user}
      onLogout={handleLogout}
      rubriques={[
        {
          titre: "Nouveau visiteur",
          description: "Remplir la fiche ou scanner une carte",
          icone: "person-add-outline",
          onPress: () => router.push("/"),
        },
        {
          titre: "Fiches PDF validées",
          description: "Archives des fiches signées",
          icone: "document-text-outline",
          onPress: () => router.push("/archives"),
        },
      ]}
    />
  );
}
