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

import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
// =====================================================
// URL BACKEND
// =====================================================

// Adresse du serveur : voir services/api.js (EXPO_PUBLIC_API_URL)
import { API_URL } from "../services/api";
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

  // =====================================================
  // CHANGEMENT PAYS
  // =====================================================

  const handlePaysChange = (value) => {
    setOrigine(value);

    if (value === "Afghanistan") {
      setIndicatif("+93");
    } else if (value === "Afrique du Sud") {
      setIndicatif("+27");
    } else if (value === "Albanie") {
      setIndicatif("+355");
    } else if (value === "Algérie") {
      setIndicatif("+213");
    } else if (value === "Allemagne") {
      setIndicatif("+49");
    } else if (value === "Andorre") {
      setIndicatif("+376");
    } else if (value === "Angola") {
      setIndicatif("+244");
    } else if (value === "Antigua-et-Barbuda") {
      setIndicatif("+1");
    } else if (value === "Arabie Saoudite") {
      setIndicatif("+966");
    } else if (value === "Argentine") {
      setIndicatif("+54");
    } else if (value === "Arménie") {
      setIndicatif("+374");
    } else if (value === "Australie") {
      setIndicatif("+61");
    } else if (value === "Autriche") {
      setIndicatif("+43");
    } else if (value === "Azerbaïdjan") {
      setIndicatif("+994");
    } else if (value === "Bahamas") {
      setIndicatif("+1");
    } else if (value === "Bahreïn") {
      setIndicatif("+973");
    } else if (value === "Bangladesh") {
      setIndicatif("+880");
    } else if (value === "Barbade") {
      setIndicatif("+1");
    } else if (value === "Belgique") {
      setIndicatif("+32");
    } else if (value === "Belize") {
      setIndicatif("+501");
    } else if (value === "Bénin") {
      setIndicatif("+229");
    } else if (value === "Bhoutan") {
      setIndicatif("+975");
    } else if (value === "Biélorussie") {
      setIndicatif("+375");
    } else if (value === "Bolivie") {
      setIndicatif("+591");
    } else if (value === "Bosnie-Herzégovine") {
      setIndicatif("+387");
    } else if (value === "Botswana") {
      setIndicatif("+267");
    } else if (value === "Brésil") {
      setIndicatif("+55");
    } else if (value === "Brunei") {
      setIndicatif("+673");
    } else if (value === "Bulgarie") {
      setIndicatif("+359");
    } else if (value === "Burkina Faso") {
      setIndicatif("+226");
    } else if (value === "Burundi") {
      setIndicatif("+257");
    } else if (value === "Cambodge") {
      setIndicatif("+855");
    } else if (value === "Cameroun") {
      setIndicatif("+237");
    } else if (value === "Canada") {
      setIndicatif("+1");
    } else if (value === "Cap-Vert") {
      setIndicatif("+238");
    } else if (value === "Chili") {
      setIndicatif("+56");
    } else if (value === "Chine") {
      setIndicatif("+86");
    } else if (value === "Chypre") {
      setIndicatif("+357");
    } else if (value === "Colombie") {
      setIndicatif("+57");
    } else if (value === "Comores") {
      setIndicatif("+269");
    } else if (value === "Congo") {
      setIndicatif("+242");
    } else if (value === "Costa Rica") {
      setIndicatif("+506");
    } else if (value === "Côte d'Ivoire") {
      setIndicatif("+225");
    } else if (value === "Croatie") {
      setIndicatif("+385");
    } else if (value === "Cuba") {
      setIndicatif("+53");
    } else if (value === "Danemark") {
      setIndicatif("+45");
    } else if (value === "Djibouti") {
      setIndicatif("+253");
    } else if (value === "Dominique") {
      setIndicatif("+1");
    } else if (value === "Égypte") {
      setIndicatif("+20");
    } else if (value === "Émirats Arabes Unis") {
      setIndicatif("+971");
    } else if (value === "Équateur") {
      setIndicatif("+593");
    } else if (value === "Érythrée") {
      setIndicatif("+291");
    } else if (value === "Espagne") {
      setIndicatif("+34");
    } else if (value === "Estonie") {
      setIndicatif("+372");
    } else if (value === "Eswatini") {
      setIndicatif("+268");
    } else if (value === "Éthiopie") {
      setIndicatif("+251");
    } else if (value === "Fidji") {
      setIndicatif("+679");
    } else if (value === "Finlande") {
      setIndicatif("+358");
    } else if (value === "France") {
      setIndicatif("+33");
    } else if (value === "Gabon") {
      setIndicatif("+241");
    } else if (value === "Gambie") {
      setIndicatif("+220");
    } else if (value === "Géorgie") {
      setIndicatif("+995");
    } else if (value === "Ghana") {
      setIndicatif("+233");
    } else if (value === "Grèce") {
      setIndicatif("+30");
    } else if (value === "Grenade") {
      setIndicatif("+1");
    } else if (value === "Guatemala") {
      setIndicatif("+502");
    } else if (value === "Guinée") {
      setIndicatif("+224");
    } else if (value === "Guinée-Bissau") {
      setIndicatif("+245");
    } else if (value === "Guinée équatoriale") {
      setIndicatif("+240");
    } else if (value === "Guyana") {
      setIndicatif("+592");
    } else if (value === "Haïti") {
      setIndicatif("+509");
    } else if (value === "Honduras") {
      setIndicatif("+504");
    } else if (value === "Hongrie") {
      setIndicatif("+36");
    } else if (value === "Inde") {
      setIndicatif("+91");
    } else if (value === "Indonésie") {
      setIndicatif("+62");
    } else if (value === "Irak") {
      setIndicatif("+964");
    } else if (value === "Iran") {
      setIndicatif("+98");
    } else if (value === "Irlande") {
      setIndicatif("+353");
    } else if (value === "Islande") {
      setIndicatif("+354");
    } else if (value === "Israël") {
      setIndicatif("+972");
    } else if (value === "Italie") {
      setIndicatif("+39");
    } else if (value === "Jamaïque") {
      setIndicatif("+1");
    } else if (value === "Japon") {
      setIndicatif("+81");
    } else if (value === "Jordanie") {
      setIndicatif("+962");
    } else if (value === "Kazakhstan") {
      setIndicatif("+7");
    } else if (value === "Kenya") {
      setIndicatif("+254");
    } else if (value === "Kirghizistan") {
      setIndicatif("+996");
    } else if (value === "Koweït") {
      setIndicatif("+965");
    } else if (value === "Laos") {
      setIndicatif("+856");
    } else if (value === "Lettonie") {
      setIndicatif("+371");
    } else if (value === "Liban") {
      setIndicatif("+961");
    } else if (value === "Lesotho") {
      setIndicatif("+266");
    } else if (value === "Liberia") {
      setIndicatif("+231");
    } else if (value === "Libye") {
      setIndicatif("+218");
    } else if (value === "Liechtenstein") {
      setIndicatif("+423");
    } else if (value === "Lituanie") {
      setIndicatif("+370");
    } else if (value === "Luxembourg") {
      setIndicatif("+352");
    } else if (value === "Macédoine du Nord") {
      setIndicatif("+389");
    } else if (value === "Madagascar") {
      setIndicatif("+261");
    } else if (value === "Malaisie") {
      setIndicatif("+60");
    } else if (value === "Malawi") {
      setIndicatif("+265");
    } else if (value === "Maldives") {
      setIndicatif("+960");
    } else if (value === "Mali") {
      setIndicatif("+223");
    } else if (value === "Malte") {
      setIndicatif("+356");
    } else if (value === "Maroc") {
      setIndicatif("+212");
    } else if (value === "Maurice") {
      setIndicatif("+230");
    } else if (value === "Mauritanie") {
      setIndicatif("+222");
    } else if (value === "Mexique") {
      setIndicatif("+52");
    } else if (value === "Moldavie") {
      setIndicatif("+373");
    } else if (value === "Monaco") {
      setIndicatif("+377");
    } else if (value === "Mongolie") {
      setIndicatif("+976");
    } else if (value === "Monténégro") {
      setIndicatif("+382");
    } else if (value === "Mozambique") {
      setIndicatif("+258");
    } else if (value === "Myanmar") {
      setIndicatif("+95");
    } else if (value === "Namibie") {
      setIndicatif("+264");
    } else if (value === "Népal") {
      setIndicatif("+977");
    } else if (value === "Nicaragua") {
      setIndicatif("+505");
    } else if (value === "Niger") {
      setIndicatif("+227");
    } else if (value === "Nigeria") {
      setIndicatif("+234");
    } else if (value === "Norvège") {
      setIndicatif("+47");
    } else if (value === "Nouvelle-Zélande") {
      setIndicatif("+64");
    } else if (value === "Oman") {
      setIndicatif("+968");
    } else if (value === "Ouganda") {
      setIndicatif("+256");
    } else if (value === "Ouzbékistan") {
      setIndicatif("+998");
    } else if (value === "Pakistan") {
      setIndicatif("+92");
    } else if (value === "Panama") {
      setIndicatif("+507");
    } else if (value === "Papouasie-Nouvelle-Guinée") {
      setIndicatif("+675");
    } else if (value === "Paraguay") {
      setIndicatif("+595");
    } else if (value === "Pays-Bas") {
      setIndicatif("+31");
    } else if (value === "Pérou") {
      setIndicatif("+51");
    } else if (value === "Philippines") {
      setIndicatif("+63");
    } else if (value === "Pologne") {
      setIndicatif("+48");
    } else if (value === "Portugal") {
      setIndicatif("+351");
    } else if (value === "Qatar") {
      setIndicatif("+974");
    } else if (value === "République démocratique du Congo") {
      setIndicatif("+243");
    } else if (value === "République dominicaine") {
      setIndicatif("+1");
    } else if (value === "République tchèque") {
      setIndicatif("+420");
    } else if (value === "Roumanie") {
      setIndicatif("+40");
    } else if (value === "Royaume-Uni") {
      setIndicatif("+44");
    } else if (value === "Russie") {
      setIndicatif("+7");
    } else if (value === "Rwanda") {
      setIndicatif("+250");
    } else if (value === "Saint-Kitts-et-Nevis") {
      setIndicatif("+1");
    } else if (value === "Sainte-Lucie") {
      setIndicatif("+1");
    } else if (value === "Saint-Marin") {
      setIndicatif("+378");
    } else if (value === "Saint-Vincent-et-les-Grenadines") {
      setIndicatif("+1");
    } else if (value === "Salvador") {
      setIndicatif("+503");
    } else if (value === "Samoa") {
      setIndicatif("+685");
    } else if (value === "Sénégal") {
      setIndicatif("+221");
    } else if (value === "Serbie") {
      setIndicatif("+381");
    } else if (value === "Seychelles") {
      setIndicatif("+248");
    } else if (value === "Sierra Leone") {
      setIndicatif("+232");
    } else if (value === "Singapour") {
      setIndicatif("+65");
    } else if (value === "Slovaquie") {
      setIndicatif("+421");
    } else if (value === "Slovénie") {
      setIndicatif("+386");
    } else if (value === "Somalie") {
      setIndicatif("+252");
    } else if (value === "Soudan") {
      setIndicatif("+249");
    } else if (value === "Soudan du Sud") {
      setIndicatif("+211");
    } else if (value === "Sri Lanka") {
      setIndicatif("+94");
    } else if (value === "Suède") {
      setIndicatif("+46");
    } else if (value === "Suisse") {
      setIndicatif("+41");
    } else if (value === "Suriname") {
      setIndicatif("+597");
    } else if (value === "Tadjikistan") {
      setIndicatif("+992");
    } else if (value === "Tanzanie") {
      setIndicatif("+255");
    } else if (value === "Thaïlande") {
      setIndicatif("+66");
    } else if (value === "Timor oriental") {
      setIndicatif("+670");
    } else if (value === "Togo") {
      setIndicatif("+228");
    } else if (value === "Tonga") {
      setIndicatif("+676");
    } else if (value === "Trinité-et-Tobago") {
      setIndicatif("+1");
    } else if (value === "Tunisie") {
      setIndicatif("+216");
    } else if (value === "Turkménistan") {
      setIndicatif("+993");
    } else if (value === "Turquie") {
      setIndicatif("+90");
    } else if (value === "Ukraine") {
      setIndicatif("+380");
    } else if (value === "Uruguay") {
      setIndicatif("+598");
    } else if (value === "Vanuatu") {
      setIndicatif("+678");
    } else if (value === "Vatican") {
      setIndicatif("+39");
    } else if (value === "Venezuela") {
      setIndicatif("+58");
    } else if (value === "Viêt Nam") {
      setIndicatif("+84");
    } else if (value === "Yémen") {
      setIndicatif("+967");
    } else if (value === "Zambie") {
      setIndicatif("+260");
    } else if (value === "Zimbabwe") {
      setIndicatif("+263");
    } else if (value === "États-Unis") {
      setIndicatif("+1");
    } else {
      setIndicatif("");
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

const scannerCarteVisite = async () => {
  try {
    if (Platform.OS !== "web") {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        afficherMessage(
          "Caméra",
          "Autorisez l'accès à la caméra pour scanner une carte de visite."
        );
        return;
      }
    }

    const resultat = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    });

    if (resultat.canceled || !resultat.assets?.length) {
      return;
    }

    const photo = resultat.assets[0];
    const imageBase64 =
      photo.base64 ||
      (photo.uri?.startsWith("data:") ? photo.uri : null);

    if (!imageBase64) {
      throw new Error("Photo illisible.");
    }

    setScanEnCours(true);

    const token = await AsyncStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/carte-visite/scan`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageBase64 }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data?.message || "Impossible de lire la carte."
      );
    }

    const c = data.champs || {};

    // Ne remplir que les champs détectés
    // Le champ « Nom et Prénom » reçoit le nom complet
    const nomComplet = [c.prenom, c.nom]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (nomComplet) setNom(nomComplet);
    if (c.email) setEmail(c.email);
    if (c.indicatif) setIndicatif(c.indicatif);
    if (c.telephone) setTelephone(c.telephone);
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

    const response = await fetch(
      `${API_URL}/api/visiteurs`,
      {
        method: "POST",
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

    if (sansPdf) {
      afficherMessage(
        "Succès",
        "Le visiteur a été ajouté avec succès."
      );
    } else {
      router.push({
        pathname: "/pdf",
        params: {
          id: String(data.id),
        },
      });
    }

    // =====================================================
    // RESET VISITEUR
    // =====================================================

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

    resetCommandeFields();

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

    {/* =================================================
        SCANNER CARTE DE VISITE
    ================================================= */}

    <TouchableOpacity
      style={[
        styles.scanButton,
        scanEnCours && { opacity: 0.6 },
      ]}
      onPress={scannerCarteVisite}
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
          selectedValue={origine}
          onValueChange={
            handlePaysChange
          }
        >
          <Picker.Item
            label="Sélectionner un pays"
            value=""
          />

          {pays.map((item) => (
            <Picker.Item
              key={item}
              label={item}
              value={item}
            />
          ))}
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
          onChangeText={setTelephone}
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

                {pays.map((item) => (
                  <Picker.Item
                    key={item}
                    label={item}
                    value={item}
                  />
                ))}

              </Picker>

            </View>

{/* CANAL */}

<Text style={styles.label}>
  Canal de distribution
</Text>

<View style={styles.pickerContainer}>

  <Picker
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
    backgroundColor: "#f5f5f5",
  },

  content: {
    padding: 20,
    paddingBottom: 50,
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
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },

  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  pickerContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },

  phoneContainer: {
    flexDirection: "row",
    gap: 8,
  },

  indicatif: {
    width: 80,
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    textAlign: "center",
  },

  phoneInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },

  section: {
    marginTop: 25,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
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
    backgroundColor: "#5C681F",
    paddingVertical: 15,
    borderRadius: 8,
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