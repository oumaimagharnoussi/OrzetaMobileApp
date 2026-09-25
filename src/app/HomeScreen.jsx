import React, { useState } from "react";
import { useRouter } from "expo-router";
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

// =====================================================
// LISTE DES PAYS
// =====================================================

const pays = [
  { name: "Tunisie", dialCode: "+216" },
  { name: "France", dialCode: "+33" },
  { name: "Algérie", dialCode: "+213" },
  { name: "Maroc", dialCode: "+212" },
  { name: "Italie", dialCode: "+39" },
  { name: "Allemagne", dialCode: "+49" },
  { name: "Espagne", dialCode: "+34" },
  { name: "Belgique", dialCode: "+32" },
  { name: "Suisse", dialCode: "+41" },
  { name: "Royaume-Uni", dialCode: "+44" },
  { name: "États-Unis", dialCode: "+1" },
  { name: "Canada", dialCode: "+1" },
  { name: "Arabie Saoudite", dialCode: "+966" },
  { name: "Émirats Arabes Unis", dialCode: "+971" },
  { name: "Qatar", dialCode: "+974" },
  { name: "Koweït", dialCode: "+965" },
  { name: "Égypte", dialCode: "+20" },
  { name: "Autre", dialCode: "" },
];

// =====================================================
// COMPOSANT
// =====================================================

export default function HomeScreen() {
  
  // ===================================================
  // INFORMATIONS GÉNÉRALES
  // ===================================================
  const router = useRouter();
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

  // ===================================================
  // PROFILE
  // ===================================================

  const [profile, setProfile] = useState("");

  // ===================================================
  // TYPE COMMANDE
  // ===================================================

  const [typeCommande, setTypeCommande] = useState("");

  // ===================================================
  // VRAC
  // ===================================================

  const [qualiteGrade, setQualiteGrade] = useState("");
  const [volumeEstime, setVolumeEstime] = useState("");
  const [destination, setDestination] = useState("");
  const [incoterm, setIncoterm] = useState("");
  const [formatLivraison, setFormatLivraison] = useState("");
  const [frequenceCommande, setFrequenceCommande] = useState("");
  const [exigencesSpecifiques, setExigencesSpecifiques] = useState([]);
  const [informationsComplementaires, setInformationsComplementaires] =
    useState("");

  // ===================================================
  // CONDITIONNÉ
  // ===================================================

  const [paysConditionne, setPaysConditionne] = useState("");
  const [canalDistribution, setCanalDistribution] = useState("");
  const [volumesEstimes, setVolumesEstimes] = useState("");

  // MULTI-SELECT CONDITIONNÉ
  const [emballagesSelectionnes, setEmballagesSelectionnes] = useState([]);
  const [formatsEmballage, setFormatsEmballage] = useState({});
  const [autreEmballage, setAutreEmballage] = useState("");

  const [typeMarque, setTypeMarque] = useState("");
  const [certificationsRequises, setCertificationsRequises] = useState([]);
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [siteWeb, setSiteWeb] = useState("");
  const [contactProfessionnel, setContactProfessionnel] = useState("");

  // ===================================================
  // NOUVELLE MARQUE
  // ===================================================

  const [marcheCible, setMarcheCible] = useState("");
  const [quantitePrevue, setQuantitePrevue] = useState("");

  // ---------------------------------------------------
  // IMPORTANT :
  // Ces états sont DIFFÉRENTS de CONDITIONNÉ.
  // ---------------------------------------------------

  const [nouvelleMarqueEmballagesSelectionnes, setNouvelleMarqueEmballagesSelectionnes] =
    useState([]);

  const [nouvelleMarqueFormatsEmballage, setNouvelleMarqueFormatsEmballage] =
    useState({});

  const [nouvelleMarqueAutreEmballage, setNouvelleMarqueAutreEmballage] =
    useState("");

  // ===================================================
  // CHANGEMENT PAYS
  // ===================================================

  const handlePaysChange = (value) => {
    setOrigine(value);

    const country = pays.find((item) => item.name === value);

    if (country) {
      setIndicatif(country.dialCode);
    } else {
      setIndicatif("");
    }
  };

  // ===================================================
  // RESET CONDITIONNÉ
  // ===================================================

  const resetConditionne = () => {
    setPaysConditionne("");
    setCanalDistribution("");
    setVolumesEstimes("");

    setEmballagesSelectionnes([]);
    setFormatsEmballage({});
    setAutreEmballage("");

    setTypeMarque("");
    setCertificationsRequises([]);
    setNomEntreprise("");
    setSiteWeb("");
    setContactProfessionnel("");
  };

  // ===================================================
  // RESET NOUVELLE MARQUE
  // ===================================================

  const resetNouvelleMarque = () => {
    setMarcheCible("");
    setQuantitePrevue("");

    setNouvelleMarqueEmballagesSelectionnes([]);
    setNouvelleMarqueFormatsEmballage({});
    setNouvelleMarqueAutreEmballage("");
  };

  // ===================================================
  // RESET VRAC
  // ===================================================

  const resetVrac = () => {
    setQualiteGrade("");
    setVolumeEstime("");
    setDestination("");
    setIncoterm("");
    setFormatLivraison("");
    setFrequenceCommande("");
    setExigencesSpecifiques([]);
    setInformationsComplementaires("");
  };

  // ===================================================
  // RESET COMMANDE
  // ===================================================

  const resetCommande = () => {
    resetVrac();
    resetConditionne();
    resetNouvelleMarque();
  };

  // ===================================================
  // CHANGEMENT PROFILE
  // ===================================================

  const handleProfileChange = (value) => {
    setProfile(value);

    if (value !== "intermediaire" && value !== "acheteur") {
      setTypeCommande("");
      resetCommande();
    }
  };

  // ===================================================
  // CHANGEMENT TYPE COMMANDE
  // ===================================================

  const handleTypeCommandeChange = (value) => {
    setTypeCommande(value);

    if (value === "vrac") {
      resetConditionne();
      resetNouvelleMarque();
    }

    if (value === "conditionné") {
      resetVrac();
    }

    if (value === "") {
      resetCommande();
    }
  };

  // ===================================================
  // TOGGLE EMBALLAGE CONDITIONNÉ
  // ===================================================

  const toggleEmballage = (type) => {
    setEmballagesSelectionnes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((item) => item !== type);
      }

      return [...prev, type];
    });

    // Si Autre est retiré
    if (
      type === "Autre" &&
      emballagesSelectionnes.includes("Autre")
    ) {
      setAutreEmballage("");
    }
  };

  // ===================================================
  // TOGGLE FORMAT CONDITIONNÉ
  // ===================================================

  const toggleFormat = (type, format) => {
    setFormatsEmballage((prev) => {
      const current = prev[type] || [];

      if (current.includes(format)) {
        return {
          ...prev,
          [type]: current.filter((item) => item !== format),
        };
      }

      return {
        ...prev,
        [type]: [...current, format],
      };
    });
  };

  // ===================================================
  // TOGGLE EMBALLAGE NOUVELLE MARQUE
  // ===================================================

  const toggleNouvelleMarqueEmballage = (type) => {
    setNouvelleMarqueEmballagesSelectionnes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((item) => item !== type);
      }

      return [...prev, type];
    });

    if (
      type === "Autre" &&
      nouvelleMarqueEmballagesSelectionnes.includes("Autre")
    ) {
      setNouvelleMarqueAutreEmballage("");
    }
  };

  // ===================================================
  // TOGGLE FORMAT NOUVELLE MARQUE
  // ===================================================

  const toggleNouvelleMarqueFormat = (type, format) => {
    setNouvelleMarqueFormatsEmballage((prev) => {
      const current = prev[type] || [];

      if (current.includes(format)) {
        return {
          ...prev,
          [type]: current.filter((item) => item !== format),
        };
      }

      return {
        ...prev,
        [type]: [...current, format],
      };
    });
  };

  // ===================================================
  // TEST BACKEND
  // ===================================================

  const testerConnexion = async () => {
    try {
      const response = await fetch(`${API_URL}/`);

      const data = await response.json();

      console.log("TEST BACKEND :", data);

      if (!response.ok) {
        throw new Error(data.message || "Erreur serveur.");
      }

      Alert.alert(
        "Connexion réussie",
        "React Native communique correctement avec Node.js."
      );
    } catch (error) {
      console.error("ERREUR CONNEXION :", error);

      Alert.alert(
        "Backend inaccessible",
        `${API_URL}\n\n${error.message}`
      );
    }
  };

  // ===================================================
  // AJOUTER VISITEUR
  // ===================================================

  const handleAjouter = async () => {
    try {
      console.log("");
      console.log("=================================");
      console.log("DÉBUT AJOUT VISITEUR");
      console.log("=================================");

      // =================================================
      // DONNÉES NOUVELLE MARQUE
      // =================================================

      const nouvelleMarqueDesign =
        typeCommande === "conditionné" &&
        typeMarque === "Création de nouvelle marque" &&
        nouvelleMarqueEmballagesSelectionnes.length > 0
          ? JSON.stringify({
              emballages: nouvelleMarqueEmballagesSelectionnes,
              autre: nouvelleMarqueAutreEmballage || null,
            })
          : null;

      const nouvelleMarqueFormats =
        typeCommande === "conditionné" &&
        typeMarque === "Création de nouvelle marque" &&
        Object.keys(nouvelleMarqueFormatsEmballage).length > 0
          ? JSON.stringify(nouvelleMarqueFormatsEmballage)
          : null;

      // =================================================
      // FORMATS CONDITIONNÉ
      // =================================================

      const formatsConditionne =
        typeCommande === "conditionné" &&
        Object.keys(formatsEmballage).length > 0
          ? JSON.stringify(formatsEmballage)
          : null;

      // =================================================
      // OBJET VISITEUR
      // =================================================

      const visiteur = {
        // -----------------------------------------------
        // INFORMATIONS GÉNÉRALES
        // -----------------------------------------------

        nom: nom.trim() || null,

        prenom: prenom.trim() || null,

        email: email.trim() || null,

        age:
          age.trim() !== ""
            ? Number(age)
            : null,

        origine: origine || null,

        indicatif: indicatif || null,

        telephone: telephone.trim() || null,

        societe: societe.trim() || null,

        adresse_societe:
          adresseSociete.trim() || null,

        fonction:
          fonction.trim() || null,

        langue_communication:
          langueCommunication || null,

        // -----------------------------------------------
        // PROFILE
        // -----------------------------------------------

        profile: profile || null,

        // -----------------------------------------------
        // TYPE COMMANDE
        // -----------------------------------------------

        type_commande:
          profile === "intermediaire" ||
          profile === "acheteur"
            ? typeCommande || null
            : null,

        // -----------------------------------------------
        // VRAC
        // -----------------------------------------------

        qualite_grade:
          typeCommande === "vrac"
            ? qualiteGrade.trim() || null
            : null,

        volume_estime:
          typeCommande === "vrac" &&
          volumeEstime.trim() !== ""
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

        // -----------------------------------------------
        // CONDITIONNÉ
        // -----------------------------------------------

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

        // Stockage des emballages CONDITIONNÉ
        // séparément de la nouvelle marque.
        type_emballage:
          typeCommande === "conditionné" &&
          emballagesSelectionnes.length > 0
            ? JSON.stringify({
                emballages: emballagesSelectionnes,
                autre: autreEmballage || null,
              })
            : null,

        // Stockage des formats CONDITIONNÉ
        formats_souhaites:
          typeCommande === "conditionné"
            ? formatsConditionne
            : null,

        type_marque:
          typeCommande === "conditionné"
            ? typeMarque || null
            : null,

        certifications_requises:
          typeCommande === "conditionné" &&
          certificationsRequises.length > 0
            ? JSON.stringify(certificationsRequises)
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

        // -----------------------------------------------
        // NOUVELLE MARQUE
        // -----------------------------------------------

        marche_cible:
          typeCommande === "conditionné" &&
          typeMarque === "Création de nouvelle marque"
            ? marcheCible.trim() || null
            : null,

        quantite_prevue:
          typeCommande === "conditionné" &&
          typeMarque === "Création de nouvelle marque"
            ? quantitePrevue.trim() || null
            : null,

        // IMPORTANT :
        // Ces deux champs sont UNIQUEMENT pour
        // la nouvelle marque.

        nouvelle_marque_formats:
          nouvelleMarqueFormats,

        nouvelle_marque_design_conditionnement:
          nouvelleMarqueDesign,
      };

      // =================================================
      // DEBUG
      // =================================================

      console.log("DONNÉES ENVOYÉES :");

      console.log(
        JSON.stringify(
          visiteur,
          null,
          2
        )
      );

      // =================================================
      // ENVOI AU BACKEND
      // =================================================

      const response = await fetch(`${API_URL}/api/visiteurs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(visitorData),
      });
      
      const data = await response.json();
      
      console.log("STATUS HTTP :", response.status);
      console.log("RÉPONSE BACKEND :", data);
      
      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error ||
            "Erreur serveur"
        );
      }
      
      console.log("=======================================");
      console.log("VISITEUR AJOUTÉ AVEC SUCCÈS");
      console.log("ID :", data.id);
      console.log("NAVIGATION VERS /pdf");
      console.log("=======================================");
      
      // Navigation après insertion réussie
      router.replace("/pdft");

      // =================================================
      // RÉPONSE
      // =================================================

      

console.log("STATUS HTTP :", response.status);
console.log("RÉPONSE BACKEND :", data);

if (!response.ok || !data.success) {
  throw new Error(
    data.message || "Impossible d'ajouter le visiteur."
  );
}

console.log("ÉTAPE 1 : VISITEUR AJOUTÉ");

Alert.alert(
  "TEST",
  "Le visiteur est ajouté. Navigation vers traitement..."
);

setTimeout(() => {
  console.log("ÉTAPE 2 : NAVIGATION");
  console.log("NAVIGATION VERS /pdf");

router.push("/pdf");
}, 1000);
      // =================================================
      // RESET FORMULAIRE
      // =================================================

      setNom("");
      setPrenom("");
      setTelephone("");
      setIndicatif("+216");
      setEmail("");
      setAge("");
      setOrigine("");
      setSociete("");
      setAdresseSociete("");
      setFonction("");
      setLangueCommunication("");

      setProfile("");
      setTypeCommande("");

      resetCommande();

    } catch (error) {
      console.error("");
      console.error(
        "================================="
      );
      console.error(
        "ERREUR AJOUT VISITEUR"
      );
      console.error(
        "================================="
      );

      console.error(error);

      Alert.alert(
        "Erreur",
        `Impossible d'ajouter le visiteur.\n\n${error.message}`
      );
    }
  };

  // ===================================================
  // INTERFACE
  // ===================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* ==============================================
          TITRE
      =============================================== */}

      <Text style={styles.title}>
        Formulaire Visiteur
      </Text>

      <Text style={styles.subtitle}>
        Enregistrement d'un nouveau visiteur
      </Text>

      {/* ==============================================
          TEST SERVEUR
      =============================================== */}

      <TouchableOpacity
        style={styles.testButton}
        onPress={testerConnexion}
      >
        <Text style={styles.buttonText}>
          TESTER LA CONNEXION AU SERVEUR
        </Text>
      </TouchableOpacity>

      {/* ==============================================
          NOM
      =============================================== */}

      <Text style={styles.label}>
        Nom
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Entrez le nom"
        value={nom}
        onChangeText={setNom}
      />

      {/* ==============================================
          SOCIÉTÉ
      =============================================== */}

      <Text style={styles.label}>
        Société
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nom de la société"
        value={societe}
        onChangeText={setSociete}
      />

      {/* ==============================================
          ADRESSE
      =============================================== */}

      <Text style={styles.label}>
        Adresse société
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Adresse de la société"
        value={adresseSociete}
        onChangeText={setAdresseSociete}
      />

      {/* ==============================================
          FONCTION
      =============================================== */}

      <Text style={styles.label}>
        Fonction
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Fonction"
        value={fonction}
        onChangeText={setFonction}
      />

      {/* ==============================================
          PRÉNOM
      =============================================== */}

      <Text style={styles.label}>
        Prénom
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Entrez le prénom"
        value={prenom}
        onChangeText={setPrenom}
      />

      {/* ==============================================
          ORIGINE
      =============================================== */}

      <Text style={styles.label}>
        Origine / Pays
      </Text>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={origine}
          onValueChange={handlePaysChange}
        >
          <Picker.Item
            label="Sélectionner un pays"
            value=""
          />

          {pays.map((item) => (
            <Picker.Item
              key={item.name}
              label={item.name}
              value={item.name}
            />
          ))}
        </Picker>
      </View>

      {/* ==============================================
          TÉLÉPHONE
      =============================================== */}

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

      {/* ==============================================
          EMAIL
      =============================================== */}

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

      {/* ==============================================
          AGE
      =============================================== */}

      <Text style={styles.label}>
        Âge
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Âge"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      {/* ==============================================
          LANGUE
      =============================================== */}

      <Text style={styles.label}>
        Langue de communication
      </Text>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={langueCommunication}
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

      {/* ==============================================
          PROFILE
      =============================================== */}

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
            label="Institut"
            value="institut"
          />

          <Picker.Item
            label="Autre"
            value="autre"
          />
        </Picker>
      </View>

      {/* ==============================================
          TYPE COMMANDE
      =============================================== */}

      {(profile === "intermediaire" ||
        profile === "acheteur") && (
        <>
          <Text style={styles.label}>
            Type de commande
          </Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={typeCommande}
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

      {/* ==============================================
          VRAC
      =============================================== */}

      {typeCommande === "vrac" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Informations commande en vrac
          </Text>

          <Text style={styles.label}>
            Qualité / Grade
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Qualité / Grade"
            value={qualiteGrade}
            onChangeText={setQualiteGrade}
          />

          <Text style={styles.label}>
            Volume estimé
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Volume estimé"
            value={volumeEstime}
            onChangeText={setVolumeEstime}
            keyboardType="numeric"
          />

          <Text style={styles.label}>
            Destination pays / port
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Destination"
            value={destination}
            onChangeText={setDestination}
          />

          <Text style={styles.label}>
            Incoterm
          </Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={incoterm}
              onValueChange={setIncoterm}
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

          <Text style={styles.label}>
            Format livraison
          </Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formatLivraison}
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

          <Text style={styles.label}>
            Fréquence
          </Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={frequenceCommande}
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

          <Text style={styles.label}>
            Exigences spécifiques
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Bio, certifications, analyses/COA, échantillons..."
            value={exigencesSpecifiques.join(", ")}
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
          />
        </View>
      )}

      {/* ==============================================
          CONDITIONNÉ
      =============================================== */}

      {typeCommande === "conditionné" && (
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
              selectedValue={paysConditionne}
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
                  key={item.name}
                  label={item.name}
                  value={item.name}
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

          {/* ==========================================
              TYPE EMBALLAGE CONDITIONNÉ
          =========================================== */}

          <Text style={styles.label}>
            Type d'emballage
          </Text>

          <View style={styles.multiSelectContainer}>
            {/* TIN */}

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() =>
                toggleEmballage("Tin")
              }
            >
              <View
                style={[
                  styles.checkbox,
                  emballagesSelectionnes.includes(
                    "Tin"
                  ) &&
                    styles.checkboxSelected,
                ]}
              >
                {emballagesSelectionnes.includes(
                  "Tin"
                ) && (
                  <Text
                    style={
                      styles.checkboxCheck
                    }
                  >
                    ✓
                  </Text>
                )}
              </View>

              <Text style={styles.checkboxText}>
                Tin
              </Text>
            </TouchableOpacity>

            {/* PET */}

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() =>
                toggleEmballage("PET")
              }
            >
              <View
                style={[
                  styles.checkbox,
                  emballagesSelectionnes.includes(
                    "PET"
                  ) &&
                    styles.checkboxSelected,
                ]}
              >
                {emballagesSelectionnes.includes(
                  "PET"
                ) && (
                  <Text
                    style={
                      styles.checkboxCheck
                    }
                  >
                    ✓
                  </Text>
                )}
              </View>

              <Text style={styles.checkboxText}>
                PET
              </Text>
            </TouchableOpacity>

            {/* GLASS */}

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() =>
                toggleEmballage("Glass")
              }
            >
              <View
                style={[
                  styles.checkbox,
                  emballagesSelectionnes.includes(
                    "Glass"
                  ) &&
                    styles.checkboxSelected,
                ]}
              >
                {emballagesSelectionnes.includes(
                  "Glass"
                ) && (
                  <Text
                    style={
                      styles.checkboxCheck
                    }
                  >
                    ✓
                  </Text>
                )}
              </View>

              <Text style={styles.checkboxText}>
                Glass
              </Text>
            </TouchableOpacity>

            {/* AUTRE */}

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() =>
                toggleEmballage("Autre")
              }
            >
              <View
                style={[
                  styles.checkbox,
                  emballagesSelectionnes.includes(
                    "Autre"
                  ) &&
                    styles.checkboxSelected,
                ]}
              >
                {emballagesSelectionnes.includes(
                  "Autre"
                ) && (
                  <Text
                    style={
                      styles.checkboxCheck
                    }
                  >
                    ✓
                  </Text>
                )}
              </View>

              <Text style={styles.checkboxText}>
                Autre
              </Text>
            </TouchableOpacity>
          </View>

          {/* AUTRE */}

          {emballagesSelectionnes.includes(
            "Autre"
          ) && (
            <TextInput
              style={styles.input}
              placeholder="Préciser l'emballage"
              value={autreEmballage}
              onChangeText={
                setAutreEmballage
              }
            />
          )}

          {/* ==========================================
              FORMATS CONDITIONNÉ
          =========================================== */}

          {emballagesSelectionnes.map(
            (type) => (
              <View
                key={type}
                style={
                  styles.formatBlock
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  Formats souhaités -{" "}
                  {type}
                </Text>

                {/* TIN */}

                {type === "Tin" &&
                  [
                    "250 ml",
                    "500 ml",
                    "1 L",
                    "2 L",
                    "3 L",
                    "4 L",
                    "5 L",
                    "16 L",
                    "20 L",
                  ].map(
                    (format) => (
                      <TouchableOpacity
                        key={format}
                        style={
                          styles.checkboxRow
                        }
                        onPress={() =>
                          toggleFormat(
                            type,
                            format
                          )
                        }
                      >
                        <View
                          style={[
                            styles.checkbox,
                            (
                              formatsEmballage[
                                type
                              ] || []
                            ).includes(
                              format
                            ) &&
                              styles.checkboxSelected,
                          ]}
                        >
                          {(
                            formatsEmballage[
                              type
                            ] || []
                          ).includes(
                            format
                          ) && (
                            <Text
                              style={
                                styles.checkboxCheck
                              }
                            >
                              ✓
                            </Text>
                          )}
                        </View>

                        <Text
                          style={
                            styles.checkboxText
                          }
                        >
                          {format}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}

                {/* PET */}

                {type === "PET" &&
                  [
                    "250 ml",
                    "500 ml",
                    "1 L",
                    "3 L",
                    "5 L",
                  ].map(
                    (format) => (
                      <TouchableOpacity
                        key={format}
                        style={
                          styles.checkboxRow
                        }
                        onPress={() =>
                          toggleFormat(
                            type,
                            format
                          )
                        }
                      >
                        <View
                          style={[
                            styles.checkbox,
                            (
                              formatsEmballage[
                                type
                              ] || []
                            ).includes(
                              format
                            ) &&
                              styles.checkboxSelected,
                          ]}
                        >
                          {(
                            formatsEmballage[
                              type
                            ] || []
                          ).includes(
                            format
                          ) && (
                            <Text
                              style={
                                styles.checkboxCheck
                              }
                            >
                              ✓
                            </Text>
                          )}
                        </View>

                        <Text
                          style={
                            styles.checkboxText
                          }
                        >
                          {format}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}

                {/* GLASS */}

                {type === "Glass" && (
                  <>
                    <Text
                      style={
                        styles.subLabel
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
                        const value =
                          `MARASCA - ${format}`;

                        return (
                          <TouchableOpacity
                            key={value}
                            style={
                              styles.checkboxRow
                            }
                            onPress={() =>
                              toggleFormat(
                                type,
                                value
                              )
                            }
                          >
                            <View
                              style={[
                                styles.checkbox,
                                (
                                  formatsEmballage[
                                    type
                                  ] || []
                                ).includes(
                                  value
                                ) &&
                                  styles.checkboxSelected,
                              ]}
                            >
                              {(
                                formatsEmballage[
                                  type
                                ] || []
                              ).includes(
                                value
                              ) && (
                                <Text
                                  style={
                                    styles.checkboxCheck
                                  }
                                >
                                  ✓
                                </Text>
                              )}
                            </View>

                            <Text
                              style={
                                styles.checkboxText
                              }
                            >
                              {format}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                    )}

                    <Text
                      style={
                        styles.subLabel
                      }
                    >
                      DORICA
                    </Text>

                    {[
                      "250 ml",
                      "500 ml",
                      "750 ml",
                    ].map(
                      (format) => {
                        const value =
                          `DORICA - ${format}`;

                        return (
                          <TouchableOpacity
                            key={value}
                            style={
                              styles.checkboxRow
                            }
                            onPress={() =>
                              toggleFormat(
                                type,
                                value
                              )
                            }
                          >
                            <View
                              style={[
                                styles.checkbox,
                                (
                                  formatsEmballage[
                                    type
                                  ] || []
                                ).includes(
                                  value
                                ) &&
                                  styles.checkboxSelected,
                              ]}
                            >
                              {(
                                formatsEmballage[
                                  type
                                ] || []
                              ).includes(
                                value
                              ) && (
                                <Text
                                  style={
                                    styles.checkboxCheck
                                  }
                                >
                                  ✓
                                </Text>
                              )}
                            </View>

                            <Text
                              style={
                                styles.checkboxText
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

                {/* AUTRE */}

                {type === "Autre" && (
                  <TextInput
                    style={
                      styles.input
                    }
                    placeholder="Préciser le format souhaité"
                    value={
                      formatsEmballage[
                        type
                      ]?.[0] || ""
                    }
                    onChangeText={(
                      value
                    ) => {
                      setFormatsEmballage(
                        (prev) => ({
                          ...prev,
                          [type]:
                            value
                              ? [value]
                              : [],
                        })
                      );
                    }}
                  />
                )}
              </View>
            )
          )}

          {/* CERTIFICATIONS */}

          <Text style={styles.label}>
            Certifications requises
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.textArea,
            ]}
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
            multiline
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
            keyboardType="url"
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

          {/* TYPE MARQUE */}

          <Text style={styles.label}>
            Type de marque
          </Text>

          <View
            style={
              styles.pickerContainer
            }
          >
            <Picker
              selectedValue={typeMarque}
              onValueChange={(value) => {
                setTypeMarque(value);

                if (
                  value !==
                  "Création de nouvelle marque"
                ) {
                  resetNouvelleMarque();
                }
              }}
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

          {/* ==========================================
              NOUVELLE MARQUE
          =========================================== */}

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

              {/* MARCHÉ CIBLE */}

              <Text style={styles.label}>
                Marché cible
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ex : Tunisie, France, Italie..."
                value={marcheCible}
                onChangeText={
                  setMarcheCible
                }
              />

              {/* QUANTITÉ */}

              <Text style={styles.label}>
                Quantité prévue
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ex : 5000 litres / an"
                value={quantitePrevue}
                onChangeText={
                  setQuantitePrevue
                }
              />

              {/* ======================================
                  PACKAGING NOUVELLE MARQUE
                  
                  Même interface que Type d'emballage
                  mais états différents.
              ======================================= */}

              <Text style={styles.label}>
                Packaging
              </Text>

              <View
                style={
                  styles.multiSelectContainer
                }
              >
                {/* TIN */}

                <TouchableOpacity
                  style={
                    styles.checkboxRow
                  }
                  onPress={() =>
                    toggleNouvelleMarqueEmballage(
                      "Tin"
                    )
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      nouvelleMarqueEmballagesSelectionnes.includes(
                        "Tin"
                      ) &&
                        styles.checkboxSelected,
                    ]}
                  >
                    {nouvelleMarqueEmballagesSelectionnes.includes(
                      "Tin"
                    ) && (
                      <Text
                        style={
                          styles.checkboxCheck
                        }
                      >
                        ✓
                      </Text>
                    )}
                  </View>

                  <Text
                    style={
                      styles.checkboxText
                    }
                  >
                    Tin
                  </Text>
                </TouchableOpacity>

                {/* PET */}

                <TouchableOpacity
                  style={
                    styles.checkboxRow
                  }
                  onPress={() =>
                    toggleNouvelleMarqueEmballage(
                      "PET"
                    )
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      nouvelleMarqueEmballagesSelectionnes.includes(
                        "PET"
                      ) &&
                        styles.checkboxSelected,
                    ]}
                  >
                    {nouvelleMarqueEmballagesSelectionnes.includes(
                      "PET"
                    ) && (
                      <Text
                        style={
                          styles.checkboxCheck
                        }
                      >
                        ✓
                      </Text>
                    )}
                  </View>

                  <Text
                    style={
                      styles.checkboxText
                    }
                  >
                    PET
                  </Text>
                </TouchableOpacity>

                {/* GLASS */}

                <TouchableOpacity
                  style={
                    styles.checkboxRow
                  }
                  onPress={() =>
                    toggleNouvelleMarqueEmballage(
                      "Glass"
                    )
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      nouvelleMarqueEmballagesSelectionnes.includes(
                        "Glass"
                      ) &&
                        styles.checkboxSelected,
                    ]}
                  >
                    {nouvelleMarqueEmballagesSelectionnes.includes(
                      "Glass"
                    ) && (
                      <Text
                        style={
                          styles.checkboxCheck
                        }
                      >
                        ✓
                      </Text>
                    )}
                  </View>

                  <Text
                    style={
                      styles.checkboxText
                    }
                  >
                    Glass
                  </Text>
                </TouchableOpacity>

                {/* AUTRE */}

                <TouchableOpacity
                  style={
                    styles.checkboxRow
                  }
                  onPress={() =>
                    toggleNouvelleMarqueEmballage(
                      "Autre"
                    )
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      nouvelleMarqueEmballagesSelectionnes.includes(
                        "Autre"
                      ) &&
                        styles.checkboxSelected,
                    ]}
                  >
                    {nouvelleMarqueEmballagesSelectionnes.includes(
                      "Autre"
                    ) && (
                      <Text
                        style={
                          styles.checkboxCheck
                        }
                      >
                        ✓
                      </Text>
                    )}
                  </View>

                  <Text
                    style={
                      styles.checkboxText
                    }
                  >
                    Autre
                  </Text>
                </TouchableOpacity>
              </View>

              {/* AUTRE EMBALLAGE */}

              {nouvelleMarqueEmballagesSelectionnes.includes(
                "Autre"
              ) && (
                <TextInput
                  style={styles.input}
                  placeholder="Préciser l'emballage"
                  value={
                    nouvelleMarqueAutreEmballage
                  }
                  onChangeText={
                    setNouvelleMarqueAutreEmballage
                  }
                />
              )}

              {/* ======================================
                  FORMATS NOUVELLE MARQUE
              ======================================= */}

              {nouvelleMarqueEmballagesSelectionnes.map(
                (type) => (
                  <View
                    key={type}
                    style={
                      styles.formatBlock
                    }
                  >
                    <Text
                      style={
                        styles.label
                      }
                    >
                      Formats souhaités -{" "}
                      {type}
                    </Text>

                    {/* TIN */}

                    {type === "Tin" &&
                      [
                        "250 ml",
                        "500 ml",
                        "1 L",
                        "2 L",
                        "3 L",
                        "4 L",
                        "5 L",
                        "16 L",
                        "20 L",
                      ].map(
                        (format) => (
                          <TouchableOpacity
                            key={format}
                            style={
                              styles.checkboxRow
                            }
                            onPress={() =>
                              toggleNouvelleMarqueFormat(
                                type,
                                format
                              )
                            }
                          >
                            <View
                              style={[
                                styles.checkbox,
                                (
                                  nouvelleMarqueFormatsEmballage[
                                    type
                                  ] || []
                                ).includes(
                                  format
                                ) &&
                                  styles.checkboxSelected,
                              ]}
                            >
                              {(
                                nouvelleMarqueFormatsEmballage[
                                  type
                                ] || []
                              ).includes(
                                format
                              ) && (
                                <Text
                                  style={
                                    styles.checkboxCheck
                                  }
                                >
                                  ✓
                                </Text>
                              )}
                            </View>

                            <Text
                              style={
                                styles.checkboxText
                              }
                            >
                              {format}
                            </Text>
                          </TouchableOpacity>
                        )
                      )}

                    {/* PET */}

                    {type === "PET" &&
                      [
                        "250 ml",
                        "500 ml",
                        "1 L",
                        "3 L",
                        "5 L",
                      ].map(
                        (format) => (
                          <TouchableOpacity
                            key={format}
                            style={
                              styles.checkboxRow
                            }
                            onPress={() =>
                              toggleNouvelleMarqueFormat(
                                type,
                                format
                              )
                            }
                          >
                            <View
                              style={[
                                styles.checkbox,
                                (
                                  nouvelleMarqueFormatsEmballage[
                                    type
                                  ] || []
                                ).includes(
                                  format
                                ) &&
                                  styles.checkboxSelected,
                              ]}
                            >
                              {(
                                nouvelleMarqueFormatsEmballage[
                                  type
                                ] || []
                              ).includes(
                                format
                              ) && (
                                <Text
                                  style={
                                    styles.checkboxCheck
                                  }
                                >
                                  ✓
                                </Text>
                              )}
                            </View>

                            <Text
                              style={
                                styles.checkboxText
                              }
                            >
                              {format}
                            </Text>
                          </TouchableOpacity>
                        )
                      )}

                    {/* GLASS */}

                    {type === "Glass" && (
                      <>
                        <Text
                          style={
                            styles.subLabel
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
                            const value =
                              `MARASCA - ${format}`;

                            return (
                              <TouchableOpacity
                                key={value}
                                style={
                                  styles.checkboxRow
                                }
                                onPress={() =>
                                  toggleNouvelleMarqueFormat(
                                    type,
                                    value
                                  )
                                }
                              >
                                <View
                                  style={[
                                    styles.checkbox,
                                    (
                                      nouvelleMarqueFormatsEmballage[
                                        type
                                      ] || []
                                    ).includes(
                                      value
                                    ) &&
                                      styles.checkboxSelected,
                                  ]}
                                >
                                  {(
                                    nouvelleMarqueFormatsEmballage[
                                      type
                                    ] || []
                                  ).includes(
                                    value
                                  ) && (
                                    <Text
                                      style={
                                        styles.checkboxCheck
                                      }
                                    >
                                      ✓
                                    </Text>
                                  )}
                                </View>

                                <Text
                                  style={
                                    styles.checkboxText
                                  }
                                >
                                  {format}
                                </Text>
                              </TouchableOpacity>
                            );
                          }
                        )}

                        <Text
                          style={
                            styles.subLabel
                          }
                        >
                          DORICA
                        </Text>

                        {[
                          "250 ml",
                          "500 ml",
                          "750 ml",
                        ].map(
                          (format) => {
                            const value =
                              `DORICA - ${format}`;

                            return (
                              <TouchableOpacity
                                key={value}
                                style={
                                  styles.checkboxRow
                                }
                                onPress={() =>
                                  toggleNouvelleMarqueFormat(
                                    type,
                                    value
                                  )
                                }
                              >
                                <View
                                  style={[
                                    styles.checkbox,
                                    (
                                      nouvelleMarqueFormatsEmballage[
                                        type
                                      ] || []
                                    ).includes(
                                      value
                                    ) &&
                                      styles.checkboxSelected,
                                  ]}
                                >
                                  {(
                                    nouvelleMarqueFormatsEmballage[
                                      type
                                    ] || []
                                  ).includes(
                                    value
                                  ) && (
                                    <Text
                                      style={
                                        styles.checkboxCheck
                                      }
                                    >
                                      ✓
                                    </Text>
                                  )}
                                </View>

                                <Text
                                  style={
                                    styles.checkboxText
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

                    {/* AUTRE */}

                    {type === "Autre" && (
                      <TextInput
                        style={
                          styles.input
                        }
                        placeholder="Préciser le format souhaité"
                        value={
                          nouvelleMarqueFormatsEmballage[
                            type
                          ]?.[0] || ""
                        }
                        onChangeText={(
                          value
                        ) => {
                          setNouvelleMarqueFormatsEmballage(
                            (prev) => ({
                              ...prev,
                              [type]:
                                value
                                  ? [value]
                                  : [],
                            })
                          );
                        }}
                      />
                    )}
                  </View>
                )
              )}
            </View>
          )}
        </View>
      )}

      {/* ==============================================
          BOUTON AJOUTER
      =============================================== */}

      <TouchableOpacity
        style={styles.button}
        onPress={handleAjouter}
      >
        <Text style={styles.buttonText}>
          AJOUTER LE VISITEUR
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
    paddingBottom: 60,
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
    marginBottom: 20,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 7,
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

  multiSelectContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 5,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  checkboxSelected: {
    backgroundColor: "#EE672A",
    borderColor: "#EE672A",
  },

  checkboxCheck: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  checkboxText: {
    fontSize: 16,
  },

  formatBlock: {
    marginTop: 10,
    paddingTop: 5,
  },

  subLabel: {
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },

  testButton: {
    backgroundColor: "#555",
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: "center",
  },

  button: {
    backgroundColor: "#EE672A",
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 30,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});