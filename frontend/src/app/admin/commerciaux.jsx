import React, { useCallback, useMemo, useState } from "react";

import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import { apiFetch } from "../../services/api";
import { Couleurs, ombre } from "../../constants/couleurs";
import EnteteAdmin, {
  BoutonIcone,
  BoutonPrincipal,
} from "../../components/entete-admin";

// Au-delà de cette largeur : tableau ; en dessous : cartes
const LARGEUR_TABLEAU = 800;

const FILTRES = [
  { valeur: "tous", label: "Tous" },
  { valeur: "actifs", label: "Actifs" },
  { valeur: "inactifs", label: "Inactifs" },
];

function estActif(item) {
  return Number(item.actif) === 1;
}

function nomComplet(item) {
  return [item.prenom, item.nom].filter(Boolean).join(" ") || "-";
}

function initiales(item) {
  return (
    `${item.prenom?.[0] || ""}${item.nom?.[0] || ""}`.toUpperCase() || "?"
  );
}

// =====================================================
// PETITS COMPOSANTS
// =====================================================

function BadgeStatut({ actif }) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: actif ? Couleurs.succesClair : Couleurs.dangerClair },
      ]}
    >
      <View
        style={[
          styles.point,
          { backgroundColor: actif ? Couleurs.succes : Couleurs.danger },
        ]}
      />
      <Text
        style={[
          styles.badgeTexte,
          { color: actif ? Couleurs.succes : Couleurs.danger },
        ]}
      >
        {actif ? "Actif" : "Inactif"}
      </Text>
    </View>
  );
}

function BoutonStatut({ actif, enCours, desactive, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desactive}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.boutonStatut,
        actif ? styles.boutonDesactiver : styles.boutonActiver,
        pressed && { opacity: 0.75 },
        desactive && !enCours && { opacity: 0.5 },
      ]}
    >
      {enCours ? (
        <ActivityIndicator
          size="small"
          color={actif ? Couleurs.danger : "#fff"}
        />
      ) : (
        <>
          <Ionicons
            name={actif ? "close-circle-outline" : "checkmark-circle-outline"}
            size={17}
            color={actif ? Couleurs.danger : "#fff"}
          />
          <Text
            style={[
              styles.boutonStatutTexte,
              { color: actif ? Couleurs.danger : "#fff" },
            ]}
          >
            {actif ? "Désactiver" : "Activer"}
          </Text>
        </>
      )}
    </Pressable>
  );
}

function Statistique({ icone, valeur, label, couleur }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcone}>
        <Ionicons name={icone} size={21} color={couleur || Couleurs.olive} />
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text style={styles.statValeur}>{valeur}</Text>
        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

// =====================================================
// PAGE
// =====================================================

export default function Commerciaux() {
  const { width } = useWindowDimensions();
  const enTableau = width >= LARGEUR_TABLEAU;
  const compact = width < 480;

  const [commerciaux, setCommerciaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actualisation, setActualisation] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState("");
  const [filtre, setFiltre] = useState("tous");

  // =====================================================
  // CHARGER LES COMMERCIAUX
  // =====================================================

  const loadCommerciaux = useCallback(async (mode = "page") => {
    try {
      if (mode === "page") setLoading(true);
      if (mode === "tirer") setActualisation(true);

      const data = await apiFetch("/api/admin/commerciaux");

      setCommerciaux(
        Array.isArray(data.commerciaux) ? data.commerciaux : []
      );
    } catch (error) {
      console.error("❌ ERREUR CHARGEMENT COMMERCIAUX :", error);

      Alert.alert(
        "Erreur",
        error.message || "Impossible de charger les commerciaux."
      );
    } finally {
      setLoading(false);
      setActualisation(false);
    }
  }, []);

  // Rechargé à chaque retour sur la page (ex. après un ajout)
  useFocusEffect(
    useCallback(() => {
      loadCommerciaux();
    }, [loadCommerciaux])
  );

  // =====================================================
  // ACTIVER / DÉSACTIVER (avec confirmation : avant, un
  // simple appui changeait le compte sans rien demander)
  // =====================================================

  async function changerStatut(item) {
    const actif = estActif(item);
    const endpoint = actif
      ? `/api/admin/commerciaux/${item.id}/desactiver`
      : `/api/admin/commerciaux/${item.id}/activer`;

    try {
      setActionLoading(item.id);

      await apiFetch(endpoint, { method: "PUT" });

      // Mise à jour immédiate, puis rechargement discret
      setCommerciaux((liste) =>
        liste.map((c) =>
          c.id === item.id ? { ...c, actif: actif ? 0 : 1 } : c
        )
      );
      loadCommerciaux("discret");
    } catch (error) {
      console.error("❌ ERREUR STATUT COMMERCIAL :", error);

      Alert.alert(
        "Erreur",
        error.message || "Erreur lors de la modification."
      );
    } finally {
      setActionLoading(null);
    }
  }

  function demanderChangement(item) {
    const actif = estActif(item);

    Alert.alert(
      actif ? "Désactiver le commercial" : "Activer le commercial",
      actif
        ? `Voulez-vous désactiver le compte de ${nomComplet(item)} ?\n\nIl ne pourra plus se connecter.`
        : `Voulez-vous activer le compte de ${nomComplet(item)} ?\n\nIl pourra se connecter à l'application.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: actif ? "Désactiver" : "Activer",
          style: actif ? "destructive" : "default",
          onPress: () => changerStatut(item),
        },
      ]
    );
  }

  function handleAddCommercial() {
    router.push("/admin/ajouter-commercial");
  }

  // =====================================================
  // STATISTIQUES, RECHERCHE ET FILTRE
  // =====================================================

  const stats = useMemo(() => {
    const actifs = commerciaux.filter(estActif).length;
    return {
      total: commerciaux.length,
      actifs,
      inactifs: commerciaux.length - actifs,
    };
  }, [commerciaux]);

  const liste = useMemo(() => {
    let resultat = commerciaux;
    const texte = search.trim().toLowerCase();

    if (texte) {
      resultat = resultat.filter((c) =>
        [`${c.prenom || ""} ${c.nom || ""}`, `${c.nom || ""} ${c.prenom || ""}`, c.email]
          .some((champ) => (champ || "").toLowerCase().includes(texte))
      );
    }

    if (filtre === "actifs") resultat = resultat.filter(estActif);
    if (filtre === "inactifs") resultat = resultat.filter((c) => !estActif(c));

    return resultat;
  }, [commerciaux, search, filtre]);

  // =====================================================
  // AFFICHAGE D'UN COMMERCIAL
  // =====================================================

  function renderCarte({ item }) {
    const actif = estActif(item);

    return (
      <View style={styles.carte}>
        <View style={styles.carteHaut}>
          <View style={[styles.avatar, !actif && styles.avatarInactif]}>
            <Text style={styles.avatarTexte}>{initiales(item)}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.carteNom} numberOfLines={1}>
              {nomComplet(item)}
            </Text>
            <Text style={styles.texteDoux} numberOfLines={1}>
              {item.email || "-"}
            </Text>
          </View>
        </View>

        <View style={styles.carteBas}>
          <BadgeStatut actif={actif} />
          <BoutonStatut
            actif={actif}
            enCours={actionLoading === item.id}
            desactive={actionLoading !== null}
            onPress={() => demanderChangement(item)}
          />
        </View>
      </View>
    );
  }

  function renderLigne({ item, index }) {
    const actif = estActif(item);

    return (
      <View style={[styles.ligne, index % 2 === 1 && styles.ligneAlternee]}>
        <View style={[styles.colNom, styles.celluleNom]}>
          <View style={[styles.avatarPetit, !actif && styles.avatarInactif]}>
            <Text style={styles.avatarPetitTexte}>{initiales(item)}</Text>
          </View>
          <Text style={styles.cellule} numberOfLines={1}>
            {nomComplet(item)}
          </Text>
        </View>
        <Text style={[styles.cellule, styles.colEmail]} numberOfLines={1}>
          {item.email || "-"}
        </Text>
        <View style={styles.colStatut}>
          <BadgeStatut actif={actif} />
        </View>
        <View style={styles.colAction}>
          <BoutonStatut
            actif={actif}
            enCours={actionLoading === item.id}
            desactive={actionLoading !== null}
            onPress={() => demanderChangement(item)}
          />
        </View>
      </View>
    );
  }

  // Élément JSX (et non composant) : la recherche garde le focus
  const hautDeListe = (
    <View>
      <View style={styles.stats}>
        <Statistique icone="people-outline" valeur={stats.total} label="Commerciaux" />
        <Statistique
          icone="checkmark-circle-outline"
          valeur={stats.actifs}
          label="Actifs"
          couleur={Couleurs.succes}
        />
        <Statistique
          icone="pause-circle-outline"
          valeur={stats.inactifs}
          label="Inactifs (à activer)"
          couleur={Couleurs.danger}
        />
      </View>

      <View style={styles.filtres}>
        <View style={styles.recherche}>
          <Ionicons name="search-outline" size={20} color={Couleurs.texteDoux} />
          <TextInput
            style={styles.rechercheInput}
            placeholder="Nom ou email…"
            placeholderTextColor={Couleurs.texteDoux}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch("")}
              hitSlop={8}
              accessibilityLabel="Effacer la recherche"
            >
              <Ionicons name="close-circle" size={20} color={Couleurs.texteDoux} />
            </Pressable>
          )}
        </View>

        <View style={styles.puces}>
          {FILTRES.map((f) => {
            const choisi = filtre === f.valeur;
            return (
              <Pressable
                key={f.valeur}
                onPress={() => setFiltre(f.valeur)}
                accessibilityRole="button"
                accessibilityState={{ selected: choisi }}
                style={[styles.puce, choisi && styles.puceActive]}
              >
                <Text style={[styles.puceTexte, choisi && styles.puceTexteActif]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {enTableau && liste.length > 0 && (
        <View style={[styles.ligne, styles.enteteTableau]}>
          <Text style={[styles.enteteCellule, styles.colNom]}>Nom et prénom</Text>
          <Text style={[styles.enteteCellule, styles.colEmail]}>Email</Text>
          <Text style={[styles.enteteCellule, styles.colStatut]}>Statut</Text>
          <Text style={[styles.enteteCellule, styles.colAction]}>Action</Text>
        </View>
      )}
    </View>
  );

  const listeVide = (
    <View style={styles.vide}>
      <Ionicons name="people-outline" size={46} color={Couleurs.bordure} />
      <Text style={styles.videTitre}>Aucun commercial trouvé</Text>
      {commerciaux.length === 0 && (
        <BoutonPrincipal
          icone="add"
          texte="Ajouter un commercial"
          onPress={handleAddCommercial}
        />
      )}
    </View>
  );

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <View style={styles.page}>
      <EnteteAdmin titre="Commerciaux" sousTitre="Comptes et activation">
        <BoutonIcone
          icone="refresh-outline"
          label="Actualiser"
          disabled={loading || actualisation}
          onPress={() => loadCommerciaux("tirer")}
        />
        <BoutonPrincipal
          icone="add"
          texte="Ajouter"
          compact={compact}
          onPress={handleAddCommercial}
        />
      </EnteteAdmin>

      {loading ? (
        <View style={styles.chargement}>
          <ActivityIndicator size="large" color={Couleurs.olive} />
          <Text style={styles.texteDoux}>Chargement des commerciaux…</Text>
        </View>
      ) : (
        <FlatList
          key={enTableau ? "tableau" : "cartes"}
          data={liste}
          keyExtractor={(item) => String(item.id)}
          renderItem={enTableau ? renderLigne : renderCarte}
          extraData={actionLoading}
          ListHeaderComponent={hautDeListe}
          ListEmptyComponent={listeVide}
          contentContainerStyle={styles.contenu}
          keyboardShouldPersistTaps="handled"
          refreshing={actualisation}
          onRefresh={() => loadCommerciaux("tirer")}
        />
      )}
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Couleurs.fond,
  },
  contenu: {
    padding: 16,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
  },
  chargement: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  texteDoux: {
    fontSize: 13,
    color: Couleurs.texteDoux,
  },

  // STATISTIQUES
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 14,
  },
  stat: {
    flexGrow: 1,
    flexBasis: 150,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: Couleurs.carte,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Couleurs.bordure,
    ...ombre,
  },
  statIcone: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Couleurs.oliveClair,
    alignItems: "center",
    justifyContent: "center",
  },
  statValeur: {
    fontSize: 22,
    fontWeight: "700",
    color: Couleurs.texte,
  },
  statLabel: {
    fontSize: 12,
    color: Couleurs.texteDoux,
  },

  // RECHERCHE + FILTRES
  filtres: {
    padding: 14,
    marginBottom: 12,
    backgroundColor: Couleurs.carte,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Couleurs.bordure,
    gap: 12,
  },
  recherche: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Couleurs.bordure,
    backgroundColor: Couleurs.fond,
  },
  rechercheInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: Couleurs.texte,
  },
  puces: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  puce: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Couleurs.bordure,
    backgroundColor: Couleurs.carte,
  },
  puceActive: {
    backgroundColor: Couleurs.olive,
    borderColor: Couleurs.olive,
  },
  puceTexte: {
    fontSize: 14,
    fontWeight: "500",
    color: Couleurs.texte,
  },
  puceTexteActif: {
    color: "#fff",
  },

  // CARTES (téléphone)
  carte: {
    backgroundColor: Couleurs.carte,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Couleurs.bordure,
    padding: 14,
    marginBottom: 10,
    ...ombre,
  },
  carteHaut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  carteBas: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Couleurs.bordure,
  },
  carteNom: {
    fontSize: 16,
    fontWeight: "700",
    color: Couleurs.texte,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Couleurs.oliveClair,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInactif: {
    backgroundColor: "#EEEEEA",
  },
  avatarTexte: {
    color: Couleurs.oliveFonce,
    fontWeight: "700",
    fontSize: 15,
  },

  // TABLEAU (ordinateur / tablette)
  ligne: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 14,
    backgroundColor: Couleurs.carte,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: Couleurs.bordure,
  },
  ligneAlternee: {
    backgroundColor: "#FAFBF7",
  },
  enteteTableau: {
    minHeight: 46,
    backgroundColor: Couleurs.oliveClair,
    borderTopWidth: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  enteteCellule: {
    fontSize: 12,
    fontWeight: "700",
    color: Couleurs.oliveFonce,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  cellule: {
    fontSize: 14,
    color: Couleurs.texte,
    flexShrink: 1,
  },
  celluleNom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarPetit: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Couleurs.oliveClair,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPetitTexte: {
    color: Couleurs.oliveFonce,
    fontWeight: "700",
    fontSize: 11,
  },
  colNom: { flex: 1.3 },
  colEmail: { flex: 1.7 },
  colStatut: { width: 110 },
  colAction: { width: 140 },

  // STATUT
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  point: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  badgeTexte: {
    fontSize: 12,
    fontWeight: "600",
  },
  boutonStatut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 36,
    minWidth: 124,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  boutonActiver: {
    backgroundColor: Couleurs.olive,
  },
  boutonDesactiver: {
    backgroundColor: Couleurs.dangerClair,
  },
  boutonStatutTexte: {
    fontSize: 13,
    fontWeight: "600",
  },

  // VIDE
  vide: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 50,
    paddingHorizontal: 20,
    backgroundColor: Couleurs.carte,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Couleurs.bordure,
  },
  videTitre: {
    fontSize: 16,
    fontWeight: "700",
    color: Couleurs.texte,
  },
});
