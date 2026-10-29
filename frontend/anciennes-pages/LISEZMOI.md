# Anciennes pages (non utilisées)

Ces fichiers étaient dans `src/app/`, donc Expo Router les compilait comme
des pages (`/home`, `/HomeScreen`, `/explore`) et les ajoutait au bundle,
alors qu'aucun écran n'y mène :

- `home.jsx` et `HomeScreen.jsx` : anciennes copies du formulaire visiteur
  (remplacées par `src/app/index.jsx`) ;
- `explore.tsx` : page d'exemple du modèle Expo.

Ils sont gardés ici au cas où. S'ils ne servent plus, ce dossier peut être supprimé.
