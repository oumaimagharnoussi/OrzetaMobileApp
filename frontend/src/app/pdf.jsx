import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
  Image,
  Linking,
} from "react-native";

import { FontAwesome, Ionicons } from "@expo/vector-icons";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import * as Print from "expo-print";
import { Asset } from "expo-asset";
import AsyncStorage from "@react-native-async-storage/async-storage";
// =====================================================
// CONFIGURATION
// =====================================================

//const API_URL = "http://192.168.1.146:5000";
const API_URL = "https://orzetamobileapp.onrender.com";

const ORANGE = "#5C681F";

// =====================================================
// PRIX ET PRODUITS SÉLECTIONNÉS DANS LE FORMULAIRE
// =====================================================


/**
 * nombre : nombre de conteneurs ou de palettes sélectionné
 */
const calculerQuantiteConditionnee = (
  unitesFCL20,
  mode,
  nombre
) => {
  const unites = Number(unitesFCL20);
  const quantite = Number(nombre);

  if (
    !Number.isFinite(unites) ||
    unites <= 0 ||
    !Number.isFinite(quantite) ||
    quantite <= 0
  ) {
    return null;
  }

  const type = String(mode || "")
    .trim()
    .toLowerCase();

  if (type.includes("fcl 20") || type.includes("20’")) {
    return unites * quantite;
  }

  if (type.includes("fcl 40") || type.includes("40’")) {
    return unites * 2 * quantite;
  }

  if (type.includes("palette")) {
    const unitesParPalette = unites / 10;
    return unitesParPalette * quantite;
  }

  return null;
};


// Prix conditionné : grille de la fiche MOTEUR (GET /api/moteur/prix),
// prix EXW en EUR par unité + unités par FCL 20 pieds, par contenant.
// Les commandes conditionnées sont chiffrées en EVOO.
const CONDITIONED_PRODUCT = "EVOO";

// Emballage + format du formulaire → nom du contenant dans la fiche MOTEUR
const CONDITIONED_CONTAINER_PREFIX = {
  PET: "PET",
  Tin: "Bidon métal",
  Glass: "Bouteille verre foncé",
  BaginBox: "Bag-in-Box",
};

const money = (n) => Number(n || 0).toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const moneyEUR = (n, decimals = 2) => `${Number(n || 0).toLocaleString("en-US", {
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals,
})} EUR`;

// Tarifs vrac : grille EXW en EUR / litre calculée par la fiche MOTEUR
// (GET /api/moteur/prix-vrac). Une modification de l'admin dans la
// fiche MOTEUR change donc directement les prix de l'offre.
// Forme : { EVOO: { "Flexitank 24 000 L": 3.621, ... }, VOO: {...}, ... }

// Catégorie du formulaire → code produit du moteur.
// Remarque : la catégorie « Lampante » correspond au produit CPOO.
const bulkProductCode = (categorie) => {
  const raw = normalizeBulkKey(categorie).toUpperCase();
  if (!raw) return null;
  if (/LAMPANTE/.test(raw)) return "CPOO";

  return ["EVOO", "VOO", "CPOO", "RPOO", "POO", "ROO", "OO"].find((code) =>
    raw === code || new RegExp(`\\b${code}\\b`).test(raw)
  ) || null;
};

const normalizeBulkKey = (value) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/\s+/g, " ")
  .trim();

const canonicalBulkFormat = (value) => {
  const key = normalizeBulkKey(value);
  if (!key) return "";

  // Le formulaire peut enregistrer un libellé court (ex. "Fûts")
  // alors que la grille tarifaire utilise le libellé complet.
  if (/\bflexi ?tank\b/.test(key)) return "Flexitank 24 000 L";
  if (/\biso ?tank\b/.test(key)) return "ISO-tank 24 000 L (rotation)";
  if (/citerne/.test(key)) return "Citerne routière 27 000 L (local)";
  if (/\bibc\b/.test(key)) return "IBC 1 000 L";
  if (/\bf[uû]ts?\b|\bfut(s)?\b|\btonneaux?\b|\bbarils?\b/.test(key)) return "Fût acier 200 L";

  // Tolérer les libellés complets avec espaces ou ponctuation variables.
  if (key.includes("flexitank")) return "Flexitank 24 000 L";
  if (key.includes("iso-tank") || key.includes("isotank")) return "ISO-tank 24 000 L (rotation)";
  if (key.includes("citerne")) return "Citerne routière 27 000 L (local)";
  if (key.includes("ibc")) return "IBC 1 000 L";
  return value;
};

const getBulkPriceEUR = (categorie, formatLivraison, bulkPrices) => {
  // Accepte aussi les libellés descriptifs, par exemple
  // "Extra Virgin Olive Oil – EVOO", et en extrait le code produit.
  const category = bulkProductCode(categorie);
  const canonicalFormat = canonicalBulkFormat(formatLivraison);
  const categoryPrices = bulkPrices?.[category];
  if (!categoryPrices || !canonicalFormat) return null;
  const wantedFormat = normalizeBulkKey(canonicalFormat);
  const match = Object.entries(categoryPrices).find(([format]) => normalizeBulkKey(format) === wantedFormat);
  return match ? match[1] : null;
};

const parseJSON = (value, fallback = null) => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return fallback; }
};

const normalizePackagingName = (name) => {
  const value = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  if (/tin|metal|bidon|bo[iî]te|can/.test(value)) return "Tin";
  if (/\bpet\b/.test(value)) return "PET";
  if (/glass|verre|dorica|marasca|bouteille/.test(value)) return "Glass";
  if (/bag.?in.?box|baginbox/.test(value)) return "BaginBox";
  return null;
};

const normalizeFormat = (value) => {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/,/g, ".")
    .replace(/\s+/g, " ");

  const ml = raw.match(/^(?:0\.)?(250|500|750)\s*(?:ml|l)$/);
  if (ml && (raw.includes("ml") || raw.startsWith("0."))) {
    return `${ml[1]} ml`;
  }

  const litres = raw.match(/^(1|2|3|5)\s*l$/);
  if (litres) return `${litres[1]} L`;

  return raw.replace(/\bml\b/g, "ml");
};
// Ligne de la fiche MOTEUR pour un emballage + format (ou null)
const getConditionedLine = (packaging, format, conditionedPrices) => {
  const kind = normalizePackagingName(packaging);
  const prefix = CONDITIONED_CONTAINER_PREFIX[kind];
  if (!prefix) return null;

  const container = `${prefix} ${normalizeFormatLabel(format)}`;
  return conditionedPrices?.[CONDITIONED_PRODUCT]?.[container] || null;
};

const getPriceEUR = (packaging, format, conditionedPrices) => {
  const price = Number(
    getConditionedLine(packaging, format, conditionedPrices)?.prix_unite
  );
  return Number.isFinite(price) ? price : null;
};

const isFormat = (value) => /^(250\s*ml|500\s*ml|750\s*ml|0[.,](250|500|750)\s*l|1\s*l|2\s*l|3\s*l|5\s*l)$/i.test(normalizeFormat(value));
const normalizeFormatLabel = (value) => {
  const raw = normalizeFormat(value).toLowerCase().replace(/,/g, ".");
  const ml = raw.match(/^(250|500|750)\s*ml$/);
  if (ml) return `${ml[1]} ml`;
  const decimal = raw.match(/^0\.(250|500|750)\s*l$/);
  if (decimal) return `${Number(decimal[1])} ml`;
  const liter = raw.match(/^(1|2|3|5)\s*l$/);
  if (liter) return `${liter[1]} L`;
  return normalizeFormat(value);
};

const collectFormats = (value, path = "", output = []) => {
  const parsed = parseJSON(value, value);
  if (Array.isArray(parsed)) {
    parsed.forEach((item) => collectFormats(item, path, output));
  } else if (parsed && typeof parsed === "object") {
    Object.entries(parsed).forEach(([key, item]) => {
      const nextPath = `${path} ${key}`;
      if (isFormat(key)) output.push({ format: normalizeFormatLabel(key), path: nextPath });
      collectFormats(item, nextPath, output);
    });
  } else if (typeof parsed === "string" && isFormat(parsed)) {
    output.push({ format: normalizeFormatLabel(parsed), path });
  }
  return output;
};

const FCL20_CAPACITY = {
  "Tin|3 L": 3360,
  "Tin|5 L": 2800,
  "PET|5 L": 2520,
  "Glass|1 L": 7920,
  "Glass|750 ml": 11520,
  "Glass|500 ml": 15840,
  "Glass|250 ml": 21600,
};

const BULK_FORMAT_CAPACITY_LITRES = {
  "Flexitank 24 000 L": 24000,
  "ISO-tank 24 000 L (rotation)": 24000,
  "Citerne routière 27 000 L (local)": 27000,
  "IBC 1 000 L": 1000,
  "Fût acier 200 L": 200,
};

const positiveNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const match = String(value).replace(/\s/g, "").replace(/,/g, ".").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const number = Number(match[0]);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const getFclCount = (commande) =>
  positiveNumber(
    commande?.nombre_fcl ??
    commande?.nombreFcl ??
    commande?.nombre_fcl_20 ??
    commande?.fcl_count
  );

const getBulkCapacity = (formatLivraison) => {
  const canonical = canonicalBulkFormat(formatLivraison);
  return BULK_FORMAT_CAPACITY_LITRES[canonical] || null;
};

// Quantité en unités :
//   FCL 20 = unités/FCL × nombre de FCL       (10 palettes par FCL 20)
//   FCL 40 = unités/FCL × 2 × nombre de FCL   (20 palettes par FCL 40)
//   Palettes = unités/FCL ÷ 10 × nombre de palettes
const getConditionedQuantity = ({
  commande,
  target,
  format,
  conditionedPrices,
}) => {
  // Mode choisi dans le formulaire
  const mode = String(
    commande?.quantite_commande ??
    commande?.mode_quantite ??
    commande?.type_quantite ??
    commande?.format_conteneur ??
    commande?.type_conteneur ??
    ""
  )
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "");

  const nombreFCL = positiveNumber(
    commande?.nombre_fcl ?? commande?.nb_fcl
  );

  const nombrePalettes = positiveNumber(
    commande?.nombre_palettes ??
    commande?.nb_palettes ??
    commande?.nombre_palette ??
    commande?.nb_palette
  );

  // Colonne « Unités / FCL » (FCL 20 pieds) de la fiche MOTEUR
  const unitesFCL20 = getUnitsPerFCL20(
    target,
    format,
    conditionedPrices
  );

  if (unitesFCL20 == null || unitesFCL20 <= 0) {
    return null;
  }

  if (mode.includes("fcl 20") || mode.includes("20")) {
    return nombreFCL
      ? unitesFCL20 * nombreFCL
      : unitesFCL20;
  }

  if (mode.includes("fcl 40") || mode.includes("40")) {
    return nombreFCL
      ? unitesFCL20 * 2 * nombreFCL
      : unitesFCL20 * 2;
  }

  if (mode.includes("palette")) {
    return nombrePalettes
      ? (unitesFCL20 / 10) * nombrePalettes
      : null;
  }

  // Compatibilité si le mode n'est pas encore enregistré.
  if (nombreFCL) {
    return unitesFCL20 * nombreFCL;
  }

  if (nombrePalettes) {
    return (unitesFCL20 / 10) * nombrePalettes;
  }

  return null;
};

// Unités / FCL 20 pieds de la fiche MOTEUR
const getUnitsPerFCL20 = (target, format, conditionedPrices) => {
  const units = Number(
    getConditionedLine(target, format, conditionedPrices)?.unites_fcl20
  );

  return Number.isFinite(units) && units > 0
    ? units
    : null;
};

// Remise conditionné selon le canal de distribution de la commande
const CANAL_DISCOUNTS = [
  { canal: "Distributeur importateur", taux: 0.25 },
  { canal: "HoReCa/Grossiste", taux: 0.15 },
];

const getCanalDiscount = (commande) => {
  const canal = normalizeBulkKey(commande?.canal_distribution ?? commande?.canal);
  return CANAL_DISCOUNTS.find((d) => normalizeBulkKey(d.canal) === canal) || null;
};

// Lignes de prix d'une sélection d'emballages / formats conditionnés.
// Utilisé pour le conditionnement classique et pour la nouvelle marque.
const addConditionedRows = ({
  rows,
  commande,
  numero,
  fclCount,
  formatEntries,
  selectedPackaging,
  conditionedPrices,
  section,
  label,
}) => {
  const seenFormats = new Set();
  const uniqueFormats = formatEntries.filter((entry) => {
    const key = `${entry.path}|${entry.format}`;
    if (seenFormats.has(key)) return false;
    seenFormats.add(key);
    return true;
  });

  const packagingNames = selectedPackaging
    .map((item) => ({ raw: String(item), normalized: normalizePackagingName(item) }))
    .filter((item) => item.normalized);

  const used = new Set();

  const remise = getCanalDiscount(commande);
  const remiseLabel = remise
    ? ` (-${Math.round(remise.taux * 100)}% ${remise.canal})`
    : "";

  uniqueFormats.forEach((entry, formatIndex) => {
    const pathLower = String(entry.path || "").toLowerCase();

    const bottleType = /\bdorica\b/i.test(pathLower)
      ? "DORICA"
      : /\bmarasca\b/i.test(pathLower)
        ? "MARASCA"
        : "";

    let packaging = null;

    const pathMatch = packagingNames.find((item) =>
      pathLower.includes(String(item.raw).toLowerCase()) ||
      pathLower.includes(item.normalized.toLowerCase())
    );

    if (pathMatch) packaging = pathMatch.normalized;
    if (!packaging && /\bpet\b/i.test(pathLower)) packaging = "PET";
    if (!packaging && /tin|metal|bidon/i.test(pathLower)) packaging = "Tin";
    if (!packaging && /glass|verre|dorica|marasca/i.test(pathLower)) packaging = "Glass";
    if (!packaging && /bag.?in.?box/i.test(pathLower)) packaging = "BaginBox";

    const targets = packaging
      ? [packaging]
      : packagingNames.map((item) => item.normalized);

    targets.forEach((target) => {
      const key = `${numero}|${target || ""}|${bottleType}|${entry.format}`;

      if (used.has(key)) return;
      used.add(key);

      const prixCatalogue = target
        ? getPriceEUR(target, entry.format, conditionedPrices)
        : null;

      // Remise canal de distribution appliquée sur le prix unitaire
      const price = prixCatalogue != null && remise
        ? prixCatalogue * (1 - remise.taux)
        : prixCatalogue;

      const quantiteTotale = getConditionedQuantity({
        commande,
        target,
        format: entry.format,
        conditionedPrices,
      });

      const quantity = quantiteTotale != null
        ? `${quantiteTotale.toLocaleString("en-US")} units`
        : "À confirmer";

      const description =
        target === "Glass" && bottleType
          ? `QR ${numero} — ${label} - ${entry.format} ${bottleType} Glass${remiseLabel}`
          : `QR ${numero} — ${label} - ${entry.format} ${target || "Packaging to confirm"}${remiseLabel}`;

      rows.push({
        key: `commande-${numero}-${section}-${target || "emballage"}-${bottleType}-${entry.format}-${formatIndex}`,
        section,
        description,
        price,
        precision: 2,
        quantity,
        total:
          price != null && quantiteTotale != null
            ? price * quantiteTotale
            : null,
      });
    });
  });

  if (uniqueFormats.length === 0) {
    const selected = packagingNames.map((item) => item.normalized).join(", ");
    rows.push({
      key: `commande-${numero}-${section}-sans-format`,
      section,
      description: `QR ${numero} — ${label}${selected ? ` — ${selected}` : " — conditionnement à préciser"}`,
      price: null,
      quantity: fclCount ? `${fclCount} FCL 20’` : String(commande?.volumes_estimes ?? commande?.volumes_conditionne ?? "À confirmer"),
      total: null,
    });
  }
};

const estNouvelleMarque = (commande) =>
  normalizeBulkKey(commande?.type_marque) === normalizeBulkKey("Création de nouvelle marque");

// prices = { vrac, conditionne } renvoyé par GET /api/moteur/prix
// Chaque ligne a une `section` : "standard" ou "nouvelle_marque".
const buildPricingRows = (visiteur, prices) => {
  const bulkPrices = prices?.vrac;
  const conditionedPrices = prices?.conditionne;

  const commandes = Array.isArray(visiteur?.commandes) && visiteur.commandes.length
    ? visiteur.commandes
    : (visiteur && (
        visiteur.type_commande || visiteur.type || visiteur.categorie ||
        visiteur.format_livraison || visiteur.type_emballage || visiteur.packaging
      ) ? [visiteur] : []);

  const rows = [];

  commandes.forEach((commande, index) => {
    const type = String(
      commande?.type_commande ?? commande?.type ?? visiteur?.type_commande ?? visiteur?.type ?? ""
    )
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");

    const numero = commande?.numero_commande || index + 1;
    const fclCount = getFclCount(commande);

    const categorie = String(
      commande?.categorie ?? commande?.category ?? commande?.qualite_grade ??
      visiteur?.categorie ?? visiteur?.category ?? ""
    ).trim();

    const formatLivraison =
      commande?.format_livraison ??
      commande?.["Format livraison"] ??
      commande?.["format livraison"] ??
      commande?.formatLivraison ??
      commande?.format_de_livraison ??
      commande?.format_livraison_vrac ??
      visiteur?.format_livraison ??
      visiteur?.["Format livraison"] ??
      visiteur?.formatLivraison ??
      "";

    // Vrac : prix EXW par litre (fiche MOTEUR) selon la catégorie
    // et le mode de livraison.
    if (type === "vrac" || (categorie && formatLivraison && !/conditionn/.test(type))) {
      const price = getBulkPriceEUR(categorie, formatLivraison, bulkPrices);
      const canonicalFormat = canonicalBulkFormat(formatLivraison);
      const estimatedVolume = positiveNumber(
        commande?.volume_estime ?? commande?.volumes_estimes ??
        commande?.volumes_conditionne ?? commande?.quantite_commande
      );
      const capacity = getBulkCapacity(formatLivraison);
      const volumeLitres = estimatedVolume || (capacity && fclCount ? capacity * fclCount : null);
      const quantity = volumeLitres
        ? `${volumeLitres.toLocaleString("en-US")} L`
        : fclCount
          ? `${fclCount} FCL 20’`
          : String(commande?.volume_estime ?? commande?.volumes_estimes ?? "À confirmer");

      rows.push({
        key: `commande-${numero}-vrac-${categorie || "categorie"}-${normalizeBulkKey(String(formatLivraison))}`,
        section: "standard",
        description: `QR ${numero} — ${categorie || "Catégorie à confirmer"} — ${String(formatLivraison || canonicalFormat || "Format livraison à confirmer")}`,
        price,
        precision: 3,
        quantity,
        total: price != null && volumeLitres != null ? price * volumeLitres : null,
      });
      return;
    }

    // Conditionné : le champ réellement enregistré par l'API est `packaging`.
    const typeEmballage = parseJSON(commande?.type_emballage, {});
    const packaging = parseJSON(
      commande?.packaging ?? commande?.formats_emballage ?? commande?.formatsEmballage,
      {}
    );
    const formatsSouhaites = parseJSON(commande?.formats_souhaites, []);
    const emballagesSelectionnes = parseJSON(commande?.emballages_selectionnes, []);

    let selectedPackaging = [];
    if (Array.isArray(typeEmballage)) {
      selectedPackaging = typeEmballage;
    } else if (Array.isArray(typeEmballage?.emballages)) {
      selectedPackaging = typeEmballage.emballages;
    } else if (Array.isArray(emballagesSelectionnes)) {
      selectedPackaging = emballagesSelectionnes;
    } else if (typeof emballagesSelectionnes === "string") {
      selectedPackaging = [emballagesSelectionnes];
    }

    // Utiliser le JSON `packaging` en priorité : il associe chaque format à son emballage.
    const primaryFormats = collectFormats(packaging);
    const formatEntries = primaryFormats.length
      ? primaryFormats
      : [
          ...collectFormats(commande?.formats_emballage),
          ...collectFormats(formatsSouhaites),
        ];

    // Une commande « nouvelle marque » sans emballage classique
    // n'a de lignes que dans le tableau nouvelle marque.
    const sansEmballageClassique =
      formatEntries.length === 0 && selectedPackaging.length === 0;

    if (!(estNouvelleMarque(commande) && sansEmballageClassique)) {
      addConditionedRows({
        rows,
        commande,
        numero,
        fclCount,
        formatEntries,
        selectedPackaging,
        conditionedPrices,
        section: "standard",
        label: "Extra Virgin Olive Oil",
      });
    }

    // Nouvelle marque : tableau séparé, selon les emballages / formats
    // choisis dans la partie « Création de nouvelle marque ».
    if (estNouvelleMarque(commande)) {
      const nmFormatsRaw = parseJSON(commande?.nouvelle_marque_formats, {});
      const nmFormats = nmFormatsRaw?.formats ?? nmFormatsRaw;

      const nmEmballagesRaw = parseJSON(
        commande?.nouvelle_marque_emballages ?? nmFormatsRaw?.emballages,
        []
      );
      const nmEmballages = Array.isArray(nmEmballagesRaw)
        ? nmEmballagesRaw
        : nmEmballagesRaw
          ? [nmEmballagesRaw]
          : [];

      addConditionedRows({
        rows,
        commande,
        numero,
        fclCount,
        formatEntries: collectFormats(nmFormats),
        selectedPackaging: nmEmballages,
        conditionedPrices,
        section: "nouvelle_marque",
        label: "Extra Virgin Olive Oil (new brand)",
      });
    }
  });

  return rows;
};

// =====================================================
// ESCAPE HTML
// =====================================================

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]
  );

// =====================================================
// PHONE
// =====================================================

const getPhone = (visiteur) =>
  `${visiteur?.indicatif || ""}${visiteur?.telephone || ""}`.replace(
    /\D/g,
    ""
  );

// =====================================================
// REFERENCE
// =====================================================

const getReference = (v) => {
  // Si la référence existe déjà dans la base
  if (v?.reference) {
    return String(v.reference);
  }

  const visitorId = Number(v?.id);

  if (!Number.isFinite(visitorId) || visitorId <= 0) {
    return "—";
  }

  const type = String(v?.type_commande || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const suffix =
    type === "vrac"
      ? "V"
      : type === "conditionne"
      ? "B"
      : "";

  if (!suffix) {
    return "—";
  }

  const year = new Date().getFullYear();

  return `${visitorId + 1}${suffix}${year}`;
};

// =====================================================
// PDF SCREEN
// =====================================================

export default function PDFScreen() {

  const [commercialName, setCommercialName] = useState("");

  useEffect(() => {
    const loadCommercial = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");

        if (storedUser) {
          const commercial = JSON.parse(storedUser);

          setCommercialName(
            `${commercial.prenom || ""} ${commercial.nom || ""}`.trim()
          );
        }
      } catch (error) {
        console.log("Erreur commercial :", error);
      }
    };

    loadCommercial();
  }, []);

  const { id } = useLocalSearchParams();

  const router = useRouter();

  const { width } = useWindowDimensions();

  const [visiteur, setVisiteur] = useState(null);

  const [loading, setLoading] = useState(true);

  const [generating, setGenerating] = useState(false);

  const [sending, setSending] = useState(false);

  const [sendingEmail, setSendingEmail] = useState(false);

  const [showSendModal, setShowSendModal] = useState(false);

  // ===================================================
  // ID VISITEUR
  // ===================================================

  const visitorId = Array.isArray(id)
    ? id[0]
    : id;

  // ===================================================
  // CHARGER VISITEUR
  // ===================================================

  useEffect(() => {
    let active = true;
  
    const loadVisiteur = async () => {
      if (!id) {
        setLoading(false);
  
        Alert.alert(
          "Erreur",
          "Identifiant du visiteur introuvable."
        );
  
        return;
      }
  
      try {
        console.log("=======================================");
        console.log("CHARGEMENT VISITEUR");
        console.log("Visitor ID :", id);
        console.log("TYPE ID :", typeof id);
        console.log("API_URL :", API_URL);
        console.log("=======================================");
  
        const token =
          await AsyncStorage.getItem("token");
  
        console.log(
          "TOKEN PDF :",
          token ? "PRÉSENT" : "ABSENT"
        );
  
        if (!token) {
          throw new Error(
            "Token d'authentification introuvable."
          );
        }
  
        const visitorId = Array.isArray(id)
  ? id[0]
  : id;

const url = `${API_URL}/api/visiteurs/${encodeURIComponent(visitorId)}`;

console.log("=================================");
console.log("🔵 API_URL :", API_URL);
console.log("🔵 ID :", visitorId);
console.log("🔵 URL APPELÉE :", url);
console.log("🔵 TOKEN :", token ? "PRÉSENT" : "ABSENT");
console.log("=================================");

const response = await fetch(url, {
  method: "GET",
  headers: {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  },
});
  
        console.log(
          "GET VISITEUR STATUS :",
          response.status
        );
  
        const responseText =
          await response.text();
  
        console.log(
          "GET VISITEUR RÉPONSE BRUTE :",
          responseText.substring(0, 500)
        );
  
        let data;
  
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          throw new Error(
            `Le serveur retourne une réponse HTML au lieu du JSON. HTTP ${response.status}`
          );
        }
  
        console.log(
          "GET VISITEUR RESPONSE :",
          data
        );
  
        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Impossible de charger le visiteur. HTTP ${response.status}`
          );
        }
  
        if (!data?.success) {
          throw new Error(
            data?.message ||
              "Le serveur n'a pas retourné les données du visiteur."
          );
        }
  
        const visitorData =
          data?.data ||
          data?.visitor ||
          data?.visiteur ||
          data;
  
        console.log(
          "✅ VISITEUR CHARGÉ :",
          visitorData
        );
  
        if (active) {
          setVisiteur(visitorData);
        }
  
      } catch (error) {
        console.error(
          "ERREUR CHARGEMENT VISITEUR :",
          error
        );
  
        if (active) {
          Alert.alert(
            "Erreur",
            error?.message ||
              "Impossible de charger le visiteur."
          );
        }
  
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
  
    loadVisiteur();
  
    return () => {
      active = false;
    };
  }, [id]);
  // ===================================================
  // NOM CLIENT
  // ===================================================

  const clientName = useMemo(() => {
    const v = visiteur || {};

    return (
      `${v.nom || ""}`.trim() ||
      v.contact_professionnel ||
      "—"
    );
  }, [visiteur]);

  // ===================================================
  // PRIX VRAC + CONDITIONNÉ (fiche MOTEUR)
  // ===================================================

  const [moteurPrices, setMoteurPrices] = useState(null);

  useEffect(() => {
    let active = true;

    const loadMoteurPrices = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_URL}/api/moteur/prix`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || `HTTP ${response.status}`);
        }

        if (active) setMoteurPrices({ vrac: data.vrac || {}, conditionne: data.conditionne || {} });
      } catch (error) {
        // Sans grille, les prix s'affichent « À confirmer »
        console.error("ERREUR PRIX MOTEUR :", error?.message || error);
      }
    };

    loadMoteurPrices();

    return () => {
      active = false;
    };
  }, []);

  // Une seule source de données pour l'aperçu et le PDF imprimé.
  const pricingRows = useMemo(
    () => buildPricingRows(visiteur, moteurPrices),
    [visiteur, moteurPrices]
  );

  // Deux tableaux : conditionnement / vrac, puis nouvelle marque
  const standardRows = useMemo(
    () => pricingRows.filter((row) => row.section !== "nouvelle_marque"),
    [pricingRows]
  );

  const newBrandRows = useMemo(
    () => pricingRows.filter((row) => row.section === "nouvelle_marque"),
    [pricingRows]
  );

  const getLogoBase64 = async () => {
    try {
      const asset = Asset.fromModule(
        require("../../assets/images/logo-olived-black.png")
      );
  
      await asset.downloadAsync();
  
      const response = await fetch(asset.localUri || asset.uri);
      const blob = await response.blob();
  
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
  
        reader.onloadend = () => {
          resolve(reader.result);
        };
  
        reader.onerror = reject;
  
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Erreur chargement logo :", error);
      return "";
    }
  };

  // ===================================================
  // HTML PDF
  // ===================================================

  const html = async () => {
    const logoBase64 = await getLogoBase64();

    const v = visiteur || {};
    const firstCommande = Array.isArray(v.commandes) ? v.commandes[0] : null;
    const incotermLabel = String(firstCommande?.incoterm ?? v.incoterm ?? "EXW")
      .trim()
      .toUpperCase() || "EXW";

    const reference =
      getReference(v);

    const client =
      v.societe ||
      v.nom_entreprise ||
      "—";

    const address =
      v.adresse_societe ||
      "—";

    const contact =
      clientName ||
      "—";

    const country =
      v.destination ||
      v.origine ||
      "—";

    const date =
      new Date().toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );

    const rowsHtml = (items) => items.map((item) => `
          <tr>
            <td>${esc(item.description)}</td>
            <td class="num">${item.price == null ? "À confirmer" : moneyEUR(item.price, item.precision || 2)}</td>
            <td class="num">${esc(item.quantity)}</td>
            <td class="num">${item.total == null ? "À confirmer" : moneyEUR(item.total, item.precision || 2)}</td>
          </tr>
        `).join("");

    const rows = standardRows.length
      ? rowsHtml(standardRows)
      : newBrandRows.length
        ? `<tr><td colspan="4">Voir le tableau « New brand » ci-dessous.</td></tr>`
        : `<tr><td colspan="4">Aucune commande ou aucun format sélectionné.</td></tr>`;

    // Tableau supplémentaire pour la création de nouvelle marque
    const newBrandTable = newBrandRows.length
      ? `
  <h3>
    PRICING – NEW BRAND
  </h3>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Unit Price EXW Sfax (EUR)</th>
        <th>Quantity</th>
        <th>Total EXW Sfax (EUR)</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml(newBrandRows)}
    </tbody>
  </table>
`
      : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8" />

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>
  OLIVED - Official Price Offer ${esc(
    reference
  )}
</title>

<style>

  @page {
    size: A4;
    margin: 12mm;
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
  }

  body {
    background: #eef0f2;
    color: #20252a;
    font-family:
      Arial,
      Helvetica,
      sans-serif;
    font-size: 9px;
    line-height: 1.35;
  }

  .document {
    width: 186mm;
    min-height: 273mm;
    margin: 0 auto;
    padding: 9mm;
    background: #ffffff;
  }

  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    margin-bottom: 25px;
  }
  
  .brand {
    width: 55%;
    display: flex;
    align-items: flex-start;
  }

  .signline {
    display: flex;
    align-items: flex-start;
    margin-top: 25px;
    font-size: 11px;
    font-weight: 600;
  }
  
  .signature-space {
    width: 300px;
    height: 100px;
    margin-left: 25px;
  }

  .logo {
    width: 160px;
    height: auto;
    object-fit: contain;
  }
  .green-line {
    width: 100%;
    height: 2px;
    background: #5C681F;
    margin-top: 8px;
    margin-bottom: 20px;
  }
  .brand-name {
    font-family:
      Georgia,
      "Times New Roman",
      serif;
    font-size: 31px;
    font-style: italic;
    font-weight: normal;
    letter-spacing: -2px;
    color: #171717;
    line-height: 1;
  }

  .brand-sub {
    margin-top: 3px;
    font-size: 7px;
    letter-spacing: 1.4px;
    color: #667044;
  }

  .contact {
    width: 40%;
    text-align: right;
    color: #333;
    font-size: 10px;
    line-height: 1.6;
  }
  
  .contact-row {
    margin-bottom: 4px;
    white-space: normal;
  }
  
  .icon {
    display: inline-block;
    margin-left: 5px;
    font-size: 13px;
    color: #333;
  }

  .ref {
    display: flex;
    justify-content: space-between;
    margin: 8px 0 12px;
    color: #626873;
    font-size: 8px;
  }

  h2 {
    margin: 0 0 11px;
    text-align: center;
    font-size: 14px;
    color: #17202b;
  }

  h3 {
    margin: 9px 0 5px;
    padding: 5px 7px;
    background: #d9e6d9;
    color: #53651d;
    font-size: 8px;
    font-weight: bold;
    text-transform: uppercase;
  }

  .client {
    margin-bottom: 4px;
  }

  .client-row {
    display: flex;
    padding: 3px 0;
    border-bottom:
      1px solid #d8d8d8;
  }

  .client-row b {
    width: 72px;
    flex-shrink: 0;
  }

  ul {
    margin: 4px 0 7px;
    padding-left: 13px;
  }

  li {
    margin: 2px 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 7px;
  }

  th {
    background: ${ORANGE};
    color: white;
    text-align: left;
    padding: 5px 4px;
    font-size: 6.7px;
  }

  td {
    border:
      1px solid #bfc3c6;
    padding: 4px;
    vertical-align: top;
  }

  th:first-child,
  td:first-child {
    width: 40%;
  }

  th:nth-child(2),
  td:nth-child(2) {
    width: 19%;
  }

  th:nth-child(3),
  td:nth-child(3) {
    width: 17%;
  }

  th:nth-child(4),
  td:nth-child(4) {
    width: 24%;
  }

  .num {
    text-align: right;
    white-space: nowrap;
  }

  .terms {
    margin: 5px 0 8px;
  }

  .signature {
    margin-top: 12px;
    line-height: 1.7;
  }

  .signature b {
    display: block;
    margin-bottom: 3px;
  }

  .signline {
    margin-top: 14px;
  }

  .footer {
    border-top:
      1px solid #bfc3c6;
    margin-top: 10px;
    padding-top: 6px;
    text-align: center;
    color: #737982;
    font-size: 6.5px;
    line-height: 1.5;
  }

  @media screen {

    body {
      padding: 18px 0;
    }

    .document {
      box-shadow:
        0 2px 10px
        rgba(0, 0, 0, 0.12);
    }

  }

</style>

</head>

<body>

<div class="document">

<!-- HEADER -->

<div class="top">

  <div class="brand">
     ${
        logoBase64
          ? `<img src="${logoBase64}" class="logo" />`
          : ""
      }
  </div>

  <div class="contact">

    <div class="contact-row">
      Rue du Lac Tchad, Immeuble ZEN, B4
      <span class="icon">📍</span>
      <br />
      Les Berges du Lac, 1053 Tunis
    </div>

    <div class="contact-row">
      +216 98462000
      <span class="icon">📞</span>
    </div>

    <div class="contact-row">
      sales@olived.tn
      <span class="icon">📧</span>
    </div>

    <div class="contact-row">
      www.olived.tn
      <span class="icon">🌐</span>
    </div>

  </div>

</div>

<div class="green-line"></div>

  <!-- REFERENCE -->

  <div class="ref">

    <span>
      <b>Ref:</b>
      ${esc(reference)}
    </span>

    <span>
      <b>Date:</b>
      ${esc(date)}
    </span>

  </div>

  <h2>
    OFFICIAL PRICE OFFER
  </h2>

  <!-- TO -->

  <h3>
    TO
  </h3>

  <div class="client">

    <div class="client-row">
      <b>Company</b>
      <span>
        ${esc(client)}
      </span>
    </div>

    <div class="client-row">
      <b>Address</b>
      <span>
        ${esc(address)}
      </span>
    </div>

    <div class="client-row">
      <b>Contact</b>
      <span>
        ${esc(contact)}
      </span>
    </div>

    

  </div>

  <!-- PRODUCT DETAILS -->

  <h3>
    PRODUCT DETAILS
  </h3>

  <ul>

    <li>
      <b>Commodity:</b>
      Extra Virgin Olive Oil –
      Harvest 2026/2027
    </li>

    <li>
      <b>Origin:</b>
      100% Tunisia
    </li>

    <li>
      <b>Extraction:</b>
      Cold extraction,
      mechanical only
    </li>

    <li>
      <b>Quality:</b>
      Extra Virgin
      (IOC / EU Standard compliant)
    </li>

    <li>
      <b>Description:</b>
      Clean, fresh medium fruity
      profile from early-harvest
      Chemlali &amp; Chetoui olives.
    </li>

    <li>
      <b>Guaranteed parameters:</b>
      Free Acidity ≤ 0.5%;
      Peroxide Value ≤ 15 meq O₂/kg;
      K232 / K270 / ΔK within IOC/EU
      limits; Panel Test:
      Fruity &gt; 0, Defects = 0.
    </li>

  </ul>

  <!-- PRICING -->

  <h3>
    PRICING
  </h3>

  <table>

    <thead>

      <tr>

        <th>
          Description
        </th>

        <th>
          Unit Price EXW Sfax (EUR)
        </th>

        <th>
          Quantity FCL 20’
        </th>

        <th>
          Total EXW Sfax (EUR)
        </th>

      </tr>

    </thead>

    <tbody>

      ${rows}

    </tbody>

  </table>

  ${newBrandTable}

  <p class="terms">

    <b>Currency:</b>
    EUR

    &nbsp;&nbsp;&nbsp;

    <b>Incoterm:</b>
    ${esc(incotermLabel)} SFAX

  </p>

  <!-- PAYMENT TERMS -->

  <h3>
    PAYMENT TERMS
  </h3>

  <ul>

    <li>
      30% advance payment upon
      Proforma Invoice confirmation
    </li>

    <li>
      70% balance by bank transfer
      prior to loading
    </li>

    <li>
      All bank charges outside Tunisia
      are at the Buyer’s cost.
    </li>

  </ul>

  <!-- DOCUMENTATION -->

  <h3>
    DOCUMENTATION TO BE PROVIDED
  </h3>

  <ul>

    <li>
      Commercial Invoice
    </li>

    <li>
      Packing List
    </li>

    <li>
      Bill of Lading
    </li>

    <li>
      Certificate of Origin
      (if required)
    </li>

    <li>
      Phytosanitary Certificate
      (upon request)
    </li>

    <li>
      Analytical Report
      (IOC-Compliant)
    </li>

  </ul>

  <!-- ADDITIONAL TERMS -->

  <h3>
    ADDITIONAL TERMS
  </h3>

  <ul>

    <li>
      Prices exclude customs duties
      and VOC fees.
    </li>

    <li>
      Contract confirmed upon Buyer’s
      written acceptance and Seller’s
      Proforma Invoice.
    </li>

    <li>
      Goods remain property of Seller
      until full payment is received.
    </li>

    <li>
      Quantities, weights and specifications
      are subject to standard commercial
      tolerances.
    </li>

  </ul>

  <p>
    <b>Validity:</b>
    Offer valid for 15 working days
    from date of issue.
  </p>

  <!-- SIGNATURE -->

  <div class="signature">

    <b>
      SELLER CONFIRMATION
    </b>

    For OLIVED

    <br />

    Name: Olfa BEN HAJEL

    <br />

    Title: General Coordinator

    <div class="signline">
  <span>Signature / Stamp:</span>
  <span class="signature-space"></span>
</div>

  </div>

  <!-- FOOTER -->

  <div class="footer">

    OLIVED LLC • Registered capital:
    TND 1,400,000

    <br />

    Registered Address:
    Route Saltania km 4.5,
    Cité CHAKER, 3081 Sfax,
    Tunisia

    <br />

    Facility:
    Route Mahdia Km 18,
    3066 Sfax, Tunisia
    • Company ID (IU): 953353Y

  </div>

</div>

</body>
</html>`;
  };

  // ===================================================
  // GÉNÉRER / IMPRIMER PDF
  // ===================================================

  const imprimerPDF = async () => {
    try {
      if (!visiteur) {
        throw new Error(
          "Aucune donnée client disponible."
        );
      }
  
      setGenerating(true);
  
      console.log(
        "======================================="
      );
  
      console.log(
        "OUVERTURE DU PDF"
      );
  
      console.log(
        "======================================="
      );
  
      // =========================================
      // GÉNÉRER LE HTML DU DOCUMENT
      // =========================================
      const content = await html();
  
      if (
        !content ||
        !content.trim()
      ) {
        throw new Error(
          "Le contenu du PDF est vide."
        );
      }
  
      console.log(
        "HTML généré :",
        content.length,
        "caractères"
      );
  
      // =========================================
      // WEB
      // =========================================
      if (Platform.OS === "web") {
  
        // Créer une nouvelle page
        const newWindow =
          window.open(
            "",
            "_blank"
          );
  
        if (!newWindow) {
          throw new Error(
            "Le navigateur a bloqué l'ouverture du nouvel onglet."
          );
        }
  
        // Écrire le document OLIVED
        newWindow.document.open();
  
        newWindow.document.write(
          content
        );
  
        newWindow.document.close();
  
        console.log(
          "✅ PDF/document ouvert dans un nouvel onglet."
        );
  
        return;
      }
  
      // =========================================
      // MOBILE
      // =========================================
      const Print =
        require("expo-print");
  
      const file =
        await Print.printToFileAsync({
          html: content,
        });
  
      if (
        !file?.uri
      ) {
        throw new Error(
          "Impossible de générer le fichier PDF."
        );
      }
  
      console.log(
        "PDF généré :",
        file.uri
      );
  
      await Print.printAsync({
        uri: file.uri,
      });
  
    } catch (error) {
  
      console.error(
        "❌ ERREUR PDF :",
        error
      );
  
      if (
        Platform.OS === "web"
      ) {
  
        window.alert(
          error?.message ||
          "Impossible d'ouvrir le PDF."
        );
  
      } else {
  
        Alert.alert(
          "Erreur PDF",
          error?.message ||
          "Impossible de générer le PDF."
        );
      }
  
    } finally {
  
      setGenerating(false);
    }
  };

  const demanderValidation = async (channel) => {
    try {
      if (!visiteur) {
        throw new Error(
          "Aucune donnée client disponible."
        );
      }
  
      // ================================
      // VÉRIFICATION EMAIL
      // ================================
  
      if (
        channel === "email" &&
        !visiteur.email?.trim()
      ) {
        throw new Error(
          "L'adresse email du visiteur est manquante."
        );
      }
  
      // ================================
      // VÉRIFICATION WHATSAPP
      // ================================
  
      if (channel === "whatsapp") {
        const telephone = getPhone(visiteur);
  
        if (!telephone) {
          throw new Error(
            "Le numéro WhatsApp du visiteur est manquant."
          );
        }
      }
  
      setSending(true);
  
      // ================================
      // GÉNÉRER LE HTML
      // ================================
  
      const content = await html();
  
      // ================================
      // CRÉER LA DEMANDE DE VALIDATION
      // ================================
  

// ================================
// CRÉER LA DEMANDE DE VALIDATION
// ================================

const response = await fetch(
  `${API_URL}/api/validation/create`,
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      visitorId: Number(visitorId),

      reference,

      channel,

      pdfHtml: content,
    }),
  }
);

const data = await response.json();

console.log(
  "======================================="
);

console.log(
  "RÉPONSE VALIDATION"
);

console.log(
  "STATUS :",
  response.status
);

console.log(
  "DATA :",
  data
);

console.log(
  "======================================="
);

if (
  !response.ok ||
  !data.success
) {
  throw new Error(
    data?.message ||
      "Impossible de créer le lien de validation."
  );
}

// ================================
// ENVOI AUTOMATIQUE PAR LE SERVEUR
// ================================
// Le backend envoie lui-même le message WhatsApp
// au validateur (21692300800) via l'API Meta.

if (!data.notificationSent) {
  throw new Error(
    "La demande a été créée, mais le message WhatsApp n'a pas pu être envoyé au validateur." +
      (data.notificationError
        ? `\n\n${data.notificationError}`
        : "")
  );
}

      setShowSendModal(false);

      Alert.alert(
        "Validation demandée",
        "La fiche a été envoyée automatiquement pour validation."
      );
  
    } catch (error) {
  
      console.error(
        "ERREUR DEMANDE VALIDATION :",
        error
      );
  
      Alert.alert(
        "Erreur",
        error?.message ||
          "Impossible de créer la demande de validation."
      );
  
    } finally {
  
      setSending(false);
  
    }
  };

  // ===================================================
  // ENVOYER WHATSAPP
  // ===================================================

  const envoyerParWhatsApp = async () => {
    try {
      if (!visiteur) {
        throw new Error("Aucune donnée client disponible.");
      }
  
      const telephone = getPhone(visiteur);
  
      if (!telephone) {
        throw new Error(
          "Le numéro de téléphone du visiteur est manquant."
        );
      }
  
      const nomComplet = [
        
        visiteur.nom,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
  // ===================================================
  // MSG WHATSAPP
  // ===================================================

const message =
  `Dear ${nomComplet},\n\n` +
  `I hope you are doing well.\n\n` +
  `Please find attached our quotation for the requested olive oil products.\n\n` +
  `The offer includes the product specifications, packaging options, quantities, and corresponding prices.\n\n` +
  `Should you require any modifications regarding volumes, packaging, delivery terms, or payment conditions, we would be pleased to review the offer accordingly.\n\n` +
  `Please do not hesitate to contact us should you need any further information or clarification.\n\n` +
  `We look forward to hearing from you and hope to have the opportunity to work with you.\n\n` +
  `Reference: ${reference}\n\n` +
  `Best regards,\n` +
  `OLIVED`;


  
      // Nettoyage du numéro :
      
      const whatsappNumber = telephone.replace(/[^\d]/g, "");
  
      // Encodage du message pour WhatsApp
      const encodedMessage = encodeURIComponent(message);
  
      // URL WhatsApp
      const whatsappUrl =
        `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
  
      console.log("=======================================");
      console.log("OUVERTURE WHATSAPP");
      console.log("Nom :", nomComplet);
      console.log("Téléphone :", whatsappNumber);
      console.log("Référence :", reference);
      console.log("=======================================");
  
      if (Platform.OS === "web") {
        // Sur navigateur
        window.open(
          whatsappUrl,
          "_blank"
        );
      } else {
        // Sur Android / iPhone
        const supported = await Linking.canOpenURL(
          whatsappUrl
        );
  
        if (!supported) {
          throw new Error(
            "WhatsApp n'est pas disponible sur cet appareil."
          );
        }
  
        await Linking.openURL(whatsappUrl);
      }
    } catch (error) {
      console.error(
        "ERREUR OUVERTURE WHATSAPP :",
        error
      );
  
      Alert.alert(
        "Erreur WhatsApp",
        error?.message ||
          "Impossible d'ouvrir WhatsApp."
      );
    }
  };

  // ===================================================
  // ENVOYER EMAIL
  // ===================================================

  const envoyerParEmail = async () => {
    try {
      if (!visiteur) {
        throw new Error(
          "Aucune donnée client disponible."
        );
      }
  
      if (!visiteur.email || !visiteur.email.trim()) {
        throw new Error(
          "L'adresse email du visiteur est manquante."
        );
      }
  
      setGenerating(true);
  
      // Nom complet du visiteur
      const nomComplet = [
    // visiteur.prenom,
        visiteur.nom,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
  
      // Générer le HTML complet avec le logo local
      const content = await html();
  
      console.log(
        "======================================="
      );
  
      console.log(
        "ENVOI EMAIL"
      );
  
      console.log(
        "Plateforme :",
        Platform.OS
      );
  
      console.log(
        "Visitor ID :",
        visitorId
      );
  
      console.log(
        "Reference :",
        reference
      );
  
      console.log(
        "Nom complet :",
        nomComplet
      );
  
      console.log(
        "Email destinataire :",
        visiteur.email
      );
  
      console.log(
        "PDF HTML :",
        content.length,
        "caractères"
      );
  
      console.log(
        "======================================="
      );
  
      const response = await fetch(
        `${API_URL}/api/email/send`,
        {
          method: "POST",
  
          headers: {
            "Content-Type": "application/json",
          },
  
          body: JSON.stringify({
            visitorId: Number(visitorId),
  
            reference,
  
            nomComplet,
  
            toEmail: visiteur.email.trim(),
  
            pdfHtml: content,
          }),
        }
      );
  
      const data = await response.json();
  
      console.log(
        "EMAIL STATUS HTTP :",
        response.status
      );
  
      console.log(
        "RÉPONSE EMAIL :",
        data
      );
  
      if (!response.ok || !data.success) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Erreur lors de l'envoi de l'email."
        );
      }
  
      Alert.alert(
        "Email envoyé",
        `Le PDF a été envoyé avec succès à ${visiteur.email}.`
      );
  
    } catch (error) {
      console.error(
        "ERREUR EMAIL :",
        error
      );
  
      Alert.alert(
        "Erreur email",
        error?.message ||
          "Impossible d'envoyer le PDF par email."
      );
  
    } finally {
      setGenerating(false);
    }
  };
  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <View
        style={styles.center}
      >
        <ActivityIndicator
          size="large"
          color={ORANGE}
        />

        <Text
          style={styles.loadingText}
        >
          Chargement du client…
        </Text>
      </View>
    );
  }

  // ===================================================
  // PAS DE VISITEUR
  // ===================================================

  if (!visiteur) {
    return (
      <View
        style={styles.center}
      >
        <Text
          style={styles.emptyText}
        >
          Aucune information disponible
          pour ce client.
        </Text>

        <TouchableOpacity
  style={styles.primary}
  onPress={() => router.replace("/")}
>
  <Text style={styles.btnText}>
    Retour
  </Text>
</TouchableOpacity>
      </View>
    );
  }

  // ===================================================
  // VARIABLES
  // ===================================================

  const v = visiteur;

  const reference =
    getReference(v);

  const info = [
    [
      "Société",
      v.societe ||
        v.nom_entreprise,
    ],

    [
      "Adresse",
      v.adresse_societe,
    ],

    [
      "Contact",
      clientName,
    ],

    [
      "E-mail",
      v.email,
    ],

    [
      "Téléphone",
      `${v.indicatif || ""} ${
        v.telephone || ""
      }`.trim(),
    ],

    [
      "Pays / destination",
      v.destination ||
        v.origine,
    ],

    [
      "Incoterm souhaité",
      v.incoterm,
    ],

    [
      "Type de commande",
      v.type_commande,
    ],

    [
      "Quantité / volume",
      v.quantite_commande ||
        v.volume_estime ||
        v.quantite_prevue,
    ],
  ].filter(
    ([, value]) =>
      value !== null &&
      value !== undefined &&
      value !== ""
  );

  // ===================================================
  // AFFICHAGE
  // ===================================================

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={
        styles.content
      }
    >
      {/* =================================================
          DOCUMENT
      ================================================= */}

      <View
        style={[
          styles.paper,
          width < 650 &&
            styles.paperMobile,
        ]}
      >
        {/* ===============================================
            HEADER
        =============================================== */}

        <View
          style={styles.brandRow}
        >
          <Image
            source={require(
              "../../assets/images/logo-olived-black.png"
            )}
            style={styles.logo}
            resizeMode="contain"
          />

          <View
            style={styles.contact}
          >
            <Text
              style={styles.contactText}
            >
              Rue du Lac Tchad,
              Immeuble ZEN, B4{" "}
              <Ionicons
                name="location"
                size={16}
                color="#333"
              />

              {"\n"}

              Les Berges du Lac,
              1053 Tunis
            </Text>

            <Text
              style={styles.contactText}
            >
              +216 98462000{" "}
              <Ionicons
                name="call"
                size={16}
                color="#333"
              />
            </Text>

            <Text
              style={styles.contactText}
            >
              sales@olived.tn{" "}
              <Ionicons
                name="mail"
                size={16}
                color="#333"
              />
            </Text>

            <Text
              style={styles.contactText}
            >
              www.olived.tn{" "}
              <Ionicons
                name="globe-outline"
                size={16}
                color="#333"
              />
            </Text>
          </View>
        </View>

        {/* ===============================================
            REFERENCE
        =============================================== */}

        <View
          style={styles.refRow}
        >
          <Text
            style={styles.small}
          >
            Ref: {reference}
          </Text>

          <Text
            style={styles.small}
          >
            Date:{" "}
            {new Date().toLocaleDateString(
              "fr-FR"
            )}
          </Text>
        </View>

        {/* ===============================================
            TITLE
        =============================================== */}

        <Text
          style={styles.offerTitle}
        >
          OFFICIAL PRICE OFFER
        </Text>

        {/* ===============================================
            TO
        =============================================== */}

        <Section title="TO">
          <InfoRows
            rows={info.slice(0, 3)}
          />
        </Section>

        {/* ===============================================
            PRODUCT DETAILS
        =============================================== */}

        <Section title="PRODUCT DETAILS">

          <Text
            style={styles.body}
          >
            <Text
              style={styles.bold}
            >
              Commodity:
            </Text>{" "}
            Extra Virgin Olive Oil –
            Harvest 2026/2027

            {"\n"}

            <Text
              style={styles.bold}
            >
              Origin:
            </Text>{" "}
            100% Tunisia

            {"\n"}

            <Text
              style={styles.bold}
            >
              Extraction:
            </Text>{" "}
            Cold extraction,
            mechanical only

            {"\n"}

            <Text
              style={styles.bold}
            >
              Quality:
            </Text>{" "}
            Extra Virgin
            (IOC / EU Standard compliant)

            {"\n"}

            <Text
              style={styles.bold}
            >
              Description:
            </Text>{" "}
            Clean, fresh medium fruity
            profile from early-harvest
            Chemlali & Chetoui olives.

            {"\n"}

            <Text
              style={styles.bold}
            >
              Guaranteed parameters:
            </Text>

            {"\n"}

            Free Acidity ≤ 0.5%;
            Peroxide ≤ 15 meq O₂/kg;

            {"\n"}

            K232/K270/ΔK within
            IOC/EU limits;

            {"\n"}

            Fruity &gt; 0,
            Defects = 0.
          </Text>

        </Section>

        {/* ===============================================
            PRICING
        =============================================== */}

        <Section title="PRICING">

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
          >
            <View>

              {/* TABLE HEADER */}

              <View
                style={styles.tableHead}
              >
                <Text
                  style={[
                    styles.th,
                    {
                      width: 250,
                    },
                  ]}
                >
                  Description
                </Text>

                <Text
                  style={[
                    styles.th,
                    {
                      width: 125,
                    },
                  ]}
                >
                  Unit Price EXW Sfax
                  (EUR)
                </Text>

                <Text
                  style={[
                    styles.th,
                    {
                      width: 105,
                    },
                  ]}
                >
                  Quantity FCL 20’
                </Text>

                <Text
                  style={[
                    styles.th,
                    {
                      width: 135,
                    },
                  ]}
                >
                  Total EXW Sfax
                  (EUR)
                </Text>
              </View>

              {/* TABLE ROWS */}

              {standardRows.map((item) => (
                <View key={item.key} style={styles.tableRow}>
                  <Text style={[styles.td, { width: 250 }]}>{item.description}</Text>
                  <Text style={[styles.td, { width: 125, textAlign: "right" }]}>
                    {item.price == null ? "À confirmer" : moneyEUR(item.price, item.precision || 2)}
                  </Text>
                  <Text style={[styles.td, { width: 105, textAlign: "right" }]}>{item.quantity}</Text>
                  <Text style={[styles.td, { width: 135, textAlign: "right" }]}>
                    {item.total == null ? "À confirmer" : moneyEUR(item.total, item.precision || 2)}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* TABLEAU NOUVELLE MARQUE */}

          {newBrandRows.length > 0 && (
            <>
              <Text style={[styles.body, styles.bold, { marginTop: 16 }]}>
                PRICING – NEW BRAND
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator>
                <View>
                  <View style={styles.tableHead}>
                    <Text style={[styles.th, { width: 250 }]}>Description</Text>
                    <Text style={[styles.th, { width: 125 }]}>Unit Price EXW Sfax (EUR)</Text>
                    <Text style={[styles.th, { width: 105 }]}>Quantity</Text>
                    <Text style={[styles.th, { width: 135 }]}>Total EXW Sfax (EUR)</Text>
                  </View>

                  {newBrandRows.map((item) => (
                    <View key={item.key} style={styles.tableRow}>
                      <Text style={[styles.td, { width: 250 }]}>{item.description}</Text>
                      <Text style={[styles.td, { width: 125, textAlign: "right" }]}>
                        {item.price == null ? "À confirmer" : moneyEUR(item.price, item.precision || 2)}
                      </Text>
                      <Text style={[styles.td, { width: 105, textAlign: "right" }]}>{item.quantity}</Text>
                      <Text style={[styles.td, { width: 135, textAlign: "right" }]}>
                        {item.total == null ? "À confirmer" : moneyEUR(item.total, item.precision || 2)}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          <Text
            style={styles.body}
          >
            <Text
              style={styles.bold}
            >
              Currency:
            </Text>{" "}
            EUR

            {"\n"}

            <Text
              style={styles.bold}
            >
              Incoterm:
            </Text>{" "}
            {String(
              (Array.isArray(visiteur?.commandes) ? visiteur.commandes[0]?.incoterm : null) ??
              visiteur?.incoterm ?? "EXW"
            ).toUpperCase()} SFAX
          </Text>

        </Section>

        {/* ===============================================
            PAYMENT
        =============================================== */}

        <Section title="PAYMENT TERMS">

          <Bullet>
            30% advance payment upon
            Proforma Invoice confirmation
          </Bullet>

          <Bullet>
            70% balance by bank transfer
            prior to loading
          </Bullet>

          <Bullet>
            All bank charges outside Tunisia
            are at the Buyer’s cost.
          </Bullet>

        </Section>

        {/* ===============================================
            DOCUMENTATION
        =============================================== */}

        <Section
          title="DOCUMENTATION TO BE PROVIDED"
        >

          <Bullet>
            Commercial Invoice
          </Bullet>

          <Bullet>
            Packing List
          </Bullet>

          <Bullet>
            Bill of Lading
          </Bullet>

          <Bullet>
            Certificate of Origin
            (if required)
          </Bullet>

          <Bullet>
            Phytosanitary Certificate
            (upon request)
          </Bullet>

          <Bullet>
            Analytical Report
            (IOC-Compliant)
          </Bullet>

        </Section>

        {/* ===============================================
            TERMS
        =============================================== */}

        <Section title="ADDITIONAL TERMS">

          <Bullet>
            Prices exclude customs duties
            and VOC fees.
          </Bullet>

          <Bullet>
            Contract confirmed upon Buyer’s
            written acceptance and Seller’s
            Proforma Invoice.
          </Bullet>

          <Bullet>
            Goods remain property of Seller
            until full payment is received.
          </Bullet>

          <Bullet>
            Quantities, weights and specifications
            are subject to standard commercial
            tolerances.
          </Bullet>

        </Section>

        <Text
          style={styles.body}
        >
          <Text
            style={styles.bold}
          >
            Validity:
          </Text>{" "}
          Offer valid for 15 working days
          from date of issue.
        </Text>

        {/* ===============================================
            SIGNATURE
        =============================================== */}

        <View
          style={styles.signature}
        >
          <Text
            style={styles.bold}
          >
            SELLER CONFIRMATION
          </Text>

          <Text>
            For OLIVED
          </Text>

          <Text>
            Name: Olfa BEN HAJEL
          </Text>

          <Text>
            Title: General Coordinator
          </Text>

          <Text
            style={{
              marginTop: 24,
            }}
          >
            Signature / Stamp:
          </Text>
        </View>

        {/* ===============================================
            FOOTER
        =============================================== */}

        <Text
          style={styles.footer}
        >
          OLIVED LLC • Registered capital:
          TND 1,400,000

          {"\n"}

          Registered Address:
          Route Saltania km 4.5,
          Cité CHAKER, 3081 Sfax,
          Tunisia

          {"\n"}

          Facility:
          Route Mahdia Km 18,
          3066 Sfax, Tunisia
          • Company ID (IU): 953353Y
        </Text>
      </View>

      {/* =================================================
          ACTIONS
      ================================================= */}

      <View
        style={styles.actions}
      >

        {/* PDF */}

        <TouchableOpacity
          style={styles.secondary}
          onPress={imprimerPDF}
          disabled={
            generating ||
            sending ||
            sendingEmail
          }
        >
          <Text
            style={styles.btnText}
          >
            {generating
              ? "Préparation…"
              : "🖨️ Générer / imprimer PDF"}
          </Text>
        </TouchableOpacity>

        {/* SEND */}

        <TouchableOpacity
          style={styles.primary}
          onPress={() =>
            setShowSendModal(true)
          }
          disabled={
            generating ||
            sending ||
            sendingEmail
          }
        >
          <Text
            style={styles.btnText}
          >
            📤 Envoyer la fiche
          </Text>
        </TouchableOpacity>

        {/* BACK */}

        <TouchableOpacity
          style={styles.back}
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={styles.backText}
          >
            Retour
          </Text>
        </TouchableOpacity>

      </View>

      {/* =================================================
          SEND MODAL
      ================================================= */}

      <Modal
        visible={showSendModal}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowSendModal(false)
        }
      >
        <View
          style={styles.overlay}
        >
          <View
            style={styles.modal}
          >

            <Text
              style={styles.modalTitle}
            >
              Envoyer la fiche visiteur
            </Text>

            {/* =========================================
                EMAIL
            ========================================= */}

            <TouchableOpacity
              style={styles.option}
              disabled={
                sendingEmail ||
                sending
              }
              onPress={() => {
                setShowSendModal(false);
              
                demanderValidation("email");
              }}
            >

              <FontAwesome
                name="envelope"
                size={25}
                color={ORANGE}
              />

              <View
                style={
                  styles.optionContent
                }
              >

                <Text
                  style={styles.optionTitle}
                >
                  {sendingEmail
                    ? "Envoi e-mail…"
                    : "E-mail"}
                </Text>

                <Text
                  style={styles.muted}
                >
                  {v.email ||
                    "Email non renseigné"}
                </Text>

              </View>

            </TouchableOpacity>

            {/* =========================================
                WHATSAPP
            ========================================= */}

            <TouchableOpacity
              style={styles.option}
              disabled={
                sending ||
                sendingEmail
              }
              onPress={() => {
                setShowSendModal(false);
              
                demanderValidation("whatsapp");
              }}
            >

              <FontAwesome
                name="whatsapp"
                size={28}
                color="#25D366"
              />

              <View
                style={
                  styles.optionContent
                }
              >

                <Text
                  style={styles.optionTitle}
                >
                  {sending
                    ? "Envoi WhatsApp…"
                    : "WhatsApp"}
                </Text>

                <Text
                  style={styles.muted}
                >
                  {v.indicatif || ""}
                  {" "}
                  {v.telephone ||
                    "Téléphone non renseigné"}
                </Text>

              </View>

            </TouchableOpacity>

            {/* =========================================
                CANCEL
            ========================================= */}

            <TouchableOpacity
              style={styles.back}
              onPress={() =>
                setShowSendModal(false)
              }
            >
              <Text
                style={styles.backText}
              >
                Annuler
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

// =====================================================
// SECTION
// =====================================================

function Section({
  title,
  children,
}) {
  return (
    <View
      style={styles.section}
    >
      <Text
        style={styles.sectionTitle}
      >
        {title}
      </Text>

      {children}
    </View>
  );
}

// =====================================================
// INFO ROWS
// =====================================================

function InfoRows({
  rows,
}) {
  return (
    <View>
      {rows.map(
        ([label, value]) => (
          <View
            key={label}
            style={styles.infoRow}
          >
            <Text
              style={styles.infoLabel}
            >
              {label}
            </Text>

            <Text
              style={styles.infoValue}
            >
              {String(
                value || "—"
              )}
            </Text>
          </View>
        )
      )}
    </View>
  );
}

// =====================================================
// BULLET
// =====================================================

function Bullet({
  children,
}) {
  return (
    <Text
      style={styles.body}
    >
      • {children}
    </Text>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles =
  StyleSheet.create({

    // =================================================
    // PAGE
    // =================================================

    page: {
      flex: 1,
      backgroundColor: "#f1f2f4",
    },

    content: {
      padding: 18,
      paddingBottom: 40,
      alignItems: "center",
    },

    // =================================================
    // PAPER
    // =================================================

    paper: {
      width: "100%",
      maxWidth: 900,
      backgroundColor: "#fff",
      padding: 28,
      borderRadius: 8,

      elevation: 3,

      shadowColor: "#000",

      shadowOpacity: 0.08,

      shadowRadius: 8,

      shadowOffset: {
        width: 0,
        height: 3,
      },
    },

    paperMobile: {
      padding: 16,
    },

    // =================================================
    // LOGO
    // =================================================

    logo: {
      width: 140,
      height: 70,
    },

    // =================================================
    // HEADER
    // =================================================

    brandRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",

      borderBottomWidth: 3,
      borderBottomColor: ORANGE,

      paddingBottom: 14,

      gap: 12,
    },

    contact: {
      alignItems: "flex-end",
      flexShrink: 1,
      maxWidth: "65%",
    },

    contactText: {
      fontSize: 10,
      color: "#333",
      textAlign: "right",
      lineHeight: 16,
    },

    // =================================================
    // REFERENCE
    // =================================================

    refRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 14,
    },

    small: {
      fontSize: 11,
      color: "#666",
    },

    // =================================================
    // TITLE
    // =================================================

    offerTitle: {
      textAlign: "center",
      fontSize: 21,
      fontWeight: "800",
      marginVertical: 18,
      color: "#292929",
    },

    // =================================================
    // SECTIONS
    // =================================================

    section: {
      marginBottom: 14,
    },

    sectionTitle: {
      backgroundColor: "#D9E6D9",
      color: "#5C681F",
      fontSize: 12,
      fontWeight: "800",
      padding: 9,
      marginBottom: 8,
    },

    // =================================================
    // INFO
    // =================================================

    infoRow: {
      flexDirection: "row",

      paddingVertical: 5,

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      borderBottomColor: "#ddd",
    },

    infoLabel: {
      width: 110,
      fontWeight: "700",
      fontSize: 12,
      color: "#555",
    },

    infoValue: {
      flex: 1,
      fontSize: 12,
      color: "#222",
    },

    // =================================================
    // TEXT
    // =================================================

    body: {
      fontSize: 12,
      lineHeight: 19,
      color: "#333",
      marginBottom: 3,
    },

    bold: {
      fontWeight: "700",
    },

    // =================================================
    // TABLE
    // =================================================

    tableHead: {
      flexDirection: "row",
      backgroundColor: ORANGE,
    },

    th: {
      padding: 8,
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
    },

    tableRow: {
      flexDirection: "row",
    },

    td: {
      padding: 7,

      borderWidth:
        StyleSheet.hairlineWidth,

      borderColor: "#bbb",

      fontSize: 10,

      color: "#333",
    },

    // =================================================
    // SIGNATURE
    // =================================================

    signature: {
      marginTop: 18,
      lineHeight: 23,
    },

    // =================================================
    // FOOTER
    // =================================================

    footer: {
      borderTopWidth: 1,
      borderTopColor: "#bbb",

      marginTop: 22,

      paddingTop: 10,

      textAlign: "center",

      fontSize: 9,

      lineHeight: 15,

      color: "#666",
    },

    // =================================================
    // ACTIONS
    // =================================================

    actions: {
      width: "100%",
      maxWidth: 900,
      marginTop: 16,
      gap: 10,
    },

    primary: {
      backgroundColor: ORANGE,
      padding: 15,
      borderRadius: 9,
      alignItems: "center",
    },

    secondary: {
      backgroundColor: "#555",
      padding: 15,
      borderRadius: 9,
      alignItems: "center",
    },

    btnText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
    },

    back: {
      padding: 12,
      alignItems: "center",
    },

    backText: {
      color: "#555",
      fontSize: 15,
    },

    // =================================================
    // LOADING
    // =================================================

    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 25,
    },

    loadingText: {
      color: "#777",
      fontSize: 13,
      marginTop: 10,
    },

    emptyText: {
      color: "#555",
      fontSize: 14,
      textAlign: "center",
      marginBottom: 15,
    },

    muted: {
      color: "#777",
      fontSize: 12,
      marginTop: 4,
    },

    // =================================================
    // MODAL
    // =================================================

    overlay: {
      flex: 1,

      backgroundColor:
        "rgba(0,0,0,.5)",

      justifyContent: "center",

      alignItems: "center",

      padding: 20,
    },

    modal: {
      width: "100%",
      maxWidth: 450,

      backgroundColor: "#fff",

      borderRadius: 16,

      padding: 22,
    },

    modalTitle: {
      fontSize: 20,

      fontWeight: "800",

      textAlign: "center",

      marginBottom: 18,
    },

    option: {
      flexDirection: "row",

      alignItems: "center",

      gap: 16,

      backgroundColor: "#f5f5f5",

      padding: 15,

      borderRadius: 10,

      marginBottom: 10,
    },

    optionContent: {
      flex: 1,
    },

    optionTitle: {
      fontSize: 16,

      fontWeight: "700",

      color: "#222",
    },

  });
