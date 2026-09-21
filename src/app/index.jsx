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
  // ÉTATS - INFORMATIONS GÉNÉRALES
  // =====================================================
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [indicatif, setIndicatif] = useState("+216");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [sexe, setSexe] = useState("");
  const [origine, setOrigine] = useState("");
  const [societe, setSociete] = useState("");
  const [adresseSociete, setAdresseSociete] = useState("");
  const [fonction, setFonction] = useState("");
  const [langueCommunication, setLangueCommunication] = useState("");

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
  const [formatsSouhaites, setFormatsSouhaites] = useState("");
  const [typeMarque, setTypeMarque] = useState("");
  const [certificationsRequises, setCertificationsRequises] = useState([]);
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [siteWeb, setSiteWeb] = useState("");
  const [contactProfessionnel, setContactProfessionnel] = useState("");

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
  // TEST CONNEXION BACKEND
  // =====================================================
  const testerConnexion = async () => {
    try {
      console.log("Test connexion vers :", `${API_URL}/`);

      const response = await fetch(`${API_URL}/`);

      const data = await response.json();

      console.log("Réponse backend :", data);

      if (response.ok) {
        Alert.alert(
          "Connexion réussie",
          "Le frontend communique correctement avec le backend."
        );
      } else {
        Alert.alert("Erreur", "Le backend a répondu avec une erreur.");
      }
    } catch (error) {
      console.error("Erreur connexion :", error);

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
    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------
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

    // -----------------------------------------------------
    // OBJET À ENVOYER AU BACKEND
    // -----------------------------------------------------
    const visitorData = {
      nom: nom.trim(),
      prenom: prenom.trim() || null,
      email: email.trim(),
      age: age ? Number(age) : null,

      sexe: sexe || null,
      origine: origine || null,
      indicatif: indicatif || null,
      telephone: telephone.trim(),

      societe: societe.trim(),
      adresse_societe: adresseSociete.trim() || null,
      fonction: fonction.trim() || null,
      langue_communication: langueCommunication || null,

      type_commande: typeCommande,

      // =========================
      // VRAC
      // =========================
      qualite_grade:
        typeCommande === "vrac" ? qualiteGrade.trim() || null : null,

      volume_estime:
        typeCommande === "vrac" && volumeEstime
          ? Number(volumeEstime)
          : null,

      destination:
        typeCommande === "vrac" ? destination.trim() || null : null,

      incoterm:
        typeCommande === "vrac" ? incoterm || null : null,

      format_livraison:
        typeCommande === "vrac" ? formatLivraison || null : null,

      frequence_commande:
        typeCommande === "vrac" ? frequenceCommande || null : null,

      exigences_specifiques:
        typeCommande === "vrac" && exigencesSpecifiques.length > 0
          ? exigencesSpecifiques
          : null,

      informations_complementaires:
        typeCommande === "vrac"
          ? informationsComplementaires.trim() || null
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
          ? canalDistribution || null
          : null,

      volumes_estimes:
        typeCommande === "conditionné"
          ? volumesEstimes.trim() || null
          : null,

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
          ? certificationsRequises
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
    };

    console.log(
      "======================================="
    );
    console.log("DONNÉES ENVOYÉES AU BACKEND");
    console.log(visitorData);
    console.log(
      "======================================="
    );

    // -----------------------------------------------------
    // ENVOI AU BACKEND
    // -----------------------------------------------------
    try {
      const response = await fetch(`${API_URL}/api/visiteurs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(visitorData),
      });

      const data = await response.json();

      console.log("Réponse backend :", data);

      if (!response.ok) {
        throw new Error(data.message || "Erreur serveur");
      }

      Alert.alert(
        "Succès",
        "Le visiteur a été ajouté avec succès."
      );

      // ---------------------------------------------------
      // RESET FORMULAIRE
      // ---------------------------------------------------
      setNom("");
      setPrenom("");
      setTelephone("");
      setEmail("");
      setAge("");
      setSexe("");
      setOrigine("");
      setIndicatif("+216");
      setSociete("");
      setAdresseSociete("");
      setFonction("");
      setLangueCommunication("");
      setTypeCommande("");

      setQualiteGrade("");
      setVolumeEstime("");
      setDestination("");
      setIncoterm("");
      setFormatLivraison("");
      setFrequenceCommande("");
      setExigencesSpecifiques([]);
      setInformationsComplementaires("");

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
      console.error("ERREUR POST :", error);

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
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Formulaire Visiteur</Text>

      <Text style={styles.subtitle}>
        Enregistrement d'un nouveau visiteur
      </Text>

      {/* =================================================
          NOM
      ================================================= */}
      <Text style={styles.label}>
        Nom et Prénom <Text style={styles.required}>*</Text>
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Entrez le nom"
        value={nom}
        onChangeText={setNom}
      />

      {/* =================================================
          PRENOM
      ================================================= */}
      <Text style={styles.label}>Adresse Site Email</Text>

      <TextInput
        style={styles.input}
        placeholder="Entrez le prénom"
        value={prenom}
        onChangeText={setPrenom}
      />

      {/* =================================================
          ORIGINE / PAYS
      ================================================= */}
      <Text style={styles.label}>
        Origine / Pays <Text style={styles.required}>*</Text>
      </Text>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={origine}
          onValueChange={handlePaysChange}
        >
          <Picker.Item label="Sélectionner un pays" value="" />

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
        Téléphone / WhatsApp <Text style={styles.required}>*</Text>
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
        Email <Text style={styles.required}>*</Text>
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
          AGE
      ================================================= */}
      <Text style={styles.label}>Âge</Text>

      <TextInput
        style={styles.input}
        placeholder="Entrez l'âge"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      {/* =================================================
          SEXE
      ================================================= */}
      <Text style={styles.label}>
        Sexe <Text style={styles.required}>*</Text>
      </Text>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={sexe}
          onValueChange={setSexe}
        >
          <Picker.Item label="Sélectionner" value="" />
          <Picker.Item label="Homme" value="Homme" />
          <Picker.Item label="Femme" value="Femme" />
        </Picker>
      </View>

      

      {/* =================================================
          SOCIETE
      ================================================= */}
      <Text style={styles.label}>
        Société <Text style={styles.required}>*</Text>
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nom de la société"
        value={societe}
        onChangeText={setSociete}
      />

      {/* =================================================
          ADRESSE SOCIETE
      ================================================= */}
      <Text style={styles.label}>Adresse société</Text>

      <TextInput
        style={styles.input}
        placeholder="Adresse de la société"
        value={adresseSociete}
        onChangeText={setAdresseSociete}
      />

      {/* =================================================
          FONCTION
      ================================================= */}
      <Text style={styles.label}>Fonction</Text>

      <TextInput
        style={styles.input}
        placeholder="Fonction"
        value={fonction}
        onChangeText={setFonction}
      />

      {/* =================================================
          LANGUE
      ================================================= */}
      <Text style={styles.label}>Langue de communication</Text>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={langueCommunication}
          onValueChange={setLangueCommunication}
        >
          <Picker.Item label="Sélectionner" value="" />
          <Picker.Item label="Français" value="Français" />
          <Picker.Item label="Anglais" value="Anglais" />
          <Picker.Item label="Arabe" value="Arabe" />
          <Picker.Item label="Italien" value="Italien" />
          <Picker.Item label="Espagnol" value="Espagnol" />
        </Picker>
      </View>

      {/* =================================================
          TYPE COMMANDE
      ================================================= */}
      <Text style={styles.label}>
        Type de commande <Text style={styles.required}>*</Text>
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
            value="conditionné"
          />
        </Picker>
      </View>

      {/* =================================================
          SECTION VRAC
      ================================================= */}
      {typeCommande === "vrac" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Informations commande en vrac
          </Text>

          <Text style={styles.label}>Qualité / Grade</Text>

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

          <Text style={styles.label}>Incoterm</Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={incoterm}
              onValueChange={setIncoterm}
            >
              <Picker.Item label="Sélectionner" value="" />
              <Picker.Item label="EXW" value="EXW" />
              <Picker.Item label="FOB" value="FOB" />
              <Picker.Item label="CFR" value="CFR" />
              <Picker.Item label="CIF" value="CIF" />
              <Picker.Item label="DAP" value="DAP" />
              <Picker.Item label="DDP" value="DDP" />
            </Picker>
          </View>

          <Text style={styles.label}>
            Format livraison
          </Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formatLivraison}
              onValueChange={setFormatLivraison}
            >
              <Picker.Item label="Sélectionner" value="" />
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

          <Text style={styles.label}>
            Fréquence
          </Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={frequenceCommande}
              onValueChange={setFrequenceCommande}
            >
              <Picker.Item label="Sélectionner" value="" />
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
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
          />

          <Text style={styles.label}>
            Informations complémentaires
          </Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Informations complémentaires"
            value={informationsComplementaires}
            onChangeText={setInformationsComplementaires}
            multiline
            numberOfLines={4}
          />
        </View>
      )}

      {/* =================================================
          SECTION CONDITIONNÉ
      ================================================= */}
      {typeCommande === "conditionné" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Informations commande conditionnée
          </Text>

          <Text style={styles.label}>
            Pays
          </Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={paysConditionne}
              onValueChange={setPaysConditionne}
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

          <Text style={styles.label}>
            Canal de distribution
          </Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={canalDistribution}
              onValueChange={setCanalDistribution}
            >
              <Picker.Item label="Sélectionner" value="" />
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

          <Text style={styles.label}>
            Volumes estimés
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Quantité par mois ou par an"
            value={volumesEstimes}
            onChangeText={setVolumesEstimes}
          />

          <Text style={styles.label}>
            Formats souhaités
          </Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formatsSouhaites}
              onValueChange={setFormatsSouhaites}
            >
              <Picker.Item label="Sélectionner" value="" />
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

          <Text style={styles.label}>
            Type de marque
          </Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={typeMarque}
              onValueChange={setTypeMarque}
            >
              <Picker.Item label="Sélectionner" value="" />
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

          <Text style={styles.label}>
            Certifications requises
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ex : BIO, ISO, IFS..."
            value={certificationsRequises.join(", ")}
            onChangeText={(text) =>
              setCertificationsRequises(
                text
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
          />

          <Text style={styles.label}>
            Nom entreprise
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Nom de l'entreprise"
            value={nomEntreprise}
            onChangeText={setNomEntreprise}
          />

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

          <Text style={styles.label}>
            Contact professionnel
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email / téléphone"
            value={contactProfessionnel}
            onChangeText={setContactProfessionnel}
          />
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

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Backend : {API_URL}
        </Text>
      </View>
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

  required: {
    color: "red",
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
    marginTop: 25,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },

  footer: {
    marginTop: 20,
    alignItems: "center",
  },

  footerText: {
    color: "#777",
    fontSize: 12,
  },
});