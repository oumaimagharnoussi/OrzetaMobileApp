// ============================================================
// LECTURE DE CARTE DE VISITE (APPLICATION MOBILE)
// Dans l'application Expo, la lecture est faite par le serveur.
// La version web (navigateur) est dans lecteurCarte.web.js.
// ============================================================

export const lecteurCarteDisponible = false;

export function prechargerLecteurCarte() {}

export async function lireCarteNavigateur() {
  throw new Error("Lecture dans le navigateur indisponible.");
}
