import React, { useEffect, useMemo, useState } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert as AlertNatif,
  Platform,
  ActivityIndicator,
  FlatList,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch } from "../../services/api";
import { Couleurs } from "../../constants/couleurs";
import EnteteAdmin, { BoutonIcone } from "../../components/entete-admin";

// Alert.alert n'affiche rien sur le web : on utilise window.alert
const Alert = {
  alert: (titre, message, boutons) =>
    Platform.OS === "web"
      ? window.alert(`${titre}\n\n${message}`)
      : AlertNatif.alert(titre, message, boutons),
};

// =====================================================
// FORMATAGE
// =====================================================

const fmt = (v, dec = 2) =>
  v === null || v === undefined || v === "" || !Number.isFinite(Number(v))
    ? "–"
    : Number(v).toFixed(dec).replace(".", ",");

const fmtPct = (v, dec = 1) =>
  v === null || v === undefined || !Number.isFinite(Number(v))
    ? "–"
    : `${(Number(v) * 100).toFixed(dec).replace(".", ",")} %`;

// =====================================================
// COLONNES DU TABLEAU MOTEUR (mêmes colonnes que l'Excel)
// =====================================================

const COLONNES = [
  { key: "produit", label: "Produit", width: 70, type: "text" },
  { key: "contenant", label: "Contenant", width: 190, type: "text" },
  { key: "famille", label: "Famille", width: 95, type: "text" },
  { key: "kg_net_unite", label: "kg net / unité", dec: 3 },
  { key: "cout_huile_avant_stockage", label: "Coût huile avant stockage" },
  { key: "apres_freinte_stockage", label: "Après freinte stockage" },
  { key: "perte_manut_cond", label: "Perte manut./cond.", type: "pct" },
  { key: "huile_apres_pertes", label: "Huile après pertes" },
  { key: "stockage", label: "Stockage", dec: 3 },
  { key: "qualite_labo", label: "Qualité / labo", dec: 3 },
  { key: "frais_financiers", label: "Frais financiers", dec: 3 },
  { key: "emballage_unite", label: "Emballage TND/unité" },
  { key: "emballage_kg", label: "Emballage TND/kg", dec: 3 },
  { key: "frais_generaux", label: "Frais généraux", dec: 3 },
  { key: "cout_revient_exw", label: "COÛT DE REVIENT EXW", bold: true },
  { key: "marge_appliquee", label: "Marge appliquée", type: "pct" },
  { key: "commission", label: "Commission", type: "pct" },
  { key: "prix_exw_catalogue", label: "PRIX EXW catalogue", bold: true },
  { key: "unites_fcl", label: "Unités / FCL", dec: 0 },
  { key: "kg_net_fcl", label: "kg net / FCL", dec: 0 },
  { key: "frais_fob_kg", label: "Frais FOB TND/kg", dec: 3 },
  { key: "fret_maritime_kg", label: "Fret maritime TND/kg", dec: 3 },
  { key: "transport_local_kg", label: "Transport local TND/kg", dec: 3 },
  { key: "coef_assurance", label: "Coef. assurance", type: "pct", dec: 2 },
  { key: "prix_final_tnd_kg", label: "PRIX FINAL TND/kg", bold: true },
  { key: "prix_final_devise_kg", label: "PRIX FINAL devise/kg", bold: true, devise: true },
  { key: "prix_unite_devise", label: "Prix par unité (devise)", devise: true },
  { key: "prix_litre_devise", label: "Prix par litre (devise)", devise: true },
  { key: "marge_brute_kg", label: "Marge brute TND/kg", dec: 3 },
  { key: "marge_pct", label: "Marge % prix EXW net", type: "pct" },
  { key: "autorise", label: "Autorisé", type: "oui-non", width: 80 },
];

const LARGEUR_DEFAUT = 110;

// =====================================================
// CHAMPS MODIFIABLES
// =====================================================

const CHAMPS_PRODUITS = [
  { key: "prix_achat_impose", label: "Prix d'achat imposé (TND/kg) – optionnel", optionnel: true },
  { key: "matiere_saisie", label: "Matière première (TND/kg)", seulement: "saisie" },
  { key: "freinte_transfo", label: "Freinte de transformation", pct: true },
  { key: "cout_transfo", label: "Coût de transformation / raffinage (TND/kg)" },
  { key: "part_coupage", label: "Part de coupage huile vierge", pct: true },
  { key: "duree_stockage", label: "Durée moyenne de stockage (mois)" },
  { key: "freinte_stockage", label: "Freinte de stockage", pct: true },
  { key: "marge_vrac_local", label: "Marge cible vrac LOCAL", pct: true },
  { key: "marge_vrac_export", label: "Marge cible vrac EXPORT", pct: true },
  { key: "marge_cond_local", label: "Marge cible conditionné LOCAL", pct: true },
  { key: "marge_cond_export", label: "Marge cible conditionné EXPORT", pct: true },
];

const CHAMPS_CONTENANTS = [
  { key: "volume_l", label: "Volume utile (L)" },
  { key: "contenant_bouchon", label: "Contenant + bouchon (TND/unité)" },
  { key: "etiquettes", label: "Étiquettes & accessoires (TND/unité)" },
  { key: "unites_carton", label: "Unités par carton" },
  { key: "cout_carton", label: "Coût carton (TND)" },
  { key: "mise_cond", label: "Mise en conditionnement MO/énergie (TND/unité)" },
  { key: "unites_palette", label: "Unités par palette" },
  { key: "cout_palette", label: "Coût palette + film (TND/palette)" },
  { key: "palettes_fcl20", label: "Palettes par FCL 20 pieds" },
  { key: "facteur_40_20", label: "Facteur capacité 40/20" },
];

const CHAMPS_CALCULATEUR = [
  { key: "prix_olives", label: "Prix d'achat des olives (TND/kg d'olives)" },
  { key: "rendement", label: "Rendement en huile", pct: true },
  { key: "trituration", label: "Coût de trituration (TND/kg d'olives)" },
  { key: "credit_sous_produits", label: "Crédit grignons & margines (TND/kg d'olives)" },
];

const CHAMPS_DESTINATIONS = [
  { key: "fret20", label: "Fret 20 pieds (USD)" },
  { key: "fret40", label: "Fret 40 pieds (USD)" },
  { key: "transit", label: "Transit (jours)" },
];

const ONGLETS = [
  "Simulateur",
  "Tableau",
  "Scénario",
  "Paramètres",
  "Produits",
  "Calculateur",
  "Contenants",
  "Destinations",
];

const estPctParametre = (p) => String(p.unite || "").trim().startsWith("%");

// =====================================================
// CHAMP NUMÉRIQUE (affiche les % × 100)
// =====================================================

function ChampNombre({ label, valeur, pct, optionnel, onChange }) {
  const versTexte = (v) =>
    v === null || v === undefined || v === ""
      ? ""
      : String(pct ? +(Number(v) * 100).toFixed(6) : v).replace(".", ",");

  // Champ vide = null (optionnel) ou 0
  const normaliser = (v) =>
    v === null || v === undefined || v === ""
      ? (optionnel ? null : 0)
      : Number(v);

  // Valeur représentée par un texte saisi (undefined si invalide)
  const valeurDuTexte = (t) => {
    const propre = t.replace(",", ".").trim();
    if (propre === "") return normaliser(null);
    const x = Number(propre);
    return Number.isFinite(x) ? (pct ? x / 100 : x) : undefined;
  };

  const [texte, setTexte] = useState(versTexte(valeur));

  // Resynchroniser seulement si la valeur change de l'extérieur
  // (Annuler, Enregistrer...), pas pendant la saisie ("1," reste "1,").
  useEffect(() => {
    const saisie = valeurDuTexte(texte);
    const attendue = normaliser(valeur);

    const identiques =
      saisie === attendue ||
      (saisie !== null && saisie !== undefined && attendue !== null &&
        Math.abs(saisie - attendue) < 1e-12);

    if (!identiques) {
      setTexte(versTexte(valeur));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valeur, pct]);

  function changer(t) {
    setTexte(t);

    const x = valeurDuTexte(t);

    if (x !== undefined) {
      onChange(x);
    }
  }

  return (
    <View style={styles.champ}>
      <Text style={styles.champLabel}>{label}</Text>

      <View style={styles.champLigne}>
        <TextInput
          style={styles.champInput}
          value={texte}
          onChangeText={changer}
          keyboardType="decimal-pad"
          placeholder={optionnel ? "vide = calcul automatique" : "0"}
        />
        {pct && <Text style={styles.champUnite}>%</Text>}
      </View>
    </View>
  );
}

function ChampChoix({ label, valeur, options, onChange }) {
  return (
    <View style={styles.champ}>
      <Text style={styles.champLabel}>{label}</Text>

      <View style={styles.pickerContainer}>
        <Picker selectedValue={valeur} onValueChange={onChange}>
          {options.map((o) => (
            <Picker.Item key={o} label={o} value={o} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

// =====================================================
// ÉCRAN
// =====================================================

export default function AdminMoteur() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [resultat, setResultat] = useState(null);
  const [brouillon, setBrouillon] = useState(null);
  const [modifie, setModifie] = useState(false);

  const [onglet, setOnglet] = useState("Simulateur");

  // Saisie de l'onglet Simulateur (cellules jaunes de l'Excel)
  const [simEntree, setSimEntree] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [simErreur, setSimErreur] = useState(null);
  const [filtreProduit, setFiltreProduit] = useState("Tous");
  const [filtreFamille, setFiltreFamille] = useState("Tous");

  function appliquer(data) {
    setResultat(data);

    setSimEntree((e) => e || {
      produit: data.donnees.produits[0]?.code,
      contenant: data.donnees.contenants[0]?.designation,
      marche: data.donnees.scenario.marche,
      incoterm: data.donnees.scenario.incoterm,
      destination: data.donnees.scenario.destination,
      taille: data.donnees.scenario.taille,
      devise: data.donnees.scenario.devise,
      marge_forcee: data.donnees.scenario.marge_forcee,
      quantite: 1,
      unite: "Conteneurs",
      remise: 0,
    });
    setBrouillon(JSON.parse(JSON.stringify(data.donnees)));
    setModifie(false);
  }

  async function charger() {
    try {
      setLoading(true);
      appliquer(await apiFetch("/api/admin/moteur"));
    } catch (error) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    charger();
  }, []);

  async function enregistrer() {
    try {
      setSaving(true);

      const data = await apiFetch("/api/admin/moteur", {
        method: "PUT",
        body: JSON.stringify({ donnees: brouillon }),
      });

      appliquer(data);
      Alert.alert("Succès", "Fiche MOTEUR enregistrée et recalculée.");
    } catch (error) {
      Alert.alert("Erreur", error.message);
    } finally {
      setSaving(false);
    }
  }

  function annuler() {
    setBrouillon(JSON.parse(JSON.stringify(resultat.donnees)));
    setModifie(false);
  }

  function reinitialiser() {
    const action = async () => {
      try {
        setSaving(true);
        appliquer(
          await apiFetch("/api/admin/moteur/reinitialiser", { method: "POST" })
        );
      } catch (error) {
        Alert.alert("Erreur", error.message);
      } finally {
        setSaving(false);
      }
    };

    const question =
      "Remettre toutes les valeurs du fichier Excel d'origine ? Vos modifications seront perdues.";

    // Alert.alert avec boutons ne fonctionne pas sur le web
    if (Platform.OS === "web") {
      if (window.confirm(question)) action();
      return;
    }

    Alert.alert(
      "Réinitialiser",
      question,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Réinitialiser", style: "destructive", onPress: action },
      ]
    );
  }

  // Recalcul du simulateur à chaque changement de saisie
  // (les modifications non enregistrées sont prises en compte)
  useEffect(() => {
    if (!simEntree || !brouillon) return;

    let actif = true;

    const minuterie = setTimeout(async () => {
      try {
        const data = await apiFetch("/api/admin/moteur/simuler", {
          method: "POST",
          body: JSON.stringify({
            entree: simEntree,
            donnees: modifie ? brouillon : undefined,
          }),
        });

        if (actif) {
          setSimulation(data);
          setSimErreur(null);
        }
      } catch (error) {
        if (actif) setSimErreur(error.message);
      }
    }, 300);

    return () => {
      actif = false;
      clearTimeout(minuterie);
    };
  }, [simEntree, brouillon, modifie]);

  function majSim(champ, valeur) {
    setSimEntree((e) => ({ ...e, [champ]: valeur }));
  }

  // Modification d'une valeur du brouillon
  function maj(section, index, champ, valeur) {
    setBrouillon((b) => {
      const copie = JSON.parse(JSON.stringify(b));

      if (index === null) {
        copie[section][champ] = valeur;
      } else {
        copie[section][index][champ] = valeur;
      }

      return copie;
    });

    setModifie(true);
  }

  const lignes = useMemo(() => {
    if (!resultat) return [];

    return resultat.lignes.filter(
      (l) =>
        (filtreProduit === "Tous" || l.produit === filtreProduit) &&
        (filtreFamille === "Tous" || l.famille === filtreFamille)
    );
  }, [resultat, filtreProduit, filtreFamille]);

  if (loading || !brouillon) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const devise = resultat.scenario?.devise || "";

  // =====================================================
  // RENDUS PAR ONGLET
  // =====================================================

  function renderValeur(col, ligne) {
    const v = ligne[col.key];
    if (col.type === "text") return v;
    if (col.type === "pct") return fmtPct(v, col.dec ?? 1);
    if (col.type === "oui-non") return v ? "Oui" : "Non";
    return fmt(v, col.dec ?? 2);
  }

  function renderTableau() {
    const produits = ["Tous", ...brouillon.produits.map((p) => p.code)];

    return (
      <View style={{ flex: 1 }}>
        <Text style={styles.info}>
          Scénario : {resultat.scenario.marche} · {resultat.scenario.incoterm}
          {["CFR", "CIF"].includes(resultat.scenario.incoterm)
            ? ` · ${resultat.scenario.destination}`
            : ""}
          {" "}· {resultat.scenario.taille} · {devise}
          {resultat.scenario.marge_forcee !== null
            ? ` · marge forcée ${fmtPct(resultat.scenario.marge_forcee)}`
            : ""}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {produits.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.chip, filtreProduit === p && styles.chipActif]}
              onPress={() => setFiltreProduit(p)}
            >
              <Text style={[styles.chipText, filtreProduit === p && styles.chipTextActif]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {["Tous", "Vrac", "Conditionné"].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, filtreFamille === f && styles.chipActif]}
              onPress={() => setFiltreFamille(f)}
            >
              <Text style={[styles.chipText, filtreFamille === f && styles.chipTextActif]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.compteur}>
          {lignes.length} ligne(s) · valeurs en TND/kg net sauf mention
        </Text>

        <ScrollView horizontal style={{ flex: 1 }}>
          <View>
            <View style={[styles.row, styles.headerRow]}>
              {COLONNES.map((c) => (
                <Text
                  key={c.key}
                  style={[styles.cell, styles.headerCell, { width: c.width || LARGEUR_DEFAUT }]}
                >
                  {c.devise ? c.label.replace("devise", devise) : c.label}
                </Text>
              ))}
            </View>

            <FlatList
              data={lignes}
              keyExtractor={(l) => l.cle}
              initialNumToRender={20}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.row,
                    index % 2 === 1 && styles.rowAlt,
                    !item.autorise && styles.rowInterdite,
                  ]}
                >
                  {COLONNES.map((c) => (
                    <Text
                      key={c.key}
                      style={[
                        styles.cell,
                        { width: c.width || LARGEUR_DEFAUT },
                        c.type !== "text" && styles.cellNum,
                        c.bold && styles.cellBold,
                      ]}
                      numberOfLines={2}
                    >
                      {renderValeur(c, item)}
                    </Text>
                  ))}
                </View>
              )}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  function renderSimulateur() {
    const e = simEntree;
    const sim = simulation;
    const r = sim?.resultats;
    const dv = sim?.scenario?.devise || e.devise;
    const ok = sim?.controle?.startsWith("✔");
    const na = (v, dec) => (v === null ? "n/a" : fmt(v, dec));

    const ligneRes = (label, valeur, unite, fort) => (
      <View style={styles.resLigne} key={label}>
        <Text style={[styles.resLabel, fort && styles.cellBold]}>{label}</Text>
        <Text style={[styles.resValeur, fort && styles.cellBold]}>{valeur}</Text>
        <Text style={styles.resUnite}>{unite}</Text>
      </View>
    );

    // Tableau horizontal : titres + lignes de valeurs
    const tableau = (titres, lignes, largeurs) => (
      <ScrollView horizontal>
        <View>
          <View style={[styles.row, styles.headerRow]}>
            {titres.map((t, i) => (
              <Text key={t} style={[styles.cell, styles.headerCell, { width: largeurs[i] }]}>
                {t}
              </Text>
            ))}
          </View>

          {lignes.map((l, i) => (
            <View key={l.cle} style={[styles.row, i % 2 === 1 && styles.rowAlt, l.fort && styles.rowTotal]}>
              {l.valeurs.map((v, j) => (
                <Text
                  key={j}
                  style={[
                    styles.cell,
                    { width: largeurs[j] },
                    j > 0 && styles.cellNum,
                    (l.fort || j === 0) && styles.cellBold,
                  ]}
                >
                  {v}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    );

    return (
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.aide}>
          Choisissez le produit et le contenant : le simulateur lit la ligne
          correspondante de la fiche MOTEUR et applique quantité, remise et incoterm.
        </Text>

        <Text style={styles.section}>1. SCÉNARIO</Text>

        <ChampChoix label="Produit" valeur={e.produit}
          options={brouillon.produits.map((p) => p.code)}
          onChange={(v) => majSim("produit", v)} />

        {!!sim?.designation_produit && (
          <Text style={styles.note}>{sim.designation_produit}</Text>
        )}

        <ChampChoix label="Contenant" valeur={e.contenant}
          options={brouillon.contenants.map((c) => c.designation)}
          onChange={(v) => majSim("contenant", v)} />

        {!!sim?.famille && <Text style={styles.note}>Famille : {sim.famille}</Text>}

        <ChampChoix label="Marché" valeur={e.marche} options={["Local", "Export"]}
          onChange={(v) => majSim("marche", v)} />

        <ChampChoix label="Incoterm" valeur={e.incoterm}
          options={["EXW", "FOB", "CFR", "CIF", "Livré local"]}
          onChange={(v) => majSim("incoterm", v)} />

        <ChampChoix label="Destination (port) – si CFR / CIF" valeur={e.destination}
          options={brouillon.destinations.map((d) => d.port)}
          onChange={(v) => majSim("destination", v)} />

        <ChampChoix label="Conteneur maritime" valeur={e.taille}
          options={["20 pieds", "40 pieds"]}
          onChange={(v) => majSim("taille", v)} />

        <ChampChoix label="Devise d'affichage" valeur={e.devise}
          options={["TND", "EUR", "USD"]}
          onChange={(v) => majSim("devise", v)} />

        <ChampNombre label="Quantité" valeur={e.quantite}
          onChange={(v) => majSim("quantite", v)} />

        <ChampChoix label="Unité de quantité" valeur={e.unite}
          options={["Tonnes", "Unités", "Conteneurs"]}
          onChange={(v) => majSim("unite", v)} />

        <ChampNombre label="Marge forcée – vide = marge cible du produit"
          valeur={e.marge_forcee} pct optionnel
          onChange={(v) => majSim("marge_forcee", v)} />

        {!!r && (
          <Text style={styles.note}>Marge appliquée : {fmtPct(r.marge_appliquee)}</Text>
        )}

        <ChampNombre label="Remise commerciale sur le prix EXW" valeur={e.remise} pct
          onChange={(v) => majSim("remise", v)} />

        {!!sim?.controle && (
          <Text style={[styles.controle, ok ? styles.controleOk : styles.controleKo]}>
            {sim.controle}
          </Text>
        )}

        {!!simErreur && <Text style={styles.alerte}>{simErreur}</Text>}

        {!!r && (
          <>
            <Text style={styles.section}>2. RÉSULTATS CLÉS</Text>

            <View style={styles.carte}>
              {ligneRes("Coût de revient départ usine", fmt(r.cout_revient_tnd_kg, 3), "TND/kg")}
              {ligneRes("Prix catalogue / kg (avant remise)", fmt(r.prix_catalogue_kg, 3), dv)}
              {ligneRes("PRIX NET / kg", fmt(r.prix_net_kg, 3), dv, true)}
              {ligneRes("PRIX NET PAR UNITÉ", fmt(r.prix_net_unite, 2), dv, true)}
              {ligneRes("Prix net par litre", fmt(r.prix_net_litre, 3), dv)}
              {ligneRes("Prix net par tonne", fmt(r.prix_net_tonne, 0), dv)}
              {ligneRes("Quantité totale", fmt(r.quantite_kg, 0), "kg")}
              {ligneRes("Nombre d'unités", fmt(r.unites, 0), "unités")}
              {ligneRes("Conteneurs (capacité FCL) nécessaires", fmt(r.conteneurs, 0), "FCL")}
              {ligneRes("Taux de remplissage", fmtPct(r.remplissage, 0), "")}
              {ligneRes("MONTANT TOTAL DE L'OFFRE", fmt(r.montant_total, 0), dv, true)}
              {ligneRes("Marge brute totale, après commission", fmt(r.marge_brute_totale_tnd, 0), "TND")}
              {ligneRes("Marge réalisée sur coût (markup)", fmtPct(r.marge_sur_cout), "")}
              {ligneRes("Marge réalisée sur prix de vente", fmtPct(r.marge_sur_prix), "")}
            </View>

            <Text style={styles.section}>3. DÉCOMPOSITION DU COÛT ET DU PRIX</Text>

            {tableau(
              ["Composante", "TND / kg", "% du prix final", `${dv} / kg`, `Par unité (${dv})`, `Total (${dv})`],
              sim.composantes.map((c) => ({
                cle: c.cle,
                fort: c.total,
                valeurs: [
                  c.libelle,
                  fmt(c.tnd_kg, 3),
                  fmtPct(c.pct_prix_final),
                  fmt(c.devise_kg, 3),
                  fmt(c.devise_unite, 2),
                  fmt(c.devise_total, 0),
                ],
              })),
              [260, 100, 100, 100, 100, 100]
            )}

            <Text style={styles.section}>4. COMPARATIF DES INCOTERMS (prix net de remise)</Text>

            {tableau(
              ["Incoterm", "TND / kg", `${dv} / kg`, `Par unité (${dv})`, `Par tonne (${dv})`, `Total offre (${dv})`],
              sim.comparatif.map((c) => ({
                cle: c.incoterm,
                fort: c.incoterm === sim.scenario.incoterm,
                valeurs: [
                  c.incoterm,
                  na(c.tnd_kg, 3),
                  na(c.devise_kg, 3),
                  na(c.devise_unite, 2),
                  na(c.devise_tonne, 0),
                  na(c.devise_total, 0),
                ],
              })),
              [100, 100, 100, 100, 100, 110]
            )}

            <Text style={styles.section}>5. SENSIBILITÉ À LA MARGE</Text>

            {tableau(
              ["Marge testée", `Prix net / kg (${dv})`, `Par unité (${dv})`, `Par tonne (${dv})`, `Montant total (${dv})`, "Marge brute totale (TND)"],
              sim.sensibilite.map((s) => ({
                cle: String(s.marge),
                valeurs: [
                  fmtPct(s.marge, 0),
                  fmt(s.devise_kg, 3),
                  fmt(s.devise_unite, 2),
                  fmt(s.devise_tonne, 0),
                  fmt(s.devise_total, 0),
                  fmt(s.marge_brute_tnd, 0),
                ],
              })),
              [100, 110, 110, 110, 120, 130]
            )}

            <Text style={[styles.note, { marginTop: 6 }]}>
              Marge 0 % = seuil de rentabilité.
            </Text>
          </>
        )}
      </ScrollView>
    );
  }

  function renderScenario() {
    const s = brouillon.scenario;

    return (
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.aide}>
          Ces choix déterminent les frais FOB, le fret, l'assurance, la marge et la devise de tout le tableau.
        </Text>

        <ChampChoix label="Marché" valeur={s.marche} options={["Local", "Export"]}
          onChange={(v) => maj("scenario", null, "marche", v)} />

        <ChampChoix label="Incoterm" valeur={s.incoterm}
          options={["EXW", "FOB", "CFR", "CIF", "Livré local"]}
          onChange={(v) => maj("scenario", null, "incoterm", v)} />

        <ChampChoix label="Destination (port) – si CFR / CIF" valeur={s.destination}
          options={brouillon.destinations.map((d) => d.port)}
          onChange={(v) => maj("scenario", null, "destination", v)} />

        <ChampChoix label="Conteneur maritime" valeur={s.taille}
          options={["20 pieds", "40 pieds"]}
          onChange={(v) => maj("scenario", null, "taille", v)} />

        <ChampChoix label="Devise d'affichage" valeur={s.devise}
          options={["TND", "EUR", "USD"]}
          onChange={(v) => maj("scenario", null, "devise", v)} />

        <ChampNombre label="Marge forcée – vide = marge cible du produit"
          valeur={s.marge_forcee} pct optionnel
          onChange={(v) => maj("scenario", null, "marge_forcee", v)} />

        {s.marche === "Local" && ["FOB", "CFR", "CIF"].includes(s.incoterm) && (
          <Text style={styles.alerte}>
            ⚠ Incoterm export incompatible avec le marché Local (choisir EXW ou Livré local)
          </Text>
        )}

        {s.marche === "Export" && s.incoterm === "Livré local" && (
          <Text style={styles.alerte}>
            ⚠ « Livré local » incompatible avec Export (choisir EXW, FOB, CFR ou CIF)
          </Text>
        )}
      </ScrollView>
    );
  }

  function renderParametres() {
    let section = null;

    return (
      <ScrollView contentContainerStyle={styles.form}>
        {brouillon.parametres.map((p, i) => {
          const titre = p.section !== section ? p.section : null;
          section = p.section;

          return (
            <View key={p.cle}>
              {titre && <Text style={styles.section}>{titre}</Text>}

              {p.cle === "ModeMarge" ? (
                <ChampChoix label={p.libelle} valeur={p.valeur}
                  options={["Marge sur coût (markup)", "Marge sur prix de vente"]}
                  onChange={(v) => maj("parametres", i, "valeur", v)} />
              ) : (
                <ChampNombre
                  label={`${p.libelle}${p.unite && !estPctParametre(p) ? ` (${p.unite})` : ""}`}
                  valeur={p.valeur}
                  pct={estPctParametre(p)}
                  onChange={(v) => maj("parametres", i, "valeur", v)}
                />
              )}

              {!!p.note && <Text style={styles.note}>{p.note}</Text>}
            </View>
          );
        })}
      </ScrollView>
    );
  }

  function renderProduits() {
    return (
      <ScrollView contentContainerStyle={styles.form}>
        {brouillon.produits.map((p, i) => {
          const calc = resultat.calculs.produits[p.code] || {};

          return (
            <View key={p.code} style={styles.carte}>
              <Text style={styles.carteTitre}>{p.code} – {p.designation_fr}</Text>
              <Text style={styles.note}>{p.definition}</Text>

              <Text style={styles.calcule}>
                Matière première : {fmt(calc.matiere_base, 3)} TND/kg
                {"  ·  "}Coût huile vrac avant stockage : {fmt(calc.cout_vrac, 3)} TND/kg
              </Text>

              {CHAMPS_PRODUITS.filter(
                (c) => !c.seulement || c.seulement === p.source_matiere
              ).map((c) => (
                <ChampNombre key={c.key} label={c.label} valeur={p[c.key]}
                  pct={c.pct} optionnel={c.optionnel}
                  onChange={(v) => maj("produits", i, c.key, v)} />
              ))}

              <ChampChoix label="Vente conditionnée autorisée" valeur={p.vente_cond_autorisee}
                options={["Oui", "Non"]}
                onChange={(v) => maj("produits", i, "vente_cond_autorisee", v)} />
            </View>
          );
        })}
      </ScrollView>
    );
  }

  function renderCalculateur() {
    return (
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.aide}>
          Coût de revient de l'huile en production propre = (prix olives + trituration – crédit) ÷ rendement.
          EVOO et VOO utilisent leur colonne ; OO et ROO utilisent « Lampante ».
        </Text>

        {brouillon.calculateur.map((c, i) => (
          <View key={c.cle} style={styles.carte}>
            <Text style={styles.carteTitre}>{c.libelle}</Text>

            <Text style={styles.calcule}>
              Coût de revient de l'huile : {fmt(resultat.calculs.calculateur[c.cle], 3)} TND/kg
            </Text>

            {CHAMPS_CALCULATEUR.map((ch) => (
              <ChampNombre key={ch.key} label={ch.label} valeur={c[ch.key]} pct={ch.pct}
                onChange={(v) => maj("calculateur", i, ch.key, v)} />
            ))}
          </View>
        ))}
      </ScrollView>
    );
  }

  function renderContenants() {
    return (
      <ScrollView contentContainerStyle={styles.form}>
        {brouillon.contenants.map((c, i) => {
          const calc = resultat.calculs.contenants.find((x) => x.code === c.code) || {};

          return (
            <View key={c.code} style={styles.carte}>
              <Text style={styles.carteTitre}>{c.designation}</Text>
              <Text style={styles.note}>{c.code} · {c.famille}</Text>

              <Text style={styles.calcule}>
                Coût total emballage : {fmt(calc.cout_total_unite, 3)} TND/unité
                {"  ·  "}{fmt(calc.emballage_kg, 3)} TND/kg net
                {"  ·  "}{fmt(calc.unites_fcl20, 0)} unités / FCL 20'
              </Text>

              {CHAMPS_CONTENANTS.map((ch) => (
                <ChampNombre key={ch.key} label={ch.label} valeur={c[ch.key]}
                  onChange={(v) => maj("contenants", i, ch.key, v)} />
              ))}
            </View>
          );
        })}
      </ScrollView>
    );
  }

  function renderDestinations() {
    return (
      <ScrollView contentContainerStyle={styles.form}>
        {brouillon.destinations.map((d, i) => (
          <View key={d.port} style={styles.carte}>
            <Text style={styles.carteTitre}>{d.port}</Text>
            <Text style={styles.note}>{d.pays}</Text>

            {CHAMPS_DESTINATIONS.map((ch) => (
              <ChampNombre key={ch.key} label={ch.label} valeur={d[ch.key]}
                onChange={(v) => maj("destinations", i, ch.key, v)} />
            ))}
          </View>
        ))}
      </ScrollView>
    );
  }

  const contenu = {
    Simulateur: renderSimulateur,
    Tableau: renderTableau,
    "Scénario": renderScenario,
    "Paramètres": renderParametres,
    Produits: renderProduits,
    Calculateur: renderCalculateur,
    Contenants: renderContenants,
    Destinations: renderDestinations,
  }[onglet];

  return (
    <View style={styles.container}>

      {/* EN-TÊTE */}

      <EnteteAdmin
        titre="Fiche MOTEUR"
        sousTitre={
          resultat.updated_at
            ? `Modifiée le ${new Date(resultat.updated_at).toLocaleString("fr-FR")}`
            : "Valeurs du fichier Excel d'origine"
        }
      >
        <BoutonIcone
          icone="refresh"
          label="Réinitialiser les valeurs d'origine"
          couleur={Couleurs.danger}
          disabled={saving}
          onPress={reinitialiser}
        />
      </EnteteAdmin>

      {/* ONGLETS */}

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.onglets}>
          {ONGLETS.map((o) => (
            <TouchableOpacity
              key={o}
              style={[styles.onglet, onglet === o && styles.ongletActif]}
              onPress={() => setOnglet(o)}
            >
              <Text style={[styles.ongletText, onglet === o && styles.ongletTextActif]}>
                {o}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>{contenu()}</View>

      {/* BARRE D'ENREGISTREMENT */}

      {modifie && (
        <View style={styles.barre}>
          <Text style={styles.barreText}>Modifications non enregistrées</Text>

          <TouchableOpacity style={styles.btnSecondaire} onPress={annuler} disabled={saving}>
            <Text style={styles.btnSecondaireText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnPrincipal} onPress={enregistrer} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnPrincipalText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Couleurs.fond },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 40,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  title: { fontSize: 22, fontWeight: "bold" },
  sousTitre: { color: "#666", fontSize: 12, marginTop: 2 },

  onglets: { backgroundColor: Couleurs.carte, paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Couleurs.bordure },
  onglet: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginRight: 6, backgroundColor: Couleurs.fond, borderWidth: 1, borderColor: Couleurs.bordure },
  ongletActif: { backgroundColor: Couleurs.olive, borderColor: Couleurs.olive },
  ongletText: { color: Couleurs.texte, fontWeight: "600" },
  ongletTextActif: { color: "#fff" },

  info: { padding: 12, paddingBottom: 4, color: "#333", fontWeight: "600" },
  chips: { paddingHorizontal: 12, paddingVertical: 4, flexGrow: 0 },
  chip: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: "#999", marginRight: 6 },
  chipActif: { backgroundColor: Couleurs.olive, borderColor: Couleurs.olive },
  chipText: { color: "#333" },
  chipTextActif: { color: "#fff" },
  compteur: { paddingHorizontal: 12, paddingVertical: 6, color: "#666", fontSize: 12 },

  row: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  rowAlt: { backgroundColor: "#fafafa" },
  rowInterdite: { opacity: 0.45 },
  headerRow: { backgroundColor: Couleurs.oliveFonce },
  cell: { paddingVertical: 8, paddingHorizontal: 6, fontSize: 12, color: "#222" },
  headerCell: { color: "#fff", fontWeight: "bold", fontSize: 11 },
  cellNum: { textAlign: "right" },
  cellBold: { fontWeight: "bold" },

  form: { padding: 16, paddingBottom: 120 },
  aide: { color: "#555", marginBottom: 12 },
  section: { fontSize: 15, fontWeight: "bold", marginTop: 18, marginBottom: 8, color: Couleurs.olive },

  carte: { backgroundColor: Couleurs.carte, borderRadius: 14, borderWidth: 1, borderColor: Couleurs.bordure, padding: 14, marginBottom: 14 },
  carteTitre: { fontSize: 16, fontWeight: "bold" },
  calcule: { backgroundColor: "#eef3e6", padding: 8, borderRadius: 6, marginVertical: 8, color: "#333", fontSize: 12 },

  champ: { marginBottom: 10 },
  champLabel: { fontSize: 13, color: "#333", marginBottom: 4 },
  champLigne: { flexDirection: "row", alignItems: "center" },
  champInput: { flex: 1, backgroundColor: Couleurs.carte, borderWidth: 1, borderColor: Couleurs.bordure, borderRadius: 10, padding: 10, color: Couleurs.texte },
  champUnite: { marginLeft: 8, fontWeight: "bold" },
  pickerContainer: { backgroundColor: Couleurs.carte, borderWidth: 1, borderColor: Couleurs.bordure, borderRadius: 10, overflow: "hidden" },

  note: { fontSize: 11, color: "#777", marginTop: -4, marginBottom: 8 },
  alerte: { color: "#b00", marginTop: 8 },

  controle: { padding: 10, borderRadius: 8, marginTop: 8, fontWeight: "bold" },
  controleOk: { backgroundColor: "#e6f2e1", color: "#2f6b1f" },
  controleKo: { backgroundColor: "#fde4e1", color: "#b00" },

  resLigne: { flexDirection: "row", alignItems: "center", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  resLabel: { flex: 1, fontSize: 13, color: "#333" },
  resValeur: { fontSize: 13, color: "#222", textAlign: "right", minWidth: 90 },
  resUnite: { fontSize: 12, color: "#666", width: 60, marginLeft: 6 },
  rowTotal: { backgroundColor: "#eef3e6" },

  barre: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  barreText: { flex: 1, color: "#b06000", fontWeight: "600" },
  btnSecondaire: { paddingVertical: 10, paddingHorizontal: 14, marginRight: 8 },
  btnSecondaireText: { color: "#222" },
  btnPrincipal: { backgroundColor: Couleurs.olive, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20, minWidth: 110, alignItems: "center" },
  btnPrincipalText: { color: "#fff", fontWeight: "bold" },
});
