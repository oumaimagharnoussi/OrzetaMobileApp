import React, { useCallback, useEffect, useMemo, useState } from "react";

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

import { apiFetch } from "../../services/api";
import { Couleurs, ombre } from "../../constants/couleurs";
import EnteteAdmin, { BoutonIcone } from "../../components/entete-admin";

// Au-delà de cette largeur, les visiteurs sont affichés en tableau ;
// en dessous (téléphone), en cartes
const LARGEUR_TABLEAU = 900;

const FILTRES = [
  { valeur: "Tous", label: "Tous" },
  { valeur: "vrac", label: "Vrac" },
  { valeur: "conditionné", label: "Conditionné" },
];

// =====================================================
// FORMATAGE
// =====================================================

function formatDate(date) {
  if (!date) return "-";

  const d = new Date(date);
  return isNaN(d) ? String(date) : d.toLocaleDateString("fr-FR");
}

function getTypeLabel(type) {
  if (!type) return "-";
  if (type.toLowerCase() === "vrac") return "Vrac";
  if (type.toLowerCase() === "conditionné") return "Conditionné";
  return type;
}

function nomComplet(item) {
  return [item.prenom, item.nom].filter(Boolean).join(" ") || "-";
}

function initiales(item) {
  return (
    `${item.prenom?.[0] || ""}${item.nom?.[0] || ""}`.toUpperCase() || "?"
  );
}

function memeType(item, type) {
  return (item.type_commande || "").toLowerCase() === type;
}

// =====================================================
// PETITS COMPOSANTS
// =====================================================

function BadgeType({ type }) {
  const vrac = (type || "").toLowerCase() === "vrac";

  if (!type) {
    return <Text style={styles.texteDoux}>-</Text>;
  }

  return (
    <View style={[styles.badge, vrac ? styles.badgeVrac : styles.badgeCond]}>
      <Text
        style={[
          styles.badgeTexte,
          { color: vrac ? Couleurs.succes : Couleurs.orange },
        ]}
      >
        {getTypeLabel(type)}
      </Text>
    </View>
  );
}

function Statistique({ icone, valeur, label }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcone}>
        <Ionicons name={icone} size={21} color={Couleurs.olive} />
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

function Info({ icone, texte }) {
  return (
    <View style={styles.info}>
      <Ionicons name={icone} size={15} color={Couleurs.texteDoux} />
      <Text style={styles.infoTexte} numberOfLines={1}>
        {texte}
      </Text>
    </View>
  );
}

function BoutonSupprimer({ enCours, desactive, onPress }) {
  if (enCours) {
    return <ActivityIndicator color={Couleurs.danger} />;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={desactive}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Supprimer ce visiteur"
      style={({ pressed }) => [
        styles.boutonSupprimer,
        pressed && { opacity: 0.6 },
        desactive && { opacity: 0.4 },
      ]}
    >
      <Ionicons name="trash-outline" size={19} color={Couleurs.danger} />
    </Pressable>
  );
}

// =====================================================
// PAGE
// =====================================================

export default function AdminVisiteurs() {
  const { width } = useWindowDimensions();
  const enTableau = width >= LARGEUR_TABLEAU;

  const [visiteurs, setVisiteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actualisation, setActualisation] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Tous");
  const [suppressionId, setSuppressionId] = useState(null);

  // =====================================================
  // CHARGER LES VISITEURS
  // =====================================================

  const loadVisiteurs = useCallback(async (tirer = false) => {
    try {
      if (tirer) setActualisation(true);
      else setLoading(true);

      const data = await apiFetch("/api/visiteurs");
      setVisiteurs(data.visiteurs || []);
    } catch (error) {
      console.error("Erreur visiteurs :", error);

      Alert.alert(
        "Erreur",
        error.message || "Impossible de charger les visiteurs."
      );
    } finally {
      setLoading(false);
      setActualisation(false);
    }
  }, []);

  useEffect(() => {
    loadVisiteurs();
  }, [loadVisiteurs]);

  // =====================================================
  // SUPPRIMER UN VISITEUR
  // (Alert.alert fonctionne aussi sur le web : services/alerteWeb)
  // =====================================================

  async function supprimerVisiteur(item) {
    try {
      setSuppressionId(item.id);

      await apiFetch(`/api/visiteurs/${item.id}`, {
        method: "DELETE",
      });

      setVisiteurs((liste) => liste.filter((v) => v.id !== item.id));

      Alert.alert("Supprimé", "Le visiteur a été supprimé.");
    } catch (error) {
      console.error("Erreur suppression visiteur :", error);

      Alert.alert(
        "Erreur",
        error.message || "Impossible de supprimer le visiteur."
      );
    } finally {
      setSuppressionId(null);
    }
  }

  function demanderSuppression(item) {
    Alert.alert(
      "Supprimer le visiteur",
      `Voulez-vous vraiment supprimer « ${nomComplet(item)} » ?\n\n` +
        "Ses commandes et sa carte de visite seront aussi supprimées. " +
        "Cette action est définitive.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => supprimerVisiteur(item),
        },
      ]
    );
  }

  // =====================================================
  // STATISTIQUES
  // =====================================================

  const stats = useMemo(() => {
    const maintenant = new Date();
    let vrac = 0;
    let conditionne = 0;
    let ceMois = 0;

    for (const v of visiteurs) {
      if (memeType(v, "vrac")) vrac++;
      if (memeType(v, "conditionné")) conditionne++;

      const d = new Date(v.created_at || v.date_creation);
      if (
        !isNaN(d) &&
        d.getMonth() === maintenant.getMonth() &&
        d.getFullYear() === maintenant.getFullYear()
      ) {
        ceMois++;
      }
    }

    return { total: visiteurs.length, vrac, conditionne, ceMois };
  }, [visiteurs]);

  // =====================================================
  // RECHERCHE + FILTRE
  // Calculé pendant l'affichage (useMemo) : avant, un useEffect
  // recopiait la liste dans un second état, ce qui affichait la
  // page deux fois à chaque lettre tapée dans la recherche.
  // =====================================================

  const filteredVisiteurs = useMemo(() => {
    let result = visiteurs;

    const text = search.trim().toLowerCase();

    if (text !== "") {
      result = result.filter((item) =>
        [
          `${item.nom || ""} ${item.prenom || ""}`,
          `${item.prenom || ""} ${item.nom || ""}`,
          item.email,
          item.nom_entreprise,
          item.telephone,
        ].some((champ) => (champ || "").toLowerCase().includes(text))
      );
    }

    if (filterType !== "Tous") {
      result = result.filter((item) => memeType(item, filterType));
    }

    return result;
  }, [search, filterType, visiteurs]);

  // =====================================================
  // AFFICHAGE D'UN VISITEUR
  // =====================================================

  function renderCarte({ item }) {
    return (
      <View style={styles.carte}>
        <View style={styles.carteHaut}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexte}>{initiales(item)}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.carteNom} numberOfLines={1}>
              {nomComplet(item)}
            </Text>
            <Text style={styles.texteDoux} numberOfLines={1}>
              {item.nom_entreprise || item.email || "-"}
            </Text>
          </View>

          <BoutonSupprimer
            enCours={suppressionId === item.id}
            desactive={suppressionId !== null}
            onPress={() => demanderSuppression(item)}
          />
        </View>

        <View style={styles.carteInfos}>
          {!!item.email && <Info icone="mail-outline" texte={item.email} />}
          {!!item.telephone && (
            <Info icone="call-outline" texte={item.telephone} />
          )}
          <Info
            icone="calendar-outline"
            texte={formatDate(item.created_at || item.date_creation)}
          />
        </View>

        <View style={styles.carteBas}>
          <BadgeType type={item.type_commande} />
        </View>
      </View>
    );
  }

  function renderLigne({ item, index }) {
    return (
      <View style={[styles.ligne, index % 2 === 1 && styles.ligneAlternee]}>
        <View style={[styles.colNom, styles.celluleNom]}>
          <View style={styles.avatarPetit}>
            <Text style={styles.avatarPetitTexte}>{initiales(item)}</Text>
          </View>
          <Text style={styles.cellule} numberOfLines={1}>
            {nomComplet(item)}
          </Text>
        </View>
        <Text style={[styles.cellule, styles.colEmail]} numberOfLines={1}>
          {item.email || "-"}
        </Text>
        <Text style={[styles.cellule, styles.colEntreprise]} numberOfLines={1}>
          {item.nom_entreprise || "-"}
        </Text>
        <Text style={[styles.cellule, styles.colTel]} numberOfLines={1}>
          {item.telephone || "-"}
        </Text>
        <View style={styles.colType}>
          <BadgeType type={item.type_commande} />
        </View>
        <Text style={[styles.cellule, styles.colDate]}>
          {formatDate(item.created_at || item.date_creation)}
        </Text>
        <View style={styles.colAction}>
          <BoutonSupprimer
            enCours={suppressionId === item.id}
            desactive={suppressionId !== null}
            onPress={() => demanderSuppression(item)}
          />
        </View>
      </View>
    );
  }

  // =====================================================
  // HAUT DE LISTE : statistiques, recherche, filtres
  // (élément JSX et non composant : la recherche garde le
  // focus pendant la saisie)
  // =====================================================

  const hautDeListe = (
    <View>
      <View style={styles.stats}>
        <Statistique icone="people-outline" valeur={stats.total} label="Visiteurs" />
        <Statistique icone="calendar-outline" valeur={stats.ceMois} label="Ce mois-ci" />
        <Statistique icone="water-outline" valeur={stats.vrac} label="Vrac" />
        <Statistique icone="cube-outline" valeur={stats.conditionne} label="Conditionné" />
      </View>

      <View style={styles.filtres}>
        <View style={styles.recherche}>
          <Ionicons name="search-outline" size={20} color={Couleurs.texteDoux} />

          <TextInput
            style={styles.rechercheInput}
            placeholder="Nom, email, société, téléphone…"
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
            const actif = filterType === f.valeur;

            return (
              <Pressable
                key={f.valeur}
                onPress={() => setFilterType(f.valeur)}
                accessibilityRole="button"
                accessibilityState={{ selected: actif }}
                style={[styles.puce, actif && styles.puceActive]}
              >
                <Text style={[styles.puceTexte, actif && styles.puceTexteActif]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.compteur}>
        {filteredVisiteurs.length} visiteur
        {filteredVisiteurs.length > 1 ? "s" : ""}
        {filteredVisiteurs.length !== visiteurs.length
          ? ` sur ${visiteurs.length}`
          : ""}
      </Text>

      {enTableau && filteredVisiteurs.length > 0 && (
        <View style={[styles.ligne, styles.enteteTableau]}>
          <Text style={[styles.enteteCellule, styles.colNom]}>Nom et prénom</Text>
          <Text style={[styles.enteteCellule, styles.colEmail]}>Email</Text>
          <Text style={[styles.enteteCellule, styles.colEntreprise]}>Entreprise</Text>
          <Text style={[styles.enteteCellule, styles.colTel]}>Téléphone</Text>
          <Text style={[styles.enteteCellule, styles.colType]}>Type</Text>
          <Text style={[styles.enteteCellule, styles.colDate]}>Date</Text>
          <View style={styles.colAction} />
        </View>
      )}
    </View>
  );

  const listeVide = (
    <View style={styles.vide}>
      <Ionicons name="people-outline" size={46} color={Couleurs.bordure} />
      <Text style={styles.videTitre}>Aucun visiteur trouvé</Text>
      <Text style={[styles.texteDoux, { textAlign: "center" }]}>
        {visiteurs.length
          ? "Aucun visiteur ne correspond à votre recherche."
          : "Les visiteurs enregistrés par les commerciaux apparaîtront ici."}
      </Text>
    </View>
  );

  // =====================================================
  // INTERFACE
  // =====================================================

  return (
    <View style={styles.page}>
      <EnteteAdmin titre="Visiteurs" sousTitre="Gestion et suivi des visiteurs">
        <BoutonIcone
          icone="refresh-outline"
          label="Actualiser"
          disabled={loading || actualisation}
          onPress={() => loadVisiteurs(true)}
        />
      </EnteteAdmin>

      {loading ? (
        <View style={styles.chargement}>
          <ActivityIndicator size="large" color={Couleurs.olive} />
          <Text style={styles.texteDoux}>Chargement des visiteurs…</Text>
        </View>
      ) : (
        <FlatList
          key={enTableau ? "tableau" : "cartes"}
          data={filteredVisiteurs}
          keyExtractor={(item, index) => String(item.id ?? index)}
          renderItem={enTableau ? renderLigne : renderCarte}
          extraData={suppressionId}
          ListHeaderComponent={hautDeListe}
          ListEmptyComponent={listeVide}
          contentContainerStyle={styles.contenu}
          keyboardShouldPersistTaps="handled"
          refreshing={actualisation}
          onRefresh={() => loadVisiteurs(true)}
          initialNumToRender={15}
          windowSize={7}
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
    maxWidth: 1200,
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
  compteur: {
    fontSize: 13,
    color: Couleurs.texteDoux,
    marginBottom: 8,
    marginLeft: 2,
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Couleurs.oliveClair,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTexte: {
    color: Couleurs.oliveFonce,
    fontWeight: "700",
    fontSize: 15,
  },
  carteNom: {
    fontSize: 16,
    fontWeight: "700",
    color: Couleurs.texte,
  },
  carteInfos: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Couleurs.bordure,
    gap: 6,
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoTexte: {
    flex: 1,
    fontSize: 14,
    color: Couleurs.texte,
  },
  carteBas: {
    marginTop: 10,
    flexDirection: "row",
  },
  boutonSupprimer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Couleurs.dangerClair,
    alignItems: "center",
    justifyContent: "center",
  },

  // TABLEAU (ordinateur / tablette)
  ligne: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
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
  colNom: { flex: 1.5 },
  colEmail: { flex: 1.7 },
  colEntreprise: { flex: 1.3 },
  colTel: { flex: 1.1 },
  colType: { flex: 0.9 },
  colDate: { flex: 0.8 },
  colAction: { width: 44, alignItems: "center" },

  // BADGES
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgeVrac: {
    backgroundColor: Couleurs.succesClair,
  },
  badgeCond: {
    backgroundColor: Couleurs.orangeClair,
  },
  badgeTexte: {
    fontSize: 12,
    fontWeight: "600",
  },

  // VIDE
  vide: {
    alignItems: "center",
    gap: 8,
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
