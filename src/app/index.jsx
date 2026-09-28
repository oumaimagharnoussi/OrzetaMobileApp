import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";

// =====================================================
// URL BACKEND
// =====================================================

const API_URL = "http://192.168.1.146:5000";

// =====================================================
// COMPOSANT
// =====================================================

export default function HomeScreen() {
  const router = useRouter();

  // =====================================================
  // INFORMATIONS GÉNÉRALES
  // =====================================================

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [indicatif, setIndicatif] = useState("+216");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [origine, setOrigine] = useState("");
  const [societe, setSociete] = useState("");
  const [adresseSociete, setAdresseSociete] = useState("");
  const [fonction, setFonction] = useState("");
  const [langueCommunication, setLangueCommunication] = useState("");

  // =====================================================
  // AUTRE EMBALLAGE PAR TYPE
  // =====================================================

  const [autresSelectionnes, setAutresSelectionnes] = useState({
    Tin: false,
    PET: false,
    Glass: false,
  });

  const [autresEmballages, setAutresEmballages] = useState({
    Tin: "",
    PET: "",
    Glass: "",
  });

  const [nouvelleMarqueAutresFormats, setNouvelleMarqueAutresFormats] =
  useState({
    Tin: "",
    PET: "",
    Glass: "",
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

  if (sousType) {
    // Glass > MARASCA / DORICA
    selected =
      formatsType &&
      typeof formatsType === "object" &&
      !Array.isArray(formatsType) &&
      Array.isArray(formatsType[sousType])
        ? formatsType[sousType].includes(format)
        : false;
  } else {
    // Tin / PET / Glass > Autre
    selected =
      Array.isArray(formatsType)
        ? formatsType.includes(format)
        : false;
  }

  const toggleFormat = () => {
    setNouvelleMarqueFormatsEmballage((prev) => {
      const current = prev?.[type];

      // ============================
      // MARASCA / DORICA
      // ============================
      if (sousType) {
        const currentSousType =
          current &&
          typeof current === "object" &&
          !Array.isArray(current) &&
          Array.isArray(current[sousType])
            ? current[sousType]
            : [];

        const updatedSousType = currentSousType.includes(format)
          ? currentSousType.filter((item) => item !== format)
          : [...currentSousType, format];

        return {
          ...prev,
          [type]: {
            ...(current &&
            typeof current === "object" &&
            !Array.isArray(current)
              ? current
              : {}),
            [sousType]: updatedSousType,
          },
        };
      }

      // ============================
      // AUTRE / FORMAT NORMAL
      // ============================

      const currentFormats = Array.isArray(current)
        ? current
        : [];

      const updatedFormats = currentFormats.includes(format)
        ? currentFormats.filter((item) => item !== format)
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

  // =====================================================
  // VRAC
  // =====================================================

  const [categorie, setCategorie] = useState("");
  const [qualiteGrade, setQualiteGrade] = useState("");
  const [volumeEstime, setVolumeEstime] = useState("");
  const [destination, setDestination] = useState("");
  const [incoterm, setIncoterm] = useState("");
  const [formatLivraison, setFormatLivraison] = useState("");
  const [frequenceCommande, setFrequenceCommande] = useState("");
  const [exigencesSpecifiques, setExigencesSpecifiques] = useState([]);
  const [informationsComplementaires, setInformationsComplementaires] =
    useState("");

  // =====================================================
  // CONDITIONNÉ
  // =====================================================

  const [paysConditionne, setPaysConditionne] = useState("");
  const [canalDistribution, setCanalDistribution] = useState("");
  const [volumesEstimes, setVolumesEstimes] = useState("");

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
    },
    Autre: [],
  });

  const [nouvelleMarqueAutreEmballage, setNouvelleMarqueAutreEmballage] =
    useState("");

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

      // VRAC
      setCategorie("");
      setQualiteGrade("");
      setVolumeEstime("");
      setDestination("");
      setIncoterm("");
      setFormatLivraison("");
      setFrequenceCommande("");
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
      });

      setAutresEmballages({
        Tin: "",
        PET: "",
        Glass: "",
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

    if (value !== "conditionné") {
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
      });

      setAutresEmballages({
        Tin: "",
        PET: "",
        Glass: "",
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

    if (value !== "vrac") {
      setCategorie("");
      setQualiteGrade("");
      setVolumeEstime("");
      setDestination("");
      setIncoterm("");
      setFormatLivraison("");
      setFrequenceCommande("");
      setExigencesSpecifiques([]);
      setInformationsComplementaires("");
    }
  };

  // =====================================================
  // AJOUT / SUPPRESSION EMBALLAGE CONDITIONNÉ
  // =====================================================

  const toggleEmballageConditionne = (type) => {
    if (emballagesSelectionnes.includes(type)) {
      setEmballagesSelectionnes(
        emballagesSelectionnes.filter((item) => item !== type)
      );

      setFormatsEmballage((prev) => {
        const updated = { ...prev };
        delete updated[type];
        return updated;
      });

      // Si on désactive Tin/PET/Glass,
      // on supprime également son Autre
      if (type === "Tin") {
        setAutresSelectionnes((prev) => ({
          ...prev,
          Tin: false,
        }));

        setAutresEmballages((prev) => ({
          ...prev,
          Tin: "",
        }));
      }

      if (type === "PET") {
        setAutresSelectionnes((prev) => ({
          ...prev,
          PET: false,
        }));

        setAutresEmballages((prev) => ({
          ...prev,
          PET: "",
        }));
      }

      if (type === "Glass") {
        setAutresSelectionnes((prev) => ({
          ...prev,
          Glass: false,
        }));

        setAutresEmballages((prev) => ({
          ...prev,
          Glass: "",
        }));
      }

      if (type === "Autre") {
        setAutreEmballage("");
      }
    } else {
      setEmballagesSelectionnes([
        ...emballagesSelectionnes,
        type,
      ]);
    }
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

  const handleAjouter = async () => {

    // ===================================================
    // VÉRIFICATION QUALIFICATION
    // ===================================================

    if (qualification === 0) {
      Alert.alert(
        "Attention",
        "Veuillez sélectionner une note de 1 à 5 étoiles."
      );
      return;
    }

    // ===================================================
    // TYPE EMBALLAGE CONDITIONNÉ
    // ===================================================
    //
    // IMPORTANT :
    // Tin / PET / Glass sont les types principaux.
    //
    // Les "Autre" sont maintenant enregistrés
    // indépendamment pour chaque type.
    //
    // ===================================================

    let typeEmballageData = null;

    if (
      typeCommande === "conditionné" &&
      emballagesSelectionnes.length > 0
    ) {
      const emballagesPrincipaux =
        emballagesSelectionnes.filter(
          (item) =>
            item === "Tin" ||
            item === "PET" ||
            item === "Glass"
        );

      typeEmballageData = {
        emballages: emballagesPrincipaux,

        autres: {
          Tin: autresSelectionnes.Tin
            ? autresEmballages.Tin.trim() || ""
            : "",

          PET: autresSelectionnes.PET
            ? autresEmballages.PET.trim() || ""
            : "",

          Glass: autresSelectionnes.Glass
            ? autresEmballages.Glass.trim() || ""
            : "",
        },
      };
    }

    // ===================================================
    // PACKAGING
    // ===================================================
    //
    // IMPORTANT :
    // packaging est maintenant séparé de type_emballage.
    //
    // Exemple :
    //
    // {
    //   Tin: ["500 ml", "1 L"],
    //   PET: ["1 L"],
    //   Glass: {
    //     MARASCA: ["750 ml"],
    //     DORICA: ["500 ml"]
    //   }
    // }
    //
    // ===================================================

    let packagingData = null;

    if (
      typeCommande === "conditionné" &&
      Object.keys(formatsEmballage).length > 0
    ) {
      packagingData = formatsEmballage;
    }

    // ===================================================
    // FORMAT NOUVELLE MARQUE
    // ===================================================

    let nouvelleMarqueFormatsData = null;

    if (
      typeCommande === "conditionné" &&
      typeMarque === "Création de nouvelle marque" &&
      nouvelleMarqueEmballagesSelectionnes.length > 0
    ) {
      nouvelleMarqueFormatsData = {
        emballages:
          nouvelleMarqueEmballagesSelectionnes,

        formats:
          nouvelleMarqueFormatsEmballage,

        autre:
          nouvelleMarqueAutreEmballage.trim() || null,
      };
    }

    // ===================================================
    // DONNÉES VISITEUR
    // ===================================================

    const visitorData = {

      // =================================================
      // INFORMATIONS GÉNÉRALES
      // =================================================

      nom:
        nom.trim() || null,

      prenom:
        prenom.trim() || null,

      email:
        email.trim() || null,

      age:
        age.trim() &&
        !isNaN(Number(age))
          ? Number(age)
          : null,

      origine:
        origine || null,

      indicatif:
        indicatif || null,

      telephone:
        telephone.trim() || null,

      societe:
        societe.trim() || null,

      adresse_societe:
        adresseSociete.trim() || null,

      fonction:
        fonction.trim() || null,

      langue_communication:
        langueCommunication || null,

      // =================================================
      // PROFILE
      // =================================================

      profile:
        profile || null,

      // =================================================
      // TYPE COMMANDE
      // =================================================

      type_commande:
        profile === "intermediaire" ||
        profile === "acheteur"
          ? typeCommande || null
          : null,

      // =================================================
      // QUALIFICATION
      // =================================================

      qualification:
        qualification > 0
          ? qualification
          : null,

      // =================================================
      // VRAC
      // =================================================

      categorie:
        typeCommande === "vrac"
          ? categorie.trim() || null
          : null,

      qualite_grade:
        typeCommande === "vrac"
          ? qualiteGrade.trim() || null
          : null,

      volume_estime:
        typeCommande === "vrac" &&
        volumeEstime.trim() &&
        !isNaN(Number(volumeEstime))
          ? Number(volumeEstime)
          : null,

      destination:
        typeCommande === "vrac"
          ? destination.trim() || null
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

      exigences_specifiques:
        typeCommande === "vrac" &&
        exigencesSpecifiques.length > 0
          ? JSON.stringify(
              exigencesSpecifiques
            )
          : null,

      informations_complementaires:
        typeCommande === "vrac"
          ? informationsComplementaires.trim() || null
          : null,

      // =================================================
      // CONDITIONNÉ
      // =================================================

      pays_conditionne:
        typeCommande === "conditionné"
          ? paysConditionne || null
          : null,

      canal_distribution:
        typeCommande === "conditionné"
          ? canalDistribution || null
          : null,

      volumes_estimes:
        typeCommande === "conditionné"
          ? volumesEstimes.trim() || null
          : null,

      // =================================================
      // TYPE D'EMBALLAGE
      // =================================================
      //
      // NOUVEAU FORMAT
      //
      // {
      //   emballages: ["Tin","PET","Glass"],
      //   autres: {
      //      Tin: "400 ml",
      //      PET: "500 ml",
      //      Glass: "750 ml"
      //   }
      // }
      //
      // =================================================

      type_emballage:
        typeCommande === "conditionné" &&
        typeEmballageData
          ? typeEmballageData
          : null,

      // =================================================
      // PACKAGING
      // =================================================
      //
      // IMPORTANT :
      // ce champ n'est PLUS null.
      //
      // =================================================

      packaging:
        typeCommande === "conditionné" &&
        packagingData
          ? packagingData
          : null,

      // =================================================
      // FORMATS SOUHAITÉS
      // =================================================

      formats_souhaites:
        typeCommande === "conditionné"
          ? formatsSouhaites || null
          : null,

      // =================================================
      // TYPE MARQUE
      // =================================================

      type_marque:
        typeCommande === "conditionné"
          ? typeMarque || null
          : null,

      // =================================================
      // CERTIFICATIONS
      // =================================================

      certifications_requises:
        typeCommande === "conditionné" &&
        certificationsRequises.length > 0
          ? JSON.stringify(
              certificationsRequises
            )
          : null,

      // =================================================
      // ENTREPRISE
      // =================================================

      nom_entreprise:
        typeCommande === "conditionné"
          ? nomEntreprise.trim() || null
          : null,

      site_web:
        typeCommande === "conditionné"
          ? siteWeb.trim() || null
          : null,

      contact_professionnel:
        typeCommande === "conditionné"
          ? contactProfessionnel.trim() || null
          : null,

      // =================================================
      // QUANTITÉ COMMANDE
      // =================================================

      type_conteneur:
        typeCommande === "conditionné" &&
        (
          quantiteCommande === "conteneur_20" ||
          quantiteCommande === "conteneur_40"
        )
          ? quantiteCommande
          : null,

      nombre_palettes:
        typeCommande === "conditionné" &&
        nombrePalettes.trim() &&
        !isNaN(Number(nombrePalettes))
          ? Number(nombrePalettes)
          : null,

      // =================================================
      // NOUVELLE MARQUE
      // =================================================

      marche_cible:
        typeCommande === "conditionné" &&
        typeMarque ===
          "Création de nouvelle marque"
          ? marcheCible.trim() || null
          : null,

      quantite_prevue:
        typeCommande === "conditionné" &&
        typeMarque ===
          "Création de nouvelle marque"
          ? quantitePrevue.trim() || null
          : null,

      // =================================================
      // NOUVELLE MARQUE - FORMATS
      // =================================================

      nouvelle_marque_formats:
        typeCommande === "conditionné" &&
        typeMarque ===
          "Création de nouvelle marque" &&
        nouvelleMarqueFormatsData
          ? JSON.stringify(
              nouvelleMarqueFormatsData
            )
          : null,

      // =================================================
      // NOUVELLE MARQUE - DESIGN
      // =================================================

      nouvelle_marque_design_conditionnement:
        typeCommande === "conditionné" &&
        typeMarque ===
          "Création de nouvelle marque" &&
        nouvelleMarqueEmballagesSelectionnes.length > 0
          ? JSON.stringify({
              emballages:
                nouvelleMarqueEmballagesSelectionnes,

              autre:
                nouvelleMarqueAutreEmballage.trim() ||
                null,
            })
          : null,
    };

    // ===================================================
    // LOG
    // ===================================================

    console.log(
      "======================================="
    );

    console.log(
      "DONNÉES ENVOYÉES AU BACKEND"
    );

    console.log(
      JSON.stringify(
        visitorData,
        null,
        2
      )
    );

    console.log(
      "======================================="
    );

    // ===================================================
    // LOG SPÉCIFIQUE EMBALLAGE
    // ===================================================

    console.log(
      "TYPE EMBALLAGE :",
      JSON.stringify(
        typeEmballageData,
        null,
        2
      )
    );

    console.log(
      "PACKAGING :",
      JSON.stringify(
        packagingData,
        null,
        2
      )
    );

    // ===================================================
    // ENVOI BACKEND
    // ===================================================

    try {
      const response = await fetch(
        `${API_URL}/api/visiteurs`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              visitorData
            ),
        }
      );

      const data =
        await response.json();

      console.log(
        "STATUS HTTP :",
        response.status
      );

      console.log(
        "RÉPONSE BACKEND :",
        data
      );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            data.error ||
            "Erreur serveur"
        );
      }

      console.log(
        "VISITEUR AJOUTÉ AVEC SUCCÈS"
      );

      console.log(
        "ID :",
        data.id
      );

      console.log(
        "QUALIFICATION :",
        qualification
      );

      console.log(
        "NAVIGATION VERS /pdf"
      );

      // =================================================
      // NAVIGATION
      // =================================================

      router.push({
        pathname: "/pdf",

        params: {
          id: String(
            data.id
          ),
        },
      });

      // =================================================
      // RESET INFORMATIONS GÉNÉRALES
      // =================================================

      setNom("");
      setPrenom("");
      setTelephone("");
      setEmail("");
      setAge("");
      setOrigine("");
      setIndicatif("+216");
      setSociete("");
      setAdresseSociete("");
      setFonction("");
      setLangueCommunication("");

      // =================================================
      // RESET PROFILE
      // =================================================

      setProfile("");
      setTypeCommande("");

      // =================================================
      // RESET VRAC
      // =================================================

      setCategorie("");
      setQualiteGrade("");
      setVolumeEstime("");
      setDestination("");
      setIncoterm("");
      setFormatLivraison("");
      setFrequenceCommande("");
      setExigencesSpecifiques([]);
      setInformationsComplementaires("");

      // =================================================
      // RESET CONDITIONNÉ
      // =================================================

      setPaysConditionne("");
      setCanalDistribution("");
      setVolumesEstimes("");

      setTypeEmballage("");
      setFormatsSouhaites("");

      setEmballagesSelectionnes([]);
      setFormatsEmballage({});
      setAutreEmballage("");

      // RESET AUTRE PAR TYPE
      setAutresSelectionnes({
        Tin: false,
        PET: false,
        Glass: false,
      });

      setAutresEmballages({
        Tin: "",
        PET: "",
        Glass: "",
      });

      setTypeMarque("");
      setCertificationsRequises([]);
      setNomEntreprise("");
      setSiteWeb("");
      setContactProfessionnel("");

      // =================================================
      // RESET QUANTITÉ
      // =================================================

      setQuantiteCommande("");
      setNombrePalettes("");

      // =================================================
      // RESET NOUVELLE MARQUE
      // =================================================

      setMarcheCible("");
      setQuantitePrevue("");

      setNouvelleMarqueEmballagesSelectionnes(
        []
      );

      setNouvelleMarqueFormatsEmballage(
        {}
      );

      setNouvelleMarqueAutreEmballage(
        ""
      );

      // =================================================
      // RESET QUALIFICATION
      // =================================================

      setQualification(0);

    } catch (error) {
      console.error(
        "ERREUR POST :",
        error
      );

      Alert.alert(
        "Erreur",
        `Impossible d'ajouter le visiteur.\n\n${error.message}`
      );
    }
  };

  // =====================================================
  // INTERFACE
  // =====================================================

  return (
    <ScrollView
    
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      keyboardShouldPersistTaps="handled"
    >

      {/* =================================================
          TITRE
      ================================================= */}

      <Text style={styles.title}>
        Formulaire Visiteur
      </Text>

      {/* =================================================
          NOM
      ================================================= */}

      <Text style={styles.label}>
        Nom et Prénom
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Entrez le nom"
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
      ================================================= */}

      <Text style={styles.label}>
        Adresse Site Email
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Adresse Site Email"
        value={prenom}
        onChangeText={setPrenom}
      />

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
        placeholder="http://..."
        value={age}
        onChangeText={setAge}
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

            {/* CATÉGORIE */}

            <Text style={styles.label}>
              Catégorie
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Catégorie"
              value={categorie}
              onChangeText={
                setCategorie
              }
            />

            {/* QUALITÉ */}

            <Text style={styles.label}>
              Grade
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Grade"
              value={qualiteGrade}
              onChangeText={
                setQualiteGrade
              }
            />

            {/* VOLUME */}

            <Text style={styles.label}>
              Volume estimé
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Volume estimé"
              value={volumeEstime}
              onChangeText={
                setVolumeEstime
              }
              keyboardType="numeric"
            />

            {/* DESTINATION */}

            <Text style={styles.label}>
              Destination pays / port
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Destination"
              value={destination}
              onChangeText={
                setDestination
              }
            />

            {/* INCOTERM */}

            <Text style={styles.label}>
              Incoterm
            </Text>

            <View style={styles.pickerContainer}>

              <Picker
                selectedValue={incoterm}
                onValueChange={
                  setIncoterm
                }
              >

                <Picker.Item
                  label="Sélectionner"
                  value=""
                />

                <Picker.Item
                  label="EXW"
                  value="EXW"
                />

                <Picker.Item
                  label="FOB"
                  value="FOB"
                />

                <Picker.Item
                  label="CFR"
                  value="CFR"
                />

                <Picker.Item
                  label="CIF"
                  value="CIF"
                />

                <Picker.Item
                  label="DAP"
                  value="DAP"
                />

                <Picker.Item
                  label="DDP"
                  value="DDP"
                />

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
                  label="Commandes régulières"
                  value="régulières"
                />

              </Picker>

            </View>

            {/* EXIGENCES */}

            <Text style={styles.label}>
              Exigences spécifiques
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Bio, certifications, analyses/COA, échantillons..."
              value={exigencesSpecifiques.join(
                ", "
              )}
              onChangeText={(text) =>
                setExigencesSpecifiques(
                  text
                    .split(",")
                    .map((item) =>
                      item.trim()
                    )
                    .filter(Boolean)
                )
              }
            />

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
                selectedValue={
                  canalDistribution
                }
                onValueChange={
                  setCanalDistribution
                }
              >

                <Picker.Item
                  label="Sélectionner"
                  value=""
                />

                <Picker.Item
                  label="Retail"
                  value="Retail"
                />

                <Picker.Item
                  label="HoReCa"
                  value="HoReCa"
                />

                <Picker.Item
                  label="E-commerce"
                  value="E-commerce"
                />

                <Picker.Item
                  label="Grossiste"
                  value="Grossiste"
                />

              </Picker>

            </View>

            {/* VOLUMES */}

            <Text style={styles.label}>
              Volumes estimés
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Quantité par mois ou par an"
              value={volumesEstimes}
              onChangeText={
                setVolumesEstimes
              }
            />

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

            <View
              style={
                styles.pickerContainer
              }
            >

              <Picker
                selectedValue={
                  quantiteCommande
                }
                onValueChange={
                  setQuantiteCommande
                }
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

            {/* NOMBRE DE PALETTES */}

            {quantiteCommande ===
              "palettes" && (

              <>
                <Text
                  style={
                    styles.label
                  }
                >
                  Nombre de palettes
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="Nombre de palettes"
                  value={
                    nombrePalettes
                  }
                  onChangeText={
                    setNombrePalettes
                  }
                  keyboardType="numeric"
                />
              </>

            )}

            {/* CERTIFICATIONS */}

            <Text style={styles.label}>
              Certifications requises
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex : BIO, ISO, IFS..."
              value={certificationsRequises.join(
                ", "
              )}
              onChangeText={(text) =>
                setCertificationsRequises(
                  text
                    .split(",")
                    .map((item) =>
                      item.trim()
                    )
                    .filter(Boolean)
                )
              }
            />

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
              placeholder="https://..."
              value={siteWeb}
              onChangeText={
                setSiteWeb
              }
              autoCapitalize="none"
            />

            {/* CONTACT */}

            <Text style={styles.label}>
              Contact professionnel
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email / téléphone"
              value={
                contactProfessionnel
              }
              onChangeText={
                setContactProfessionnel
              }
            />

            {/* TYPE DE MARQUE */}

            <Text style={styles.label}>
              Type de marque
            </Text>

            <View
              style={
                styles.pickerContainer
              }
            >

              <Picker
                selectedValue={
                  typeMarque
                }
                onValueChange={
                  setTypeMarque
                }
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
          CHAMP AUTRE
      ================================================= */}

      {Array.isArray(nouvelleMarqueFormatsEmballage?.Glass) &&
        nouvelleMarqueFormatsEmballage.Glass.includes("Autre") && (

          <View style={{ width: "100%" }}>

            <Text style={styles.label}>
              Préciser l'emballage
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Saisir le type d'emballage"
              value={
                nouvelleMarqueAutresFormats?.Glass || ""
              }
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
          Ajouter le visiteur
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

});