// ============================================================
// ENV
// ============================================================

require("dotenv").config();


// ============================================================
// IMPORTS
// ============================================================

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");
const { Readable } = require("stream");
const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const dns = require("node:dns");

dns.setDefaultResultOrder("ipv4first");
// ============================================================
// APP
// ============================================================

const app = express();

const PORT = Number(process.env.PORT || 5000);


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());

app.use(
  express.json({
    limit: "15mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "15mb",
  })
);


// ============================================================
// MYSQL
// ============================================================

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "visiteurs_db",

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  charset: "utf8mb4",
});


// ============================================================
// MYSQL DISPONIBLE DANS LES ROUTES
// ============================================================

app.locals.db = pool;


// ============================================================
// VARIABLES WHATSAPP META
// ============================================================

const graphVersion =
  process.env.WHATSAPP_GRAPH_VERSION ||
  process.env.GRAPH_VERSION ||
  "v23.0";

const phoneNumberId =
  process.env.WHATSAPP_PHONE_NUMBER_ID ||
  process.env.PHONE_NUMBER_ID ||
  null;

const accessToken =
  process.env.WHATSAPP_ACCESS_TOKEN ||
  process.env.ACCESS_TOKEN ||
  null;


// ============================================================
// TEST MYSQL
// ============================================================

pool
  .getConnection()
  .then((connection) => {
    console.log("=================================");
    console.log("✅ MYSQL CONNECTÉ");
    console.log("=================================");

    connection.release();
  })
  .catch((error) => {
    console.error(
      "❌ ERREUR MYSQL :",
      error.message
    );
  });


// ============================================================
// ROUTES AUTHENTIFICATION
// ============================================================

const authRoutes = require("./routes/auth");

app.use(
  "/api/auth",
  authRoutes
);


// ============================================================
// ROUTES ADMIN
// ============================================================

const adminRoutes = require("./routes/admin");

app.use(
  "/api/admin",
  adminRoutes
);


// ============================================================
// MIDDLEWARE AUTHENTIFICATION
// ============================================================

const {
  authenticateToken,
  requireAdmin,
  requireCommercial,
  requireUser,
} = require("./middleware/auth");


// ============================================================
// HELPERS
// ============================================================

function cleanString(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const str = String(value).trim();

  return str === "" ? null : str;
}


// ============================================================
// CLEAN JSON
// ============================================================

function cleanJson(value) {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "null"
  ) {
    return null;
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return null;
    }
  }

  if (typeof value === "string") {
    const valueClean =
      value.trim();

    if (
      valueClean === "" ||
      valueClean === "null"
    ) {
      return null;
    }

    try {
      const parsed =
        JSON.parse(valueClean);

      return JSON.stringify(parsed);

    } catch (error) {
      return JSON.stringify(
        valueClean
      );
    }
  }

  return JSON.stringify(value);
}


// ============================================================
// PARSE JSON
// ============================================================

function parseJson(
  value,
  fallback = null
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  if (
    typeof value === "object"
  ) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}


// ============================================================
// NORMALISATION TYPE COMMANDE
// ============================================================

function normalizeTypeCommande(value) {
  const valueClean =
    cleanString(value);

  if (!valueClean) {
    return null;
  }

  const lower =
    valueClean.toLowerCase();

  if (lower === "vrac") {
    return "vrac";
  }

  if (
    lower === "conditionné" ||
    lower === "conditionne"
  ) {
    return "conditionné";
  }

  return valueClean;
}


// ============================================================
// NORMALISATION COMMANDES
// ============================================================

function normalizeCommandes(
  value,
  typeCommandePrincipal
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  let commandes;

  try {
    commandes =
      typeof value === "string"
        ? JSON.parse(value)
        : value;

  } catch (error) {
    throw new Error(
      "Le champ commandes contient un JSON invalide."
    );
  }

  if (!Array.isArray(commandes)) {
    throw new Error(
      "Le champ commandes doit être un tableau."
    );
  }

  if (commandes.length === 0) {
    return [];
  }

  const typePrincipal =
    normalizeTypeCommande(
      typeCommandePrincipal
    );

  for (
    let i = 0;
    i < commandes.length;
    i++
  ) {
    const commande =
      commandes[i] || {};

    const typeCommande =
      normalizeTypeCommande(
        commande.type_commande ??
        commande.typeCommande ??
        typePrincipal
      );

    if (!typeCommande) {
      throw new Error(
        `Le type de la commande ${i + 1} est manquant.`
      );
    }

    if (
      typePrincipal &&
      typeCommande !== typePrincipal
    ) {
      throw new Error(
        `Les commandes ne peuvent pas mélanger Vrac et Conditionné. ` +
        `La commande ${i + 1} est de type "${typeCommande}" ` +
        `alors que le visiteur est de type "${typePrincipal}".`
      );
    }

    commande.type_commande =
      typeCommande;

    commandes[i] =
      commande;
  }

  return commandes;
}


// ============================================================
// REFERENCE
// ============================================================

function generateReference(
  id,
  typeCommande
) {
  const numero =
    Number(id) + 1;

  const type =
    normalizeTypeCommande(
      typeCommande
    );

  const lettre =
    type === "vrac"
      ? "V"
      : "B";

  return `${numero}${lettre}2026`;
}


// ============================================================
// INSERTION COMMANDE
// ============================================================

async function insererCommande(
  connection,
  visiteurId,
  commande,
  numeroCommande
) {
  const typeCommande =
    normalizeTypeCommande(
      commande.type_commande ||
      commande.type
    );

  if (!typeCommande) {
    throw new Error(
      "Le type de commande est obligatoire."
    );
  }

  const numero =
    Number(numeroCommande) || 1;


  // ==========================================================
  // INSERT
  // ==========================================================

  await connection.execute(
    `
      INSERT INTO commandes (
        visiteur_id,
        numero_commande,
        type_commande,
  
        categorie,
        qualite_grade,
        volume_estime,
        destination,
        destinationport,
        incoterm,
        format_livraison,
        frequence_commande,
        exigences_specifiques,
        informations_complementaires,
  
        pays_conditionne,
        periode_volume,
        nombre_fcl,
        nom_label,
        canal_distribution,
        volumes_estimes,
  
        type_emballage,
        formats_souhaites,
        emballages_selectionnes,
        formats_emballage,
        autre_emballage,
        autres_selectionnes,
        autres_emballages,
  
        type_marque,
        certifications_requises,
        profil_aromatique,
  
        nom_entreprise,
        site_web,
        contact_professionnel,
  
        quantite_commande,
        nombre_palettes,
  
        marche_cible,
        quantite_prevue,
  
        nouvelle_marque_emballages,
        nouvelle_marque_formats,
        nouvelle_marque_autre_emballage,
  
        k232_demande,
        k232_valeur,
        k270_demande,
        k270_valeur
      )
  
      VALUES (
        ?, ?, ?,
  
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
  
        ?, ?, ?, ?, ?, ?,
  
        ?, ?, ?, ?, ?, ?, ?,
  
        ?, ?, ?,
  
        ?, ?, ?,
  
        ?, ?,
  
        ?, ?,
  
        ?, ?, ?,
  
        ?, ?, ?, ?
      )
    `,
    [
      visiteurId,
      numero,
      typeCommande,
  
      commande.categorie || null,
      commande.qualite_grade || null,
      commande.volume_estime ?? null,
      commande.destination || null,
      commande.destinationport?.trim() || null,
      commande.incoterm || null,
      commande.format_livraison || null,
      commande.frequence_commande || null,
  
      commande.exigences_specifiques
        ? Array.isArray(commande.exigences_specifiques)
          ? JSON.stringify(commande.exigences_specifiques)
          : commande.exigences_specifiques
        : null,
  
      commande.informations_complementaires || null,
  
      // =========================
      // CONDITIONNÉ
      // =========================
  
      commande.pays_conditionne || null,
      commande.periode_volume ?? commande.periodeVolume ?? null,
      commande.nombre_fcl ?? commande.nombreFcl ?? null,
      commande.nom_label ?? commande.nomLabel ?? null,
      commande.canal_distribution || commande.canal || null,
      commande.volumes_estimes ?? commande.volumes_conditionne ?? null,
  
      commande.type_emballage
        ? JSON.stringify(commande.type_emballage)
        : null,
  
      commande.formats_souhaites
        ? JSON.stringify(commande.formats_souhaites)
        : null,
  
      commande.type_emballage?.emballages
        ? JSON.stringify(commande.type_emballage.emballages)
        : null,
  
      commande.packaging
        ? JSON.stringify(commande.packaging)
        : null,
  
      commande.type_emballage?.autres?.Autre || null,
  
      commande.type_emballage?.autres
        ? JSON.stringify(commande.type_emballage.autres)
        : null,
  
      commande.type_emballage?.autres
        ? JSON.stringify(commande.type_emballage.autres)
        : null,
  
      commande.type_marque || null,
  
      commande.certifications_requises
        ? Array.isArray(commande.certifications_requises)
          ? JSON.stringify(commande.certifications_requises)
          : commande.certifications_requises
        : null,
  
      commande.profil_aromatique
        ? JSON.stringify(commande.profil_aromatique)
        : null,
  
      commande.nom_entreprise || null,
      commande.site_web || null,
      commande.contact_professionnel || null,
  
      commande.type_conteneur ||
        commande.quantite_commande ||
        null,
  
      commande.nombre_palettes ?? null,
  
      commande.marche_cible || null,
      commande.quantite_prevue || null,
  
      commande.nouvelle_marque_formats?.emballages
        ? JSON.stringify(commande.nouvelle_marque_formats.emballages)
        : null,
  
      commande.nouvelle_marque_formats?.formats
        ? JSON.stringify(commande.nouvelle_marque_formats.formats)
        : null,
  
      commande.nouvelle_marque_formats?.autre || null,
  
      // =========================
      // K232 / K270
      // =========================
  
      commande.k232_demande ? 1 : 0,
  
      commande.k232_demande
        ? commande.k232_valeur || null
        : null,
  
      commande.k270_demande ? 1 : 0,
  
      commande.k270_demande
        ? commande.k270_valeur || null
        : null,
    ]
  );
}
// ============================================================
// GET VISITEUR
// ============================================================

async function getVisitorById(id) {
  const visitorId =
    Number(id);

  if (
    !Number.isInteger(visitorId) ||
    visitorId <= 0
  ) {
    throw new Error(
      "Identifiant visiteur invalide."
    );
  }

  const [rows] =
    await pool.query(
      `
        SELECT *
        FROM visiteurs
        WHERE id = ?
        LIMIT 1
      `,
      [visitorId]
    );

  if (!rows.length) {
    throw new Error(
      "Visiteur introuvable."
    );
  }

  return rows[0];
}


// ============================================================
// GET COMMANDES VISITEUR
// ============================================================

async function getCommandesByVisitorId(
  visitorId
) {
  const id =
    Number(visitorId);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      "Identifiant du visiteur invalide."
    );
  }

  const [rows] =
    await pool.execute(
      `
        SELECT *
        FROM commandes
        WHERE visiteur_id = ?
        ORDER BY
          numero_commande ASC,
          id ASC
      `,
      [id]
    );

  return rows;
}



// ============================================================
// PDF - PUPPETEER
// ============================================================

async function generatePdfFromHtml(htmlContent) {
  let browser = null;

  try {
    // ==========================================
    // 1. VÉRIFIER LE CONTENU HTML
    // ==========================================
    if (
      typeof htmlContent !== "string" ||
      !htmlContent.trim()
    ) {
      throw new Error(
        "Contenu HTML du PDF manquant ou vide."
      );
    }

    console.log("========================================");
    console.log("PDF : démarrage de la génération");
    console.log("PDF : longueur HTML =", htmlContent.length);
    console.log("========================================");

    // ==========================================
    // 2. LANCER CHROMIUM
    // ==========================================
    console.log("PDF : lancement de Chromium...");

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      timeout: 30000,
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: 1280,
      height: 1800,
      deviceScaleFactor: 1,
    });

    page.setDefaultNavigationTimeout(20000);
    page.setDefaultTimeout(20000);

    // ==========================================
    // 3. JOURNALISER LES ERREURS DE PAGE
    // ==========================================
    page.on("pageerror", (error) => {
      console.error(
        "PDF : erreur JavaScript dans la page :",
        error.message
      );
    });

    page.on("requestfailed", (request) => {
      console.warn(
        "PDF : ressource inaccessible :",
        request.url(),
        request.failure()?.errorText || "Erreur inconnue"
      );
    });

    // ==========================================
    // 4. CHARGER LE HTML
    // ==========================================
    console.log("PDF : chargement HTML, délai maximal 20 s...");

    await page.setContent(htmlContent, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });

    console.log("PDF : HTML chargé.");

    // ==========================================
    // 5. ATTENDRE LES POLICES (MAXIMUM 5 S)
    // ==========================================
    console.log("PDF : attente des polices...");

    await Promise.race([
      page.evaluate(async () => {
        if (document.fonts) {
          await document.fonts.ready;
        }
      }),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);

    console.log("PDF : préparation terminée.");

    // ==========================================
    // 6. GÉNÉRER LE PDF
    // ==========================================
    console.log("PDF : génération du fichier A4...");

    const pdfData = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
      timeout: 30000,
    });

    if (!pdfData || pdfData.length === 0) {
      throw new Error(
        "Puppeteer a généré un PDF vide."
      );
    }

    console.log(
      "PDF : génération réussie, taille =",
      pdfData.length,
      "octets"
    );

    return Buffer.from(pdfData);

  } catch (error) {
    console.error(
      "========================================"
    );
    console.error("PDF : ÉCHEC DE GÉNÉRATION");
    console.error("PDF : message =", error.message);
    console.error(error.stack || error);
    console.error(
      "========================================"
    );

    throw error;

  } finally {
    // ==========================================
    // 7. FERMER CHROMIUM
    // ==========================================
    if (browser) {
      try {
        await browser.close();
        console.log("PDF : Chromium fermé.");
      } catch (closeError) {
        console.error(
          "PDF : erreur fermeture Chromium :",
          closeError.message
        );
      }
    }
  }
}

// ============================================================
// EMAIL TRANSPORTER
// ============================================================

function createEmailTransporter() {
  const smtpUser =
    process.env.SMTP_USER;

  const smtpPass =
    process.env.SMTP_PASSWORD;

  if (!smtpUser) {
    throw new Error(
      "SMTP_USER est manquant dans .env"
    );
  }

  if (!smtpPass) {
    throw new Error(
      "SMTP_PASSWORD est manquant dans .env"
    );
  }

 
return nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: Number(process.env.SMTP_PORT || 465),
  secure: Number(process.env.SMTP_PORT || 465) === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});
}


// ============================================================
// ROOT
// ============================================================

app.get(
  "/",
  (req, res) => {
    res.json({
      success: true,
      message:
        "OLIVED API fonctionne correctement.",
    });
  }
);


// ============================================================
// TEST AUTH
// ============================================================

app.get(
  "/api/test-auth",
  (req, res) => {
    res.json({
      success: true,
      message:
        "Serveur et routes principales fonctionnent.",
    });
  }
);


// ============================================================
// TEST DB
// ============================================================

app.get(
  "/api/test-db",
  async (req, res) => {
    try {
      const [rows] =
        await pool.query(
          "SELECT 1 AS test"
        );

      res.json({
        success: true,
        message:
          "Connexion MySQL réussie.",
        data: rows,
      });

    } catch (error) {

      console.error(
        "❌ TEST DB :",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Erreur de connexion à MySQL.",
        error:
          error.message,
      });
    }
  }
);


// ============================================================
// CRÉER DEMANDE VALIDATION PDF
// ============================================================

app.post(
  "/api/validation/create",
  async (req, res) => {
    try {

      const {
        visitorId,
        reference,
        channel,
        pdfHtml,
      } = req.body;

      console.log(
        "======================================="
      );

      console.log(
        "CRÉATION VALIDATION PDF"
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
        "Channel :",
        channel
      );

      console.log(
        "PDF HTML :",
        pdfHtml?.length
      );

      console.log(
        "======================================="
      );


      if (!visitorId) {
        return res.status(400).json({
          success: false,
          message:
            "Identifiant visiteur manquant.",
        });
      }

      if (!reference) {
        return res.status(400).json({
          success: false,
          message:
            "Référence manquante.",
        });
      }

      if (
        channel !== "whatsapp" &&
        channel !== "email"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Canal d'envoi invalide.",
        });
      }

      if (
        !pdfHtml ||
        typeof pdfHtml !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "HTML du PDF manquant.",
        });
      }


      const [visiteurs] =
        await pool.query(
          `
            SELECT *
            FROM visiteurs
            WHERE id = ?
            LIMIT 1
          `,
          [visitorId]
        );


      if (!visiteurs.length) {
        return res.status(404).json({
          success: false,
          message:
            "Visiteur introuvable.",
        });
      }


      const visiteur =
        visiteurs[0];


      const token =
        crypto
          .randomBytes(32)
          .toString("hex");


      const expiresAt =
        new Date(
          Date.now() +
          48 * 60 * 60 * 1000
        );


      await pool.query(
        `
          INSERT INTO pdf_validations
          (
            token,
            visitor_id,
            reference,
            channel,
            pdf_html,
            status,
            expires_at
          )
          VALUES (
            ?, ?, ?, ?, ?,
            'pending',
            ?
          )
        `,
        [
          token,
          visitorId,
          reference,
          channel,
          pdfHtml,
          expiresAt,
        ]
      );


      const appPublicUrl =
        process.env.APP_PUBLIC_URL;


      if (!appPublicUrl) {
        throw new Error(
          "APP_PUBLIC_URL est manquant dans .env"
        );
      }


      const validationUrl =
        `${appPublicUrl}/validation/${token}`;


      console.log(
        "======================================="
      );

      console.log(
        "VALIDATION CRÉÉE"
      );

      console.log(
        "Token :",
        token
      );

      console.log(
        "URL :",
        validationUrl
      );

      console.log(
        "Visiteur :",
        visiteur.nom,
        visiteur.prenom
      );

      console.log(
        "Canal :",
        channel
      );

      console.log(
        "======================================="
      );


      return res.json({
        success: true,
        message:
          "Lien de validation créé.",
        validationUrl,
        token,
        reference,
        channel,
      });

    } catch (error) {

      console.error(
        "======================================="
      );

      console.error(
        "ERREUR CREATE VALIDATION :",
        error
      );

      console.error(
        "======================================="
      );


      return res.status(500).json({
        success: false,
        message:
          "Erreur lors de la création du lien de validation.",
        error:
          error.message,
      });
    }
  }
);


// ============================================================
// PAGE VALIDATION PDF
// ============================================================


// ============================================================
// FONCTION : ÉCHAPPER LES CARACTÈRES HTML
// ============================================================

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}


// ============================================================
// PAGE DE VALIDATION DE LA FICHE OLIVED
// IMPORTANT : AUCUN APPEL À PUPPETEER DANS CETTE ROUTE
// ============================================================

app.get("/validation/:token", async (req, res) => {
  try {
    const { token } = req.params;

    console.log("=======================================");
    console.log("OUVERTURE LIEN VALIDATION");
    console.log("=======================================");

    // 1. Vérifier le format du token
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Lien invalide - OLIVED</title>
        </head>
        <body style="font-family:Arial,sans-serif;text-align:center;padding:40px">
          <h1>Lien invalide</h1>
          <p>Le lien de validation est invalide.</p>
        </body>
        </html>
      `);
    }

    // 2. Récupérer la demande de validation
    const [rows] = await pool.query(
      `
        SELECT
          id,
          visitor_id,
          reference,
          channel,
          pdf_html,
          status,
          expires_at
        FROM pdf_validations
        WHERE token = ?
        LIMIT 1
      `,
      [token]
    );

    // 3. Vérifier que la demande existe
    if (!rows.length) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Lien introuvable - OLIVED</title>
        </head>
        <body style="font-family:Arial,sans-serif;text-align:center;padding:40px">
          <h1>Lien introuvable</h1>
          <p>Cette demande de validation n'existe pas ou n'est plus disponible.</p>
        </body>
        </html>
      `);
    }

    const validation = rows[0];

    console.log("[VALIDATION] ID :", validation.id);
    console.log("[VALIDATION] Référence :", validation.reference);
    console.log("[VALIDATION] Statut :", validation.status);
    console.log("[VALIDATION] Canal :", validation.channel);

    // 4. Vérifier l'expiration du lien
    if (
      validation.expires_at &&
      new Date(validation.expires_at).getTime() < Date.now()
    ) {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Lien expiré - OLIVED</title>
        </head>
        <body style="font-family:Arial,sans-serif;text-align:center;padding:40px">
          <h1>Lien expiré</h1>
          <p>Ce lien de validation a expiré.</p>
          <p>Veuillez demander un nouveau lien.</p>
        </body>
        </html>
      `);
    }

    // 5. Vérifier le statut de la demande
    const statutsAutorises = ["pending", "validated", "rejected"];

    if (!statutsAutorises.includes(validation.status)) {
      console.error(
        "[VALIDATION] Statut inattendu :",
        validation.status
      );

      return res.status(500).send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Erreur de validation - OLIVED</title>
        </head>
        <body style="font-family:Arial,sans-serif;text-align:center;padding:40px">
          <h1>Erreur de validation</h1>
          <p>Le statut de cette demande est invalide.</p>
        </body>
        </html>
      `);
    }

    // 6. Vérifier la présence du HTML de la fiche
    if (
      !validation.pdf_html ||
      typeof validation.pdf_html !== "string"
    ) {
      console.error(
        "[VALIDATION] HTML absent pour la demande :",
        validation.id
      );

      return res.status(500).send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Fiche indisponible - OLIVED</title>
        </head>
        <body style="font-family:Arial,sans-serif;text-align:center;padding:40px">
          <h1>Fiche indisponible</h1>
          <p>Le contenu de cette fiche est introuvable.</p>
          <p>Veuillez contacter l'équipe OLIVED.</p>
        </body>
        </html>
      `);
    }

    // 7. Préparer les données affichées
    const htmlBase64 = Buffer
      .from(validation.pdf_html, "utf8")
      .toString("base64");

    const reference = escapeHtml(
      validation.reference || "Non renseignée"
    );

    const isPending = validation.status === "pending";

    const statusLabel =
      validation.status === "validated"
        ? "VALIDÉE"
        : validation.status === "rejected"
          ? "REFUSÉE"
          : "EN ATTENTE";

    // 8. En-têtes HTTP
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("X-Content-Type-Options", "nosniff");

    console.log(
      "[VALIDATION] Fiche affichée sans génération PDF :",
      validation.reference || "Non renseignée",
      "| Canal :",
      validation.channel
    );

    // 9. Afficher la page de validation
    return res.send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>Validation OLIVED - ${reference}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            width: 100%;
            min-height: 100%;
          }

          body {
            font-family: Arial, Helvetica, sans-serif;
            background: #eeeeee;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }

          .header {
            background: #ffffff;
            padding: 18px 25px;
            border-bottom: 1px solid #dddddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
          }

          .title {
            font-size: 20px;
            font-weight: 700;
            color: #222222;
          }

          .reference {
            font-size: 14px;
            color: #666666;
            overflow-wrap: anywhere;
          }

          .pdf-container {
            flex: 1;
            padding: 20px;
            display: flex;
            justify-content: center;
            min-height: 0;
          }

          .pdf-frame {
            width: 100%;
            max-width: 1200px;
            height: calc(100vh - 150px);
            min-height: 600px;
            border: none;
            background: #ffffff;
            box-shadow: 0 2px 15px rgba(0, 0, 0, 0.15);
            border-radius: 6px;
          }

          .actions {
            background: #ffffff;
            padding: 18px 25px;
            border-top: 1px solid #dddddd;
            display: flex;
            justify-content: center;
            gap: 20px;
            position: sticky;
            bottom: 0;
            z-index: 100;
          }

          button {
            border: none;
            padding: 14px 45px;
            border-radius: 7px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            min-width: 180px;
          }

          button:disabled {
            opacity: 0.6;
            cursor: wait;
          }

          .validate {
            background: #198754;
            color: #ffffff;
          }

          .validate:hover {
            background: #157347;
          }

          .reject {
            background: #dc3545;
            color: #ffffff;
          }

          .reject:hover {
            background: #bb2d3b;
          }

          .status {
            text-align: center;
            padding: 15px;
            font-weight: 700;
            background: #fff3cd;
            color: #856404;
          }

          .error-message {
            color: #842029;
            background: #f8d7da;
            padding: 12px;
            border-radius: 6px;
            margin: 12px 0;
            text-align: center;
          }

          @media (max-width: 700px) {
            .header {
              padding: 15px;
            }

            .title {
              font-size: 18px;
            }

            .pdf-container {
              padding: 5px;
            }

            .pdf-frame {
              height: calc(100vh - 220px);
              min-height: 450px;
            }

            .actions {
              flex-direction: column;
              padding: 12px;
              gap: 10px;
            }

            button {
              width: 100%;
            }
          }
        </style>
      </head>

      <body>
        <header class="header">
          <div class="title">
            OLIVED - Validation de la fiche
          </div>

          <div class="reference">
            Référence :
            <strong>${reference}</strong>
          </div>
        </header>

        ${
          !isPending
            ? `
              <div class="status">
                Cette demande a déjà été traitée : ${statusLabel}.
              </div>
            `
            : ""
        }

        <main class="pdf-container">
          <iframe
            class="pdf-frame"
            src="data:text/html;charset=utf-8;base64,${htmlBase64}"
            title="Fiche OLIVED à consulter"
            sandbox="allow-same-origin"
          ></iframe>
        </main>

        ${
          isPending
            ? `
              <footer class="actions">
                <button
                  id="btnValider"
                  class="validate"
                  type="button"
                  onclick="valider()"
                >
                  ✓ VALIDER
                </button>

                <button
                  id="btnRefuser"
                  class="reject"
                  type="button"
                  onclick="refuser()"
                >
                  ✕ REFUSER
                </button>
              </footer>
            `
            : ""
        }

        <script>
          let traitementEnCours = false;

          async function envoyerDecision(action) {
            if (traitementEnCours) return;

            const confirmation =
              action === "validate"
                ? "Voulez-vous VALIDER cette fiche ?"
                : "Voulez-vous REFUSER cette fiche ?";

            if (!window.confirm(confirmation)) return;

            traitementEnCours = true;

            const btnValider = document.getElementById("btnValider");
            const btnRefuser = document.getElementById("btnRefuser");

            if (btnValider) btnValider.disabled = true;
            if (btnRefuser) btnRefuser.disabled = true;

            try {
              const response = await fetch(
                "/api/validation/${token}/" + action,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  }
                }
              );

              let data;

              try {
                data = await response.json();
              } catch {
                throw new Error(
                  "Le serveur a retourné une réponse invalide."
                );
              }

              console.log("RÉPONSE SERVEUR :", data);

              if (!response.ok || !data.success) {
                window.alert(
                  data.message ||
                  "Impossible de traiter cette demande."
                );

                traitementEnCours = false;

                if (btnValider) btnValider.disabled = false;
                if (btnRefuser) btnRefuser.disabled = false;

                return;
              }

              if (
                action === "validate" &&
                data.whatsappUrl
              ) {
                window.location.href = data.whatsappUrl;
                return;
              }

              if (
                action === "validate" &&
                data.notificationError
              ) {
                window.alert(
                  "La fiche est validée, mais la notification a échoué : " +
                  data.notificationError
                );
              } else if (action === "validate") {
                window.alert(
                  data.notificationStatus === "processing"
                    ? "Fiche validée. L'envoi de l'e-mail est en cours."
                    : "Fiche validée avec succès."
                );
              } else {
                window.alert("La fiche a été refusée.");
              }

              window.location.reload();

            } catch (error) {
              console.error("ERREUR DÉCISION :", error);

              window.alert(
                error.message ||
                "Erreur de connexion au serveur. Consultez les logs Render."
              );

              traitementEnCours = false;

              if (btnValider) btnValider.disabled = false;
              if (btnRefuser) btnRefuser.disabled = false;
            }
          }

          function valider() {
            return envoyerDecision("validate");
          }

          function refuser() {
            return envoyerDecision("reject");
          }
        </script>
      </body>
      </html>
    `);

  } catch (error) {
    console.error(
      "ERREUR PAGE VALIDATION :",
      error.stack || error.message
    );

    if (!res.headersSent) {
      return res.status(500).send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Erreur serveur - OLIVED</title>
        </head>
        <body style="font-family:Arial,sans-serif;text-align:center;padding:40px">
          <h1>Erreur serveur</h1>
          <p>Impossible d'afficher la fiche.</p>
          <p>Veuillez réessayer plus tard.</p>
        </body>
        </html>
      `);
    }
  }
});

// ============================================================
// VALIDER PDF
// ============================================================

// ============================================================
// VALIDER UNE FICHE OLIVED
// ============================================================

app.post("/api/validation/:token/validate", async (req, res) => {
  let validation;

  try {
    console.log("[VALIDATION] Début");

    const { token } = req.params;

    // 1. Vérifier le token
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        success: false,
        message: "Token de validation invalide.",
      });
    }

    // 2. Récupérer la demande
    const [rows] = await pool.query(
      `
        SELECT
          id,
          visitor_id,
          reference,
          channel,
          status,
          expires_at
        FROM pdf_validations
        WHERE token = ?
        LIMIT 1
      `,
      [token]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Demande de validation introuvable.",
      });
    }

    validation = rows[0];

    if (validation.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: "Cette fiche a déjà été traitée.",
        status: validation.status,
      });
    }

    if (
      validation.expires_at &&
      new Date(validation.expires_at).getTime() < Date.now()
    ) {
      return res.status(410).json({
        success: false,
        message: "Le lien de validation a expiré.",
      });
    }

    if (!["email", "whatsapp"].includes(validation.channel)) {
      return res.status(400).json({
        success: false,
        message: "Canal de notification invalide.",
      });
    }

    console.log(
      "[VALIDATION] Demande trouvée :",
      validation.reference,
      "| Canal :",
      validation.channel
    );

    // 3. Récupérer le visiteur
    const visiteur = await getVisitorById(validation.visitor_id);

    if (!visiteur) {
      return res.status(404).json({
        success: false,
        message: "Visiteur introuvable.",
      });
    }

    const nomComplet =
      `${visiteur.prenom || ""} ${visiteur.nom || ""}`.trim();

    // 4. Enregistrer la décision avant toute notification.
    // L'UPDATE conditionnel évite deux validations simultanées.
    const [updateResult] = await pool.query(
      `
        UPDATE pdf_validations
        SET
          status = 'validated',
          validated_at = NOW()
        WHERE id = ?
          AND status = 'pending'
          AND (expires_at IS NULL OR expires_at >= NOW())
      `,
      [validation.id]
    );

    if (updateResult.affectedRows !== 1) {
      const [currentRows] = await pool.query(
        `
          SELECT status, expires_at
          FROM pdf_validations
          WHERE id = ?
          LIMIT 1
        `,
        [validation.id]
      );

      const current = currentRows[0];

      if (
        current?.expires_at &&
        new Date(current.expires_at).getTime() < Date.now()
      ) {
        return res.status(410).json({
          success: false,
          message: "Le lien de validation a expiré.",
        });
      }

      return res.status(409).json({
        success: false,
        message: "Cette fiche a déjà été traitée.",
        status: current?.status || "inconnu",
      });
    }

    console.log(
      "[VALIDATION] Décision enregistrée :",
      validation.reference
    );

    // 5. Préparer les informations de notification
    const message =
      `Dear ${nomComplet || "Customer"},\n\n` +
      `Please find the OLIVED offer for your review.\n\n` +
      `Reference: ${validation.reference}\n\n` +
      `Best regards,\nOLIVED`;

    let whatsappUrl = null;

    if (validation.channel === "whatsapp") {
      const telephone =
        visiteur.telephone ||
        visiteur.phone ||
        visiteur.whatsapp;

      if (!telephone) {
        return res.json({
          success: true,
          status: "validated",
          reference: validation.reference,
          channel: "whatsapp",
          notificationSent: false,
          notificationError:
            "Fiche validée, mais le numéro WhatsApp du visiteur est manquant.",
          whatsappUrl: null,
          message:
            "La fiche est validée, mais aucun numéro WhatsApp n'est disponible.",
        });
      }

      let phone = String(telephone).replace(/\D/g, "");

      if (phone.startsWith("00")) {
        phone = phone.substring(2);
      }

      // Numéro tunisien local à 8 chiffres
      if (/^[234579]\d{7}$/.test(phone)) {
        phone = "216" + phone;
      }

      // Vérification minimale du numéro international
      if (phone.length < 8 || phone.length > 15) {
        return res.json({
          success: true,
          status: "validated",
          reference: validation.reference,
          channel: "whatsapp",
          notificationSent: false,
          notificationError: "Le numéro WhatsApp semble invalide.",
          whatsappUrl: null,
          message: "Fiche validée, mais le numéro WhatsApp est invalide.",
        });
      }

      whatsappUrl =
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

      console.log(
        "[VALIDATION] Lien WhatsApp préparé :",
        validation.reference
      );

      // WhatsApp n'envoie pas automatiquement le message ni le PDF.
      return res.json({
        success: true,
        message:
          "Fiche validée. Ouvrez WhatsApp pour poursuivre l'envoi.",
        status: "validated",
        reference: validation.reference,
        channel: "whatsapp",
        notificationSent: false,
        notificationError: null,
        whatsappUrl,
      });
    }

    // 6. Répondre immédiatement pour éviter que Puppeteer ou SMTP
    // ne bloque la requête HTTP jusqu'à un 502.
    res.status(200).json({
      success: true,
      message:
        "Fiche validée. L'envoi de l'e-mail est en cours.",
      status: "validated",
      reference: validation.reference,
      channel: "email",
      notificationSent: false,
      notificationStatus: "processing",
      notificationError: null,
      whatsappUrl: null,
    });

    // 7. Générer le PDF et envoyer l'e-mail en arrière-plan.
    // Les erreurs sont consignées dans les logs Render.
    void (async () => {
      try {
        console.log(
          "[EMAIL] Début du traitement :",
          validation.reference
        );

        if (!visiteur.email) {
          throw new Error(
            "L'adresse e-mail du visiteur est manquante."
          );
        }

        const [htmlRows] = await pool.query(
          `
            SELECT pdf_html
            FROM pdf_validations
            WHERE id = ?
            LIMIT 1
          `,
          [validation.id]
        );

        if (!htmlRows.length || !htmlRows[0].pdf_html) {
          throw new Error(
            "Le contenu HTML de la fiche est introuvable."
          );
        }

        console.log(
          "[EMAIL] Génération du PDF :",
          validation.reference
        );

        const pdfBuffer = await generatePdfFromHtml(
          htmlRows[0].pdf_html
        );

        if (!pdfBuffer || !pdfBuffer.length) {
          throw new Error("Le PDF généré est vide.");
        }

        console.log(
          "[EMAIL] PDF généré, envoi en cours :",
          validation.reference
        );

        const transporter = createEmailTransporter();

        const info = await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.SMTP_USER,
          to: visiteur.email,
          subject:
            `Official Price Offer OLIVED - ${validation.reference}`,
          text:
            `Dear ${nomComplet || "Customer"},\n\n` +
            `Please find attached our quotation for the requested olive oil products.\n\n` +
            `Reference: ${validation.reference}\n\n` +
            `Best regards,\nOLIVED`,
          attachments: [
            {
              filename: `OLIVED_${validation.reference}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });

        console.log(
          "[EMAIL] E-mail envoyé :",
          validation.reference,
          "| Message ID :",
          info.messageId
        );
      } catch (emailError) {
        console.error(
          "[EMAIL] ÉCHEC pour",
          validation?.reference,
          ":",
          emailError.stack || emailError.message
        );
      }
    })();
  } catch (error) {
    console.error(
      "[VALIDATION] ERREUR :",
      error.stack || error.message
    );

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la validation de la fiche.",
        error: error.message,
      });
    }
  }
});

// ============================================================
// REFUSER PDF
// ============================================================

app.post(
  "/api/validation/:token/reject",
  async (req, res) => {

    try {

      const { token } =
        req.params;


      const [rows] =
        await pool.query(
          `
            SELECT *
            FROM pdf_validations
            WHERE token = ?
            LIMIT 1
          `,
          [token]
        );


      if (!rows.length) {

        return res.status(404).json({
          success: false,
          message:
            "Demande de validation introuvable.",
        });
      }


      const validation =
        rows[0];


      if (
        validation.status !==
        "pending"
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Cette fiche a déjà été traitée.",
        });
      }


      if (
        validation.expires_at &&
        new Date(
          validation.expires_at
        ) < new Date()
      ) {

        return res.status(410).json({
          success: false,
          message:
            "Le lien de validation a expiré.",
        });
      }


      await pool.query(
        `
          UPDATE pdf_validations
          SET
            status = 'rejected',
            validated_at = NOW()
          WHERE token = ?
        `,
        [token]
      );


      console.log(
        "FICHE REFUSÉE"
      );


      return res.json({
        success: true,
        message:
          "La fiche a été refusée.",
        reference:
          validation.reference,
      });

    } catch (error) {

      console.error(
        "ERREUR REFUS PDF :",
        error
      );


      return res.status(500).json({
        success: false,
        message:
          "Erreur lors du refus de la fiche.",
        error:
          error.message,
      });
    }
  }
);


// ============================================================
// POST VISITEUR + COMMANDES
// ============================================================

app.post(
  "/api/visiteurs",
  authenticateToken,
  async (req, res) => {

    let connection = null;

    try {

      // ========================================================
      // DONNÉES VISITEUR
      // ========================================================

      const {
        nom,
        prenom,
        email,
        site,
        origine,
        indicatif,
        telephone,
        societe,
        adresse_societe,
        fonction,
        genre,
        langue_communication,
        profile,
        type_commande,
        qualification,
        commandes,
        nombre_commandes,

        // ======================================================
        // ÉCHANTILLON
        // Ces champs appartiennent maintenant à VISITEURS
        // ======================================================
        demande_echantillon,
        adresse_echantillon,
        personne_reception_echantillon,
        tel_reception_echantillon,

      } = req.body;


      // ========================================================
      // COMMERCIAL
      // ========================================================

      const commercialId = req.user.id;


      console.log(
        "======================================="
      );

      console.log(
        "📥 POST /api/visiteurs"
      );

      console.log(
        "COMMERCIAL ID :",
        commercialId
      );

      console.log(
        "NOMBRE COMMANDES :",
        Array.isArray(commandes)
          ? commandes.length
          : 0
      );

      console.log(
        "ÉCHANTILLON :",
        demande_echantillon
      );

      console.log(
        "ADRESSE ÉCHANTILLON :",
        adresse_echantillon
      );

      console.log(
        "PERSONNE RÉCEPTION :",
        personne_reception_echantillon
      );

      console.log(
        "TÉLÉPHONE RÉCEPTION :",
        tel_reception_echantillon
      );

      console.log(
        "COMMANDES :",
        JSON.stringify(
          commandes,
          null,
          2
        )
      );

      console.log(
        "======================================="
      );


      // ========================================================
      // VALIDATION QUALIFICATION
      // ========================================================

      if (
        qualification !== undefined &&
        qualification !== null &&
        qualification !== ""
      ) {

        const q = Number(
          qualification
        );

        if (
          !Number.isInteger(q) ||
          q < 1 ||
          q > 5
        ) {

          return res.status(400).json({
            success: false,
            message:
              "La qualification doit être comprise entre 1 et 5.",
          });
        }
      }


      // ========================================================
      // NORMALISER COMMANDES
      // ========================================================

      let normalizedCommandes = commandes;

      if (
        commandes !== undefined
      ) {

        try {

          normalizedCommandes =
            normalizeCommandes(
              commandes,
              type_commande
            );

        } catch (error) {

          return res.status(400).json({
            success: false,
            message:
              error.message,
          });
        }
      }


      // ========================================================
      // CONNEXION
      // ========================================================

      connection =
        await pool.getConnection();

      await connection.beginTransaction();


      // ========================================================
      // INSERT VISITEUR
      // ========================================================

      const [result] = await connection.execute(
        `
        INSERT INTO visiteurs (
          nom,
          prenom,
          email,
          site,
          origine,
          indicatif,
          telephone,
          societe,
          adresse_societe,
          fonction,
          genre,
          langue_communication,
          profile,
          type_commande,
          qualification,
          commercial_id,
      
          demande_echantillon,
          adresse_echantillon,
          personne_reception_echantillon,
          tel_reception_echantillon
        )
      
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )
        `,
        [
          nom || null,
          prenom || null,
          email || null,
          site || null,
          origine || null,
          indicatif || null,
          telephone || null,
          societe || null,
          adresse_societe || null,
          fonction || null,
          genre || null,
          langue_communication || null,
          profile || null,
          type_commande || null,
          qualification || null,
          commercialId,
      
          // ==================================================
          // ÉCHANTILLON
          // ==================================================
      
          demande_echantillon === "oui"
            ? "oui"
            : "non",
      
          demande_echantillon === "oui"
            ? adresse_echantillon?.trim() || null
            : null,
      
          demande_echantillon === "oui"
            ? personne_reception_echantillon?.trim() || null
            : null,
      
          demande_echantillon === "oui"
            ? tel_reception_echantillon?.trim() || null
            : null,
        ]
      );
      
      const visiteurId = result.insertId;
      
      console.log(
        "✅ VISITEUR CRÉÉ ID :",
        visiteurId
      );


      // ========================================================
      // INSERT COMMANDES
      // ========================================================

      if (
        Array.isArray(
          normalizedCommandes
        ) &&
        normalizedCommandes.length > 0
      ) {

        for (
          let index = 0;
          index <
          normalizedCommandes.length;
          index++
        ) {

          const commande =
            normalizedCommandes[index];


          console.log(
            `📦 INSERTION COMMANDE ${index + 1}`
          );


          await insererCommande(
            connection,
            visiteurId,
            commande,
            index + 1
          );
        }

      } else {

        console.log(
          "⚠️ AUCUNE COMMANDE À INSÉRER"
        );
      }


      // ========================================================
      // REFERENCE
      // ========================================================

      if (
        type_commande
      ) {

        const reference =
          generateReference(
            visiteurId,
            type_commande
          );


        await connection.execute(
          `
          UPDATE visiteurs
          SET reference = ?
          WHERE id = ?
          `,
          [
            reference,
            visiteurId,
          ]
        );
      }


      // ========================================================
      // COMMIT
      // ========================================================

      await connection.commit();


      console.log(
        "======================================="
      );

      console.log(
        "✅ VISITEUR + COMMANDES ENREGISTRÉS"
      );

      console.log(
        "VISITEUR ID :",
        visiteurId
      );

      console.log(
        "COMMANDES :",
        Array.isArray(
          normalizedCommandes
        )
          ? normalizedCommandes.length
          : 0
      );

      console.log(
        "======================================="
      );


      return res.status(200).json({
        success: true,
        message:
          "Visiteur ajouté",
        id:
          visiteurId,
        visitor_id:
          visiteurId,
        commercial_id:
          commercialId,
        nombre_commandes:
          Array.isArray(
            normalizedCommandes
          )
            ? normalizedCommandes.length
            : 0,
      });


    } catch (error) {

      // ========================================================
      // ROLLBACK
      // ========================================================

      if (connection) {

        try {

          await connection.rollback();

        } catch (rollbackError) {

          console.error(
            "❌ ERREUR ROLLBACK :",
            rollbackError
          );
        }
      }


      console.error(
        "======================================="
      );

      console.error(
        "❌ ERREUR POST VISITEUR"
      );

      console.error(
        "MESSAGE :",
        error.message
      );

      console.error(
        "STACK :",
        error.stack
      );

      console.error(
        "======================================="
      );


      return res.status(500).json({
        success: false,
        message:
          "Erreur lors de l'enregistrement du visiteur.",
        error:
          error.message,
      });

    } finally {

      if (connection) {
        connection.release();
      }
    }
  }
);


// ============================================================
// GET TOUS LES VISITEURS
// ============================================================

app.get(
  "/api/visiteurs",
  authenticateToken,
  requireUser,
  async (req, res) => {

    try {

      let visiteurs;


      if (
        req.user.role === "admin"
      ) {

        [visiteurs] =
          await pool.query(
            `
              SELECT *
              FROM visiteurs
              ORDER BY id DESC
            `
          );

      } else {

        [visiteurs] =
          await pool.query(
            `
              SELECT *
              FROM visiteurs
              WHERE commercial_id = ?
              ORDER BY id DESC
            `,
            [req.user.id]
          );
      }


      res.json({
        success: true,
        visiteurs,
      });

    } catch (error) {

      console.error(
        "❌ GET VISITEURS :",
        error
      );


      res.status(500).json({
        success: false,
        message:
          "Erreur serveur",
      });
    }
  }
);

// ============================================================
// GET VISITEUR PAR ID
// ============================================================
app.get(
  "/api/visiteurs/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      console.log("GET VISITEUR ID :", id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: "Identifiant visiteur invalide.",
        });
      }

      const visitor = await getVisitorById(id);
      const commandes = await getCommandesByVisitorId(id);

      visitor.commandes = commandes;

      return res.status(200).json({
        success: true,
        data: visitor,
      });

    } catch (error) {
      console.error("❌ ERREUR GET VISITEUR :", error);

      if (error.message === "Visiteur introuvable.") {
        return res.status(404).json({
          success: false,
          message: "Visiteur introuvable.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Erreur lors du chargement du visiteur.",
        error: error.message,
      });
    }
  }
);
// ============================================================
// GET VISITEUR PAR ID
// ============================================================

app.get(
  "/api/visiteurs/:id/pdf",
  authenticateToken,
  async (req, res) => {
    let browser;

    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: "Identifiant visiteur invalide.",
        });
      }

      // ================================
      // RÉCUPÉRER LE VISITEUR
      // ================================
      const visitor = await getVisitorById(id);

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: "Visiteur introuvable.",
        });
      }

      // ================================
      // RÉFÉRENCE
      // ================================
      if (!visitor.reference) {
        const reference = generateReference(
          visitor.id,
          visitor.type_commande
        );

        await pool.execute(
          `
            UPDATE visiteurs
            SET reference = ?
            WHERE id = ?
          `,
          [
            reference,
            visitor.id,
          ]
        );

        visitor.reference = reference;
      }

      // ================================
      // COMMANDES
      // ================================
      const commandes =
        await getCommandesByVisitorId(id);

      visitor.commandes = commandes;

      // ================================
      // GÉNÉRER LE HTML DU VRAI PDF
      // ================================
      const htmlContent = await pdfHtml(visitor);

      if (!htmlContent || !htmlContent.trim()) {
        throw new Error(
          "Le contenu HTML du PDF est vide."
        );
      }

      

      // ================================
      // VRAI PDF
      // ================================
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: "0",
          right: "0",
          bottom: "0",
          left: "0",
        },
      });

      await browser.close();
      browser = null;

      // ================================
      // RETOURNER LE PDF
      // ================================
      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="OLIVED_${visitor.reference}.pdf"`
      );

      res.setHeader(
        "Content-Length",
        pdfBuffer.length
      );

      return res.send(pdfBuffer);

    } catch (error) {

      console.error(
        "❌ ERREUR GÉNÉRATION PDF :",
        error
      );

      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error(
            "Erreur fermeture Puppeteer :",
            closeError
          );
        }
      }

      return res.status(500).json({
        success: false,
        message:
          "Erreur lors de la génération du PDF.",
        error: error.message,
      });
    }
  }
);


// ============================================================
// PUT VISITEUR
// ============================================================

app.put(
  "/api/visiteurs/:id",
  authenticateToken,
  async (req, res) => {

    try {

      const id =
        Number(
          req.params.id
        );


      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Identifiant visiteur invalide.",
        });
      }


      const currentVisitor =
        await getVisitorById(id);


      const body =
        req.body || {};


      // ========================================================
      // COMMANDES
      // ========================================================

      if (
        body.commandes !== undefined
      ) {

        const newType =
          normalizeTypeCommande(
            body.type_commande ??
            currentVisitor.type_commande
          );


        let normalized;


        try {

          normalized =
            normalizeCommandes(
              body.commandes,
              newType
            );

        } catch (error) {

          return res.status(400).json({
            success: false,
            message:
              error.message,
          });
        }


        const connection =
          await pool.getConnection();


        try {

          await connection.beginTransaction();


          await connection.execute(
            `
              DELETE FROM commandes
              WHERE visiteur_id = ?
            `,
            [id]
          );


          if (
            Array.isArray(
              normalized
            ) &&
            normalized.length > 0
          ) {

            for (
              let index = 0;
              index <
              normalized.length;
              index++
            ) {

              await insererCommande(
                connection,
                id,
                normalized[index],
                index + 1
              );
            }
          }


          await connection.commit();

        } catch (error) {

          await connection.rollback();

          throw error;

        } finally {

          connection.release();
        }
      }


      // ========================================================
      // CHAMPS VISITEUR
      // ========================================================

      const allowedFields = [
        "nom",
        "prenom",
        "email",
        "site",
        "origine",
        "indicatif",
        "telephone",
        "societe",
        "adresse_societe",
        "fonction",
        "genre",
        "langue_communication",
        "profile",
        "type_commande",
        "qualification",
      ];


      const fields = [];
      const values = [];


      for (
        const field of allowedFields
      ) {

        if (
          body[field] === undefined
        ) {
          continue;
        }


        // ======================================================
        // QUALIFICATION
        // ======================================================

        if (
          field === "qualification"
        ) {

          const q =
            Number(
              body[field]
            );


          if (
            !Number.isInteger(q) ||
            q < 1 ||
            q > 5
          ) {

            return res.status(400).json({
              success: false,
              message:
                "La qualification doit être comprise entre 1 et 5.",
            });
          }


          fields.push(
            "qualification = ?"
          );

          values.push(q);

          continue;
        }


        // ======================================================
        // TYPE COMMANDE
        // ======================================================

        if (
          field === "type_commande"
        ) {

          const type =
            normalizeTypeCommande(
              body[field]
            );


          if (!type) {

            return res.status(400).json({
              success: false,
              message:
                "Type de commande invalide.",
            });
          }


          fields.push(
            "type_commande = ?"
          );

          values.push(type);

          continue;
        }


        fields.push(
          `${field} = ?`
        );


        values.push(
          cleanString(
            body[field]
          )
        );
      }


      // ========================================================
      // UPDATE VISITEUR
      // ========================================================

      if (
        fields.length > 0
      ) {

        values.push(id);


        const sql =
          `
            UPDATE visiteurs
            SET ${fields.join(", ")}
            WHERE id = ?
          `;


        await pool.execute(
          sql,
          values
        );
      }


      // ========================================================
      // VISITEUR MIS À JOUR
      // ========================================================

      const updated =
        await getVisitorById(id);


      const commandes =
        await getCommandesByVisitorId(
          id
        );


      updated.commandes =
        commandes;


      return res.json({
        success: true,
        message:
          "Visiteur modifié avec succès.",
        data:
          updated,
      });

    } catch (error) {

      console.error(
        "❌ PUT VISITEUR :",
        error
      );


      return res.status(500).json({
        success: false,
        message:
          "Erreur lors de la modification du visiteur.",
        error:
          error.message,
        sqlMessage:
          error.sqlMessage,
      });
    }
  }
);


// ============================================================
// DELETE VISITEUR
// ============================================================

app.delete(
  "/api/visiteurs/:id",
  authenticateToken,
  async (req, res) => {

    try {

      const id =
        Number(
          req.params.id
        );


      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Identifiant visiteur invalide.",
        });
      }


      await getVisitorById(id);


      await pool.execute(
        `
          DELETE FROM visiteurs
          WHERE id = ?
        `,
        [id]
      );


      res.json({
        success: true,
        message:
          "Visiteur supprimé avec succès.",
        id,
      });

    } catch (error) {

      console.error(
        "❌ DELETE VISITEUR :",
        error
      );


      res.status(500).json({
        success: false,
        message:
          "Erreur lors de la suppression du visiteur.",
        error:
          error.message,
      });
    }
  }
);


// ============================================================
// QUALIFICATION
// ============================================================

app.put(
  "/api/visiteurs/:id/qualification",
  authenticateToken,
  async (req, res) => {

    try {

      const id =
        Number(
          req.params.id
        );


      const qualification =
        Number(
          req.body?.qualification
        );


      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "ID visiteur invalide.",
        });
      }


      if (
        !Number.isInteger(
          qualification
        ) ||
        qualification < 1 ||
        qualification > 5
      ) {

        return res.status(400).json({
          success: false,
          message:
            "La qualification doit être comprise entre 1 et 5.",
        });
      }


      await getVisitorById(id);


      await pool.execute(
        `
          UPDATE visiteurs
          SET qualification = ?
          WHERE id = ?
        `,
        [
          qualification,
          id,
        ]
      );


      const [rows] =
        await pool.execute(
          `
            SELECT
              id,
              reference,
              nom,
              prenom,
              qualification
            FROM visiteurs
            WHERE id = ?
          `,
          [id]
        );


      res.json({
        success: true,
        message:
          "Qualification enregistrée avec succès.",
        data:
          rows[0],
      });

    } catch (error) {

      console.error(
        "❌ QUALIFICATION :",
        error
      );


      res.status(500).json({
        success: false,
        message:
          "Erreur lors de l'enregistrement de la qualification.",
        error:
          error.message,
      });
    }
  }
);


// ============================================================
// EMAIL - ENVOYER PDF
// ============================================================

app.post(
  "/api/email/send",
  async (req, res) => {

    try {

      const {
        visitorId,
        visiteurId,
        nomComplet,
        message,
        reference,
        toEmail,
        pdfHtml,
      } = req.body || {};


      const id =
        Number(
          visitorId ||
          visiteurId
        );


      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Identifiant visiteur manquant ou invalide.",
        });
      }


      if (
        !pdfHtml ||
        typeof pdfHtml !== "string" ||
        pdfHtml.trim().length < 100
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Le contenu HTML du PDF est manquant ou invalide.",
        });
      }


      const visitor =
        await getVisitorById(id);


      let finalReference =
        cleanString(
          reference
        ) ||
        cleanString(
          visitor.reference
        );


      if (!finalReference) {

        finalReference =
          generateReference(
            visitor.id,
            visitor.type_commande
          );


        await pool.execute(
          `
            UPDATE visiteurs
            SET reference = ?
            WHERE id = ?
          `,
          [
            finalReference,
            visitor.id,
          ]
        );
      }


      const recipient =
        cleanString(
          toEmail
        ) ||
        cleanString(
          visitor.email
        ) ||
        cleanString(
          process.env.EMAIL_TO
        ) ||
        "Contact@olived.tn";


      const pdfBuffer =
        await generatePdfFromHtml(
          pdfHtml
        );


      const transporter =
        createEmailTransporter();


      const finalNomComplet =
        cleanString(
          nomComplet
        ) ||
        [
          visitor.prenom,
          visitor.nom,
        ]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        "Client";


      const mailSubject =
        `Official Price Offer OLIVED - ${finalReference}`;


      const mailText =
        cleanString(message) ||
        `Dear ${finalNomComplet},

I hope you are doing well.

Please find attached our quotation for the requested olive oil products.

The offer includes the product specifications, packaging options, quantities, and corresponding prices.

Should you require any modifications regarding volumes, packaging, delivery terms, or payment conditions, we would be pleased to review the offer accordingly.

Please do not hesitate to contact us should you need any further information or clarification.

We look forward to hearing from you and hope to have the opportunity to work with you.

Reference: ${finalReference}

Best regards,
OLIVED`;


      const mailHtml = `
        <div
          style="
            font-family:Arial,sans-serif;
            line-height:1.6;
          "
        >

          <p>
            Dear ${finalNomComplet},
          </p>

          <p>
            I hope you are doing well.
          </p>

          <p>
            Please find attached our quotation for the requested olive oil products.
          </p>

          <p>
            The offer includes the product specifications, packaging options, quantities, and corresponding prices.
          </p>

          <p>
            Should you require any modifications regarding volumes, packaging, delivery terms, or payment conditions, we would be pleased to review the offer accordingly.
          </p>

          <p>
            Please do not hesitate to contact us should you need any further information or clarification.
          </p>

          <p>
            We look forward to hearing from you and hope to have the opportunity to work with you.
          </p>

          <p>
            <strong>
              Reference:
            </strong>
            ${finalReference}
          </p>

          <p>
            Best regards,<br>
            <strong>
              OLIVED
            </strong>
          </p>

        </div>
      `;


      const info =
        await transporter.sendMail({

          from:
            process.env.EMAIL_FROM ||
            process.env.SMTP_USER,

          to:
            recipient,

          subject:
            mailSubject,

          text:
            mailText,

          html:
            mailHtml,

          attachments: [
            {
              filename:
                `Official_Price_Offer_${finalReference}.pdf`,

              content:
                pdfBuffer,

              contentType:
                "application/pdf",
            },
          ],
        });


      res.json({
        success: true,
        message:
          "Email envoyé avec succès.",
        messageId:
          info.messageId,
        reference:
          finalReference,
        recipient,
      });

    } catch (error) {

      console.error(
        "❌ ERREUR EMAIL :",
        error
      );


      res.status(500).json({
        success: false,
        message:
          "Erreur lors de l'envoi de l'email.",
        error:
          error.message,
        code:
          error.code,
      });
    }
  }
);


// ============================================================
// WHATSAPP - ENVOYER PDF VIA META
// ============================================================

app.post(
  "/api/whatsapp/send",
  async (req, res) => {

    try {

      const {
        visitorId,
        visiteurId,
        reference,
        telephone,
        pdfHtml,
      } = req.body || {};


      const id =
        Number(
          visitorId ||
          visiteurId
        );


      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Identifiant visiteur invalide.",
        });
      }


      if (
        !pdfHtml ||
        typeof pdfHtml !== "string" ||
        pdfHtml.trim().length < 100
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Le contenu HTML du PDF est manquant.",
        });
      }


      if (
        !phoneNumberId ||
        !accessToken
      ) {

        return res.status(500).json({
          success: false,
          message:
            "Configuration WhatsApp Meta manquante dans .env.",
        });
      }


      const visitor =
        await getVisitorById(id);


      let finalReference =
        cleanString(
          reference
        ) ||
        cleanString(
          visitor.reference
        );


      if (!finalReference) {

        finalReference =
          generateReference(
            visitor.id,
            visitor.type_commande
          );


        await pool.execute(
          `
            UPDATE visiteurs
            SET reference = ?
            WHERE id = ?
          `,
          [
            finalReference,
            visitor.id,
          ]
        );
      }


      let whatsappNumber =
        cleanString(
          telephone
        ) ||
        cleanString(
          visitor.telephone
        );


      if (!whatsappNumber) {

        return res.status(400).json({
          success: false,
          message:
            "Numéro WhatsApp introuvable.",
        });
      }


      whatsappNumber =
        whatsappNumber.replace(
          /\D/g,
          ""
        );


      if (
        whatsappNumber.startsWith("00")
      ) {

        whatsappNumber =
          whatsappNumber.substring(2);
      }


      if (
        (
          whatsappNumber.startsWith("2") ||
          whatsappNumber.startsWith("5") ||
          whatsappNumber.startsWith("9")
        ) &&
        whatsappNumber.length === 8
      ) {

        whatsappNumber =
          "216" + whatsappNumber;
      }


      const pdfBuffer =
        await generatePdfFromHtml(
          pdfHtml
        );


      // ========================================================
      // UPLOAD MEDIA
      // ========================================================

      const uploadUrl =
        `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/media`;


      const form =
        new FormData();


      form.append(
        "messaging_product",
        "whatsapp"
      );


      form.append(
        "type",
        "application/pdf"
      );


      form.append(
        "file",
        Readable.from(
          pdfBuffer
        ),
        {
          filename:
            `Official_Price_Offer_${finalReference}.pdf`,

          contentType:
            "application/pdf",

          knownLength:
            pdfBuffer.length,
        }
      );


      const uploadResponse =
        await axios.post(
          uploadUrl,
          form,
          {
            headers: {
              ...form.getHeaders(),

              Authorization:
                `Bearer ${accessToken}`,
            },

            maxContentLength:
              Infinity,

            maxBodyLength:
              Infinity,

            timeout:
              60000,
          }
        );


      const mediaId =
        uploadResponse.data?.id;


      if (!mediaId) {

        throw new Error(
          "WhatsApp n'a pas retourné de media ID."
        );
      }


      // ========================================================
      // ENVOI DOCUMENT
      // ========================================================

      const sendUrl =
        `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;


      const payload = {

        messaging_product:
          "whatsapp",

        recipient_type:
          "individual",

        to:
          whatsappNumber,

        type:
          "document",

        document: {

          id:
            mediaId,

          caption:
            `OLIVED - Official Price Offer\nReference: ${finalReference}`,

          filename:
            `Official_Price_Offer_${finalReference}.pdf`,
        },
      };


      const whatsappResponse =
        await axios.post(
          sendUrl,
          payload,
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,

              "Content-Type":
                "application/json",
            },

            timeout:
              60000,
          }
        );


      const messageId =
        whatsappResponse
          .data
          ?.messages?.[0]?.id;


      res.json({
        success: true,
        message:
          "PDF envoyé avec succès sur WhatsApp.",
        reference:
          finalReference,
        phone:
          whatsappNumber,
        mediaId,
        messageId,
      });

    } catch (error) {

      console.error(
        "❌ ERREUR WHATSAPP :",
        error
      );


      if (
        error.response
      ) {

        console.error(
          "WhatsApp response:",
          JSON.stringify(
            error.response.data,
            null,
            2
          )
        );
      }


      res.status(500).json({
        success: false,
        message:
          "Erreur lors de l'envoi du PDF sur WhatsApp.",
        error:
          error.response?.data ||
          error.message,
      });
    }
  }
);


// ============================================================
// TUNISIE + VRAC
// ============================================================

app.get(
  "/api/visiteurs/tunisie/vrac",
  async (req, res) => {

    try {

      const [rows] =
        await pool.query(
          `
            SELECT *
            FROM visiteurs
            WHERE origine = 'Tunisie'
              AND type_commande = 'vrac'
            ORDER BY id DESC
          `
        );


      const data =
        rows.map(
          (visitor) => ({
            ...visitor,

            commandes:
              parseJson(
                visitor.commandes,
                []
              ),
          })
        );


      res.json({
        success: true,
        count:
          data.length,
        data,
      });

    } catch (error) {

      console.error(
        "❌ ERREUR TUNISIE VRAC :",
        error
      );


      res.status(500).json({
        success: false,
        message:
          "Erreur lors de la récupération des visiteurs.",
        error:
          error.message,
      });
    }
  }
);


// ============================================================
// ADMIN - TOUS LES COMMERCIAUX
// ============================================================

app.get(
  "/api/admin/commerciaux",
  authenticateToken,
  requireAdmin,
  async (req, res) => {

    try {

      const [commerciaux] =
        await pool.query(
          `
            SELECT
              id,
              nom,
              prenom,
              email,
              role,
              actif,
              created_at
            FROM users
            WHERE role = 'commercial'
            ORDER BY id DESC
          `
        );


      res.json({
        success: true,
        commerciaux,
      });

    } catch (error) {

      console.error(
        "GET COMMERCIAUX ERROR:",
        error
      );


      res.status(500).json({
        success: false,
        message:
          "Erreur serveur",
      });
    }
  }
);


// ============================================================
// ADMIN - AJOUT COMMERCIAL
// ============================================================

app.post(
  "/api/admin/commerciaux",
  authenticateToken,
  requireAdmin,
  async (req, res) => {

    try {

      console.log(
        "========== AJOUT COMMERCIAL =========="
      );

      console.log(
        "BODY :",
        req.body
      );


      const nom =
        req.body.nom;

      const prenom =
        req.body.prenom;

      const email =
        req.body.email;

      const password =
        req.body.password;


      if (
        !nom ||
        !prenom ||
        !email
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Nom, prénom et email sont obligatoires",
        });
      }


      const nomValue =
        nom.trim();

      const prenomValue =
        prenom.trim();

      const emailValue =
        email
          .trim()
          .toLowerCase();


      const [existing] =
        await pool.query(
          `
            SELECT id
            FROM users
            WHERE email = ?
          `,
          [emailValue]
        );


      if (
        existing.length > 0
      ) {

        return res.status(409).json({
          success: false,
          message:
            "Cet email existe déjà",
        });
      }


      let passwordValue =
        null;


      if (
        password !== null &&
        password !== undefined &&
        String(password).trim() !== ""
      ) {

        passwordValue =
          await bcrypt.hash(
            String(password).trim(),
            10
          );
      }


      const [result] =
        await pool.query(
          `
            INSERT INTO users
            (
              nom,
              prenom,
              email,
              password,
              role,
              actif
            )

            VALUES (
              ?, ?, ?, ?,
              'commercial',
              0
            )
          `,
          [
            nomValue,
            prenomValue,
            emailValue,
            passwordValue,
          ]
        );


      console.log(
        "✅ COMMERCIAL CRÉÉ ID :",
        result.insertId
      );


      return res.status(201).json({
        success: true,
        message:
          "Commercial créé avec succès",
        commercialId:
          result.insertId,
        actif:
          0,
      });

    } catch (error) {

      console.error(
        "❌ ERREUR SQL :",
        error
      );


      return res.status(500).json({
        success: false,
        message:
          "Erreur serveur",
        error:
          error.message,
      });
    }
  }
);


// ============================================================
// ACTIVER COMMERCIAL
// ============================================================

app.put(
  "/api/admin/commerciaux/:id/activer",
  authenticateToken,
  requireAdmin,
  async (req, res) => {

    try {

      const { id } =
        req.params;


      const [result] =
        await pool.query(
          `
            UPDATE users
            SET actif = 1
            WHERE id = ?
              AND role = 'commercial'
          `,
          [id]
        );


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Commercial introuvable.",
        });
      }


      return res.json({
        success: true,
        message:
          "Commercial activé avec succès.",
      });

    } catch (error) {

      console.error(
        "❌ ERREUR ACTIVATION :",
        error
      );


      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  }
);


// ============================================================
// DESACTIVER COMMERCIAL
// ============================================================

app.put(
  "/api/admin/commerciaux/:id/desactiver",
  authenticateToken,
  requireAdmin,
  async (req, res) => {

    try {

      const { id } =
        req.params;


      const [result] =
        await pool.query(
          `
            UPDATE users
            SET actif = 0
            WHERE id = ?
              AND role = 'commercial'
          `,
          [id]
        );


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Commercial introuvable.",
        });
      }


      return res.json({
        success: true,
        message:
          "Commercial désactivé avec succès.",
      });

    } catch (error) {

      console.error(
        "❌ ERREUR DESACTIVATION :",
        error
      );


      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  }
);


// ============================================================
// AUTH ME
// ============================================================

app.get(
  "/api/auth/me",
  authenticateToken,
  async (req, res) => {

    try {

      const [users] =
        await pool.query(
          `
            SELECT
              id,
              nom,
              prenom,
              email,
              role,
              actif,
              created_at
            FROM users
            WHERE id = ?
          `,
          [req.user.id]
        );


      if (
        users.length === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Utilisateur introuvable",
        });
      }


      res.json({
        success: true,
        user:
          users[0],
      });

    } catch (error) {

      console.error(
        error
      );


      res.status(500).json({
        success: false,
        message:
          "Erreur serveur",
      });
    }
  }
);


// ============================================================
// MIGRATION COLONNE COMMANDES VISITEUR
// ============================================================

async function ensureCommandesColumn() {

  const [columns] =
    await pool.query(
      `
        SELECT COUNT(*) AS count
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'visiteurs'
          AND COLUMN_NAME = 'commandes'
      `
    );


  if (
    Number(
      columns[0]?.count || 0
    ) === 0
  ) {

    console.log(
      "📦 Création de la colonne commandes..."
    );


    await pool.query(
      `
        ALTER TABLE visiteurs
        ADD COLUMN commandes LONGTEXT NULL
      `
    );


    console.log(
      "✅ Colonne commandes créée."
    );

  } else {

    console.log(
      "✅ Colonne commandes déjà présente."
    );
  }
}


// ============================================================
// START SERVER
// ============================================================

async function startServer() {

  try {

    const connection =
      await pool.getConnection();


    console.log(
      "======================================="
    );

    console.log(
      "MYSQL CONNECTÉ"
    );

    console.log(
      "======================================="
    );

    console.log(
      "Database :",
      process.env.DB_NAME ||
        "visiteurs_db"
    );


    connection.release();


    // ========================================================
    // MIGRATION
    // ========================================================

    await ensureCommandesColumn();


    // ========================================================
    // SERVER
    // ========================================================

    app.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log("");

        console.log(
          "======================================="
        );

        console.log(
          "🚀 OLIVED SERVER"
        );

        console.log(
          "======================================="
        );

        console.log(
          `Local : http://localhost:${PORT}`
        );

        console.log(
          `Réseau : http://192.168.1.146:${PORT}`
        );

        console.log("");

        console.log(
          "Test API :"
        );

        console.log(
          `http://localhost:${PORT}/api/test-db`
        );

        console.log(
          "======================================="
        );

        console.log("");
      }
    );

  } catch (error) {

    console.error(
      "======================================="
    );

    console.error(
      "❌ IMPOSSIBLE DE DÉMARRER LE SERVEUR"
    );

    console.error(
      "======================================="
    );

    console.error(
      error
    );

    process.exit(1);
  }
}


// ============================================================
// LANCEMENT
// ============================================================

startServer();