// ============================================================
// JOURNAUX DE DÉBOGAGE DÉSACTIVÉS EN PRODUCTION
// Les pages affichent beaucoup de console.log (objets entiers en
// JSON, réponses du serveur…) : en production, cela ralentit
// l'application et peut exposer des données (tokens, mots de passe).
// Les avertissements et erreurs (warn / error) restent affichés.
// ============================================================

if (!__DEV__) {
  const rien = () => {};
  console.log = rien;
  console.info = rien;
  console.debug = rien;
}
