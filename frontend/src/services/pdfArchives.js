import { Platform, Linking } from "react-native";

import { apiFetch } from "./api";

// ============================================================
// FICHES PDF VALIDÉES
// Le serveur enregistre chaque fiche au moment de sa validation
// (base + fichier). Ici : consultation uniquement.
// ============================================================

// Liste des fiches (toutes, ou celles d'un visiteur) + recherche
export async function listerArchives({ visiteurId, q } = {}) {
  const params = [];
  if (visiteurId) params.push(`visiteur_id=${encodeURIComponent(visiteurId)}`);
  if (q) params.push(`q=${encodeURIComponent(q)}`);

  const data = await apiFetch(
    `/api/pdf-archives${params.length ? `?${params.join("&")}` : ""}`
  );

  return data.archives || [];
}

// Ouvre la fiche (lien signé valable 10 min) dans le navigateur
// ou le lecteur PDF du téléphone
export async function ouvrirArchive(id, { telecharger = false } = {}) {
  // Sur le web, l'onglet est ouvert avant l'appel réseau
  // pour ne pas être bloqué par le navigateur
  const onglet =
    Platform.OS === "web" && !telecharger ? window.open("", "_blank") : null;

  try {
    const data = await apiFetch(`/api/pdf-archives/${id}/lien`);
    const url = telecharger ? data.url_telechargement : data.url;

    if (Platform.OS === "web") {
      if (onglet) {
        onglet.location.href = url;
      } else {
        window.location.href = url;
      }
      return;
    }

    await Linking.openURL(url);
  } catch (error) {
    if (onglet) onglet.close();
    throw error;
  }
}

export const LIBELLES_SOURCE = {
  validation: "Validée",
};

export const formatTaille = (octets) =>
  octets >= 1024 * 1024
    ? `${(octets / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`
    : `${Math.max(1, Math.round(octets / 1024))} Ko`;

export const formatDate = (d) =>
  d
    ? new Date(d).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "–";
