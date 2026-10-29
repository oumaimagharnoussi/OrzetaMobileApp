import React from "react";
import { router } from "expo-router";

import { useAuth } from "../../context/AuthContext";
import TableauDeBord from "../../components/tableau-de-bord";

export default function AdminHome() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/auth/login");
  }

  return (
    <TableauDeBord
      titre="Administration"
      user={user}
      onLogout={handleLogout}
      rubriques={[
        {
          titre: "Gestion des commerciaux",
          description: "Comptes, activation et rôles",
          icone: "people-outline",
          onPress: () => router.push("/admin/commerciaux"),
        },
        {
          titre: "Tous les visiteurs",
          description: "Recherche, filtres et suppression",
          icone: "id-card-outline",
          onPress: () => router.push("/admin/visiteurs"),
        },
        {
          titre: "OLIVED Simulateur",
          description: "Coûts et prix de vente",
          icone: "calculator-outline",
          onPress: () => router.push("/admin/moteur"),
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
