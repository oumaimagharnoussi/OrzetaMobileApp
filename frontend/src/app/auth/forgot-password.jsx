import React, { useState } from "react";

import { router } from "expo-router";

import { forgotPassword } from "../../services/api";
import {
  PageAuth,
  ChampAuth,
  BoutonAuth,
  LienAuth,
  MessageAuth,
  SuccesAuth,
} from "../../components/formulaire-auth";

const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [erreurServeur, setErreurServeur] = useState("");
  const [envoye, setEnvoye] = useState(false);

  // ============================================================
  // ENVOI DU LIEN
  // ============================================================

  async function handleForgotPassword() {
    if (loading) return;

    const adresse = email.trim().toLowerCase();

    if (!adresse) {
      setErreur("Veuillez saisir votre email.");
      return;
    }

    if (!EMAIL_VALIDE.test(adresse)) {
      setErreur("Adresse email invalide.");
      return;
    }

    try {
      setLoading(true);
      setErreurServeur("");

      await forgotPassword(adresse);

      // Le serveur répond pareil que l'email existe ou non
      // (pour ne pas révéler les comptes) : on affiche la suite
      setEnvoye(true);
    } catch (error) {
      setErreurServeur(
        error.message || "Impossible d'envoyer le lien. Réessayez."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // LIEN ENVOYÉ
  // ============================================================

  if (envoye) {
    return (
      <PageAuth>
        <SuccesAuth icone="mail-unread-outline" titre="Vérifiez vos emails">
          Si un compte existe pour {email.trim().toLowerCase()}, vous allez
          recevoir un lien pour choisir un nouveau mot de passe. Ce lien est
          valable 30 minutes.
        </SuccesAuth>

        <MessageAuth>
          Rien reçu ? Regardez dans les courriers indésirables (spam), ou
          renvoyez le lien.
        </MessageAuth>

        <BoutonAuth
          texte="Retour à la connexion"
          onPress={() => router.replace("/auth/login")}
        />

        <LienAuth
          icone="refresh"
          texte="Renvoyer le lien"
          onPress={() => setEnvoye(false)}
        />
      </PageAuth>
    );
  }

  // ============================================================
  // INTERFACE
  // ============================================================

  return (
    <PageAuth
      titre="Mot de passe oublié"
      sousTitre="Entrez l'email de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe."
    >
      {!!erreurServeur && (
        <MessageAuth type="erreur">{erreurServeur}</MessageAuth>
      )}

      <ChampAuth
        label="Email"
        icone="mail-outline"
        placeholder="nom@exemple.com"
        value={email}
        onChangeText={(valeur) => {
          setEmail(valeur);
          if (erreur) setErreur("");
          if (erreurServeur) setErreurServeur("");
        }}
        erreur={erreur}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={handleForgotPassword}
        autoFocus
        editable={!loading}
      />

      <BoutonAuth
        texte="Envoyer le lien"
        texteChargement="Envoi…"
        chargement={loading}
        onPress={handleForgotPassword}
      />

      <LienAuth
        icone="arrow-back"
        texte="Retour à la connexion"
        onPress={() => router.replace("/auth/login")}
        disabled={loading}
      />
    </PageAuth>
  );
}
