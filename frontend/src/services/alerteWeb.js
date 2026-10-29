// ============================================================
// Alert.alert SUR LE WEB
// Sur le navigateur, Alert.alert de React Native n'affiche rien :
// les erreurs de connexion, les confirmations… étaient invisibles.
// On le remplace (web uniquement) par window.alert / window.confirm.
// ============================================================

import { Alert, Platform } from "react-native";

if (Platform.OS === "web" && typeof window !== "undefined") {
  Alert.alert = (titre, message, boutons) => {
    const texte = [titre, message].filter(Boolean).join("\n\n");
    const liste = Array.isArray(boutons) ? boutons : [];

    if (liste.length <= 1) {
      window.alert(texte);
      liste[0]?.onPress?.();
      return;
    }

    const annuler =
      liste.find((b) => b.style === "cancel") || liste[0];
    const valider =
      liste.find((b) => b !== annuler && b.style !== "cancel") ||
      liste[liste.length - 1];

    if (window.confirm(texte)) {
      valider?.onPress?.();
    } else {
      annuler?.onPress?.();
    }
  };
}
