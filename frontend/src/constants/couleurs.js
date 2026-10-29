// ============================================================
// COULEURS ET STYLES COMMUNS DE L'APPLICATION (charte OLIVED)
// ============================================================

import { Platform } from "react-native";

export const Couleurs = {
  olive: "#5C681F",
  oliveFonce: "#434C14",
  oliveClair: "#EEF2DC",
  fond: "#F6F7F2",
  carte: "#FFFFFF",
  texte: "#1F2318",
  texteDoux: "#6B7060",
  bordure: "#E1E4D6",
  danger: "#C62828",
  dangerClair: "#FDECEC",
  succes: "#2E7D32",
  succesClair: "#E8F5E9",
  orange: "#A15C00",
  orangeClair: "#FFF3E0",
};

// Ombre légère, identique sur iOS, Android et web
export const ombre = Platform.select({
  web: { boxShadow: "0 2px 10px rgba(31, 35, 24, 0.07)" },
  default: {
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});

// Largeur maximale du contenu (lisible sur ordinateur et tablette)
export const LARGEUR_MAX = 760;
