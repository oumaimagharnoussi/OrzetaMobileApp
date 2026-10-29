import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  ImageManipulator,
  SaveFormat,
} from "expo-image-manipulator";

// Taille maximale (plus grand côté) de la photo envoyée au serveur :
// suffisant pour lire la carte, et beaucoup plus rapide à envoyer et à lire
const TAILLE_MAX_CARTE = 1400;

// Réduit et compresse la photo sur le téléphone avant l'envoi
async function preparerPhotoCarte(photo) {
  const largeur = photo.width || 0;
  const hauteur = photo.height || 0;

  let contexte = ImageManipulator.manipulate(photo.uri);

  if (Math.max(largeur, hauteur) > TAILLE_MAX_CARTE) {
    contexte =
      largeur >= hauteur
        ? contexte.resize({ width: TAILLE_MAX_CARTE })
        : contexte.resize({ height: TAILLE_MAX_CARTE });
  }

  const image = await contexte.renderAsync();

  const resultat = await image.saveAsync({
    compress: 0.7,
    format: SaveFormat.JPEG,
    base64: true,
  });

  return resultat.base64;
}

import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";
import { Couleurs, ombre, LARGEUR_MAX } from "../constants/couleurs";
import AsyncStorage from "@react-native-async-storage/async-storage";
// =====================================================
// URL BACKEND
// =====================================================

// Adresse du serveur : voir services/api.js (EXPO_PUBLIC_API_URL)
import { API_URL } from "../services/api";
import {
  lecteurCarteDisponible,
  prechargerLecteurCarte,
  lireCarteNavigateur,
} from "../services/lecteurCarte";
// Produits proposés en conditionné : codes de la fiche MOTEUR
// (CPOO, huile de grignons brute, est réservée au vrac)
const PRODUITS_CONDITIONNE = [
  "Extra Virgin Olive Oil – EVOO",
  "Virgin Olive Oil – VOO",
  "Olive Oil – OO",
  "Refined Olive Oil – ROO",
  "Refined Olive Pomace Oil – RPOO",
  "Olive Pomace Oil – POO",
];

// =====================================================
// COMPOSANT
// =====================================================

// =====================================================
// PAYS <-> INDICATIF TÉLÉPHONIQUE
// =====================================================

const PAYS_INDICATIFS = {
  "Afghanistan": "+93",
  "Afrique du Sud": "+27",
  "Albanie": "+355",
  "Algérie": "+213",
  "Allemagne": "+49",
  "Andorre": "+376",
  "Angola": "+244",
  "Antigua-et-Barbuda": "+1",
  "Arabie Saoudite": "+966",
  "Argentine": "+54",
  "Arménie": "+374",
  "Australie": "+61",
  "Autriche": "+43",
  "Azerbaïdjan": "+994",
  "Bahamas": "+1",
  "Bahreïn": "+973",
  "Bangladesh": "+880",
  "Barbade": "+1",
  "Belgique": "+32",
  "Belize": "+501",
  "Bénin": "+229",
  "Bhoutan": "+975",
  "Biélorussie": "+375",
  "Bolivie": "+591",
  "Bosnie-Herzégovine": "+387",
  "Botswana": "+267",
  "Brésil": "+55",
  "Brunei": "+673",
  "Bulgarie": "+359",
  "Burkina Faso": "+226",
  "Burundi": "+257",
  "Cambodge": "+855",
  "Cameroun": "+237",
  "Canada": "+1",
  "Cap-Vert": "+238",
  "Chili": "+56",
  "Chine": "+86",
  "Chypre": "+357",
  "Colombie": "+57",
  "Comores": "+269",
  "Congo": "+242",
  "Costa Rica": "+506",
  "Côte d'Ivoire": "+225",
  "Croatie": "+385",
  "Cuba": "+53",
  "Danemark": "+45",
  "Djibouti": "+253",
  "Dominique": "+1",
  "Égypte": "+20",
  "Émirats Arabes Unis": "+971",
  "Équateur": "+593",
  "Érythrée": "+291",
  "Espagne": "+34",
  "Estonie": "+372",
  "Eswatini": "+268",
  "Éthiopie": "+251",
  "Fidji": "+679",
  "Finlande": "+358",
  "France": "+33",
  "Gabon": "+241",
  "Gambie": "+220",
  "Géorgie": "+995",
  "Ghana": "+233",
  "Grèce": "+30",
  "Grenade": "+1",
  "Guatemala": "+502",
  "Guinée": "+224",
  "Guinée-Bissau": "+245",
  "Guinée équatoriale": "+240",
  "Guyana": "+592",
  "Haïti": "+509",
  "Honduras": "+504",
  "Hongrie": "+36",
  "Inde": "+91",
  "Indonésie": "+62",
  "Irak": "+964",
  "Iran": "+98",
  "Irlande": "+353",
  "Islande": "+354",
  "Israël": "+972",
  "Italie": "+39",
  "Jamaïque": "+1",
  "Japon": "+81",
  "Jordanie": "+962",
  "Kazakhstan": "+7",
  "Kenya": "+254",
  "Kirghizistan": "+996",
  "Koweït": "+965",
  "Laos": "+856",
  "Lettonie": "+371",
  "Liban": "+961",
  "Lesotho": "+266",
  "Liberia": "+231",
  "Libye": "+218",
  "Liechtenstein": "+423",
  "Lituanie": "+370",
  "Luxembourg": "+352",
  "Macédoine du Nord": "+389",
  "Madagascar": "+261",
  "Malaisie": "+60",
  "Malawi": "+265",
  "Maldives": "+960",
  "Mali": "+223",
  "Malte": "+356",
  "Maroc": "+212",
  "Maurice": "+230",
  "Mauritanie": "+222",
  "Mexique": "+52",
  "Moldavie": "+373",
  "Monaco": "+377",
  "Mongolie": "+976",
  "Monténégro": "+382",
  "Mozambique": "+258",
  "Myanmar": "+95",
  "Namibie": "+264",
  "Népal": "+977",
  "Nicaragua": "+505",
  "Niger": "+227",
  "Nigeria": "+234",
  "Norvège": "+47",
  "Nouvelle-Zélande": "+64",
  "Oman": "+968",
  "Ouganda": "+256",
  "Ouzbékistan": "+998",
  "Pakistan": "+92",
  "Panama": "+507",
  "Papouasie-Nouvelle-Guinée": "+675",
  "Paraguay": "+595",
  "Pays-Bas": "+31",
  "Pérou": "+51",
  "Philippines": "+63",
  "Pologne": "+48",
  "Portugal": "+351",
  "Qatar": "+974",
  "République démocratique du Congo": "+243",
  "République dominicaine": "+1",
  "République tchèque": "+420",
  "Roumanie": "+40",
  "Royaume-Uni": "+44",
  "Russie": "+7",
  "Rwanda": "+250",
  "Saint-Kitts-et-Nevis": "+1",
  "Sainte-Lucie": "+1",
  "Saint-Marin": "+378",
  "Saint-Vincent-et-les-Grenadines": "+1",
  "Salvador": "+503",
  "Samoa": "+685",
  "Sénégal": "+221",
  "Serbie": "+381",
  "Seychelles": "+248",
  "Sierra Leone": "+232",
  "Singapour": "+65",
  "Slovaquie": "+421",
  "Slovénie": "+386",
  "Somalie": "+252",
  "Soudan": "+249",
  "Soudan du Sud": "+211",
  "Sri Lanka": "+94",
  "Suède": "+46",
  "Suisse": "+41",
  "Suriname": "+597",
  "Tadjikistan": "+992",
  "Tanzanie": "+255",
  "Thaïlande": "+66",
  "Timor oriental": "+670",
  "Togo": "+228",
  "Tonga": "+676",
  "Trinité-et-Tobago": "+1",
  "Tunisie": "+216",
  "Turkménistan": "+993",
  "Turquie": "+90",
  "Ukraine": "+380",
  "Uruguay": "+598",
  "Vanuatu": "+678",
  "Vatican": "+39",
  "Venezuela": "+58",
  "Viêt Nam": "+84",
  "Yémen": "+967",
  "Zambie": "+260",
  "Zimbabwe": "+263",
  "États-Unis": "+1",
};

// Indicatifs partagés par plusieurs pays : pays proposé par défaut
const PAYS_PAR_DEFAUT = {
  "+1": "États-Unis",
  "+7": "Russie",
  "+39": "Italie",
};

const INDICATIFS_CONNUS = [
  ...new Set(Object.values(PAYS_INDICATIFS)),
].sort((a, b) => b.length - a.length);

function paysDepuisIndicatif(indicatif) {
  if (!indicatif) return null;
  if (PAYS_PAR_DEFAUT[indicatif]) return PAYS_PAR_DEFAUT[indicatif];

  return (
    Object.keys(PAYS_INDICATIFS).find(
      (pays) => PAYS_INDICATIFS[pays] === indicatif
    ) || null
  );
}

// « +33 6 12 34 56 78 » -> { indicatif: "+33", reste: "6 12 34 56 78" }
function decouperNumeroInternational(texte) {
  const m = String(texte || "").match(/^\s*(?:\+|00)\s*([\d\s().-]+)$/);
  if (!m) return null;

  const chiffres = m[1].replace(/\D/g, "");

  const indicatif = INDICATIFS_CONNUS.find((code) =>
    chiffres.startsWith(code.substring(1))
  );

  if (!indicatif) return null;

  // Retirer l'indicatif du numéro saisi
  let aRetirer = indicatif.length - 1;
  let reste = m[1];
  while (aRetirer > 0 && reste.length) {
    if (/\d/.test(reste[0])) aRetirer--;
    reste = reste.substring(1);
  }

  return {
    indicatif,
    reste: reste.replace(/^[\s().-]+/, ""),
  };
}

// =====================================================

// PAYS
// =====================================================

const pays = [
  "Afghanistan",
  "Afrique du Sud",
  "Albanie",
  "Algérie",
  "Allemagne",
  "Andorre",
  "Angola",
  "Antigua-et-Barbuda",
  "Arabie Saoudite",
  "Argentine",
  "Arménie",
  "Australie",
  "Autriche",
  "Azerbaïdjan",
  "Bahamas",
  "Bahreïn",
  "Bangladesh",
  "Barbade",
  "Belgique",
  "Belize",
  "Bénin",
  "Bhoutan",
  "Biélorussie",
  "Bolivie",
  "Bosnie-Herzégovine",
  "Botswana",
  "Brésil",
  "Brunei",
  "Bulgarie",
  "Burkina Faso",
  "Burundi",
  "Cambodge",
  "Cameroun",
  "Canada",
  "Cap-Vert",
  "Chili",
  "Chine",
  "Chypre",
  "Colombie",
  "Comores",
  "Congo",
  "Costa Rica",
  "Côte d'Ivoire",
  "Croatie",
  "Cuba",
  "Danemark",
  "Djibouti",
  "Dominique",
  "Égypte",
  "Émirats Arabes Unis",
  "Équateur",
  "Érythrée",
  "Espagne",
  "Estonie",
  "Eswatini",
  "Éthiopie",
  "Fidji",
  "Finlande",
  "France",
  "Gabon",
  "Gambie",
  "Géorgie",
  "Ghana",
  "Grèce",
  "Grenade",
  "Guatemala",
  "Guinée",
  "Guinée-Bissau",
  "Guinée équatoriale",
  "Guyana",
  "Haïti",
  "Honduras",
  "Hongrie",
  "Inde",
  "Indonésie",
  "Irak",
  "Iran",
  "Irlande",
  "Islande",
  "Israël",
  "Italie",
  "Jamaïque",
  "Japon",
  "Jordanie",
  "Kazakhstan",
  "Kenya",
  "Kirghizistan",
  "Koweït",
  "Laos",
  "Lettonie",
  "Liban",
  "Lesotho",
  "Liberia",
  "Libye",
  "Liechtenstein",
  "Lituanie",
  "Luxembourg",
  "Macédoine du Nord",
  "Madagascar",
  "Malaisie",
  "Malawi",
  "Maldives",
  "Mali",
  "Malte",
  "Maroc",
  "Maurice",
  "Mauritanie",
  "Mexique",
  "Moldavie",
  "Monaco",
  "Mongolie",
  "Monténégro",
  "Mozambique",
  "Myanmar",
  "Namibie",
  "Népal",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "Norvège",
  "Nouvelle-Zélande",
  "Oman",
  "Ouganda",
  "Ouzbékistan",
  "Pakistan",
  "Panama",
  "Papouasie-Nouvelle-Guinée",
  "Paraguay",
  "Pays-Bas",
  "Pérou",
  "Philippines",
  "Pologne",
  "Portugal",
  "Qatar",
  "République démocratique du Congo",
  "République dominicaine",
  "République tchèque",
  "Roumanie",
  "Royaume-Uni",
  "Russie",
  "Rwanda",
  "Saint-Kitts-et-Nevis",
  "Sainte-Lucie",
  "Saint-Marin",
  "Saint-Vincent-et-les-Grenadines",
  "Salvador",
  "Samoa",
  "Sénégal",
  "Serbie",
  "Seychelles",
  "Sierra Leone",
  "Singapour",
  "Slovaquie",
  "Slovénie",
  "Somalie",
  "Soudan",
  "Soudan du Sud",
  "Sri Lanka",
  "Suède",
  "Suisse",
  "Suriname",
  "Tadjikistan",
  "Tanzanie",
  "Thaïlande",
  "Timor oriental",
  "Togo",
  "Tonga",
  "Trinité-et-Tobago",
  "Tunisie",
  "Turkménistan",
  "Turquie",
  "Ukraine",
  "Uruguay",
  "Vanuatu",
  "Vatican",
  "Venezuela",
  "Viêt Nam",
  "Yémen",
  "Zambie",
  "Zimbabwe",
  "États-Unis",
  "Autre",
];

// Liste des pays créée une seule fois (et non à chaque frappe dans le
// formulaire) : les deux listes déroulantes réutilisent ces éléments
const ITEMS_PAYS = pays.map((item) => (
  <Picker.Item key={item} label={item} value={item} />
));

export default function HomeScreen() {
  const router = useRouter();

  // =====================================================
  // INFORMATIONS GÉNÉRALES
  // =====================================================
  const { logout } = useAuth();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [indicatif, setIndicatif] = useState("+216");
  const [scanEnCours, setScanEnCours] = useState(false);
  // Photo de la carte de visite, enregistrée avec le visiteur
  const [carteVisiteImage, setCarteVisiteImage] = useState(null);
  const [carteVisiteQr, setCarteVisiteQr] = useState(null);
  // Visiteur déjà enregistré (retour depuis la page PDF) :
  // un nouvel envoi le modifie au lieu de créer un doublon
  const [visiteurEnregistreId, setVisiteurEnregistreId] = useState(null);
  const [email, setEmail] = useState("");
  const [site, setSite] = useState("");
  const [origine, setOrigine] = useState("");
  const [societe, setSociete] = useState("");
  const [adresseSociete, setAdresseSociete] = useState("");
  const [fonction, setFonction] = useState("");
  const [langueCommunication, setLangueCommunication] = useState("");
  const [genre, setGenre] = useState("");
  const [autreExigence, setAutreExigence] = useState("");
  const [nombreFCL, setNombreFCL] = useState("");
  const [nomLabel, setNomLabel] = useState("");
  const [profilAromatique, setProfilAromatique] = useState({
    fruité: "",
    amer: "",
    piquant: "",
    défaut: "",
  });
  const [demandeEchantillon, setDemandeEchantillon] = useState("non");
  const [adresseEchantillon, setAdresseEchantillon] = useState("");
  const [personneReceptionEchantillon, setPersonneReceptionEchantillon] = useState("");
  const [telReceptionEchantillon, setTelReceptionEchantillon] = useState("");
  const [certifications, setCertifications] = useState([]);

const [typeEtiquette, setTypeEtiquette] = useState("");
const [typeEtiquetteConditionne, setTypeEtiquetteConditionne] = useState("");


  const handleLogout = () => {
    logout();
    router.replace("/auth/login");
  };
  // =====================================================
  // AUTRE EMBALLAGE PAR TYPE
  // =====================================================

  const [autresSelectionnes, setAutresSelectionnes] = useState({
    Tin: false,
    PET: false,
    Glass: false,
    BaginBox: false,
  });

  const [autresEmballages, setAutresEmballages] = useState({
    Tin: "",
    PET: "",
    Glass: "",
    BaginBox: "",
  });

  const [nouvelleMarqueAutresFormats, setNouvelleMarqueAutresFormats] =
  useState({
    Tin: "",
    PET: "",
    Glass: "",
    BaginBox: "",
  });

  const toggleFormatEmballage = (type, format) => {
    setNouvelleMarqueFormatsEmballage((prev) => {
      const formatsActuels = Array.isArray(prev[type])
        ? prev[type]
        : [];
  
      const dejaSelectionne = formatsActuels.includes(format);
  
      return {
        ...prev,
        [type]: dejaSelectionne
          ? formatsActuels.filter((item) => item !== format)
          : [...formatsActuels, format],
      };
    });
  };
const toggleFormatNouvelleMarque = (
  type,
  format,
  sousType = null
) => {
  setNouvelleMarqueFormatsEmballage((prev) => {
    // CAS GLASS : formats classés par marque
    if (type === "Glass" && sousType) {
      const formatsGlass = prev.Glass || {};
      const formatsMarque = formatsGlass[sousType] || [];

      const nouveauxFormats = formatsMarque.includes(format)
        ? formatsMarque.filter((item) => item !== format)
        : [...formatsMarque, format];

      return {
        ...prev,
        Glass: {
          ...formatsGlass,
          [sousType]: nouveauxFormats,
        },
      };
    }

    // CAS TIN, PET et autres formats simples
    const formats = Array.isArray(prev[type])
      ? prev[type]
      : [];

    const nouveauxFormats = formats.includes(format)
      ? formats.filter((item) => item !== format)
      : [...formats, format];

    return {
      ...prev,
      [type]: nouveauxFormats,
    };
  });
};

const renderFormatCheckbox = (type, format, sousType = null) => {
  const formatsType = nouvelleMarqueFormatsEmballage?.[type];

  let selected = false;

  // =================================================
  // GLASS > MARASCA / DORICA
  // =================================================
  if (sousType) {
    selected =
      formatsType &&
      typeof formatsType === "object" &&
      !Array.isArray(formatsType) &&
      Array.isArray(formatsType[sousType])
        ? formatsType[sousType].includes(format)
        : false;
  }

  // =================================================
  // GLASS > AUTRE
  // =================================================
  else if (type === "Glass") {
    const formatsGeneraux =
      formatsType &&
      typeof formatsType === "object" &&
      !Array.isArray(formatsType) &&
      Array.isArray(formatsType.formats)
        ? formatsType.formats
        : [];

    selected = formatsGeneraux.includes(format);
  }

  // =================================================
  // TIN / PET
  // =================================================
  else {
    const formatsGeneraux = Array.isArray(formatsType)
      ? formatsType
      : [];

    selected = formatsGeneraux.includes(format);
  }

  // =================================================
  // TOGGLE
  // =================================================
  const toggleFormat = () => {
    setNouvelleMarqueFormatsEmballage((prev) => {
      const current = prev?.[type];

      // =================================================
      // MARASCA / DORICA
      // =================================================
      if (sousType) {
        const currentObject =
          current &&
          typeof current === "object" &&
          !Array.isArray(current)
            ? current
            : {};

        const currentSousType = Array.isArray(
          currentObject[sousType]
        )
          ? currentObject[sousType]
          : [];

        const updatedSousType = currentSousType.includes(format)
          ? currentSousType.filter(
              (item) => item !== format
            )
          : [...currentSousType, format];

        return {
          ...prev,
          [type]: {
            ...currentObject,
            [sousType]: updatedSousType,
          },
        };
      }

      // =================================================
      // GLASS > AUTRE
      // =================================================
      if (type === "Glass") {
        const currentObject =
          current &&
          typeof current === "object" &&
          !Array.isArray(current)
            ? current
            : {};

        const currentFormats = Array.isArray(
          currentObject.formats
        )
          ? currentObject.formats
          : [];

        const updatedFormats = currentFormats.includes(format)
          ? currentFormats.filter(
              (item) => item !== format
            )
          : [...currentFormats, format];

        return {
          ...prev,
          [type]: {
            ...currentObject,
            formats: updatedFormats,
          },
        };
      }

      // =================================================
      // TIN / PET
      // =================================================
      const currentFormats = Array.isArray(current)
        ? current
        : [];

      const updatedFormats = currentFormats.includes(format)
        ? currentFormats.filter(
            (item) => item !== format
          )
        : [...currentFormats, format];

      return {
        ...prev,
        [type]: updatedFormats,
      };
    });
  };

  return (
    <TouchableOpacity
      key={`${type}-${sousType || "general"}-${format}`}
      style={styles.formatCheckboxContainer}
      onPress={toggleFormat}
      activeOpacity={0.7}
    >
      <Text style={styles.formatCheckbox}>
        {selected ? "☑" : "☐"}
      </Text>

      <Text style={styles.formatCheckboxLabel}>
        {format}
      </Text>
    </TouchableOpacity>
  );
};
  // =====================================================
  // PROFILE
  // =====================================================

  const [profile, setProfile] = useState("");

  // =====================================================
  // TYPE COMMANDE
  // =====================================================

  const [typeCommande, setTypeCommande] = useState("");

  // Commandes déjà enregistrées dans la fiche du visiteur.
  // Toutes les commandes gardent le même type (vrac OU conditionné).
  const [commandes, setCommandes] = useState([]);

  // =====================================================
  // VRAC
  // =====================================================

  const [categorie, setCategorie] = useState("");
  const [qualiteGrade, setQualiteGrade] = useState("");
  const [volumeEstime, setVolumeEstime] = useState("");
  const [destination, setDestination] = useState("");
  const [destinationport, setDestinationport] = useState("");
  const [incoterm, setIncoterm] = useState("EXW");
  const [formatLivraison, setFormatLivraison] = useState("");
  const [frequenceCommande, setFrequenceCommande] = useState("");
  const [periodeRecurrence, setPeriodeRecurrence] = useState("");
  const [nombreCommandesRecurrence, setNombreCommandesRecurrence] = useState("");
  const [exigencesSpecifiques, setExigencesSpecifiques] = useState([]);
  const [informationsComplementaires, setInformationsComplementaires] =
    useState("");

  // =====================================================
  // CONDITIONNÉ
  // =====================================================

  const [paysConditionne, setPaysConditionne] = useState("");
  const [canalDistribution, setCanalDistribution] = useState("");
  const [autreCanalDistribution, setAutreCanalDistribution] = useState("");
  const [typeVolumeEstime, setTypeVolumeEstime] = useState("");
const [volumesEstimes, setVolumesEstimes] = useState("");
const [autreVolumeEstime, setAutreVolumeEstime] = useState("");

  // Type d'emballage CONDITIONNÉ
  const [typeEmballage, setTypeEmballage] = useState("");
  const [formatsSouhaites, setFormatsSouhaites] = useState("");

  // Sélection multiple des emballages CONDITIONNÉ
  const [emballagesSelectionnes, setEmballagesSelectionnes] = useState([]);
  const [formatsEmballage, setFormatsEmballage] = useState({});

  // Ancien Autre global conservé pour compatibilité
  const [autreEmballage, setAutreEmballage] = useState("");

  const [typeMarque, setTypeMarque] = useState("");
  const [certificationsRequises, setCertificationsRequises] = useState([]);
  const [autreCertification, setAutreCertification] = useState("");
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [siteWeb, setSiteWeb] = useState("");
  const [contactProfessionnel, setContactProfessionnel] = useState("");

  // =====================================================
  // QUANTITÉ DE LA COMMANDE
  // =====================================================

  const [quantiteCommande, setQuantiteCommande] = useState("");
  const [nombrePalettes, setNombrePalettes] = useState("");

  // =====================================================
  // NOUVELLE MARQUE
  // =====================================================

  const [marcheCible, setMarcheCible] = useState("");
  const [quantitePrevue, setQuantitePrevue] = useState("");


  const [k232Selection, setK232Selection] = useState(false);
const [k270Selection, setK270Selection] = useState(false);

const [k232Valeur, setK232Valeur] = useState("");
const [k270Valeur, setK270Valeur] = useState("");
  // =====================================================
  // NOUVELLE MARQUE
  // EMBALLAGE ET FORMATS INDÉPENDANTS
  // =====================================================

  const [
    nouvelleMarqueEmballagesSelectionnes,
    setNouvelleMarqueEmballagesSelectionnes,
  ] = useState([]);

  const [nouvelleMarqueFormatsEmballage, setNouvelleMarqueFormatsEmballage] =
  useState({
    Tin: [],
    PET: [],
    Glass: {
      MARASCA: [],
      DORICA: [],
      formats: [],
    },
    BaginBox: [],
    Autre: [],
  });

  const [nouvelleMarqueAutreEmballage, setNouvelleMarqueAutreEmballage] =
    useState("");

  // =====================================================
  // GESTION DE PLUSIEURS COMMANDES
  // =====================================================

  const resetCommandeFields = () => {
    // VRAC
    setCategorie("");
    setQualiteGrade("");
    setGenre("");
    setVolumeEstime("");
    setDestination("");
    setDestinationport("");
    setIncoterm("");
    setFormatLivraison("");
    setFrequenceCommande("");
    setPeriodeRecurrence("");
    setNombreCommandesRecurrence("");
    setExigencesSpecifiques([]);
    setCertificationsRequises([]);
    setAutreCertification("");
    setInformationsComplementaires("");
    setAutreExigence("");
    setProfilAromatique({
      fruité: "",
      amer: "",
      piquant: "",
      défaut: "",
    });

    // CONDITIONNÉ
    setPaysConditionne("");
    setCanalDistribution("");
    setAutreCanalDistribution("");
    setTypeVolumeEstime("");
    setVolumesEstimes("");
    setAutreVolumeEstime("");
    setTypeEmballage("");
    setFormatsSouhaites("");
    setEmballagesSelectionnes([]);
    setFormatsEmballage({});
    setAutreEmballage("");
    setAutresSelectionnes({
      Tin: false,
      PET: false,
      Glass: false,
      BaginBox: false,
    });
    setAutresEmballages({
      Tin: "",
      PET: "",
      Glass: "",
      BaginBox: "",
    });

    setTypeMarque("");
    setTypeEtiquette("");
    setTypeEtiquetteConditionne("");
    setNomLabel("");
    setCertificationsRequises([]);
    setAutreCertification("");
    setNomEntreprise("");
    setSiteWeb("");
    setContactProfessionnel("");

    // QUANTITÉ
    setQuantiteCommande("");
    setNombreFCL("");
    setNombrePalettes("");

    // NOUVELLE MARQUE
    setMarcheCible("");
    setQuantitePrevue("");
    setNouvelleMarqueEmballagesSelectionnes([]);
    setNouvelleMarqueFormatsEmballage({
      Tin: [],
      PET: [],
      Glass: {
        MARASCA: [],
        DORICA: [],
        formats: [],
      },
      BaginBox: [],
      Autre: [],
    });
    setNouvelleMarqueAutresFormats({
      Tin: "",
      PET: "",
      Glass: "",
      BaginBox: "",
    });
    setNouvelleMarqueAutreEmballage("");

    setK232Selection(false);
setK270Selection(false);

setK232Valeur("");
setK270Valeur("");
  };


 
  // =====================================================
  // QUALIFICATION DU VISITEUR
  // =====================================================

  const [qualification, setQualification] = useState(0);


  // =====================================================
  // CHANGEMENT PAYS
  // =====================================================

  const handlePaysChange = (value) => {
    setOrigine(value);
    setIndicatif(PAYS_INDICATIFS[value] || "");
  };

  // =====================================================
  // TÉLÉPHONE -> ORIGINE / PAYS
  // =====================================================

  const handleTelephoneChange = (texte) => {
    // Numéro international (+33…, 0033…) : indicatif et pays détectés
    const international = decouperNumeroInternational(texte);

    if (international) {
      setIndicatif(international.indicatif);
      setOrigine(paysDepuisIndicatif(international.indicatif) || origine);
      setTelephone(international.reste);
      return;
    }

    setTelephone(texte);

    // Numéro local : le pays est celui de l'indicatif affiché
    if (!origine && texte.replace(/\D/g, "").length >= 6) {
      const pays = paysDepuisIndicatif(indicatif);
      if (pays) setOrigine(pays);
    }
  };

  // =====================================================
  // CHANGEMENT PROFILE
  // =====================================================

  const handleProfileChange = (value) => {
    setProfile(value);

    if (value !== "intermediaire" && value !== "acheteur") {
      setTypeCommande("");
      setCommandes([]);

      // VRAC
      setCategorie("");
      setQualiteGrade("");
      setVolumeEstime("");
      setDestination("");
      setIncoterm("");
      setFormatLivraison("");
      setFrequenceCommande("");
      setPeriodeRecurrence("");
      setNombreCommandesRecurrence("");
      setExigencesSpecifiques([]);
      setInformationsComplementaires("");

      // CONDITIONNÉ
      setPaysConditionne("");
      setCanalDistribution("");
      setVolumesEstimes("");
      setTypeEmballage("");
      setFormatsSouhaites("");
      setEmballagesSelectionnes([]);
      setFormatsEmballage({});
      setAutreEmballage("");

      // AUTRES PAR TYPE
      setAutresSelectionnes({
        Tin: false,
        PET: false,
        Glass: false,
        BaginBox: false,
      });

      setAutresEmballages({
        Tin: "",
        PET: "",
        Glass: "",
        BaginBox: "",
      });

      setTypeMarque("");
      setCertificationsRequises([]);
      setNomEntreprise("");
      setSiteWeb("");
      setContactProfessionnel("");

      // QUANTITÉ
      setQuantiteCommande("");
      setNombrePalettes("");

      // NOUVELLE MARQUE
      setMarcheCible("");
      setQuantitePrevue("");
      setNouvelleMarqueEmballagesSelectionnes([]);
      setNouvelleMarqueFormatsEmballage({});
      setNouvelleMarqueAutreEmballage("");
    }
  };

  // =====================================================
  // CHANGEMENT TYPE COMMANDE
  // =====================================================

  const handleTypeCommandeChange = (value) => {
    setTypeCommande(value);
    // Un changement de type démarre une nouvelle série de commandes.
    // Il est donc impossible de mélanger Vrac et Conditionné.
    setCommandes([]);
    resetCommandeFields();
  
    // ======================================================
    // Si on choisit CONDITIONNÉ
    // → on nettoie tous les champs VRAC
    // ======================================================
    if (value === "conditionné") {
      setCategorie("");
      setQualiteGrade("");
      setVolumeEstime("");
      setDestination("");
      setIncoterm("");
      setFormatLivraison("");
      setFrequenceCommande("");
      setPeriodeRecurrence("");
      setNombreCommandesRecurrence("");
      setExigencesSpecifiques([]);
      setInformationsComplementaires("");
    }
  
    // ======================================================
    // Si on choisit VRAC
    // → on nettoie tous les champs CONDITIONNÉ
    // ======================================================
    if (value === "vrac") {
      setPaysConditionne("");
      setCanalDistribution("");
      setVolumesEstimes("");
      setTypeEmballage("");
      setFormatsSouhaites("");
  
      setEmballagesSelectionnes([]);
      setFormatsEmballage({});
      setAutreEmballage("");
  
      setAutresSelectionnes({
        Tin: false,
        PET: false,
        Glass: false,
        BaginBox: false,
      });
  
      setAutresEmballages({
        Tin: "",
        PET: "",
        Glass: "",
        BaginBox: "",
      });
  
      setTypeMarque("");
      setCertificationsRequises([]);
      setNomEntreprise("");
      setSiteWeb("");
      setContactProfessionnel("");
  
      setQuantiteCommande("");
      setNombrePalettes("");
  
      setMarcheCible("");
      setQuantitePrevue("");
  
      setNouvelleMarqueEmballagesSelectionnes([]);
      setNouvelleMarqueFormatsEmballage({});
      setNouvelleMarqueAutreEmballage("");
    }
  };

  // =====================================================
  // AJOUT / SUPPRESSION EMBALLAGE CONDITIONNÉ
  // =====================================================


  
// Un seul type d'emballage : choisir un autre type (ou désélectionner)
// efface les formats et les « Autre » du choix précédent, sinon la
// fiche PDF afficherait encore l'ancien emballage.
const toggleEmballageConditionne = (type) => {
  setEmballagesSelectionnes((prev) =>
    prev.includes(type) ? [] : [type]
  );

  setFormatsEmballage({});

  setAutresSelectionnes({
    Tin: false,
    PET: false,
    Glass: false,
    BaginBox: false,
  });

  setAutresEmballages({
    Tin: "",
    PET: "",
    Glass: "",
    BaginBox: "",
  });

  setAutreEmballage("");
};

  // =====================================================
  // AJOUT / SUPPRESSION EMBALLAGE NOUVELLE MARQUE
  // =====================================================

  const toggleEmballageNouvelleMarque = (type) => {
    if (nouvelleMarqueEmballagesSelectionnes.includes(type)) {
      setNouvelleMarqueEmballagesSelectionnes(
        nouvelleMarqueEmballagesSelectionnes.filter(
          (item) => item !== type
        )
      );

      setNouvelleMarqueFormatsEmballage((prev) => {
        const updated = { ...prev };
        delete updated[type];
        return updated;
      });

      if (type === "Autre") {
        setNouvelleMarqueAutreEmballage("");
      }
    } else {
      setNouvelleMarqueEmballagesSelectionnes([
        ...nouvelleMarqueEmballagesSelectionnes,
        type,
      ]);
    }
  };

  // =====================================================
  // TEST CONNEXION BACKEND
  // =====================================================

  const testerConnexion = async () => {
    try {
      console.log(
        "Test connexion vers :",
        `${API_URL}/`
      );

      const response = await fetch(`${API_URL}/`);
      const data = await response.json();

      console.log(
        "Réponse backend :",
        data
      );

      if (response.ok) {
        Alert.alert(
          "Connexion réussie",
          "Le frontend communique correctement avec le backend."
        );
      } else {
        Alert.alert(
          "Erreur",
          "Le backend a répondu avec une erreur."
        );
      }
    } catch (error) {
      console.error(
        "Erreur connexion :",
        error
      );

      Alert.alert(
        "Backend inaccessible",
        `Impossible de contacter le serveur.\n\n${API_URL}\n\nVérifie que le backend est démarré et que le téléphone est sur le même Wi-Fi que le PC.`
      );
    }
  };

  // =====================================================
  // AJOUTER VISITEUR
  // =====================================================

  // =====================================================
  // CONSTRUCTION DE LA COMMANDE COURANTE
  // =====================================================

  const construireCommandeCourante = () => {
    if (!typeCommande) return null;
  
    const exigencesSpecifiquesFinales = [
      ...(exigencesSpecifiques || []).filter((item) => item !== "Autre"),
      ...(exigencesSpecifiques?.includes("Autre") && autreExigence?.trim()
        ? [autreExigence.trim()]
        : []),
    ];
  
    const certificationsRequisesFinales = [
      ...(certificationsRequises || []).filter(
        (item) => item !== "Autre"
      ),
      ...(certificationsRequises?.includes("Autre") &&
      autreCertification?.trim()
        ? [autreCertification.trim()]
        : []),
    ];
  
    let typeEmballageData = null;
  
    if (
      typeCommande === "conditionné" &&
      emballagesSelectionnes?.length > 0
    ) {
      typeEmballageData = {
        emballages: emballagesSelectionnes,
        autres: {
          Tin: autresSelectionnes?.Tin
            ? autresEmballages?.Tin?.trim() || ""
            : "",
          PET: autresSelectionnes?.PET
            ? autresEmballages?.PET?.trim() || ""
            : "",
          Glass: autresSelectionnes?.Glass
            ? autresEmballages?.Glass?.trim() || ""
            : "",
          BaginBox: autresSelectionnes?.BaginBox
            ? autresEmballages?.BaginBox?.trim() || ""
            : "",
          Autre: emballagesSelectionnes.includes("Autre")
            ? autreEmballage?.trim() || ""
            : "",
        },
      };
    }
  
    const packagingData =
      typeCommande === "conditionné" &&
      formatsEmballage &&
      Object.keys(formatsEmballage).length > 0
        ? formatsEmballage
        : null;
  
    let nouvelleMarqueFormatsData = null;
  
    if (
      typeCommande === "conditionné" &&
      typeMarque === "Création de nouvelle marque"
    ) {
      nouvelleMarqueFormatsData = {
        emballages: nouvelleMarqueEmballagesSelectionnes || [],
        formats: nouvelleMarqueFormatsEmballage || {},
        autres_formats: nouvelleMarqueAutresFormats || {},
        autre: nouvelleMarqueAutreEmballage?.trim() || null,
      };
    }
  
    return {
      type_commande: typeCommande,
  
      // =========================
      // VRAC
      // =========================
  
      // Vrac : catégorie ; conditionné : produit de la fiche MOTEUR
      categorie: categorie?.trim() || null,
  
      qualite_grade:
        typeCommande === "vrac"
          ? qualiteGrade?.trim() || null
          : null,

      // Genre de l'huile (Conventionnelle / Biologique) : propre à la commande
      genre:
        typeCommande === "vrac"
          ? genre?.trim() || null
          : null,
  
      volume_estime:
        typeCommande === "vrac" &&
        volumeEstime?.trim() &&
        !isNaN(Number(volumeEstime))
          ? Number(volumeEstime)
          : null,
  
      destination:
        typeCommande === "vrac"
          ? destination?.trim() || null
          : null,
  
      destinationport:
        typeCommande === "vrac"
          ? destinationport?.trim() || null
          : null,
  
      incoterm:
        typeCommande === "vrac"
          ? incoterm || null
          : null,
  
      format_livraison:
        typeCommande === "vrac"
          ? formatLivraison || null
          : null,
  
      frequence_commande:
        typeCommande === "vrac"
          ? frequenceCommande || null
          : null,

      periode_recurrence:
        typeCommande === "vrac" &&
        frequenceCommande === "recurrence"
          ? periodeRecurrence || null
          : null,

      nombre_commandes_recurrence:
        typeCommande === "vrac" &&
        frequenceCommande === "recurrence" &&
        nombreCommandesRecurrence?.trim() &&
        !isNaN(Number(nombreCommandesRecurrence))
          ? Number(nombreCommandesRecurrence)
          : null,
  
      exigences_specifiques:
        typeCommande === "vrac" &&
        exigencesSpecifiquesFinales.length > 0
          ? exigencesSpecifiquesFinales
          : null,
  
      informations_complementaires:
        typeCommande === "vrac"
          ? informationsComplementaires?.trim() || null
          : null,
  
      profil_aromatique:
        typeCommande === "vrac"
          ? profilAromatique || null
          : null,
  
      certifications_requises:
        certificationsRequisesFinales.length > 0
          ? certificationsRequisesFinales
          : certifications.length > 0
            ? certifications
            : null,
  
      // =========================
      // CONDITIONNÉ
      // =========================
  
      pays_conditionne:
        typeCommande === "conditionné"
          ? paysConditionne || null
          : null,
  
      canal_distribution:
        typeCommande === "conditionné"
          ? canalDistribution === "Autre"
            ? autreCanalDistribution?.trim() || null
            : canalDistribution || null
          : null,
  
      volumes_estimes:
        typeCommande === "conditionné"
          ? volumesEstimes?.trim() || null
          : null,
  
      periode_volume:
        typeCommande === "conditionné"
          ? typeVolumeEstime || null
          : null,
  
      // =========================
      // EMBALLAGES
      // =========================
  
      type_emballage: typeEmballageData,
  
      packaging: packagingData,
  
      formats_souhaites:
        typeCommande === "conditionné"
          ? formatsSouhaites || null
          : null,
  
      // =========================
      // MARQUE
      // =========================
  
      type_marque:
        typeCommande === "conditionné"
          ? typeMarque || null
          : null,
      
          type_etiquette:
          typeCommande === "conditionné" &&
          typeMarque === "Marque ORZETA"
            ? typeEtiquette || null
            : null,

      type_etiquette_conditionne:
        typeCommande === "conditionné"
          ? typeEtiquetteConditionne || null
          : null,
  
      nom_label:
        typeCommande === "conditionné" &&
        typeMarque === "Private Label"
          ? nomLabel?.trim() || null
          : null,
  
      nom_entreprise:
        typeCommande === "conditionné"
          ? nomEntreprise?.trim() || null
          : null,
  
      site_web:
        typeCommande === "conditionné"
          ? siteWeb?.trim() || null
          : null,
  
      contact_professionnel:
        typeCommande === "conditionné"
          ? contactProfessionnel?.trim() || null
          : null,
  
      // =========================
      // QUANTITÉ
      // =========================
  
      quantite_commande:
        typeCommande === "conditionné"
          ? quantiteCommande || null
          : null,
  
      nombre_fcl:
        typeCommande === "conditionné" &&
        (quantiteCommande === "conteneur_20" ||
          quantiteCommande === "conteneur_40") &&
        nombreFCL?.trim() &&
        !isNaN(Number(nombreFCL))
          ? Number(nombreFCL)
          : null,
  
      nombre_palettes:
        typeCommande === "conditionné" &&
        quantiteCommande === "palettes" &&
        nombrePalettes?.trim() &&
        !isNaN(Number(nombrePalettes))
          ? Number(nombrePalettes)
          : null,
  
      // =========================
      // NOUVELLE MARQUE
      // =========================
  
      marche_cible:
        typeCommande === "conditionné" &&
        typeMarque === "Création de nouvelle marque"
          ? marcheCible?.trim() || null
          : null,
  
      quantite_prevue:
        typeCommande === "conditionné" &&
        typeMarque === "Création de nouvelle marque"
          ? quantitePrevue?.trim() || null
          : null,
  
      nouvelle_marque_formats:
        typeCommande === "conditionné" &&
        typeMarque === "Création de nouvelle marque"
          ? nouvelleMarqueFormatsData
          : null,
  
      nouvelle_marque_design_conditionnement:
        typeCommande === "conditionné" &&
        typeMarque === "Création de nouvelle marque"
          ? {
              emballages: nouvelleMarqueEmballagesSelectionnes || [],
              autre: nouvelleMarqueAutreEmballage?.trim() || null,
            }
          : null,
  
      // =========================
      // K232 / K270
      // =========================
  
      k232_demande: k232Selection ? 1 : 0,
  
      k232_valeur:
        k232Selection
          ? k232Valeur || null
          : null,
  
      k270_demande: k270Selection ? 1 : 0,
  
      k270_valeur:
        k270Selection
          ? k270Valeur || null
          : null,
    };
  };

  /*const commandeCouranteEstRenseignee = () => {
    if (!typeCommande) return false;

    if (typeCommande === "vrac") {
      return Boolean(
        categorie?.trim() ||
        qualiteGrade?.trim() ||
        volumeEstime?.trim() ||
        destination?.trim() ||
        destinationport?.trim() ||
        incoterm ||
        formatLivraison ||
        frequenceCommande ||
        exigencesSpecifiques?.length ||
        informationsComplementaires?.trim() ||
        demandeEchantillon === "oui" ||
        k232Selection ||
        k270Selection
      );
    }

    return Boolean(
      paysConditionne ||
      canalDistribution ||
      autreCanalDistribution?.trim() ||
      volumesEstimes?.trim() ||
      typeVolumeEstime ||
      emballagesSelectionnes?.length ||
      formatsSouhaites ||
      typeMarque ||
      certificationsRequises?.length ||
      nomEntreprise?.trim() ||
      siteWeb?.trim() ||
      contactProfessionnel?.trim() ||
      quantiteCommande ||
      nombreFCL?.trim() ||
      nombrePalettes?.trim() ||
      marcheCible?.trim() ||
      quantitePrevue?.trim() ||
      demandeEchantillon === "oui" ||
      k232Selection ||
      k270Selection
    );
  };*/
  const commandeCouranteEstRenseignee = () => {
    // Le choix du type de commande suffit pour considérer
    // la commande comme créée.
    if (!typeCommande) return false;
  
    return true;
  };

  // =====================================================
  // AJOUTER UNE COMMANDE
  // =====================================================

  const handleAjouterCommande = () => {
    if (!typeCommande) {
      Alert.alert(
        "Attention",
        "Veuillez sélectionner un type de commande."
      );
      return;
    }

    if (!commandeCouranteEstRenseignee()) {
      Alert.alert(
        "Attention",
        "Veuillez renseigner les informations de la commande avant de l'ajouter."
      );
      return;
    }

    if (commandes.length > 0) {
      const typeExistant = commandes[0]?.type_commande;

      if (typeExistant && typeExistant !== typeCommande) {
        Alert.alert(
          "Type de commande incompatible",
          "Vous ne pouvez pas mélanger les commandes Vrac et Conditionné dans la même fiche visiteur."
        );
        return;
      }
    }

    const nouvelleCommande = construireCommandeCourante();

    if (!nouvelleCommande) {
      Alert.alert("Erreur", "Impossible de construire la commande.");
      return;
    }

    console.log("=======================================");
    console.log("📦 COMMANDE AJOUTÉE");
    console.log(JSON.stringify(nouvelleCommande, null, 2));
    console.log("=======================================");

    setCommandes((prev) => [...(prev || []), nouvelleCommande]);

    // IMPORTANT : on garde typeCommande pour permettre d'ajouter
    // une deuxième commande du même type.
    resetCommandeFields();

    Alert.alert(
      "Commande ajoutée",
      `Commande ${commandes.length + 1} ajoutée. Vous pouvez saisir une autre commande ${
        typeCommande === "vrac" ? "Vrac" : "Conditionnée"
      } ou cliquer sur « Traitement de commande ».`
    );
  };

  // =====================================================
  // AJOUTER VISITEUR
  // =====================================================


// Seuls ces profils passent par la page PDF (traitement de commande).
// Tous les autres (y compris aucun profil) sont enregistrés directement.
const PROFILS_AVEC_PDF = [
  "intermediaire",
  "acheteur",
];

// Alert.alert ne s'affiche pas sur le web
const afficherMessage = (titre, message) => {
  if (Platform.OS === "web") {
    window.alert(`${titre}\n\n${message}`);
  } else {
    Alert.alert(titre, message);
  }
};

// =====================================================
// SCANNER UNE CARTE DE VISITE
// =====================================================

// Choix : prendre une photo ou choisir une photo existante
const choisirSourceCarte = () => {
  // Charger le lecteur pendant que l'utilisateur prend la photo
  prechargerLecteurCarte();

  // Sur le web, le navigateur du téléphone propose lui-même
  // « Prendre une photo » ou « Photothèque »
  if (Platform.OS === "web") {
    scannerCarteVisite("galerie");
    return;
  }

  Alert.alert(
    "Carte de visite",
    "Comment voulez-vous ajouter la carte ?",
    [
      {
        text: "Prendre une photo",
        onPress: () => scannerCarteVisite("camera"),
      },
      {
        text: "Choisir une photo existante",
        onPress: () => scannerCarteVisite("galerie"),
      },
      { text: "Annuler", style: "cancel" },
    ]
  );
};

const scannerCarteVisite = async (source = "camera") => {
  try {
    if (Platform.OS !== "web") {
      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        afficherMessage(
          source === "camera" ? "Caméra" : "Photos",
          source === "camera"
            ? "Autorisez l'accès à la caméra pour scanner une carte de visite."
            : "Autorisez l'accès aux photos pour choisir une carte de visite."
        );
        return;
      }
    }

    const options = {
      mediaTypes: ["images"],
      // La photo est réduite ensuite par preparerPhotoCarte
      quality: 1,
    };

    const resultat =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (resultat.canceled || !resultat.assets?.length) {
      return;
    }

    const photo = resultat.assets[0];

    setScanEnCours(true);

    const imageBase64 = await preparerPhotoCarte(photo);

    if (!imageBase64) {
      throw new Error("Photo illisible.");
    }

    const token = await AsyncStorage.getItem("token");

    const appelServeur = async (chemin, corps) => {
      const reponse = await fetch(`${API_URL}${chemin}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(corps),
      });

      return { response: reponse, data: await reponse.json() };
    };

    let lecture = null;

    // Web : le téléphone lit la carte lui-même (rapide), le serveur
    // trie seulement le texte. En cas d'échec, lecture par le serveur.
    if (lecteurCarteDisponible) {
      try {
        const { lignes, qr } = await lireCarteNavigateur(imageBase64);

        lecture = await appelServeur(
          "/api/carte-visite/analyser",
          { lignes, qr }
        );
      } catch (erreurNavigateur) {
        console.warn(
          "Lecture dans le navigateur impossible, lecture par le serveur :",
          erreurNavigateur
        );
        lecture = null;
      }
    }

    if (!lecture?.response?.ok) {
      lecture = await appelServeur(
        "/api/carte-visite/scan",
        { imageBase64 }
      );
    }

    const { response, data } = lecture;

    if (!response.ok || !data.success) {
      throw new Error(
        data?.message || "Impossible de lire la carte."
      );
    }

    const c = data.champs || {};

    // Garder la photo pour l'enregistrer avec le visiteur
    setCarteVisiteImage(imageBase64);
    setCarteVisiteQr(data.qr || null);

    // Ne remplir que les champs détectés
    // Le champ « Nom et Prénom » reçoit le nom complet
    const nomComplet = [c.prenom, c.nom]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (nomComplet) setNom(nomComplet);
    if (c.email) setEmail(c.email);
    if (c.indicatif) {
      setIndicatif(c.indicatif);

      const pays = paysDepuisIndicatif(c.indicatif);
      if (pays) setOrigine(pays);
    }

    if (c.telephone) {
      if (c.indicatif) {
        setTelephone(c.telephone);
      } else {
        // Détecte aussi le pays depuis le numéro
        handleTelephoneChange(c.telephone);
      }
    }
    if (c.site) setSite(c.site);
    if (c.societe) setSociete(c.societe);
    if (c.fonction) setFonction(c.fonction);
    if (c.adresse_societe) setAdresseSociete(c.adresse_societe);

    const nbChamps = Object.values(c).filter(Boolean).length;

    afficherMessage(
      nbChamps ? "Carte lue" : "Carte non reconnue",
      nbChamps
        ? `${nbChamps} champ(s) rempli(s)${data.qr ? " (QR code lu)" : ""}. Vérifiez les informations avant d'ajouter le visiteur.`
        : "Aucune information détectée. Reprenez la photo bien à plat, nette et bien éclairée."
    );
  } catch (error) {
    console.error("ERREUR SCAN CARTE :", error);

    afficherMessage(
      "Erreur",
      error?.message || "Impossible de scanner la carte de visite."
    );
  } finally {
    setScanEnCours(false);
  }
};

// =====================================================
// VIDER LE FORMULAIRE (nouveau visiteur)
// =====================================================

const reinitialiserFormulaire = () => {
  setNom("");
  setPrenom("");
  setTelephone("");
  setEmail("");
  setSite("");
  setOrigine("");
  setIndicatif("+216");
  setSociete("");
  setAdresseSociete("");
  setFonction("");
  setLangueCommunication("");
  setGenre("");
  setProfile("");
  setTypeCommande("");
  setCommandes([]);
  setQualification(0);
  setDemandeEchantillon("non");
  setAdresseEchantillon("");
  setPersonneReceptionEchantillon("");
  setTelReceptionEchantillon("");
  setCarteVisiteImage(null);
  setCarteVisiteQr(null);
  setVisiteurEnregistreId(null);

  resetCommandeFields();
};

const handleAjouter = async () => {
  const sansPdf =
    !PROFILS_AVEC_PDF.includes(profile);

  try {
    // =====================================================
    // COMMANDES
    // =====================================================

    const commandesFinales = [...(commandes || [])];

    console.log("=======================================");
    console.log("📋 PRÉPARATION VISITEUR");
    console.log("TYPE COMMANDE :", typeCommande || "AUCUN");
    console.log(
      "COMMANDE RENSEIGNÉE :",
      commandeCouranteEstRenseignee()
    );
    console.log("K232 :", k232Selection, k232Valeur);
    console.log("K270 :", k270Selection, k270Valeur);

    // =====================================================
    // AJOUT DE LA COMMANDE COURANTE SI UN TYPE EST CHOISI
    // =====================================================

    if (typeCommande) {
      const commandeCourante = construireCommandeCourante();

      console.log(
        "COMMANDE COURANTE :",
        JSON.stringify(commandeCourante, null, 2)
      );

      if (commandeCourante) {
        // Vérification uniquement si plusieurs commandes
        // existent déjà avec un type différent.
        if (commandesFinales.length > 0) {
          const typeExistant =
            commandesFinales[0]?.type_commande;

          const nouveauType =
            commandeCourante?.type_commande;

          if (
            typeExistant &&
            nouveauType &&
            typeExistant !== nouveauType
          ) {
            Alert.alert(
              "Type de commande incompatible",
              "Vous ne pouvez pas mélanger les commandes Vrac et Conditionné."
            );
            return;
          }
        }

        commandesFinales.push(commandeCourante);
      }
    }

    // =====================================================
    // TYPES DE COMMANDES
    // =====================================================

    const typesCommandes = [
      ...new Set(
        commandesFinales
          .map((commande) => commande?.type_commande)
          .filter(Boolean)
      ),
    ];

    // Vérification uniquement lorsqu'il existe
    // réellement plusieurs types.
    if (typesCommandes.length > 1) {
      Alert.alert(
        "Erreur",
        "Les commandes Vrac et Conditionné ne peuvent pas être mélangées."
      );
      return;
    }

    const typeCommandeFinal =
      typesCommandes.length > 0
        ? typesCommandes[0]
        : null;

    // =====================================================
    // DONNÉES VISITEUR
    // =====================================================

    const visitorData = {
      nom: nom?.trim() || null,
      prenom: prenom?.trim() || null,
      email: email?.trim() || null,
      site: site?.trim() || null,
      origine: origine || null,
      indicatif: indicatif || null,
      telephone: telephone?.trim() || null,
      societe: societe?.trim() || null,
      adresse_societe:
        adresseSociete?.trim() || null,
      fonction: fonction?.trim() || null,
      langue_communication:
        langueCommunication || null,
        profile: profile?.trim() || null,
    
      // Commande totalement facultative
      type_commande: typeCommandeFinal,
    
      // =====================================================
      // ÉCHANTILLON
      // Ces données appartiennent au VISITEUR
      // =====================================================
      demande_echantillon:
  demandeEchantillon === "oui" ? "oui" : "non",

adresse_echantillon:
  demandeEchantillon === "oui"
    ? adresseEchantillon?.trim() || null
    : null,

personne_reception_echantillon:
  demandeEchantillon === "oui"
    ? personneReceptionEchantillon?.trim() || null
    : null,

tel_reception_echantillon:
  demandeEchantillon === "oui"
    ? telReceptionEchantillon?.trim() || null
    : null,
    
      // =====================================================
      // COMMANDES
      // =====================================================
    
      commandes: commandesFinales,
    
      nombre_commandes:
        commandesFinales.length,
    
      // Qualification facultative
      qualification:
        qualification || null,

      // Photo de la carte de visite (facultative)
      carte_visite_image: carteVisiteImage || null,
      carte_visite_qr: carteVisiteQr || null,
    };

    // =====================================================
    // DEBUG
    // =====================================================

    console.log("=======================================");
    console.log("📤 ENVOI VISITEUR + COMMANDES");
    console.log(
      "TYPE COMMANDE FINAL :",
      typeCommandeFinal || "AUCUN"
    );
    console.log(
      "NOMBRE COMMANDES :",
      commandesFinales.length
    );
    console.log(
      JSON.stringify(visitorData, null, 2)
    );
    console.log("=======================================");

    // =====================================================
    // AUTHENTIFICATION
    // =====================================================

    const token =
      await AsyncStorage.getItem("token");

    if (!token) {
      throw new Error(
        "Authentification requise"
      );
    }

    // =====================================================
    // ENVOI BACKEND
    // =====================================================

    const modification = Boolean(visiteurEnregistreId);

    const response = await fetch(
      modification
        ? `${API_URL}/api/visiteurs/${visiteurEnregistreId}`
        : `${API_URL}/api/visiteurs`,
      {
        method: modification ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(visitorData),
      }
    );

    const data = await response.json();

    console.log(
      "STATUS HTTP :",
      response.status
    );

    console.log(
      "RÉPONSE BACKEND :",
      data
    );

    // =====================================================
    // ERREUR BACKEND
    // =====================================================

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          data.error ||
          "Erreur serveur"
      );
    }

    // =====================================================
    // SUCCÈS
    // =====================================================

    console.log("=======================================");
    console.log(
      "✅ VISITEUR AJOUTÉ AVEC SUCCÈS"
    );
    console.log(
      "VISITEUR ID :",
      data.id
    );
    console.log(
      "COMMANDES ENREGISTRÉES :",
      data.nombre_commandes ??
        commandesFinales.length
    );
    console.log("=======================================");

    // =====================================================
    // OUVERTURE PDF
    // =====================================================

    const idVisiteur = modification
      ? visiteurEnregistreId
      : data.id;

    if (sansPdf) {
      afficherMessage(
        "Succès",
        modification
          ? "Le visiteur a été modifié avec succès."
          : "Le visiteur a été ajouté avec succès."
      );

      reinitialiserFormulaire();
    } else {
      // Le formulaire n'est PAS vidé : en revenant en arrière depuis
      // la page PDF, on retrouve le visiteur et ses commandes
      setVisiteurEnregistreId(idVisiteur);

      router.push({
        pathname: "/pdf",
        params: {
          id: String(idVisiteur),
        },
      });
    }

  } catch (error) {
    console.error(
      "======================================="
    );
    console.error(
      "❌ ERREUR POST :",
      error
    );
    console.error(
      "=======================================");

    afficherMessage(
      "Erreur",
      `Impossible d'ajouter le visiteur.\n\n${
        error?.message ||
        "Erreur inconnue"
      }`
    );
  }
};



  // =====================================================
// INTERFACE
// =====================================================

return (
  <ScrollView
    style={styles.container}
    contentContainerStyle={styles.content}
    keyboardShouldPersistTaps="handled"
  >

    {/* =================================================
        DÉCONNEXION
    ================================================= */}

    <View style={styles.headerButtons}>
      <TouchableOpacity
        style={styles.archivesButton}
        onPress={() => router.push("/archives")}
      >
        <Ionicons
          name="document-text-outline"
          size={20}
          color="#5C681F"
        />

        <Text style={styles.archivesButtonText}>
          Fiches validées
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons
          name="log-out-outline"
          size={20}
          color="#c62828"
        />

        <Text style={styles.logoutText}>
          Déconnexion
        </Text>
      </TouchableOpacity>
    </View>

    {/* =================================================
        TITRE
    ================================================= */}

    <Text style={styles.title}>
      Formulaire Visiteur
    </Text>

    {visiteurEnregistreId && (
      <View style={styles.modeModification}>
        <Ionicons
          name="create-outline"
          size={20}
          color="#5C681F"
        />

        <Text style={styles.modeModificationText}>
          Visiteur déjà enregistré : vos corrections seront
          enregistrées sur la même fiche.
        </Text>

        <TouchableOpacity
          style={styles.nouveauVisiteurButton}
          onPress={reinitialiserFormulaire}
        >
          <Text style={styles.nouveauVisiteurText}>
            Nouveau visiteur
          </Text>
        </TouchableOpacity>
      </View>
    )}

    {/* =================================================
        SCANNER CARTE DE VISITE
    ================================================= */}

    <TouchableOpacity
      style={[
        styles.scanButton,
        scanEnCours && { opacity: 0.6 },
      ]}
      onPress={choisirSourceCarte}
      disabled={scanEnCours}
    >
      {scanEnCours ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Ionicons
          name="camera-outline"
          size={22}
          color="#fff"
        />
      )}

      <Text style={styles.scanButtonText}>
        {scanEnCours
          ? "Lecture de la carte…"
          : "Scanner une carte de visite"}
      </Text>
    </TouchableOpacity>

   

      {/* =================================================
          NOM
      ================================================= */}

      <Text style={styles.label}>
        Nom et Prénom
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Entrez le nom et le prénom"
        value={nom}
        onChangeText={setNom}
      />

      {/* =================================================
          FONCTION
      ================================================= */}

      <Text style={styles.label}>
        Fonction
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Fonction"
        value={fonction}
        onChangeText={setFonction}
      />

      {/* =================================================
          SOCIÉTÉ
      ================================================= */}

      <Text style={styles.label}>
        Société
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nom de la société"
        value={societe}
        onChangeText={setSociete}
      />

      {/* =================================================
          ADRESSE SOCIÉTÉ
      ================================================= */}

      <Text style={styles.label}>
        Adresse société
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Adresse de la société"
        value={adresseSociete}
        onChangeText={setAdresseSociete}
      />

      {/* =================================================
          ADRESSE SITE EMAIL
      ================================================= 

      <Text style={styles.label}>
        Adresse Site Email
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Adresse Site Email"
        value={prenom}
        onChangeText={setPrenom}
      />*/}

      {/* =================================================
          ORIGINE / PAYS
      ================================================= */}

      <Text style={styles.label}>
        Origine / Pays
      </Text>

      <View style={styles.pickerContainer}>
        <Picker
          style={styles.picker}
          selectedValue={origine}
          onValueChange={
            handlePaysChange
          }
        >
          <Picker.Item
            label="Sélectionner un pays"
            value=""
          />

          {ITEMS_PAYS}
        </Picker>
      </View>

      {/* =================================================
          TELEPHONE
      ================================================= */}

      <Text style={styles.label}>
        Téléphone / WhatsApp
      </Text>

      <View style={styles.phoneContainer}>

        <TextInput
          style={styles.indicatif}
          value={indicatif}
          editable={false}
        />

        <TextInput
          style={styles.phoneInput}
          placeholder="Téléphone"
          value={telephone}
          onChangeText={handleTelephoneChange}
          keyboardType="phone-pad"
        />

      </View>

      {/* =================================================
          EMAIL
      ================================================= */}

      <Text style={styles.label}>
        Email
      </Text>

      <TextInput
        style={styles.input}
        placeholder="exemple@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* =================================================
          SITE WEB
      ================================================= */}

      <Text style={styles.label}>
        Site Web
      </Text>

      <TextInput
        style={styles.input}
        placeholder="www..."
        value={site}
        onChangeText={setSite}
        autoCapitalize="none"
      />

      {/* =================================================
          LANGUE
      ================================================= */}

      <Text style={styles.label}>
        Langue de communication
      </Text>

      <View style={styles.pickerContainer}>
        <Picker
          style={styles.picker}
          selectedValue={
            langueCommunication
          }
          onValueChange={(value) =>
            setLangueCommunication(
              value
            )
          }
        >
          <Picker.Item
            label="Sélectionner"
            value=""
          />

          <Picker.Item
            label="Arabe"
            value="Arabe"
          />

          <Picker.Item
            label="Français"
            value="Français"
          />

          <Picker.Item
            label="Anglais"
            value="Anglais"
          />

          <Picker.Item
            label="Espagnol"
            value="Espagnol"
          />

          <Picker.Item
            label="Italien"
            value="Italien"
          />

          <Picker.Item
            label="Allemand"
            value="Allemand"
          />

          <Picker.Item
            label="Portugais"
            value="Portugais"
          />

          <Picker.Item
            label="Néerlandais"
            value="Néerlandais"
          />

          <Picker.Item
            label="Russe"
            value="Russe"
          />

          <Picker.Item
            label="Chinois (Mandarin)"
            value="Chinois (Mandarin)"
          />

          <Picker.Item
            label="Japonais"
            value="Japonais"
          />

          <Picker.Item
            label="Coréen"
            value="Coréen"
          />

          <Picker.Item
            label="Turc"
            value="Turc"
          />

          <Picker.Item
            label="Grec"
            value="Grec"
          />

          <Picker.Item
            label="Polonais"
            value="Polonais"
          />

          <Picker.Item
            label="Roumain"
            value="Roumain"
          />

          <Picker.Item
            label="Tchèque"
            value="Tchèque"
          />

          <Picker.Item
            label="Hongrois"
            value="Hongrois"
          />

          <Picker.Item
            label="Suédois"
            value="Suédois"
          />

          <Picker.Item
            label="Norvégien"
            value="Norvégien"
          />

          <Picker.Item
            label="Danois"
            value="Danois"
          />

          <Picker.Item
            label="Finnois"
            value="Finnois"
          />

          <Picker.Item
            label="Hébreu"
            value="Hébreu"
          />

          <Picker.Item
            label="Persan"
            value="Persan"
          />

          <Picker.Item
            label="Hindi"
            value="Hindi"
          />

          <Picker.Item
            label="Indonésien"
            value="Indonésien"
          />

          <Picker.Item
            label="Malais"
            value="Malais"
          />

          <Picker.Item
            label="Vietnamien"
            value="Vietnamien"
          />

          <Picker.Item
            label="Thaï"
            value="Thaï"
          />

          <Picker.Item
            label="Ukrainien"
            value="Ukrainien"
          />

          <Picker.Item
            label="Bulgare"
            value="Bulgare"
          />

          <Picker.Item
            label="Croate"
            value="Croate"
          />

          <Picker.Item
            label="Serbe"
            value="Serbe"
          />

          <Picker.Item
            label="Slovaque"
            value="Slovaque"
          />

          <Picker.Item
            label="Slovène"
            value="Slovène"
          />

          <Picker.Item
            label="Lituanien"
            value="Lituanien"
          />

          <Picker.Item
            label="Letton"
            value="Letton"
          />

          <Picker.Item
            label="Estonien"
            value="Estonien"
          />

          <Picker.Item
            label="Swahili"
            value="Swahili"
          />

          <Picker.Item
            label="Afrikaans"
            value="Afrikaans"
          />

          <Picker.Item
            label="Bengali"
            value="Bengali"
          />

          <Picker.Item
            label="Ourdou"
            value="Ourdou"
          />

          <Picker.Item
            label="Tamoul"
            value="Tamoul"
          />

          <Picker.Item
            label="Persan (Farsi)"
            value="Persan (Farsi)"
          />

          <Picker.Item
            label="Autre"
            value="Autre"
          />

        </Picker>
      </View>

      {/* =================================================
          PROFILE
      ================================================= */}

      <Text style={styles.label}>
        Profile
      </Text>

      <View style={styles.pickerContainer}>

        <Picker
          style={styles.picker}
          selectedValue={profile}
          onValueChange={
            handleProfileChange
          }
        >

          <Picker.Item
            label="Sélectionner un profil"
            value=""
          />

          <Picker.Item
            label="Fournisseur"
            value="fournisseur"
          />

          <Picker.Item
            label="Intermédiaire"
            value="intermediaire"
          />

          <Picker.Item
            label="Acheteur"
            value="acheteur"
          />

          <Picker.Item
            label="Institution"
            value="institution"
          />

          <Picker.Item
            label="Autre"
            value="autre"
          />

        </Picker>

      </View>
       {/* ==========================================
    DEMANDE D'ÉCHANTILLON
========================================== */}

<View style={styles.section}>

<Text style={styles.sectionTitle}>
  Demande d'échantillon
</Text>

<Text style={styles.label}>
  Le client demande-t-il un échantillon ?
</Text>

{/* ================================
    CHOIX OUI / NON
================================= */}

<View style={styles.checkboxContainer}>

  {/* OUI */}
  <TouchableOpacity
    onPress={() => {
      console.log("ÉCHANTILLON : OUI");
      setDemandeEchantillon("oui");
    }}
    activeOpacity={0.7}
    style={styles.checkboxOption}
  >
    <Text style={styles.checkboxSymbol}>
      {demandeEchantillon === "oui" ? "☑" : "☐"}
    </Text>

    <Text style={styles.checkboxText}>
      Oui
    </Text>
  </TouchableOpacity>


  {/* NON */}
  <TouchableOpacity
    onPress={() => {
      console.log("ÉCHANTILLON : NON");

      setDemandeEchantillon("non");
      setAdresseEchantillon("");
      setPersonneReceptionEchantillon("");
      setTelReceptionEchantillon("");
    }}
    activeOpacity={0.7}
    style={styles.checkboxOption}
  >
    <Text style={styles.checkboxSymbol}>
      {demandeEchantillon === "non" ? "☑" : "☐"}
    </Text>

    <Text style={styles.checkboxText}>
      Non
    </Text>
  </TouchableOpacity>

</View>


{/* ================================
    INFORMATIONS ÉCHANTILLON
    AFFICHÉES UNIQUEMENT SI OUI
================================= */}

{demandeEchantillon === "oui" && (
  <View style={styles.echantillonContainer}>

    <Text style={styles.label}>
      Adresse de réception *
    </Text>

    <TextInput
      style={styles.input}
      placeholder="Saisir l'adresse de réception"
      value={adresseEchantillon}
      onChangeText={setAdresseEchantillon}
    />


    <Text style={styles.label}>
      Personne en charge de la réception *
    </Text>

    <TextInput
      style={styles.input}
      placeholder="Nom et prénom"
      value={personneReceptionEchantillon}
      onChangeText={setPersonneReceptionEchantillon}
    />


    <Text style={styles.label}>
      Téléphone de la personne en charge *
    </Text>

    <TextInput
      style={styles.input}
      placeholder="Ex : +216 XX XXX XXX"
      value={telReceptionEchantillon}
      onChangeText={setTelReceptionEchantillon}
      keyboardType="phone-pad"
    />

  </View>
)}

</View>
      {/* =================================================
          TYPE COMMANDE
      ================================================= */}

      {(profile === "intermediaire" ||
        profile === "acheteur") && (
        <>

          <Text style={styles.label}>
            Type de commande
          </Text>

          <View style={styles.pickerContainer}>

            <Picker
              style={styles.picker}
              selectedValue={
                typeCommande
              }
              onValueChange={
                handleTypeCommandeChange
              }
            >

              <Picker.Item
                label="Sélectionner"
                value=""
              />

              <Picker.Item
                label="Vrac"
                value="vrac"
              />

              <Picker.Item
                label="Conditionné"
                value="conditionné"
              />

            </Picker>

          </View>

        </>
      )}

      {/* =================================================
          SECTION VRAC
      ================================================= */}
      

      {typeCommande === "vrac" &&
        (profile === "intermediaire" ||
          profile === "acheteur") && (

          <View style={styles.section}>

            <Text style={styles.sectionTitle}>
              Informations commande en vrac
            </Text>

            {commandes.length > 0 && (
              <View style={styles.savedCommandsContainer}>
                <Text style={styles.savedCommandsTitle}>
                  Commandes déjà ajoutées : {commandes.length}
                </Text>

                {commandes.map((commande, index) => (
                  <View key={`saved-vrac-${index}`} style={styles.savedCommandCard}>
                    <Text style={styles.savedCommandTitle}>
                      Commande {index + 1} → Vrac
                    </Text>
                    <Text style={styles.savedCommandText}>
                      Catégorie : {commande.categorie || "—"}
                    </Text>
                    <Text style={styles.savedCommandText}>
                      Genre : {commande.genre || "—"}
                    </Text>
                    <Text style={styles.savedCommandText}>
                      Volume : {commande.volume_estime ?? "—"}
                    </Text>
                    <Text style={styles.savedCommandText}>
                      Destination : {commande.destination || "—"}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.currentCommandTitle}>
              Commande {commandes.length + 1} → Vrac
            </Text>

                        {/* FREQUENCE */}

                        <Text style={styles.label}>
                        Fréquence
                      </Text>
          
                      <View style={styles.pickerContainer}>
          
                        <Picker
                          style={styles.picker}
                          selectedValue={
                            frequenceCommande
                          }
                          onValueChange={
                            setFrequenceCommande
                          }
                        >
          
                          <Picker.Item
                            label="Sélectionner"
                            value=""
                          />
          
                          <Picker.Item
                            label="Commande unique"
                            value="unique"
                          />
          
                          <Picker.Item
                            label="Commandes contrat cadre"
                            value="contrat-cadre"
                          />

                          <Picker.Item
                            label="Récurrence"
                            value="recurrence"
                          />

                        </Picker>

                      </View>

{/* RÉCURRENCE : NOMBRE DE COMMANDES PAR MOIS / PAR AN */}

{frequenceCommande === "recurrence" && (
  <View style={{ marginTop: 10 }}>

    <Text style={styles.label}>
      Nombre de commandes
    </Text>

    <View style={styles.pickerContainer}>
      <Picker
        style={styles.picker}
        selectedValue={periodeRecurrence}
        onValueChange={setPeriodeRecurrence}
      >
        <Picker.Item label="Sélectionner" value="" />
        <Picker.Item label="Par mois" value="Par mois" />
        <Picker.Item label="Par année" value="Par année" />
      </Picker>
    </View>

    <TextInput
      style={styles.input}
      placeholder={
        periodeRecurrence === "Par année"
          ? "Nombre de commandes par année"
          : "Nombre de commandes par mois"
      }
      value={nombreCommandesRecurrence}
      onChangeText={setNombreCommandesRecurrence}
      keyboardType="numeric"
    />

  </View>
)}

           {/* CATÉGORIE */}

<Text style={styles.label}>
Catégorie
</Text>

<View style={styles.pickerContainer}>
<Picker
  style={styles.picker}
  selectedValue={categorie}
  onValueChange={setCategorie}
>
  <Picker.Item
    label="Sélectionner une catégorie"
    value=""
  />

  <Picker.Item
    label="Extra Virgin Olive Oil – EVOO"
    value="Extra Virgin Olive Oil – EVOO"
  />

  <Picker.Item
    label="Virgin Olive Oil – VOO"
    value="Virgin Olive Oil – VOO"
  />

  <Picker.Item
    label="Lampante Olive Oil"
    value="Lampante Olive Oil"
  />
</Picker>
</View>

           {/* ACIDITÉ */}

<Text style={styles.label}>
  Acidité
</Text>

<View style={styles.pickerContainer}>
  <Picker
    style={styles.picker}
    selectedValue={qualiteGrade}
    onValueChange={setQualiteGrade}
  >
    <Picker.Item
      label="Sélectionner"
      value=""
    />

    <Picker.Item label="< 0.3" value="<0.3" />
    <Picker.Item label="< 0.5" value="<0.5" />
    <Picker.Item label="< 0.8" value="<0.8" />
    <Picker.Item label="< 2" value="<2" />
  </Picker>
</View>


{/* ==========================================
    PARAMÈTRES UV - FACULTATIFS
========================================== */}

<Text style={styles.label}>
  Paramètres UV
</Text>

<View style={styles.checkboxContainer}>

  {/* K232 */}
  <TouchableOpacity
    style={styles.checkboxOption}
    onPress={() => {
      const nouvelleSelection = !k232Selection;
      setK232Selection(nouvelleSelection);
    
      if (!nouvelleSelection) {
        setK232Valeur("");
      }
    }}
    activeOpacity={0.7}
  >
    <Text style={styles.checkboxSymbol}>
      {k232Selection ? "☑" : "☐"}
    </Text>

    <Text style={styles.checkboxText}>
      K232
    </Text>
  </TouchableOpacity>


  {/* K270 */}
  <TouchableOpacity
    style={styles.checkboxOption}
    onPress={() => {
      const nouvelleSelection = !k270Selection;
      setK270Selection(nouvelleSelection);
    
      if (!nouvelleSelection) {
        setK270Valeur("");
      }
    }}
    activeOpacity={0.7}
  >
    <Text style={styles.checkboxSymbol}>
      {k270Selection ? "☑" : "☐"}
    </Text>

    <Text style={styles.checkboxText}>
      K270
    </Text>
  </TouchableOpacity>

</View>


{/* ==========================================
    VALEUR K232 - FACULTATIVE
========================================== */}

{k232Selection && (
  <View style={styles.kValueContainer}>

    <Text style={styles.label}>
      Valeur K232
    </Text>

    <View style={styles.checkboxContainer}>

      {/* ≤ 2.5 */}
      <TouchableOpacity
        style={styles.checkboxOption}
        onPress={() =>
          setK232Valeur(
            k232Valeur === "<=2.5" ? "" : "<=2.5"
          )
        }
        activeOpacity={0.7}
      >
        <Text style={styles.checkboxSymbol}>
          {k232Valeur === "<=2.5" ? "☑" : "☐"}
        </Text>

        <Text style={styles.checkboxText}>
          ≤ 2.5
        </Text>
      </TouchableOpacity>


      {/* ≥ 2.5 */}
      <TouchableOpacity
        style={styles.checkboxOption}
        onPress={() =>
          setK232Valeur(
            k232Valeur === ">=2.5" ? "" : ">=2.5"
          )
        }
        activeOpacity={0.7}
      >
        <Text style={styles.checkboxSymbol}>
          {k232Valeur === ">=2.5" ? "☑" : "☐"}
        </Text>

        <Text style={styles.checkboxText}>
          ≥ 2.5
        </Text>
      </TouchableOpacity>

    </View>

  </View>
)}


{/* ==========================================
    VALEUR K270 - FACULTATIVE
========================================== */}

{k270Selection && (
  <View style={styles.kValueContainer}>

    <Text style={styles.label}>
      Valeur K270
    </Text>

    <View style={styles.checkboxContainer}>

      {/* ≤ 0.22 */}
      <TouchableOpacity
        style={styles.checkboxOption}
        onPress={() =>
          setK270Valeur(
            k270Valeur === "<=0.22" ? "" : "<=0.22"
          )
        }
        activeOpacity={0.7}
      >
        <Text style={styles.checkboxSymbol}>
          {k270Valeur === "<=0.22" ? "☑" : "☐"}
        </Text>

        <Text style={styles.checkboxText}>
          ≤ 0.22
        </Text>
      </TouchableOpacity>


      {/* > 0.22 */}
      <TouchableOpacity
        style={styles.checkboxOption}
        onPress={() =>
          setK270Valeur(
            k270Valeur === ">0.22" ? "" : ">0.22"
          )
        }
        activeOpacity={0.7}
      >
        <Text style={styles.checkboxSymbol}>
          {k270Valeur === ">0.22" ? "☑" : "☐"}
        </Text>

        <Text style={styles.checkboxText}>
          &gt; 0.22
        </Text>
      </TouchableOpacity>

    </View>

  </View>
)}

{/* GENRE */}

<Text style={styles.label}>
  Genre
</Text>

<View style={styles.pickerContainer}>
  <Picker
    style={styles.picker}
    selectedValue={genre}
    onValueChange={setGenre}
  >
    <Picker.Item
      label="Sélectionner"
      value=""
    />

    <Picker.Item
      label="Conventionnelle"
      value="Conventionnelle"
    />

    <Picker.Item
      label="Biologique"
      value="Biologique"
    />
  </Picker>
</View>

{/* =================================================
    PROFIL AROMATIQUE
================================================= */}

<View style={styles.aromatiqueContainer}>

  <Text style={styles.aromatiqueTitle}>
    Profil aromatique
  </Text>

  {/* FRUITÉ */}
  <View style={styles.aromatiqueRow}>
    <Text style={styles.aromatiqueLabel}>
      Fruité
    </Text>

    {["0 – 3", "3 – 6"].map((item) => (
      <TouchableOpacity
        key={item}
        style={styles.aromatiqueOption}
        onPress={() =>
          setProfilAromatique({
            ...profilAromatique,
            fruité:
              profilAromatique.fruité === item
                ? ""
                : item,
          })
        }
      >
        <Text style={styles.aromatiqueCheckbox}>
          {profilAromatique.fruité === item ? "☑" : "☐"}
        </Text>

        <Text style={styles.aromatiqueOptionText}>
          {item}
        </Text>
      </TouchableOpacity>
    ))}
  </View>


  {/* AMER */}
  <View style={styles.aromatiqueRow}>
    <Text style={styles.aromatiqueLabel}>
      Amer
    </Text>

    {["0 – 3", "3 – 6"].map((item) => (
      <TouchableOpacity
        key={item}
        style={styles.aromatiqueOption}
        onPress={() =>
          setProfilAromatique({
            ...profilAromatique,
            amer:
              profilAromatique.amer === item
                ? ""
                : item,
          })
        }
      >
        <Text style={styles.aromatiqueCheckbox}>
          {profilAromatique.amer === item ? "☑" : "☐"}
        </Text>

        <Text style={styles.aromatiqueOptionText}>
          {item}
        </Text>
      </TouchableOpacity>
    ))}
  </View>


  {/* PIQUANT */}
  <View style={styles.aromatiqueRow}>
    <Text style={styles.aromatiqueLabel}>
      Piquant
    </Text>

    {["0 – 3", "3 – 6"].map((item) => (
      <TouchableOpacity
        key={item}
        style={styles.aromatiqueOption}
        onPress={() =>
          setProfilAromatique({
            ...profilAromatique,
            piquant:
              profilAromatique.piquant === item
                ? ""
                : item,
          })
        }
      >
        <Text style={styles.aromatiqueCheckbox}>
          {profilAromatique.piquant === item ? "☑" : "☐"}
        </Text>

        <Text style={styles.aromatiqueOptionText}>
          {item}
        </Text>
      </TouchableOpacity>
    ))}
  </View>


  {/* DÉFAUT */}
  <View style={styles.aromatiqueRow}>
    <Text style={styles.aromatiqueLabel}>
      Défaut
    </Text>

    {["0", "≠ 0"].map((item) => (
      <TouchableOpacity
        key={item}
        style={styles.aromatiqueOption}
        onPress={() =>
          setProfilAromatique({
            ...profilAromatique,
            défaut:
              profilAromatique.défaut === item
                ? ""
                : item,
          })
        }
      >
        <Text style={styles.aromatiqueCheckbox}>
          {profilAromatique.défaut === item ? "☑" : "☐"}
        </Text>

        <Text style={styles.aromatiqueOptionText}>
          {item}
        </Text>
      </TouchableOpacity>
    ))}
  </View>

</View>



            {/* VOLUME */}

            <Text style={styles.label}>
  Volume estimé en tonne
</Text>

<View style={styles.inputWithUnit}>
  <TextInput
    style={styles.inputVolume}
    placeholder="Volume estimé"
    value={volumeEstime}
    onChangeText={setVolumeEstime}
    keyboardType="numeric"
  />

  <Text style={styles.unitText}>T</Text>
</View>

            {/* DESTINATION */}

            <Text style={styles.label}>
              Destination pays
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Destination"
              value={destination}
              onChangeText={
                setDestination
              }
            />
            {/* DESTINATION */}

            <Text style={styles.label}>
              Destination port
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Destination"
              value={destinationport}
              onChangeText={
                setDestinationport
              }
            />

            {/* INCOTERM */}

            <Text style={styles.label}>
              Incoterm
            </Text>

           
<View style={styles.pickerContainer}>
  <Picker
    style={styles.picker}
    selectedValue={incoterm}
    onValueChange={setIncoterm}
  >
    <Picker.Item label="EXW" value="EXW" />
    <Picker.Item label="FOB" value="FOB" />
    <Picker.Item label="CFR" value="CFR" />
    <Picker.Item label="CIF" value="CIF" />
    <Picker.Item label="DAP" value="DAP" />
    <Picker.Item label="DDP" value="DDP" />
  </Picker>
</View>

            {/* FORMAT LIVRAISON */}

            <Text style={styles.label}>
              Format livraison
            </Text>

            <View style={styles.pickerContainer}>

              <Picker
                style={styles.picker}
                selectedValue={
                  formatLivraison
                }
                onValueChange={
                  setFormatLivraison
                }
              >

                <Picker.Item
                  label="Sélectionner"
                  value=""
                />

                <Picker.Item
                  label="Flexitank"
                  value="Flexitank"
                />

                <Picker.Item
                  label="IBC"
                  value="IBC"
                />

                <Picker.Item
                  label="Camion-citerne"
                  value="Camion-citerne"
                />

                <Picker.Item
                  label="Fûts"
                  value="Fûts"
                />

                <Picker.Item
                  label="Autre"
                  value="Autre"
                />

              </Picker>

            </View>



{/* =================================================
    CERTIFICATIONS REQUISES
================================================= */}

<Text style={styles.label}>
  Certifications requises
</Text>

<View style={styles.exigencesContainer}>

  {[
    "ISO 22000",
    "HACCP",
    "IFS Food",
    "BRCGS",
    "ISO 9001",
    "BIO / Organic",
    "Halal",
    "Kosher",
    "JAS",
    "Analyses COI / IOC",
    "Certificat d’analyse (COA)",
    "Certificat d’analyse ONH",
    "Autre",
  ].map((item) => {

    const selected =
      certificationsRequises.includes(item);

    return (
      <TouchableOpacity
        key={item}
        style={styles.exigenceOption}
        onPress={() => {

          if (selected) {

            setCertificationsRequises(
              certificationsRequises.filter(
                (certification) =>
                  certification !== item
              )
            );

            if (item === "Autre") {
              setAutreCertification("");
            }

          } else {

            setCertificationsRequises([
              ...certificationsRequises,
              item,
            ]);

          }

        }}
      >

        <Text style={styles.exigenceCheckbox}>
          {selected ? "☑" : "☐"}
        </Text>

        <Text style={styles.exigenceText}>
          {item}
        </Text>

      </TouchableOpacity>
    );
  })}

  {/* CHAMP AUTRE CERTIFICATION */}
  {certificationsRequises.includes("Autre") && (
    <TextInput
      style={styles.input}
      placeholder="Préciser la certification"
      value={autreCertification}
      onChangeText={setAutreCertification}
    />
  )}

</View>

            {/* INFORMATIONS */}

            <Text style={styles.label}>
              Informations complémentaires
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.textArea,
              ]}
              placeholder="Informations complémentaires"
              value={
                informationsComplementaires
              }
              onChangeText={
                setInformationsComplementaires
              }
              multiline
              numberOfLines={4}
            />
<TouchableOpacity
  style={styles.addCommandButton}
  onPress={handleAjouterCommande}
  activeOpacity={0.8}
>
  <Text style={styles.addCommandButtonText}>
    + Ajouter une commande Vrac
  </Text>
</TouchableOpacity>

          </View>
        )}

      {/* =================================================
          SECTION CONDITIONNÉ
      ================================================= */}

      {typeCommande === "conditionné" &&
        (profile === "intermediaire" ||
          profile === "acheteur") && (

          <View style={styles.section}>

            <Text style={styles.sectionTitle}>
              Informations commande conditionnée
            </Text>

            {commandes.length > 0 && (
              <View style={styles.savedCommandsContainer}>
                <Text style={styles.savedCommandsTitle}>
                  Commandes déjà ajoutées : {commandes.length}
                </Text>

                {commandes.map((commande, index) => (
                  <View key={`saved-conditionne-${index}`} style={styles.savedCommandCard}>
                    <Text style={styles.savedCommandTitle}>
                      Commande {index + 1} → Conditionné
                    </Text>
                    <Text style={styles.savedCommandText}>
                      Produit : {commande.categorie || "—"}
                    </Text>
                    <Text style={styles.savedCommandText}>
                      Pays : {commande.pays_conditionne || "—"}
                    </Text>
                    <Text style={styles.savedCommandText}>
                      Canal : {commande.canal_distribution || "—"}
                    </Text>
                    <Text style={styles.savedCommandText}>
                      Volume : {commande.volumes_conditionne || "—"}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.currentCommandTitle}>
              Commande {commandes.length + 1} → Conditionné
            </Text>

            {/* PRODUIT (ligne de la fiche MOTEUR utilisée pour le prix) */}

            <Text style={styles.label}>
              Produit
            </Text>

            <View style={styles.pickerContainer}>
              <Picker
                style={styles.picker}
                selectedValue={categorie}
                onValueChange={setCategorie}
              >
                <Picker.Item
                  label="Sélectionner un produit"
                  value=""
                />

                {PRODUITS_CONDITIONNE.map((item) => (
                  <Picker.Item
                    key={item}
                    label={item}
                    value={item}
                  />
                ))}
              </Picker>
            </View>

            {/* PAYS */}

            <Text style={styles.label}>
              Pays
            </Text>

            <View style={styles.pickerContainer}>

              <Picker
                style={styles.picker}
                selectedValue={
                  paysConditionne
                }
                onValueChange={
                  setPaysConditionne
                }
              >

                <Picker.Item
                  label="Sélectionner un pays"
                  value=""
                />

                {ITEMS_PAYS}

              </Picker>

            </View>

{/* CANAL */}

<Text style={styles.label}>
  Canal de distribution
</Text>

<View style={styles.pickerContainer}>

  <Picker
    style={styles.picker}
    selectedValue={canalDistribution}
    onValueChange={setCanalDistribution}
  >

    <Picker.Item
      label="Sélectionner"
      value=""
    />

    <Picker.Item
      label="Epicerie/d'étalon"
      value="Epicerie/d'étalon"
    />

    <Picker.Item
      label="HoReCa/Grossiste"
      value="HoReCa/Grossiste"
    />

    <Picker.Item
      label="Distributeur importateur"
      value="Distributeur importateur"
    />

    {/* AUTRE */}
    <Picker.Item
      label="Autre"
      value="Autre"
    />

  </Picker>

</View>

{/* CHAMP AUTRE */}

{canalDistribution === "Autre" && (
  <View style={{ marginTop: 10 }}>

    <Text style={styles.label}>
      Préciser le canal de distribution
    </Text>

    <TextInput
      style={styles.input}
      placeholder="Saisir le canal de distribution"
      value={autreCanalDistribution}
      onChangeText={setAutreCanalDistribution}
    />

  </View>
)}

            {/* VOLUMES ESTIMÉS */}

<Text style={styles.label}>
  Volumes estimés
</Text>

{/* CHOIX DU TYPE DE VOLUME */}

<View style={styles.pickerContainer}>
<Picker
  style={styles.picker}
  selectedValue={typeVolumeEstime}
  onValueChange={(value) => {
    setTypeVolumeEstime(value);
    setVolumesEstimes("");
    setAutreVolumeEstime("");
  }}
>
  <Picker.Item label="Sélectionner" value="" />
  <Picker.Item label="Volume par mois" value="Par mois" />
  <Picker.Item label="Volume par an" value="Par an" />
  <Picker.Item label="Autre" value="Autre" />
</Picker>
</View>

{/* VOLUME PAR MOIS OU PAR AN */}

{(typeVolumeEstime === "Par mois" ||
  typeVolumeEstime === "Par an") && (
  <View style={{ marginTop: 10 }}>

    <Text style={styles.label}>
      {typeVolumeEstime === "Par mois"
        ? "Volume estimé par mois"
        : "Volume estimé par an"}
    </Text>

    <TextInput
      style={styles.input}
      placeholder="Saisir le volume"
      value={volumesEstimes}
      onChangeText={setVolumesEstimes}
      keyboardType="numeric"
    />

  </View>
)}

{/* AUTRE */}

{typeVolumeEstime === "Autre" && (
  <View style={{ marginTop: 10 }}>

    <Text style={styles.label}>
      Préciser le volume estimé
    </Text>

    <TextInput
      style={styles.input}
      placeholder="Préciser le volume"
      value={autreVolumeEstime}
      onChangeText={setAutreVolumeEstime}
    />

  </View>
)}

{/* TYPE D'ÉTIQUETTE CONDITIONNÉ (champ indépendant, toujours visible) */}

    <Text style={styles.label}>
      Game
    </Text>

    <View style={styles.pickerContainer}>
      <Picker
        style={styles.picker}
        selectedValue={typeEtiquetteConditionne}
        onValueChange={setTypeEtiquetteConditionne}
      >
        <Picker.Item
          label="Sélectionner une étiquette"
          value=""
        />

        <Picker.Item
          label="SUN"
          value="SUN"
        />

        <Picker.Item
          label="GROVE"
          value="GROVE"
        />

        <Picker.Item
          label="ORGANIC"
          value="ORGANIC"
        />
      </Picker>
    </View>

            {/* =================================================
                TYPE D'EMBALLAGE CONDITIONNÉ
            ================================================= */}

            <Text style={styles.label}>
              Type d'emballage
            </Text>

            {/* =================================================
                TIN
            ================================================= */}

            <View style={styles.packagingRow}>

              <TouchableOpacity
                style={styles.typeContainer}
                onPress={() =>
                  toggleEmballageConditionne(
                    "Tin"
                  )
                }
              >

                <Text style={styles.checkbox}>
                  {emballagesSelectionnes.includes(
                    "Tin"
                  )
                    ? "☑"
                    : "☐"}
                </Text>

                <Text style={styles.checkboxLabel}>
                  Tin
                </Text>

              </TouchableOpacity>

              {emballagesSelectionnes.includes(
                "Tin"
              ) && (

                <View style={styles.formatsRow}>

                  {[
                    "250 ml",
                    "500 ml",
                    "1 L",
                    "2 L",
                    "3 L",
                    "4 L",
                    "5 L",
                    "16 L",
                    "20 L",
                  ].map((format) => {

                    const selected =
                      formatsEmballage.Tin?.includes(
                        format
                      ) || false;

                    return (
                      <TouchableOpacity
                        key={`Tin-${format}`}
                        style={
                          styles.formatItem
                        }
                        onPress={() => {

                          setFormatsEmballage(
                            (prev) => {

                              const current =
                                prev.Tin || [];

                              const updated =
                                current.includes(
                                  format
                                )
                                  ? current.filter(
                                      (item) =>
                                        item !==
                                        format
                                    )
                                  : [
                                      ...current,
                                      format,
                                    ];

                              return {
                                ...prev,
                                Tin: updated,
                              };
                            }
                          );

                        }}
                      >

                        <Text
                          style={
                            styles.checkbox
                          }
                        >
                          {selected
                            ? "☑"
                            : "☐"}
                        </Text>

                        <Text
                          style={
                            styles.checkboxLabel
                          }
                        >
                          {format}
                        </Text>

                      </TouchableOpacity>
                    );
                  })}

                  {/* AUTRE TIN */}

                  <TouchableOpacity
                    style={
                      styles.formatItem
                    }
                    onPress={() => {

                      setAutresSelectionnes(
                        (prev) => ({
                          ...prev,
                          Tin:
                            !prev.Tin,
                        })
                      );

                      if (
                        autresSelectionnes.Tin
                      ) {

                        setAutresEmballages(
                          (prev) => ({
                            ...prev,
                            Tin: "",
                          })
                        );

                      }

                    }}
                  >

                    <Text
                      style={
                        styles.checkbox
                      }
                    >
                      {autresSelectionnes.Tin
                        ? "☑"
                        : "☐"}
                    </Text>

                    <Text
                      style={
                        styles.checkboxLabel
                      }
                    >
                      Autre
                    </Text>

                  </TouchableOpacity>

                  {autresSelectionnes.Tin && (

                    <View
                      style={{
                        width: "100%",
                      }}
                    >

                      <Text
                        style={
                          styles.label
                        }
                      >
                        Préciser l'emballage
                      </Text>

                      <TextInput
                        style={
                          styles.input
                        }
                        placeholder="Saisir le type d'emballage"
                        value={
                          autresEmballages.Tin
                        }
                        onChangeText={(text) =>
                          setAutresEmballages(
                            (prev) => ({
                              ...prev,
                              Tin: text,
                            })
                          )
                        }
                      />

                    </View>

                  )}

                </View>

              )}

            </View>

            {/* =================================================
                PET
            ================================================= */}

            <View style={styles.packagingRow}>

              <TouchableOpacity
                style={styles.typeContainer}
                onPress={() =>
                  toggleEmballageConditionne(
                    "PET"
                  )
                }
              >

                <Text style={styles.checkbox}>
                  {emballagesSelectionnes.includes(
                    "PET"
                  )
                    ? "☑"
                    : "☐"}
                </Text>

                <Text style={styles.checkboxLabel}>
                  PET
                </Text>

              </TouchableOpacity>

              {emballagesSelectionnes.includes(
                "PET"
              ) && (

                <View style={styles.formatsRow}>

                  {[
                    "250 ml",
                    "500 ml",
                    "1 L",
                    "3 L",
                    "5 L",
                  ].map((format) => {

                    const selected =
                      formatsEmballage.PET?.includes(
                        format
                      ) || false;

                    return (
                      <TouchableOpacity
                        key={`PET-${format}`}
                        style={
                          styles.formatItem
                        }
                        onPress={() => {

                          setFormatsEmballage(
                            (prev) => {

                              const current =
                                prev.PET || [];

                              const updated =
                                current.includes(
                                  format
                                )
                                  ? current.filter(
                                      (item) =>
                                        item !==
                                        format
                                    )
                                  : [
                                      ...current,
                                      format,
                                    ];

                              return {
                                ...prev,
                                PET: updated,
                              };
                            }
                          );

                        }}
                      >

                        <Text
                          style={
                            styles.checkbox
                          }
                        >
                          {selected
                            ? "☑"
                            : "☐"}
                        </Text>

                        <Text
                          style={
                            styles.checkboxLabel
                          }
                        >
                          {format}
                        </Text>

                      </TouchableOpacity>
                    );
                  })}

                  {/* AUTRE PET */}

                  <TouchableOpacity
                    style={
                      styles.formatItem
                    }
                    onPress={() => {

                      setAutresSelectionnes(
                        (prev) => ({
                          ...prev,
                          PET:
                            !prev.PET,
                        })
                      );

                      if (
                        autresSelectionnes.PET
                      ) {

                        setAutresEmballages(
                          (prev) => ({
                            ...prev,
                            PET: "",
                          })
                        );

                      }

                    }}
                  >

                    <Text
                      style={
                        styles.checkbox
                      }
                    >
                      {autresSelectionnes.PET
                        ? "☑"
                        : "☐"}
                    </Text>

                    <Text
                      style={
                        styles.checkboxLabel
                      }
                    >
                      Autre
                    </Text>

                  </TouchableOpacity>

                  {autresSelectionnes.PET && (

                    <View
                      style={{
                        width: "100%",
                      }}
                    >

                      <Text
                        style={
                          styles.label
                        }
                      >
                        Préciser l'emballage
                      </Text>

                      <TextInput
                        style={
                          styles.input
                        }
                        placeholder="Saisir le type d'emballage"
                        value={
                          autresEmballages.PET
                        }
                        onChangeText={(text) =>
                          setAutresEmballages(
                            (prev) => ({
                              ...prev,
                              PET: text,
                            })
                          )
                        }
                      />

                    </View>

                  )}

                </View>

              )}

            </View>

            

            {/* =================================================
                GLASS
            ================================================= */}

            <View style={styles.packagingRowGlass}>

              <TouchableOpacity
                style={styles.typeContainer}
                onPress={() =>
                  toggleEmballageConditionne(
                    "Glass"
                  )
                }
              >

                <Text style={styles.checkbox}>
                  {emballagesSelectionnes.includes(
                    "Glass"
                  )
                    ? "☑"
                    : "☐"}
                </Text>

                <Text style={styles.checkboxLabel}>
                  Glass
                </Text>

              </TouchableOpacity>

              {emballagesSelectionnes.includes(
                "Glass"
              ) && (

                <View
                  style={
                    styles.glassFormatsContainer
                  }
                >

                  {/* MARASCA */}

                  <View style={styles.glassRow}>

                    <Text
                      style={
                        styles.subTypeLabel
                      }
                    >
                      MARASCA
                    </Text>

                    <View
                      style={
                        styles.formatsRow
                      }
                    >

                      {[
                        "250 ml",
                        "500 ml",
                        "750 ml",
                        "1 L",
                      ].map((format) => {

                        const selected =
                          formatsEmballage.Glass
                            ?.MARASCA
                            ?.includes(
                              format
                            ) || false;

                        return (
                          <TouchableOpacity
                            key={`MARASCA-${format}`}
                            style={
                              styles.formatItem
                            }
                            onPress={() => {

                              setFormatsEmballage(
                                (prev) => {

                                  const current =
                                    prev.Glass
                                      ?.MARASCA ||
                                    [];

                                  const updated =
                                    current.includes(
                                      format
                                    )
                                      ? current.filter(
                                          (
                                            item
                                          ) =>
                                            item !==
                                            format
                                        )
                                      : [
                                          ...current,
                                          format,
                                        ];

                                  return {
                                    ...prev,

                                    Glass: {
                                      ...(prev.Glass ||
                                        {}),

                                      MARASCA:
                                        updated,
                                    },
                                  };
                                }
                              );

                            }}
                          >

                            <Text
                              style={
                                styles.checkbox
                              }
                            >
                              {selected
                                ? "☑"
                                : "☐"}
                            </Text>

                            <Text
                              style={
                                styles.checkboxLabel
                              }
                            >
                              {format}
                            </Text>

                          </TouchableOpacity>
                        );
                      })}

                    </View>

                  </View>

                  {/* DORICA */}

                  <View style={styles.glassRow}>

                    <Text
                      style={
                        styles.subTypeLabel
                      }
                    >
                      DORICA
                    </Text>

                    <View
                      style={
                        styles.formatsRow
                      }
                    >

                      {[
                        "250 ml",
                        "500 ml",
                        "750 ml",
                      ].map((format) => {

                        const selected =
                          formatsEmballage.Glass
                            ?.DORICA
                            ?.includes(
                              format
                            ) || false;

                        return (
                          <TouchableOpacity
                            key={`DORICA-${format}`}
                            style={
                              styles.formatItem
                            }
                            onPress={() => {

                              setFormatsEmballage(
                                (prev) => {

                                  const current =
                                    prev.Glass
                                      ?.DORICA ||
                                    [];

                                  const updated =
                                    current.includes(
                                      format
                                    )
                                      ? current.filter(
                                          (
                                            item
                                          ) =>
                                            item !==
                                            format
                                        )
                                      : [
                                          ...current,
                                          format,
                                        ];

                                  return {
                                    ...prev,

                                    Glass: {
                                      ...(prev.Glass ||
                                        {}),

                                      DORICA:
                                        updated,
                                    },
                                  };
                                }
                              );

                            }}
                          >

                            <Text
                              style={
                                styles.checkbox
                              }
                            >
                              {selected
                                ? "☑"
                                : "☐"}
                            </Text>

                            <Text
                              style={
                                styles.checkboxLabel
                              }
                            >
                              {format}
                            </Text>

                          </TouchableOpacity>
                        );
                      })}

                    </View>

                  </View>

                  {/* AUTRE GLASS */}

                  <TouchableOpacity
                    style={
                      styles.formatItem
                    }
                    onPress={() => {

                      setAutresSelectionnes(
                        (prev) => ({
                          ...prev,
                          Glass:
                            !prev.Glass,
                        })
                      );

                      if (
                        autresSelectionnes.Glass
                      ) {

                        setAutresEmballages(
                          (prev) => ({
                            ...prev,
                            Glass: "",
                          })
                        );

                      }

                    }}
                  >

                    <Text
                      style={
                        styles.checkbox
                      }
                    >
                      {autresSelectionnes.Glass
                        ? "☑"
                        : "☐"}
                    </Text>

                    <Text
                      style={
                        styles.checkboxLabel
                      }
                    >
                      Autre
                    </Text>

                  </TouchableOpacity>

                  {autresSelectionnes.Glass && (

                    <View
                      style={{
                        width: "100%",
                      }}
                    >

                      <Text
                        style={
                          styles.label
                        }
                      >
                        Préciser l'emballage
                      </Text>

                      <TextInput
                        style={
                          styles.input
                        }
                        placeholder="Saisir le type d'emballage"
                        value={
                          autresEmballages.Glass
                        }
                        onChangeText={(text) =>
                          setAutresEmballages(
                            (prev) => ({
                              ...prev,
                              Glass: text,
                            })
                          )
                        }
                      />

                    </View>

                  )}

                </View>

              )}

            </View>

            <View style={styles.packagingRow}>

<TouchableOpacity
  style={styles.typeContainer}
  onPress={() =>
    toggleEmballageConditionne(
      "BaginBox"
    )
  }
>

  <Text style={styles.checkbox}>
    {emballagesSelectionnes.includes(
      "BaginBox"
    )
      ? "☑"
      : "☐"}
  </Text>

  <Text style={styles.checkboxLabel}>
  Bag in Box
  </Text>

</TouchableOpacity>

{emballagesSelectionnes.includes(
  "BaginBox"
) && (

  <View style={styles.formatsRow}>

    {[
      
      "3 L",
      "5 L",
      "10 L",
      "20 L",
    ].map((format) => {

      const selected =
        formatsEmballage.BaginBox?.includes(
          format
        ) || false;

      return (
        <TouchableOpacity
          key={`BaginBox-${format}`}
          style={
            styles.formatItem
          }
          onPress={() => {

            setFormatsEmballage(
              (prev) => {

                const current =
                  prev.BaginBox || [];

                const updated =
                  current.includes(
                    format
                  )
                    ? current.filter(
                        (item) =>
                          item !==
                          format
                      )
                    : [
                        ...current,
                        format,
                      ];

                return {
                  ...prev,
                  BaginBox: updated,
                };
              }
            );

          }}
        >

          <Text
            style={
              styles.checkbox
            }
          >
            {selected
              ? "☑"
              : "☐"}
          </Text>

          <Text
            style={
              styles.checkboxLabel
            }
          >
            {format}
          </Text>

        </TouchableOpacity>
      );
    })}

    {/* AUTRE BaginBox */}

    <TouchableOpacity
      style={
        styles.formatItem
      }
      onPress={() => {

        setAutresSelectionnes(
          (prev) => ({
            ...prev,
            BaginBox:
              !prev.BaginBox,
          })
        );

        if (
          autresSelectionnes.BaginBox
        ) {

          setAutresEmballages(
            (prev) => ({
              ...prev,
              BaginBox: "",
            })
          );

        }

      }}
    >

      <Text
        style={
          styles.checkbox
        }
      >
        {autresSelectionnes.BaginBox
          ? "☑"
          : "☐"}
      </Text>

      <Text
        style={
          styles.checkboxLabel
        }
      >
        Autre
      </Text>

    </TouchableOpacity>

    {autresSelectionnes.BaginBox && (

      <View
        style={{
          width: "100%",
        }}
      >

        <Text
          style={
            styles.label
          }
        >
          Préciser l'emballage
        </Text>

        <TextInput
          style={
            styles.input
          }
          placeholder="Saisir le type d'emballage"
          value={
            autresEmballages.BaginBox
          }
          onChangeText={(text) =>
            setAutresEmballages(
              (prev) => ({
                ...prev,
                BaginBox: text,
              })
            )
          }
        />

      </View>

    )}

  </View>

)}

</View>


                        {/* AUTRE */}

            <View
              style={styles.packagingRow}
            >
              <TouchableOpacity
                style={
                  styles.typeContainer
                }
                onPress={() =>
                  toggleEmballageConditionne(
                    "Autre"
                  )
                }
              >
                <Text
                  style={
                    styles.checkbox
                  }
                >
                  {emballagesSelectionnes.includes(
                    "Autre"
                  )
                    ? "☑"
                    : "☐"}
                </Text>

                <Text
                  style={
                    styles.checkboxLabel
                  }
                >
                  Autre
                </Text>
              </TouchableOpacity>
            </View>

            {/* AUTRE EMBALLAGE */}

            {emballagesSelectionnes.includes(
              "Autre"
            ) && (
              <>
                <Text
                  style={styles.label}
                >
                  Préciser l'emballage
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Saisir le type d'emballage"
                  value={
                    autreEmballage
                  }
                  onChangeText={
                    setAutreEmballage
                  }
                />
              </>
            )}

            {/* =================================================
    QUANTITÉ DE LA COMMANDE
================================================= */}

<Text style={styles.label}>
  Quantité de la commande
</Text>

<View style={styles.pickerContainer}>

  <Picker
    style={styles.picker}
    selectedValue={quantiteCommande}
    onValueChange={setQuantiteCommande}
  >

    <Picker.Item
      label="Sélectionner"
      value=""
    />

    <Picker.Item
      label="FCL 20 pieds"
      value="conteneur_20"
    />

    <Picker.Item
      label="FCL 40 pieds"
      value="conteneur_40"
    />

    <Picker.Item
      label="Palettes"
      value="palettes"
    />

  </Picker>

</View>


{/* =================================================
    NOMBRE DE FCL
================================================= */}

{(
  quantiteCommande === "conteneur_20" ||
  quantiteCommande === "conteneur_40"
) && (

  <>
    <Text style={styles.label}>
      Nombre de FCL
    </Text>

    <TextInput
      style={styles.input}
      placeholder="Nombre de FCL"
      value={nombreFCL}
      onChangeText={setNombreFCL}
      keyboardType="numeric"
    />
  </>

)}


{/* =================================================
    NOMBRE DE PALETTES
================================================= */}

{quantiteCommande === "palettes" && (

  <>
    <Text style={styles.label}>
      Nombre de palettes
    </Text>

    <TextInput
      style={styles.input}
      placeholder="Nombre de palettes"
      value={nombrePalettes}
      onChangeText={setNombrePalettes}
      keyboardType="numeric"
    />
  </>

)}

            {/* CERTIFICATIONS */}

<Text style={styles.label}>
  Certifications requises
</Text>

<View style={styles.exigencesContainer}>

  {[
    "ISO 22000",
    "HACCP",
    "IFS Food",
    "BRCGS",
    "ISO 9001",
    "BIO / Organic",
    "Halal",
    "Kosher",
    "JAS",
    "Analyses COI / IOC",
    "Certificat d’analyse (COA)",
    "Certificat d’analyse ONH",
    "Autre",
  ].map((item) => {

    const selected =
      certificationsRequises.includes(item);

    return (
      <TouchableOpacity
        key={item}
        style={styles.exigenceOption}
        onPress={() => {

          if (selected) {

            // Désélectionner
            setCertificationsRequises(
              certificationsRequises.filter(
                (certification) =>
                  certification !== item
              )
            );

            // Vider le champ si Autre est désélectionné
            if (item === "Autre") {
              setAutreCertification("");
            }

          } else {

            // Sélectionner
            setCertificationsRequises([
              ...certificationsRequises,
              item,
            ]);

          }

        }}
      >

        <Text style={styles.exigenceCheckbox}>
          {selected ? "☑" : "☐"}
        </Text>

        <Text style={styles.exigenceText}>
          {item}
        </Text>

      </TouchableOpacity>
    );
  })}

  {/* CHAMP AUTRE */}
  {certificationsRequises.includes("Autre") && (
  <TextInput
    style={styles.input}
    placeholder="Préciser la certification"
    value={autreCertification}
    onChangeText={(text) => {
      console.log("AUTRE CERTIFICATION :", text);
      setAutreCertification(text);
    }}
  />
)}

</View>

            {/* NOM ENTREPRISE */}

            <Text style={styles.label}>
              Nom entreprise
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nom de l'entreprise"
              value={nomEntreprise}
              onChangeText={
                setNomEntreprise
              }
            />

            {/* SITE WEB */}

            <Text style={styles.label}>
              Site web
            </Text>

            <TextInput
              style={styles.input}
              placeholder="www..."
              value={siteWeb}
              onChangeText={
                setSiteWeb
              }
              autoCapitalize="none"
            />

            {/* CONTACT */}

<Text style={styles.label}>
  Canal de communication préféré
</Text>

<View style={styles.pickerContainer}>

  <Picker
    style={styles.picker}
    selectedValue={contactProfessionnel}
    onValueChange={setContactProfessionnel}
  >

    <Picker.Item
      label="Sélectionner"
      value=""
    />

    <Picker.Item
      label="📧 Email"
      value="Email"
    />

    <Picker.Item
      label="📞 Téléphone"
      value="Téléphone"
    />

    <Picker.Item
      label="💬 WhatsApp"
      value="WhatsApp"
    />

    <Picker.Item
      label="💬 BOTIM"
      value="BOTIM"
    />

    <Picker.Item
      label="💬 Telegram"
      value="Telegram"
    />

    <Picker.Item
      label="💬 Viber"
      value="Viber"
    />

<Picker.Item
      label="🟢 WeChat"
      value="WeChatWeChat"
    />

  </Picker>

</View>

            {/* TYPE DE MARQUE */}

<Text style={styles.label}>
  Type de marque
</Text>

<View style={styles.pickerContainer}>

  <Picker
    style={styles.picker}
    selectedValue={typeMarque}
    onValueChange={setTypeMarque}
  >

    <Picker.Item
      label="Sélectionner"
      value=""
    />

    <Picker.Item
      label="Marque ORZETA"
      value="Marque ORZETA"
    />

    <Picker.Item
      label="Private Label"
      value="Private Label"
    />

    <Picker.Item
      label="Création de nouvelle marque"
      value="Création de nouvelle marque"
    />

  </Picker>

</View>
{/* Afficher le type d'étiquette uniquement pour ORZETA */}
{typeMarque === "Marque ORZETA" && (
  <>
    <Text style={styles.label}>
      Type d'étiquette
    </Text>

    <View style={styles.pickerContainer}>
      <Picker
        style={styles.picker}
        selectedValue={typeEtiquette}
        onValueChange={setTypeEtiquette}
      >
        <Picker.Item
          label="Sélectionner une étiquette"
          value=""
        />

        <Picker.Item
          label="SUN"
          value="SUN"
        />

        <Picker.Item
          label="GROVE"
          value="GROVE"
        />

        <Picker.Item
          label="ORGANIC"
          value="ORGANIC"
        />
      </Picker>
    </View>
  </>
)}


{/* NOM DU LABEL */}

{typeMarque === "Private Label" && (
  <>
    <Text style={styles.label}>
      Nom de label
    </Text>

    <TextInput
      style={styles.input}
      placeholder="Nom de label"
      value={nomLabel}
      onChangeText={setNomLabel}
    />
  </>
)}

{/* =================================================
    INFORMATIONS NOUVELLE MARQUE
================================================= */}

{typeMarque === "Création de nouvelle marque" && (
  <View style={styles.newBrandSection}>
    <Text style={styles.newBrandTitle}>
      Informations nouvelle marque
    </Text>

    {/* MARCHÉ CIBLE */}
    <Text style={styles.label}>
      Marché cible
    </Text>

    <TextInput
      style={styles.input}
      placeholder="Ex : Tunisie, France, Italie..."
      value={marcheCible}
      onChangeText={setMarcheCible}
    />

    {/* QUANTITÉ PRÉVUE */}
    <Text style={styles.label}>
      Quantité prévue
    </Text>

    <TextInput
      style={styles.input}
      placeholder="Ex : 5000 litres / an"
      value={quantitePrevue}
      onChangeText={setQuantitePrevue}
      keyboardType="numeric"
    />

    {/* =================================================
        EMBALLAGE NOUVELLE MARQUE
    ================================================= */}

    <View style={styles.packagingContainer}>
      <Text style={styles.label}>
        Type d'emballage
      </Text>

      {/* ================= TIN ================= */}
      <View style={styles.packagingSection}>
        <TouchableOpacity
          style={styles.packagingType}
          onPress={() => toggleEmballageNouvelleMarque("Tin")}
        >
          <Text style={styles.checkbox}>
            {nouvelleMarqueEmballagesSelectionnes.includes("Tin")
              ? "☑"
              : "☐"}
          </Text>

          <Text style={styles.checkboxLabel}>
            Tin
          </Text>
        </TouchableOpacity>

        {nouvelleMarqueEmballagesSelectionnes.includes("Tin") && (
          <View style={styles.packagingDetails}>
            <View style={styles.packagingFormatsRow}>
              {[
                "250 ml",
                "500 ml",
                "1 L",
                "2 L",
                "3 L",
                "4 L",
                "5 L",
                "16 L",
                "20 L",
                "Autre",
              ].map((format) =>
                renderFormatCheckbox("Tin", format)
              )}
            </View>

            {nouvelleMarqueFormatsEmballage.Tin?.includes("Autre") && (
              <>
                <Text style={styles.label}>
                  Préciser l'emballage
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Saisir le type d'emballage"
                  value={nouvelleMarqueAutresFormats.Tin}
                  onChangeText={(value) =>
                    setNouvelleMarqueAutresFormats((prev) => ({
                      ...prev,
                      Tin: value,
                    }))
                  }
                />
              </>
            )}
          </View>
        )}
      </View>

      {/* ================= PET ================= */}
      <View style={styles.packagingSection}>
        <TouchableOpacity
          style={styles.packagingType}
          onPress={() => toggleEmballageNouvelleMarque("PET")}
        >
          <Text style={styles.checkbox}>
            {nouvelleMarqueEmballagesSelectionnes.includes("PET")
              ? "☑"
              : "☐"}
          </Text>

          <Text style={styles.checkboxLabel}>
            PET
          </Text>
        </TouchableOpacity>

        {nouvelleMarqueEmballagesSelectionnes.includes("PET") && (
          <View style={styles.packagingDetails}>
            <View style={styles.packagingFormatsRow}>
              {[
                "250 ml",
                "500 ml",
                "1 L",
                "3 L",
                "5 L",
                "Autre",
              ].map((format) =>
                renderFormatCheckbox("PET", format)
              )}
            </View>

            {nouvelleMarqueFormatsEmballage.PET?.includes("Autre") && (
              <>
                <Text style={styles.label}>
                  Préciser l'emballage
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Saisir le type d'emballage"
                  value={nouvelleMarqueAutresFormats.PET}
                  onChangeText={(value) =>
                    setNouvelleMarqueAutresFormats((prev) => ({
                      ...prev,
                      PET: value,
                    }))
                  }
                />
              </>
            )}
          </View>
        )}
      </View>

{/* ================= GLASS ================= */}

<View style={styles.packagingSection}>

  {/* ================= TYPE GLASS ================= */}

  <TouchableOpacity
    style={styles.packagingType}
    onPress={() => toggleEmballageNouvelleMarque("Glass")}
  >
    <Text style={styles.checkbox}>
      {nouvelleMarqueEmballagesSelectionnes.includes("Glass")
        ? "☑"
        : "☐"}
    </Text>

    <Text style={styles.checkboxLabel}>
      Glass
    </Text>
  </TouchableOpacity>


  {/* ================= DETAILS GLASS ================= */}

  {nouvelleMarqueEmballagesSelectionnes.includes("Glass") && (

    <View style={styles.packagingDetails}>

      {/* =================================================
          MARASCA
      ================================================= */}

<View style={styles.packagingFormatsRow}>
  <Text style={styles.packagingBrand}>
    MARASCA
  </Text>

  {["250 ml", "500 ml", "750 ml", "1 L"].map((format) =>
    renderFormatCheckbox("Glass", format, "MARASCA")
  )}
</View>


      {/* =================================================
          DORICA
      ================================================= */}

<View style={styles.packagingFormatsRow}>
  <Text style={styles.packagingBrand}>
    DORICA
  </Text>

  {["250 ml", "500 ml", "750 ml"].map((format) =>
    renderFormatCheckbox("Glass", format, "DORICA")
  )}
</View>


{/* =================================================
    AUTRE FORMAT GLASS
================================================= */}

<View style={styles.packagingFormatsRow}>

  {renderFormatCheckbox(
    "Glass",
    "Autre"
  )}

</View>


{/* =================================================
    CHAMP PRÉCISER AUTRE GLASS
================================================= */}

{nouvelleMarqueFormatsEmballage?.Glass?.formats?.includes(
  "Autre"
) && (

  <View style={{ width: "100%", marginTop: 10 }}>

    <Text style={styles.label}>
      Préciser l'emballage
    </Text>

    <TextInput
      style={styles.input}
      placeholder="Saisir le type d'emballage"
      value={nouvelleMarqueAutresFormats?.Glass || ""}
      onChangeText={(value) =>
        setNouvelleMarqueAutresFormats((prev) => ({
          ...prev,
          Glass: value,
        }))
      }
    />

  </View>
)}

    </View>

  )}

</View>


{/* ================= BaginBox ================= */}
      <View style={styles.packagingSection}>
        <TouchableOpacity
          style={styles.packagingType}
          onPress={() => toggleEmballageNouvelleMarque("BaginBox")}
        >
          <Text style={styles.checkbox}>
            {nouvelleMarqueEmballagesSelectionnes.includes("BaginBox")
              ? "☑"
              : "☐"}
          </Text>

          <Text style={styles.checkboxLabel}>Bag in Box</Text>
        </TouchableOpacity>

        {nouvelleMarqueEmballagesSelectionnes.includes("BaginBox") && (
          <View style={styles.packagingDetails}>
            <View style={styles.packagingFormatsRow}>
              {[
                
                "3 L",
                
                "5 L",
                "10 L",
                "20 L",
                "Autre",
              ].map((format) =>
                renderFormatCheckbox("BaginBox", format)
              )}
            </View>

            {nouvelleMarqueFormatsEmballage.BaginBox?.includes("Autre") && (
              <>
                <Text style={styles.label}>
                  Préciser l'emballage
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Saisir le type d'emballage"
                  value={nouvelleMarqueAutresFormats.BaginBox}
                  onChangeText={(value) =>
                    setNouvelleMarqueAutresFormats((prev) => ({
                      ...prev,
                      BaginBox: value,
                    }))
                  }
                />
              </>
            )}
          </View>
        )}
      </View>
      {/* ================= AUTRE TYPE ================= */}
      <View style={styles.packagingSection}>
        <TouchableOpacity
          style={styles.packagingType}
          onPress={() => toggleEmballageNouvelleMarque("Autre")}
        >
          <Text style={styles.checkbox}>
            {nouvelleMarqueEmballagesSelectionnes.includes("Autre")
              ? "☑"
              : "☐"}
          </Text>

          <Text style={styles.checkboxLabel}>
            Autre
          </Text>
        </TouchableOpacity>

        {nouvelleMarqueEmballagesSelectionnes.includes("Autre") && (
          <View style={styles.packagingDetails}>
            <Text style={styles.label}>
              Préciser l'emballage
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Saisir le type d'emballage"
              value={nouvelleMarqueAutreEmballage}
              onChangeText={setNouvelleMarqueAutreEmballage}
            />
          </View>
        )}
      </View>
    </View>
    {/* Fin packagingContainer */}
  </View>
  /* Fin newBrandSection */
)}

<TouchableOpacity
  style={styles.addCommandButton}
  onPress={handleAjouterCommande}
  activeOpacity={0.8}
>
  <Text style={styles.addCommandButtonText}>
    + Ajouter une commande Conditionnée
  </Text>
</TouchableOpacity>

{/* FERMETURE SECTION CONDITIONNÉ */}
</View>
)}

{/* =================================================
    QUALIFICATION DU VISITEUR
================================================= */}

      <View
        style={
          styles.ratingContainer
        }
      >

        <Text
          style={
            styles.ratingTitle
          }
        >
          Qualification du visiteur
        </Text>

        <View
          style={
            styles.starsContainer
          }
        >

          {[1, 2, 3, 4, 5].map(
            (etoile) => (

              <TouchableOpacity
                key={etoile}
                onPress={() =>
                  setQualification(
                    etoile
                  )
                }
                activeOpacity={0.7}
              >

                <Text
                  style={
                    styles.star
                  }
                >
                  {etoile <=
                  qualification
                    ? "★"
                    : "☆"}
                </Text>

              </TouchableOpacity>

            )
          )}

        </View>

        <Text
          style={
            styles.ratingText
          }
        >
          {qualification === 0
            ? "Sélectionner une note"
            : `${qualification} / 5 étoiles`}
        </Text>

      </View>

      {/* =================================================
          BOUTON AJOUTER
      ================================================= */}

      <TouchableOpacity
        style={styles.button}
        onPress={handleAjouter}
      >

        <Text
          style={
            styles.buttonText
          }
        >
          {PROFILS_AVEC_PDF.includes(profile)
            ? "Traitement de commande"
            : "Ajouter visiteur"}
        </Text>

      </TouchableOpacity>

    </ScrollView> 
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: Couleurs.fond,
  },

  // Colonne centrée et limitée en largeur (lisible sur ordinateur)
  content: {
    padding: 20,
    paddingBottom: 50,
    width: "100%",
    maxWidth: LARGEUR_MAX,
    alignSelf: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 5,
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 25,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: Couleurs.texte,
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    backgroundColor: Couleurs.carte,
    color: Couleurs.texte,
    borderWidth: 1,
    borderColor: Couleurs.bordure,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },

  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  // Liste déroulante : sur le web, le <select> faisait 19 px de haut
  picker: Platform.select({
    web: {
      height: 48,
      paddingHorizontal: 10,
      borderWidth: 0,
      backgroundColor: "transparent",
      fontSize: 16,
      color: Couleurs.texte,
    },
    default: {},
  }),

  pickerContainer: {
    backgroundColor: Couleurs.carte,
    borderWidth: 1,
    borderColor: Couleurs.bordure,
    borderRadius: 10,
    overflow: "hidden",
  },

  phoneContainer: {
    flexDirection: "row",
    gap: 8,
  },

  indicatif: {
    width: 80,
    backgroundColor: Couleurs.oliveClair,
    borderWidth: 1,
    borderColor: Couleurs.bordure,
    borderRadius: 10,
    paddingHorizontal: 10,
    textAlign: "center",
  },

  phoneInput: {
    flex: 1,
    backgroundColor: Couleurs.carte,
    color: Couleurs.texte,
    borderWidth: 1,
    borderColor: Couleurs.bordure,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },

  section: {
    marginTop: 25,
    padding: 16,
    backgroundColor: Couleurs.carte,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Couleurs.bordure,
    ...ombre,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: Couleurs.oliveFonce,
    marginBottom: 10,
  },

  newBrandSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#5C681F",
  },

  newBrandTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },

  button: {
    backgroundColor: Couleurs.olive,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 25,
    alignItems: "center",
  },

  testButton: {
    backgroundColor: "#555",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },

  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },

  checkbox: {
    fontSize: 22,
    marginRight: 10,
  },

  checkboxLabel: {
    fontSize: 16,
    color: "#333",
    //flexShrink: 0,
  },

  packagingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },

  packagingRowGlass: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    width: "100%",
  },

  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 90,
  },

  formatsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
  },

  formatItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 8,
  },

  glassFormatsContainer: {
    flex: 1,
  },

  glassRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  subTypeLabel: {
    width: 85,
    fontSize: 14,
    fontWeight: "600",
  },

  // =====================================================
  // STYLES QUALIFICATION
  // =====================================================

  ratingContainer: {
    alignItems: "center",
    marginVertical: 25,
  },

  ratingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333333",
  },

  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  star: {
    fontSize: 42,
    color: "#FFD700",
    marginHorizontal: 5,
  },

  ratingText: {
    fontSize: 16,
    marginTop: 8,
    color: "#555555",
  },

  
packagingContainer: {
  width: "100%",
  marginTop: 10,
},

packagingSection: {
  flexDirection: "row",
  alignItems: "flex-start",
  width: "100%",
  marginTop: 12,
},

packagingType: {
  flexDirection: "row",
  alignItems: "center",
  width: 80,
  paddingTop: 2,
},

packagingDetails: {
  flex: 1,
  minWidth: 0,
  marginLeft: 0,
},

packagingFormatsRow: {
  flexDirection: "row",
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 12,
},

packagingFormatItem: {
  flexDirection: "row",
  alignItems: "center",
  marginRight: 12,
  marginBottom: 4,
},

packagingBrand: {
  minWidth: 65,
  marginRight: 12,
  fontSize: 13,
  color: "#000",
},
formatCheckboxContainer: {
  flexDirection: "row",
  alignItems: "center",
  marginRight: 15,
  marginBottom: 10,
},

formatCheckbox: {
  fontSize: 20,
  marginRight: 5,
},

formatCheckboxLabel: {
  fontSize: 14,
  color: "#333",
},
inputWithUnit: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 8,
  height: 45,
  paddingRight: 12,
},

inputVolume: {
  flex: 1,
  height: 45,
  paddingHorizontal: 12,
  borderWidth: 0,
},

unitText: {
  fontSize: 16,
  fontWeight: "bold",
},

aromatiqueContainer: {
  marginTop: 10,
  marginBottom: 15,
},

aromatiqueTitle: {
  fontSize: 16,
  fontWeight: "bold",
  marginBottom: 10,
  color: "#333",
},

aromatiqueRow: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 8,
  minHeight: 35,
},

aromatiqueLabel: {
  width: 90,
  fontSize: 14,
  fontWeight: "600",
  color: "#333",
},

aromatiqueOption: {
  flexDirection: "row",
  alignItems: "center",
  width: 90,
},

aromatiqueCheckbox: {
  fontSize: 20,
  marginRight: 5,
},

aromatiqueOptionText: {
  fontSize: 14,
  color: "#333",
},

exigencesContainer: {
  marginTop: 5,
  marginBottom: 15,
},

exigenceOption: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 8,
  paddingVertical: 4,
},

exigenceCheckbox: {
  fontSize: 20,
  marginRight: 8,
},

exigenceText: {
  fontSize: 14,
  color: "#333",
},

contactContainer: {
  marginTop: 5,
  marginBottom: 15,
},

contactItem: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 8,
},

checkbox: {
  fontSize: 22,
  marginRight: 10,
},

contactText: {
  fontSize: 16,
},

  // =====================================================
  // STYLES COMMANDES MULTIPLES
  // =====================================================

  savedCommandsContainer: {
    marginBottom: 15,
  },

  savedCommandsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5C681F",
    marginBottom: 8,
  },

  savedCommandCard: {
    backgroundColor: "#f4f4f4",
    borderWidth: 1,
    borderColor: "#d8d8d8",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },

  savedCommandTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },

  savedCommandText: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },

  currentCommandTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 12,
    color: "#333",
  },

  addCommandButton: {
    backgroundColor: "#5c681F",
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },

  addCommandButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  headerButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },

  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#5C681F",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 20,
  },

  modeModification: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: "#eef2dc",
    borderColor: "#5C681F",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },

  modeModificationText: {
    flex: 1,
    minWidth: 180,
    color: "#5C681F",
    fontSize: 14,
  },

  nouveauVisiteurButton: {
    backgroundColor: "#5C681F",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  nouveauVisiteurText: {
    color: "#fff",
    fontWeight: "bold",
  },

  carteJointe: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eef2dc",
    borderRadius: 10,
    padding: 12,
    marginTop: -10,
    marginBottom: 20,
  },

  carteJointeText: {
    flex: 1,
    color: "#5C681F",
    fontSize: 14,
  },

  scanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  archivesButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#5C681F",
    borderRadius: 8,
  },

  archivesButtonText: {
    marginLeft: 6,
    color: "#5C681F",
    fontSize: 14,
    fontWeight: "600",
  },

  logoutButton: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#c62828",
    borderRadius: 8,
  },
  
  logoutText: {
    marginLeft: 6,
    color: "#c62828",
    fontSize: 14,
    fontWeight: "600",
  },

  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 15,
  },
  
  checkboxOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 40,
  },
  
  checkboxSymbol: {
    fontSize: 24,
    color: "#000",
    marginRight: 7,
  },
  
  checkboxText: {
    fontSize: 16,
    color: "#000",
  },
  kValueContainer: {
    marginTop: 5,
    marginBottom: 10,
  },

});