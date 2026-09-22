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

// =====================================================
// URL BACKEND
// =====================================================
const API_URL = "http://192.168.1.146:5000";

export default function HomeScreen() {
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

  // Emballages sélectionnés pour la NOUVELLE MARQUE
  const [nouvelleMarqueEmballagesSelectionnes, setNouvelleMarqueEmballagesSelectionnes] =
    useState([]);

  // Formats de la NOUVELLE MARQUE
  const [nouvelleMarqueFormatsEmballage, setNouvelleMarqueFormatsEmballage] =
    useState({});

  // Autre emballage de la NOUVELLE MARQUE
  const [nouvelleMarqueAutreEmballage, setNouvelleMarqueAutreEmballage] =
    useState("");

  // =====================================================
  // PAYS
  // =====================================================
  const pays = [
    "Tunisie",
    "Algérie",
    "Maroc",
    "France",
    "Italie",
    "Espagne",
    "Allemagne",
    "Belgique",
    "Suisse",
    "Canada",
    "États-Unis",
    "Arabie Saoudite",
    "Émirats Arabes Unis",
    "Qatar",
    "Koweït",
    "Autre",
  ];

  // =====================================================
  // CHANGEMENT PAYS
  // =====================================================
  const handlePaysChange = (value) => {
    setOrigine(value);

    if (value === "Tunisie") {
      setIndicatif("+216");
    } else if (value === "Algérie") {
      setIndicatif("+213");
    } else if (value === "Maroc") {
      setIndicatif("+212");
    } else if (value === "France") {
      setIndicatif("+33");
    } else if (value === "Italie") {
      setIndicatif("+39");
    } else if (value === "Espagne") {
      setIndicatif("+34");
    } else if (value === "Allemagne") {
      setIndicatif("+49");
    } else if (value === "Belgique") {
      setIndicatif("+32");
    } else if (value === "Suisse") {
      setIndicatif("+41");
    } else if (value === "Canada") {
      setIndicatif("+1");
    } else if (value === "États-Unis") {
      setIndicatif("+1");
    } else if (value === "Arabie Saoudite") {
      setIndicatif("+966");
    } else if (value === "Émirats Arabes Unis") {
      setIndicatif("+971");
    } else if (value === "Qatar") {
      setIndicatif("+974");
    } else if (value === "Koweït") {
      setIndicatif("+965");
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
    // FORMAT EMBALLAGES CONDITIONNÉ
    // ===================================================
    let emballagesConditionneData = null;

    if (
      typeCommande === "conditionné" &&
      emballagesSelectionnes.length > 0
    ) {
      emballagesConditionneData = {
        emballages: emballagesSelectionnes,
        formats: formatsEmballage,
        autre: autreEmballage || null,
      };
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
          nouvelleMarqueAutreEmballage || null,
      };
    }

    // ===================================================
    // DONNÉES VISITEUR
    // ===================================================
    const visitorData = {
      // =================================================
      // INFORMATIONS GÉNÉRALES
      // =================================================
      nom: nom.trim() || null,
      prenom: prenom.trim() || null,
      email: email.trim() || null,

      age:
        age.trim() && !isNaN(Number(age))
          ? Number(age)
          : null,

      origine: origine || null,
      indicatif: indicatif || null,
      telephone: telephone.trim() || null,

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
      // VRAC
      // =================================================
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
          ? JSON.stringify(exigencesSpecifiques)
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

      // Type d'emballage de la commande conditionnée
      type_emballage:
        typeCommande === "conditionné"
          ? emballagesConditionneData
            ? JSON.stringify(
                emballagesConditionneData
              )
            : null
          : null,

      // Formats de la commande conditionnée
      formats_souhaites:
        typeCommande === "conditionné"
          ? formatsSouhaites || null
          : null,

      type_marque:
        typeCommande === "conditionné"
          ? typeMarque || null
          : null,

      certifications_requises:
        typeCommande === "conditionné" &&
        certificationsRequises.length > 0
          ? JSON.stringify(
              certificationsRequises
            )
          : null,

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
      // CHAMPS SPÉCIFIQUES NOUVELLE MARQUE
      // =================================================

      // Formats spécifiques à la nouvelle marque
      nouvelle_marque_formats:
        typeCommande === "conditionné" &&
        typeMarque ===
          "Création de nouvelle marque" &&
        nouvelleMarqueFormatsData
          ? JSON.stringify(
              nouvelleMarqueFormatsData
            )
          : null,

      // Packaging / design conditionnement
      // spécifique à la nouvelle marque
      nouvelle_marque_design_conditionnement:
        typeCommande === "conditionné" &&
        typeMarque ===
          "Création de nouvelle marque" &&
        nouvelleMarqueEmballagesSelectionnes.length > 0
          ? JSON.stringify({
              emballages:
                nouvelleMarqueEmballagesSelectionnes,
              autre:
                nouvelleMarqueAutreEmballage || null,
            })
          : null,

      // =================================================
      // ANCIENS CHAMPS NOUVELLE MARQUE
      // laissés NULL pour éviter toute confusion
      // =================================================
      packaging: null,
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

          body: JSON.stringify(
            visitorData
          ),
        }
      );

      const data =
        await response.json();

      console.log(
        "Réponse backend :",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Erreur serveur"
        );
      }

      Alert.alert(
        "Succès",
        "Le visiteur a été ajouté avec succès."
      );

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

      <Text style={styles.subtitle}>
        Enregistrement d'un nouveau visiteur
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
          onValueChange={
            setLangueCommunication
          }
        >
          <Picker.Item
            label="Sélectionner"
            value=""
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
            label="Arabe"
            value="Arabe"
          />

          <Picker.Item
            label="Italien"
            value="Italien"
          />

          <Picker.Item
            label="Espagnol"
            value="Espagnol"
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

            {/* QUALITÉ */}
            <Text style={styles.label}>
              Qualité / Grade
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Qualité / Grade"
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

            {/* TIN */}
            <TouchableOpacity
              style={
                styles.checkboxContainer
              }
              onPress={() =>
                toggleEmballageConditionne(
                  "Tin"
                )
              }
            >
              <Text
                style={styles.checkbox}
              >
                {emballagesSelectionnes.includes(
                  "Tin"
                )
                  ? "☑"
                  : "☐"}
              </Text>

              <Text
                style={
                  styles.checkboxLabel
                }
              >
                Tin
              </Text>
            </TouchableOpacity>

            {/* PET */}
            <TouchableOpacity
              style={
                styles.checkboxContainer
              }
              onPress={() =>
                toggleEmballageConditionne(
                  "PET"
                )
              }
            >
              <Text
                style={styles.checkbox}
              >
                {emballagesSelectionnes.includes(
                  "PET"
                )
                  ? "☑"
                  : "☐"}
              </Text>

              <Text
                style={
                  styles.checkboxLabel
                }
              >
                PET
              </Text>
            </TouchableOpacity>

            {/* GLASS */}
            <TouchableOpacity
              style={
                styles.checkboxContainer
              }
              onPress={() =>
                toggleEmballageConditionne(
                  "Glass"
                )
              }
            >
              <Text
                style={styles.checkbox}
              >
                {emballagesSelectionnes.includes(
                  "Glass"
                )
                  ? "☑"
                  : "☐"}
              </Text>

              <Text
                style={
                  styles.checkboxLabel
                }
              >
                Glass
              </Text>
            </TouchableOpacity>

            {/* AUTRE */}
            <TouchableOpacity
              style={
                styles.checkboxContainer
              }
              onPress={() =>
                toggleEmballageConditionne(
                  "Autre"
                )
              }
            >
              <Text
                style={styles.checkbox}
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
                  style={
                    styles.input
                  }
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
                FORMATS CONDITIONNÉ
            ================================================= */}
            {emballagesSelectionnes.map(
              (type) => {
                if (
                  type === "Autre"
                ) {
                  return null;
                }

                return (
                  <View
                    key={type}
                    style={{
                      marginTop: 15,
                    }}
                  >
                    <Text
                      style={
                        styles.label
                      }
                    >
                      Formats souhaités -{" "}
                      {type}
                    </Text>

                    {/* GLASS */}
                    {type ===
                    "Glass" ? (
                      <>
                        <Text
                          style={
                            styles.label
                          }
                        >
                          MARASCA
                        </Text>

                        {[
                          "250 ml",
                          "500 ml",
                          "750 ml",
                          "1 L",
                        ].map(
                          (format) => {
                            const selected =
                              formatsEmballage
                                .Glass
                                ?.MARASCA?.includes(
                                  format
                                ) ||
                              false;

                            return (
                              <TouchableOpacity
                                key={`MARASCA-${format}`}
                                style={
                                  styles.checkboxContainer
                                }
                                onPress={() => {
                                  setFormatsEmballage(
                                    (
                                      prev
                                    ) => {
                                      const current =
                                        prev
                                          .Glass
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
                                        Glass:
                                          {
                                            ...(
                                              prev.Glass ||
                                              {}
                                            ),
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
                          }
                        )}

                        <Text
                          style={[
                            styles.label,
                            {
                              marginTop: 15,
                            },
                          ]}
                        >
                          DORICA
                        </Text>

                        {[
                          "250 ml",
                          "500 ml",
                          "750 ml",
                        ].map(
                          (format) => {
                            const selected =
                              formatsEmballage
                                .Glass
                                ?.DORICA?.includes(
                                  format
                                ) ||
                              false;

                            return (
                              <TouchableOpacity
                                key={`DORICA-${format}`}
                                style={
                                  styles.checkboxContainer
                                }
                                onPress={() => {
                                  setFormatsEmballage(
                                    (
                                      prev
                                    ) => {
                                      const current =
                                        prev
                                          .Glass
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
                                        Glass:
                                          {
                                            ...(
                                              prev.Glass ||
                                              {}
                                            ),
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
                          }
                        )}
                      </>
                    ) : (
                      <>
                        {(
                          type === "Tin"
                            ? [
                                "250 ml",
                                "500 ml",
                                "1 L",
                                "2 L",
                                "3 L",
                                "4 L",
                                "5 L",
                                "16 L",
                                "20 L",
                              ]
                            : [
                                "250 ml",
                                "500 ml",
                                "1 L",
                                "3 L",
                                "5 L",
                              ]
                        ).map(
                          (format) => {
                            const selected =
                              formatsEmballage[
                                type
                              ]?.includes(
                                format
                              ) ||
                              false;

                            return (
                              <TouchableOpacity
                                key={`${type}-${format}`}
                                style={
                                  styles.checkboxContainer
                                }
                                onPress={() => {
                                  setFormatsEmballage(
                                    (
                                      prev
                                    ) => {
                                      const current =
                                        prev[
                                          type
                                        ] ||
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
                                        [type]:
                                          updated,
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
                          }
                        )}
                      </>
                    )}
                  </View>
                );
              }
            )}

            {/* =================================================
                QUANTITÉ DE LA COMMANDE
            ================================================= */}
            <Text style={styles.label}>
              Quantité de la commande
            </Text>

            <View style={styles.pickerContainer}>
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
                  label="Conteneur 20 pieds"
                  value="conteneur_20"
                />

                <Picker.Item
                  label="Conteneur 40 pieds"
                  value="conteneur_40"
                />
              </Picker>
            </View>

            {/* NOMBRE DE PALETTES */}
            <Text style={styles.label}>
              Nombre de palettes
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre de palettes"
              value={nombrePalettes}
              onChangeText={
                setNombrePalettes
              }
              keyboardType="numeric"
            />

            {/* =================================================
                CERTIFICATIONS
            ================================================= */}
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
              onChangeText={setSiteWeb}
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

            {/* =================================================
                TYPE DE MARQUE
            ================================================= */}
            <Text style={styles.label}>
              Type de marque
            </Text>

            <View style={styles.pickerContainer}>
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
            {typeMarque ===
              "Création de nouvelle marque" && (
              <View
                style={
                  styles.newBrandSection
                }
              >
                <Text
                  style={
                    styles.newBrandTitle
                  }
                >
                  Informations nouvelle marque
                </Text>

                {/* =================================================
                    MARCHÉ CIBLE
                ================================================= */}
                <Text
                  style={styles.label}
                >
                  Marché cible
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="Ex : Tunisie, France, Italie..."
                  value={
                    marcheCible
                  }
                  onChangeText={
                    setMarcheCible
                  }
                />

                {/* =================================================
                    QUANTITÉ PRÉVUE
                ================================================= */}
                <Text
                  style={styles.label}
                >
                  Quantité prévue
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="Ex : 5000 litres / an"
                  value={
                    quantitePrevue
                  }
                  onChangeText={
                    setQuantitePrevue
                  }
                  keyboardType="numeric"
                />

                {/* =================================================
                    PACKAGING
                    NOM INTERFACE = PACKAGING
                    CHAMPS BASE = NOUVELLE MARQUE
                ================================================= */}
                <Text
                  style={styles.label}
                >
                  Packaging
                </Text>

                {/* TIN */}
                <TouchableOpacity
                  style={
                    styles.checkboxContainer
                  }
                  onPress={() =>
                    toggleEmballageNouvelleMarque(
                      "Tin"
                    )
                  }
                >
                  <Text
                    style={
                      styles.checkbox
                    }
                  >
                    {nouvelleMarqueEmballagesSelectionnes.includes(
                      "Tin"
                    )
                      ? "☑"
                      : "☐"}
                  </Text>

                  <Text
                    style={
                      styles.checkboxLabel
                    }
                  >
                    Tin
                  </Text>
                </TouchableOpacity>

                {/* PET */}
                <TouchableOpacity
                  style={
                    styles.checkboxContainer
                  }
                  onPress={() =>
                    toggleEmballageNouvelleMarque(
                      "PET"
                    )
                  }
                >
                  <Text
                    style={
                      styles.checkbox
                    }
                  >
                    {nouvelleMarqueEmballagesSelectionnes.includes(
                      "PET"
                    )
                      ? "☑"
                      : "☐"}
                  </Text>

                  <Text
                    style={
                      styles.checkboxLabel
                    }
                  >
                    PET
                  </Text>
                </TouchableOpacity>

                {/* GLASS */}
                <TouchableOpacity
                  style={
                    styles.checkboxContainer
                  }
                  onPress={() =>
                    toggleEmballageNouvelleMarque(
                      "Glass"
                    )
                  }
                >
                  <Text
                    style={
                      styles.checkbox
                    }
                  >
                    {nouvelleMarqueEmballagesSelectionnes.includes(
                      "Glass"
                    )
                      ? "☑"
                      : "☐"}
                  </Text>

                  <Text
                    style={
                      styles.checkboxLabel
                    }
                  >
                    Glass
                  </Text>
                </TouchableOpacity>

                {/* AUTRE */}
                <TouchableOpacity
                  style={
                    styles.checkboxContainer
                  }
                  onPress={() =>
                    toggleEmballageNouvelleMarque(
                      "Autre"
                    )
                  }
                >
                  <Text
                    style={
                      styles.checkbox
                    }
                  >
                    {nouvelleMarqueEmballagesSelectionnes.includes(
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

                {/* AUTRE EMBALLAGE */}
                {nouvelleMarqueEmballagesSelectionnes.includes(
                  "Autre"
                ) && (
                  <>
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
                        nouvelleMarqueAutreEmballage
                      }
                      onChangeText={
                        setNouvelleMarqueAutreEmballage
                      }
                    />
                  </>
                )}

                {/* =================================================
                    FORMATS SOUHAITÉS
                    INDÉPENDANTS DE LA COMMANDE CONDITIONNÉE
                ================================================= */}
                {nouvelleMarqueEmballagesSelectionnes
                  .filter(
                    (type) =>
                      type !== "Autre"
                  )
                  .map((type) => (
                    <View
                      key={`nouvelle-marque-${type}`}
                      style={{
                        marginTop: 15,
                      }}
                    >
                      <Text
                        style={
                          styles.label
                        }
                      >
                        Formats souhaités -{" "}
                        {type}
                      </Text>

                      {/* GLASS */}
                      {type ===
                      "Glass" ? (
                        <>
                          {/* MARASCA */}
                          <Text
                            style={
                              styles.label
                            }
                          >
                            MARASCA
                          </Text>

                          {[
                            "250 ml",
                            "500 ml",
                            "750 ml",
                            "1 L",
                          ].map(
                            (format) => {
                              const selected =
                                nouvelleMarqueFormatsEmballage
                                  .Glass
                                  ?.MARASCA?.includes(
                                    format
                                  ) ||
                                false;

                              return (
                                <TouchableOpacity
                                  key={`NM-MARASCA-${format}`}
                                  style={
                                    styles.checkboxContainer
                                  }
                                  onPress={() => {
                                    setNouvelleMarqueFormatsEmballage(
                                      (
                                        prev
                                      ) => {
                                        const current =
                                          prev
                                            .Glass
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
                                          Glass:
                                            {
                                              ...(
                                                prev.Glass ||
                                                {}
                                              ),
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
                                    {
                                      format
                                    }
                                  </Text>
                                </TouchableOpacity>
                              );
                            }
                          )}

                          {/* DORICA */}
                          <Text
                            style={[
                              styles.label,
                              {
                                marginTop: 15,
                              },
                            ]}
                          >
                            DORICA
                          </Text>

                          {[
                            "250 ml",
                            "500 ml",
                            "750 ml",
                          ].map(
                            (format) => {
                              const selected =
                                nouvelleMarqueFormatsEmballage
                                  .Glass
                                  ?.DORICA?.includes(
                                    format
                                  ) ||
                                false;

                              return (
                                <TouchableOpacity
                                  key={`NM-DORICA-${format}`}
                                  style={
                                    styles.checkboxContainer
                                  }
                                  onPress={() => {
                                    setNouvelleMarqueFormatsEmballage(
                                      (
                                        prev
                                      ) => {
                                        const current =
                                          prev
                                            .Glass
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
                                          Glass:
                                            {
                                              ...(
                                                prev.Glass ||
                                                {}
                                              ),
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
                                    {
                                      format
                                    }
                                  </Text>
                                </TouchableOpacity>
                              );
                            }
                          )}
                        </>
                      ) : (
                        <>
                          {(
                            type ===
                            "Tin"
                              ? [
                                  "250 ml",
                                  "500 ml",
                                  "1 L",
                                  "2 L",
                                  "3 L",
                                  "4 L",
                                  "5 L",
                                  "16 L",
                                  "20 L",
                                ]
                              : [
                                  "250 ml",
                                  "500 ml",
                                  "1 L",
                                  "3 L",
                                  "5 L",
                                ]
                          ).map(
                            (format) => {
                              const selected =
                                nouvelleMarqueFormatsEmballage[
                                  type
                                ]?.includes(
                                  format
                                ) ||
                                false;

                              return (
                                <TouchableOpacity
                                  key={`NM-${type}-${format}`}
                                  style={
                                    styles.checkboxContainer
                                  }
                                  onPress={() => {
                                    setNouvelleMarqueFormatsEmballage(
                                      (
                                        prev
                                      ) => {
                                        const current =
                                          prev[
                                            type
                                          ] ||
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
                                          [type]:
                                            updated,
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
                                    {
                                      format
                                    }
                                  </Text>
                                </TouchableOpacity>
                              );
                            }
                          )}
                        </>
                      )}
                    </View>
                  ))}
              </View>
            )}
          </View>
        )}

      {/* =================================================
          BOUTON AJOUTER
      ================================================= */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleAjouter}
      >
        <Text style={styles.buttonText}>
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
    borderColor: "#EE672A",
  },

  newBrandTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },

  button: {
    backgroundColor: "#EE672A",
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
});