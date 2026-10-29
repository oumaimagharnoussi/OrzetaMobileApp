import React, { useRef, useState } from "react";
import { View, StyleSheet } from "react-native";

import { router } from "expo-router";

import { register } from "../../services/api";
import {
  PageAuth,
  ChampAuth,
  BoutonAuth,
  LienAuth,
  MessageAuth,
  SuccesAuth,
} from "../../components/formulaire-auth";

const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function retourConnexion() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/auth/login");
  }
}

export default function Register() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const [loading, setLoading] = useState(false);
  const [erreurs, setErreurs] = useState({});
  const [erreurServeur, setErreurServeur] = useState("");
  const [compteCree, setCompteCree] = useState(false);

  const nomRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmationRef = useRef(null);

  // L'erreur d'un champ disparaît dès qu'on le corrige
  function modifier(champ, setter) {
    return (valeur) => {
      setter(valeur);
      if (erreurs[champ]) setErreurs((e) => ({ ...e, [champ]: null }));
      if (erreurServeur) setErreurServeur("");
    };
  }

  // ============================================================
  // VÉRIFICATION DU FORMULAIRE
  // Les erreurs s'affichent sous chaque champ (au lieu d'une
  // seule fenêtre « Veuillez remplir tous les champs »)
  // ============================================================

  function verifier() {
    const e = {};

    if (!prenom.trim()) e.prenom = "Le prénom est obligatoire.";
    if (!nom.trim()) e.nom = "Le nom est obligatoire.";

    if (!email.trim()) e.email = "L'email est obligatoire.";
    else if (!EMAIL_VALIDE.test(email.trim()))
      e.email = "Adresse email invalide.";

    if (!password) e.password = "Le mot de passe est obligatoire.";
    else if (password.length < 8)
      e.password = "Au moins 8 caractères.";

    if (password && confirmation !== password)
      e.confirmation = "Les mots de passe ne correspondent pas.";

    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  // ============================================================
  // INSCRIPTION
  // ============================================================

  async function handleRegister() {
    if (loading || !verifier()) return;

    try {
      setLoading(true);
      setErreurServeur("");

      const data = await register({
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (data.success === true) {
        setCompteCree(true);
        return;
      }

      setErreurServeur(data.message || "L'inscription a échoué.");
    } catch (error) {
      // 409 : email déjà utilisé → affiché sous le champ email
      if (error.status === 409) {
        setErreurs((e) => ({
          ...e,
          email: "Un compte existe déjà avec cet email.",
        }));
      } else {
        setErreurServeur(error.message || "Une erreur est survenue.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // COMPTE CRÉÉ
  // Le serveur crée le compte inactif : sans ce message, la
  // connexion échouait juste après sans explication.
  // ============================================================

  if (compteCree) {
    return (
      <PageAuth>
        <SuccesAuth titre="Compte créé">
          Merci {prenom.trim()} ! Votre compte doit maintenant être activé
          par un administrateur. Vous pourrez ensuite vous connecter avec{" "}
          {email.trim().toLowerCase()}.
        </SuccesAuth>

        <BoutonAuth
          texte="Retour à la connexion"
          onPress={() => router.replace("/auth/login")}
        />
      </PageAuth>
    );
  }

  // ============================================================
  // INTERFACE
  // ============================================================

  return (
    <PageAuth
      titre="Créer un compte"
      sousTitre="Rejoignez l'équipe commerciale OLIVED"
    >
      {!!erreurServeur && (
        <MessageAuth type="erreur">{erreurServeur}</MessageAuth>
      )}

      <View style={styles.ligne}>
        <View style={styles.moitie}>
          <ChampAuth
            label="Prénom"
            icone="person-outline"
            placeholder="Prénom"
            value={prenom}
            onChangeText={modifier("prenom", setPrenom)}
            erreur={erreurs.prenom}
            autoCapitalize="words"
            autoComplete="given-name"
            textContentType="givenName"
            returnKeyType="next"
            onSubmitEditing={() => nomRef.current?.focus()}
            editable={!loading}
          />
        </View>

        <View style={styles.moitie}>
          <ChampAuth
            ref={nomRef}
            label="Nom"
            icone="person-outline"
            placeholder="Nom"
            value={nom}
            onChangeText={modifier("nom", setNom)}
            erreur={erreurs.nom}
            autoCapitalize="words"
            autoComplete="family-name"
            textContentType="familyName"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            editable={!loading}
          />
        </View>
      </View>

      <ChampAuth
        ref={emailRef}
        label="Email"
        icone="mail-outline"
        placeholder="nom@exemple.com"
        value={email}
        onChangeText={modifier("email", setEmail)}
        erreur={erreurs.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!loading}
      />

      <ChampAuth
        ref={passwordRef}
        label="Mot de passe"
        icone="lock-closed-outline"
        placeholder="8 caractères minimum"
        motDePasse
        value={password}
        onChangeText={modifier("password", setPassword)}
        erreur={erreurs.password}
        aide={
          password && password.length < 8
            ? `Encore ${8 - password.length} caractère${8 - password.length > 1 ? "s" : ""}`
            : ""
        }
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmationRef.current?.focus()}
        editable={!loading}
      />

      <ChampAuth
        ref={confirmationRef}
        label="Confirmer le mot de passe"
        icone="lock-closed-outline"
        placeholder="Retapez le mot de passe"
        motDePasse
        value={confirmation}
        onChangeText={modifier("confirmation", setConfirmation)}
        erreur={erreurs.confirmation}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={handleRegister}
        editable={!loading}
      />

      <MessageAuth>
        Votre compte sera activé par un administrateur avant votre
        première connexion.
      </MessageAuth>

      <BoutonAuth
        texte="Créer le compte"
        texteChargement="Création…"
        chargement={loading}
        onPress={handleRegister}
      />

      <LienAuth
        icone="arrow-back"
        texte="Retour à la connexion"
        onPress={retourConnexion}
        disabled={loading}
      />
    </PageAuth>
  );
}

const styles = StyleSheet.create({
  ligne: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 12,
  },
  moitie: {
    flexGrow: 1,
    flexBasis: 140,
  },
});
