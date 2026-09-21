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

// ==================================================
// URL BACKEND NODE.JS
// TEST SUR LE PC
// ==================================================
const API_URL = "http://192.168.1.146:5000";
const testerConnexion = async () => {
  console.log("=================================");
  console.log("TEST CONNEXION BACKEND");
  console.log("=================================");
  console.log("URL :", `${API_URL}/`);

  try {
    const response = await fetch(`${API_URL}/`);

    console.log("STATUS HTTP :", response.status);

    const data = await response.json();

    console.log("RÉPONSE NODE.JS :", data);

    if (!response.ok) {
      throw new Error(
        data.message || "Le serveur a retourné une erreur."
      );
    }

    Alert.alert(
      "Connexion OK",
      "React Native communique correctement avec Node.js."
    );

  } catch (error) {
    console.error("ERREUR TEST BACKEND :", error);

    Alert.alert(
      "Connexion impossible",
      `Impossible de contacter Node.js.\n\n${error.message}\n\nURL : ${API_URL}`
    );
  }
};
// ==================================================
// LISTE DES PAYS
// ==================================================

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
  { name: "Égypte", dialCode: "+20" },
];

export default function HomeScreen() {
  // ==================================================
  // INFORMATIONS PRINCIPALES
  // ==================================================

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [indicatif, setIndicatif] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [sexe, setSexe] = useState("");
  const [origine, setOrigine] = useState("");
  const [societe, setSociete] = useState("");
  const [adresseSociete, setAdresseSociete] = useState("");
  const [fonction, setFonction] = useState("");
  const [langueCommunication, setLangueCommunication] = useState("");
  const [typeCommande, setTypeCommande] = useState("");

  // ==================================================
  // VRAC
  // ==================================================

  const [qualiteGrade, setQualiteGrade] = useState("");
  const [volumeEstime, setVolumeEstime] = useState("");
  const [destination, setDestination] = useState("");
  const [incoterm, setIncoterm] = useState("");
  const [formatLivraison, setFormatLivraison] = useState("");
  const [frequenceCommande, setFrequenceCommande] = useState("");
  const [exigencesSpecifiques, setExigencesSpecifiques] = useState([]);
  const [informationsComplementaires, setInformationsComplementaires] =
    useState("");

  // ==================================================
  // CONDITIONNÉ
  // ==================================================

  const [paysConditionne, setPaysConditionne] = useState("");
  const [canalDistribution, setCanalDistribution] = useState("");
  const [volumesEstimes, setVolumesEstimes] = useState("");
  const [formatsSouhaites, setFormatsSouhaites] = useState("");
  const [typeMarque, setTypeMarque] = useState("");
  const [certificationsRequises, setCertificationsRequises] = useState([]);
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [siteWeb, setSiteWeb] = useState("");
  const [contactProfessionnel, setContactProfessionnel] = useState("");

  // ==================================================
  // TEST CONNEXION BACKEND
  // ==================================================

  const testerConnexion = async () => {
    console.log("=================================");
    console.log("TEST CONNEXION BACKEND");
    console.log("=================================");
    console.log("URL :", `${API_URL}/`);
  
    
  };

  // ==================================================
  // AJOUTER VISITEUR
  // ==================================================

  const handleAjouter = async () => {
    console.log("");
    console.log("=================================");
    console.log("DÉBUT AJOUT VISITEUR");
    console.log("=================================");

    // ==================================================
    // VALIDATION CHAMPS OBLIGATOIRES
    // ==================================================

    if (
      !nom.trim() ||
      !telephone.trim() ||
      !email.trim() ||
      !sexe ||
      !origine ||
      !societe.trim() ||
      !typeCommande
    ) {
      Alert.alert(
        "Champs obligatoires",
        "Veuillez remplir tous les champs obligatoires (*)."
      );
      return;
    }

    // ==================================================
    // VALIDATION EMAIL
    // ==================================================

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      Alert.alert(
        "Email invalide",
        "Veuillez saisir une adresse email valide."
      );
      return;
    }

    // ==================================================
    // RÉCUPÉRATION PAYS
    // ==================================================

    const country = pays.find(
      (item) => item.name === origine
    );

    if (!country) {
      Alert.alert(
        "Pays",
        "Veuillez sélectionner un pays."
      );
      return;
    }

    // ==================================================
    // VALIDATION TÉLÉPHONE
    // ==================================================

    const telephoneDigits = telephone.replace(/\D/g, "");

    if (telephoneDigits.length < 6) {
      Alert.alert(
        "Téléphone invalide",
        "Veuillez saisir un numéro de téléphone valide."
      );
      return;
    }

    // ==================================================
    // VALIDATION VOLUME VRAC
    // ==================================================

    if (
      typeCommande === "vrac" &&
      volumeEstime !== "" &&
      isNaN(Number(volumeEstime))
    ) {
      Alert.alert(
        "Volume invalide",
        "Veuillez saisir un volume numérique."
      );
      return;
    }

    // ==================================================
    // OBJET À ENVOYER AU BACKEND
    // ==================================================

    const visiteur = {
      // -----------------------------
      // INFORMATIONS PRINCIPALES
      // -----------------------------

      nom: nom.trim(),

      // prenom et age ne sont pas envoyés
      // car ils ne sont pas encore dans la table MySQL actuelle.

      email: email.trim(),

      sexe: sexe,

      origine: origine,

      indicatif: country.dialCode,

      telephone: telephone.trim(),

      societe: societe.trim(),

      adresse_societe:
        adresseSociete.trim() || null,

      type_commande: typeCommande,

      fonction:
        fonction.trim() || null,

      langue_communication:
        langueCommunication || null,

      // -----------------------------
      // VRAC
      // -----------------------------

      qualite_grade:
        typeCommande === "vrac"
          ? qualiteGrade.trim() || null
          : null,

      volume_estime:
        typeCommande === "vrac" &&
        volumeEstime !== ""
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
          ? exigencesSpecifiques
          : null,

      informations_complementaires:
        typeCommande === "vrac"
          ? informationsComplementaires.trim() || null
          : null,

      // -----------------------------
      // CONDITIONNÉ
      // -----------------------------

      pays_conditionne:
        typeCommande === "conditionne"
          ? paysConditionne.trim() || null
          : null,

      canal_distribution:
        typeCommande === "conditionne"
          ? canalDistribution || null
          : null,

      volumes_estimes:
        typeCommande === "conditionne"
          ? volumesEstimes.trim() || null
          : null,

      formats_souhaites:
        typeCommande === "conditionne"
          ? formatsSouhaites || null
          : null,

      type_marque:
        typeCommande === "conditionne"
          ? typeMarque || null
          : null,

      certifications_requises:
        typeCommande === "conditionne" &&
        certificationsRequises.length > 0
          ? certificationsRequises
          : null,

      nom_entreprise:
        typeCommande === "conditionne"
          ? nomEntreprise.trim() || null
          : null,

      site_web:
        typeCommande === "conditionne"
          ? siteWeb.trim() || null
          : null,

      contact_professionnel:
        typeCommande === "conditionne"
          ? contactProfessionnel.trim() || null
          : null,
    };

    // ==================================================
    // AFFICHAGE DEBUG
    // ==================================================

    console.log("URL API :", `${API_URL}/api/visiteurs`);

    console.log(
      "DONNÉES ENVOYÉES :",
      JSON.stringify(visiteur, null, 2)
    );

    console.log("=================================");

    // ==================================================
    // ENVOI AU BACKEND
    // ==================================================

    try {
      console.log("ENVOI VERS NODE.JS...");

      const response = await fetch(
        `${API_URL}/api/visiteurs`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify(visiteur),
        }
      );

      console.log(
        "STATUS HTTP :",
        response.status
      );

      const data = await response.json();

      console.log(
        "RÉPONSE NODE.JS :",
        data
      );

      // ==================================================
      // ERREUR SERVEUR
      // ==================================================

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Erreur lors de l'ajout du visiteur."
        );
      }

      // ==================================================
      // SUCCÈS
      // ==================================================

      Alert.alert(
        "Succès",
        `Le visiteur ${nom} a été ajouté avec succès dans la base de données.`
      );

      // ==================================================
      // RESET INFORMATIONS PRINCIPALES
      // ==================================================

      setNom("");
      setPrenom("");
      setTelephone("");
      setIndicatif("");
      setEmail("");
      setAge("");
      setSexe("");
      setOrigine("");
      setSociete("");
      setAdresseSociete("");
      setFonction("");
      setLangueCommunication("");
      setTypeCommande("");

      // ==================================================
      // RESET VRAC
      // ==================================================

      setQualiteGrade("");
      setVolumeEstime("");
      setDestination("");
      setIncoterm("");
      setFormatLivraison("");
      setFrequenceCommande("");
      setExigencesSpecifiques([]);
      setInformationsComplementaires("");

      // ==================================================
      // RESET CONDITIONNÉ
      // ==================================================

      setPaysConditionne("");
      setCanalDistribution("");
      setVolumesEstimes("");
      setFormatsSouhaites("");
      setTypeMarque("");
      setCertificationsRequises([]);
      setNomEntreprise("");
      setSiteWeb("");
      setContactProfessionnel("");
    } catch (error) {
      console.error("");
      console.error("=================================");
      console.error("ERREUR CONNEXION API");
      console.error("=================================");
      console.error(error);
      console.error("=================================");

      Alert.alert(
        "Erreur",
        `Impossible de contacter le serveur Node.js.\n\n${error.message}\n\nAPI : ${API_URL}`
      );
    }
  };

  // ==================================================
  // INTERFACE
  // ==================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        Ajouter un visiteur
      </Text>

      {/* ==================================================
          TEST BACKEND
      ================================================== */}

      <TouchableOpacity
        style={styles.testButton}
        onPress={testerConnexion}
      >
        <Text style={styles.buttonText}>
          TESTER LA CONNEXION AU SERVEUR
        </Text>
      </TouchableOpacity>

      {/* ==================================================
          NOM
      ================================================== */}

      <Text style={styles.label}>
        Nom *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Entrez le nom"
        value={nom}
        onChangeText={setNom}
        autoCapitalize="words"
      />

      {/* ==================================================
          PRÉNOM
      ================================================== */}

      <Text style={styles.label}>
        Prénom
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Entrez le prénom"
        value={prenom}
        onChangeText={setPrenom}
        autoCapitalize="words"
      />

      {/* ==================================================
          EMAIL
      ================================================== */}

      <Text style={styles.label}>
        Email *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Entrez l'email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* ==================================================
          ÂGE
      ================================================== */}

      <Text style={styles.label}>
        Âge
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Entrez l'âge"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      {/* ==================================================
          TÉLÉPHONE
      ================================================== */}

      <Text style={styles.label}>
        Téléphone *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Entrez le téléphone"
        value={telephone}
        onChangeText={setTelephone}
        keyboardType="phone-pad"
      />

      {/* ==================================================
          SEXE
      ================================================== */}

      <Text style={styles.label}>
        Sexe *
      </Text>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={sexe}
          onValueChange={setSexe}
        >
          <Picker.Item
            label="Sélectionner"
            value=""
          />

          <Picker.Item
            label="Homme"
            value="Homme"
          />

          <Picker.Item
            label="Femme"
            value="Femme"
          />
        </Picker>
      </View>

      {/* ==================================================
          ORIGINE
      ================================================== */}

      <Text style={styles.label}>
        Origine / Pays *
      </Text>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={origine}
          onValueChange={(value) => {
            setOrigine(value);

            const selectedCountry = pays.find(
              (item) => item.name === value
            );

            if (selectedCountry) {
              setIndicatif(
                selectedCountry.dialCode
              );
            } else {
              setIndicatif("");
            }
          }}
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

      {/* ==================================================
          INDICATIF
      ================================================== */}

      <Text style={styles.label}>
        Indicatif
      </Text>

      <TextInput
        style={[
          styles.input,
          styles.disabledInput,
        ]}
        value={indicatif}
        editable={false}
        placeholder="+216"
      />

      {/* ==================================================
          SOCIÉTÉ
      ================================================== */}

      <Text style={styles.label}>
        Société *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nom de la société"
        value={societe}
        onChangeText={setSociete}
      />

      {/* ==================================================
          ADRESSE SOCIÉTÉ
      ================================================== */}

      <Text style={styles.label}>
        Adresse société
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Adresse de la société"
        value={adresseSociete}
        onChangeText={setAdresseSociete}
      />

      {/* ==================================================
          FONCTION
      ================================================== */}

      <Text style={styles.label}>
        Fonction
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Fonction"
        value={fonction}
        onChangeText={setFonction}
      />

      {/* ==================================================
          LANGUE
      ================================================== */}

      <Text style={styles.label}>
        Langue de communication
      </Text>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={langueCommunication}
          onValueChange={setLangueCommunication}
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
        </Picker>
      </View>

      {/* ==================================================
          TYPE COMMANDE
      ================================================== */}

      <Text style={styles.label}>
        Type de commande *
      </Text>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={typeCommande}
          onValueChange={setTypeCommande}
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
            value="conditionne"
          />
        </Picker>
      </View>

      {/* ==================================================
          VRAC
      ================================================== */}

      {typeCommande === "vrac" && (
        <View>
          <Text style={styles.sectionTitle}>
            Informations Vrac
          </Text>

          {/* QUALITÉ */}

          <Text style={styles.label}>
            Qualité / Grade
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Qualité / Grade"
            value={qualiteGrade}
            onChangeText={setQualiteGrade}
          />

          {/* VOLUME */}

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

          {/* DESTINATION */}

          <Text style={styles.label}>
            Destination pays / port
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Destination"
            value={destination}
            onChangeText={setDestination}
          />

          {/* INCOTERM */}

          <Text style={styles.label}>
            Incoterm
          </Text>

          <TextInput
            style={styles.input}
            placeholder="FOB / CIF / EXW..."
            value={incoterm}
            onChangeText={setIncoterm}
            autoCapitalize="characters"
          />

          {/* FORMAT LIVRAISON */}

          <Text style={styles.label}>
            Format livraison
          </Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formatLivraison}
              onValueChange={setFormatLivraison}
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
                label="Fûts"
                value="Fûts"
              />

              <Picker.Item
                label="Autre"
                value="Autre"
              />
            </Picker>
          </View>

          {/* FRÉQUENCE */}

          <Text style={styles.label}>
            Fréquence
          </Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={frequenceCommande}
              onValueChange={setFrequenceCommande}
            >
              <Picker.Item
                label="Sélectionner"
                value=""
              />

              <Picker.Item
                label="Unique"
                value="unique"
              />

              <Picker.Item
                label="Régulières"
                value="regulieres"
              />
            </Picker>
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
            value={informationsComplementaires}
            onChangeText={
              setInformationsComplementaires
            }
            multiline
          />
        </View>
      )}

      {/* ==================================================
          CONDITIONNÉ
      ================================================== */}

      {typeCommande === "conditionne" && (
        <View>
          <Text style={styles.sectionTitle}>
            Informations Conditionné
          </Text>

          {/* PAYS */}

          <Text style={styles.label}>
            Pays
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Pays"
            value={paysConditionne}
            onChangeText={setPaysConditionne}
          />

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
            placeholder="Par mois / par an"
            value={volumesEstimes}
            onChangeText={setVolumesEstimes}
          />

          {/* FORMATS */}

          <Text style={styles.label}>
            Formats souhaités
          </Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formatsSouhaites}
              onValueChange={setFormatsSouhaites}
            >
              <Picker.Item
                label="Sélectionner"
                value=""
              />

              <Picker.Item
                label="250 ml"
                value="250 ml"
              />

              <Picker.Item
                label="500 ml"
                value="500 ml"
              />

              <Picker.Item
                label="750 ml"
                value="750 ml"
              />

              <Picker.Item
                label="1 L"
                value="1 L"
              />

              <Picker.Item
                label="Autre"
                value="Autre"
              />
            </Picker>
          </View>

          {/* TYPE MARQUE */}

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
                label="Marque OLIVED"
                value="Marque OLIVED"
              />

              <Picker.Item
                label="Private Label"
                value="Private Label"
              />
            </Picker>
          </View>

          {/* CERTIFICATIONS */}

          <Text style={styles.label}>
            Certifications requises
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.textArea,
            ]}
            placeholder="Certifications requises"
            value={certificationsRequises.join(", ")}
            onChangeText={(value) =>
              setCertificationsRequises(
                value
                  .split(",")
                  .map((item) => item.trim())
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
            placeholder="Nom entreprise"
            value={nomEntreprise}
            onChangeText={setNomEntreprise}
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
            placeholder="Contact professionnel"
            value={contactProfessionnel}
            onChangeText={setContactProfessionnel}
          />
        </View>
      )}

      {/* ==================================================
          BOUTON AJOUTER
      ================================================== */}

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAjouter}
      >
        <Text style={styles.buttonText}>
          AJOUTER LE VISITEUR
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ==================================================
// STYLES
// ==================================================

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
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 15,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },

  disabledInput: {
    backgroundColor: "#e9e9e9",
    color: "#555",
  },

  textArea: {
    height: 100,
    textAlignVertical: "top",
  },

  pickerContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
  },

  testButton: {
    backgroundColor: "#555",
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 20,
  },

  addButton: {
    backgroundColor: "#EE672A",
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 30,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
});