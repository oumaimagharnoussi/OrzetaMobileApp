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

// =====================================================
// CONFIGURATION
// =====================================================

const API_URL = "http://192.168.1.146:5000";

const ORANGE = "#5C681F";

// =====================================================
// PRODUITS
// =====================================================

const products = [
  [
    "Extra Virgin Olive Oil – 3L Tin Cans",
    18.5,
    3360,
  ],
  [
    "Extra Virgin Olive Oil – 5L Tin Cans",
    25.8,
    2800,
  ],
  [
    "Extra Virgin Olive Oil – 5L PET",
    21.7,
    2520,
  ],
  [
    "Extra Virgin Olive Oil – 1L Glass bottle",
    6.2,
    7920,
  ],
  [
    "Extra Virgin Olive Oil – 0.750L DORICA Glass bottle",
    4.6,
    11520,
  ],
  [
    "Extra Virgin Olive Oil – 0.500L DORICA Glass bottle",
    3.75,
    15840,
  ],
  [
    "Extra Virgin Olive Oil – 0.250L DORICA Glass bottle",
    2.6,
    21600,
  ],
];

// =====================================================
// MONEY
// =====================================================

const money = (n) =>
  Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
      if (!visitorId) {
        setLoading(false);

        Alert.alert(
          "Erreur",
          "Identifiant du visiteur introuvable."
        );

        return;
      }

      try {
        console.log(
          "======================================="
        );

        console.log(
          "CHARGEMENT VISITEUR"
        );

        console.log(
          "Visitor ID :",
          visitorId
        );

        console.log(
          "======================================="
        );

        const response = await fetch(
          `${API_URL}/api/visiteurs/${encodeURIComponent(
            visitorId
          )}`
        );

        const data = await response.json();

        console.log(
          "GET VISITEUR STATUS :",
          response.status
        );

        console.log(
          "GET VISITEUR RESPONSE :",
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Impossible de charger le visiteur."
          );
        }

        if (!data?.success) {
          throw new Error(
            data?.message ||
              "Le serveur n'a pas retourné les données du visiteur."
          );
        }

        /*
         * Le nouveau server.js retourne :
         *
         * {
         *   success: true,
         *   data: visitor,
         *   visitor: visitor
         * }
         *
         * On accepte les deux.
         */

        const visitorData =
          data?.data ||
          data?.visitor ||
          data?.visiteur ||
          data;

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
  }, [visitorId]);

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

    const rows = products
      .map(
        ([desc, price, qty]) => `
          <tr>
            <td>${esc(desc)}</td>
            <td class="num">${money(
              price
            )}</td>
            <td class="num">${Number(
              qty
            ).toLocaleString("en-US")}</td>
            <td class="num">${money(
              price * qty
            )}</td>
          </tr>
        `
      )
      .join("");

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
          Unit Price EXW Sfax (USD)
        </th>

        <th>
          Quantity FCL 20’
        </th>

        <th>
          Total EXW Sfax (USD)
        </th>

      </tr>

    </thead>

    <tbody>

      ${rows}

    </tbody>

  </table>

  <p class="terms">

    <b>Currency:</b>
    USD

    &nbsp;&nbsp;&nbsp;

    <b>Incoterm:</b>
    EXW SFAX

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
  
      // Générer le HTML complet avec le logo local
      const content = await html();
  
      console.log(
        "======================================="
      );
  
      console.log(
        "GÉNÉRATION PDF LOCAL"
      );
  
      console.log(
        "Plateforme :",
        Platform.OS
      );
  
      console.log(
        "HTML :",
        content.length,
        "caractères"
      );
  
      console.log(
        "======================================="
      );
  
      if (!content || !content.trim()) {
        throw new Error(
          "Le contenu HTML du PDF est vide."
        );
      }
  
      if (Platform.OS === "web") {
        // Sur Web : ouvrir la boîte d'impression
        await Print.printAsync({
          html: content,
        });
      } else {
        // Sur Android / iOS :
        // générer d'abord le fichier PDF
        const file = await Print.printToFileAsync({
          html: content,
        });
  
        console.log(
          "PDF généré :",
          file?.uri
        );
  
        if (!file?.uri) {
          throw new Error(
            "Le fichier PDF n'a pas pu être généré."
          );
        }
  
        // Ouvrir l'impression du fichier PDF
        await Print.printAsync({
          uri: file.uri,
        });
      }
  
      console.log(
        "PDF généré/imprimé avec succès."
      );
    } catch (error) {
      console.error(
        "ERREUR PDF :",
        error
      );
  
      Alert.alert(
        "Erreur PDF",
        error?.message ||
          "Impossible de générer le PDF."
      );
    } finally {
      setGenerating(false);
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
  `Please find attached our quotation for the requested olive oil products.\n` +
  `The offer includes the product specifications, packaging options, quantities, and corresponding prices. Should you require any modifications regarding volumes, packaging, delivery terms, or payment conditions, we would be pleased to review the offer accordingly.\n` +
  `Please do not hesitate to contact us should you need any further information or clarification.\n` +
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
                  (USD)
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
                  (USD)
                </Text>
              </View>

              {/* TABLE ROWS */}

              {products.map(
                ([desc, price, qty]) => (
                  <View
                    key={desc}
                    style={
                      styles.tableRow
                    }
                  >
                    <Text
                      style={[
                        styles.td,
                        {
                          width: 250,
                        },
                      ]}
                    >
                      {desc}
                    </Text>

                    <Text
                      style={[
                        styles.td,
                        {
                          width: 125,
                          textAlign:
                            "right",
                        },
                      ]}
                    >
                      {money(price)}
                    </Text>

                    <Text
                      style={[
                        styles.td,
                        {
                          width: 105,
                          textAlign:
                            "right",
                        },
                      ]}
                    >
                      {qty.toLocaleString(
                        "en-US"
                      )}
                    </Text>

                    <Text
                      style={[
                        styles.td,
                        {
                          width: 135,
                          textAlign:
                            "right",
                        },
                      ]}
                    >
                      {money(
                        price * qty
                      )}
                    </Text>
                  </View>
                )
              )}

            </View>
          </ScrollView>

          <Text
            style={styles.body}
          >
            <Text
              style={styles.bold}
            >
              Currency:
            </Text>{" "}
            USD

            {"\n"}

            <Text
              style={styles.bold}
            >
              Incoterm:
            </Text>{" "}
            EXW SFAX
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

                envoyerParEmail();
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

                envoyerParWhatsApp();
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