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
  
        demande_echantillon,
        adresse_echantillon,
        personne_reception_echantillon,
        tel_reception_echantillon,
  
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
  
        ?, ?, ?, ?,
  
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
  
      commande.demande_echantillon ? 1 : 0,
  
      commande.demande_echantillon
        ? commande.adresse_echantillon || null
        : null,
  
      commande.demande_echantillon
        ? commande.personne_reception_echantillon || null
        : null,
  
      commande.demande_echantillon
        ? commande.tel_reception_echantillon || null
        : null,
  
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

async function generatePdfFromHtml(
  htmlContent
) {
  let browser = null;

  try {
    if (
      !htmlContent ||
      typeof htmlContent !== "string"
    ) {
      throw new Error(
        "Contenu HTML du PDF manquant."
      );
    }

    browser =
      await puppeteer.launch({
        headless: true,

        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });

    const page =
      await browser.newPage();

    await page.setViewport({
      width: 1280,
      height: 1800,
      deviceScaleFactor: 1,
    });

    await page.setContent(
      htmlContent,
      {
        waitUntil: "networkidle0",
        timeout: 60000,
      }
    );

    await page.emulateMediaType(
      "screen"
    );

    const pdfData =
      await page.pdf({
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

    const pdfBuffer =
      Buffer.from(pdfData);

    await browser.close();

    browser = null;

    return pdfBuffer;

  } catch (error) {

    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error(
          closeError.message
        );
      }
    }

    throw error;
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
    host:
      process.env.SMTP_HOST ||
      "smtp.hostinger.com",

    port:
      Number(
        process.env.SMTP_PORT ||
        465
      ),

    secure:
      String(
        process.env.SMTP_SECURE
      ).toLowerCase() === "true",

    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
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

app.get(
  "/validation/:token",
  async (req, res) => {

    try {

      const { token } =
        req.params;


      console.log(
        "======================================="
      );

      console.log(
        "OUVERTURE LIEN VALIDATION"
      );

      console.log(
        "Token :",
        token
      );

      console.log(
        "======================================="
      );


      const [rows] =
        await pool.query(
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


      if (!rows.length) {

        return res.status(404).send(`
          <!DOCTYPE html>
          <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <title>Validation OLIVED</title>
          </head>

          <body style="
            margin:0;
            padding:40px;
            font-family:Arial,sans-serif;
            text-align:center;
            background:#f5f5f5;
          ">

            <h1>
              Lien invalide
            </h1>

            <p>
              Le lien de validation n'existe pas.
            </p>

          </body>
          </html>
        `);
      }


      const validation =
        rows[0];


      if (
        validation.expires_at &&
        new Date(
          validation.expires_at
        ) < new Date()
      ) {

        return res.status(410).send(`
          <!DOCTYPE html>
          <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <title>Validation OLIVED</title>
          </head>

          <body style="
            margin:0;
            padding:40px;
            font-family:Arial,sans-serif;
            text-align:center;
            background:#f5f5f5;
          ">

            <h1>
              Lien expiré
            </h1>

            <p>
              Ce lien de validation a expiré.
            </p>

          </body>
          </html>
        `);
      }


      const pdfBuffer =
        await generatePdfFromHtml(
          validation.pdf_html
        );


      res.setHeader(
        "Content-Type",
        "text/html; charset=utf-8"
      );


      const pdfBase64 =
        pdfBuffer.toString(
          "base64"
        );


      const isPending =
        validation.status === "pending";


      return res.send(`
        <!DOCTYPE html>

        <html lang="fr">

        <head>

          <meta charset="UTF-8">

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          >

          <title>
            Validation PDF OLIVED -
            ${validation.reference}
          </title>

          <style>

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
            }

            body {
              font-family:
                Arial,
                Helvetica,
                sans-serif;

              background: #eeeeee;

              display: flex;
              flex-direction: column;

              min-height: 100vh;
            }

            .header {
              background: white;

              padding: 18px 25px;

              border-bottom:
                1px solid #ddd;

              display: flex;

              justify-content:
                space-between;

              align-items: center;

              gap: 20px;

              flex-wrap: wrap;
            }

            .title {
              font-size: 20px;

              font-weight: 700;

              color: #222;
            }

            .reference {
              font-size: 14px;

              color: #666;
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

              height:
                calc(100vh - 150px);

              min-height: 600px;

              border: none;

              background: white;

              box-shadow:
                0 2px 15px
                rgba(0,0,0,0.15);

              border-radius: 6px;
            }

            .actions {
              background: white;

              padding: 18px 25px;

              border-top:
                1px solid #ddd;

              display: flex;

              justify-content: center;

              gap: 20px;

              position: sticky;

              bottom: 0;

              z-index: 100;
            }

            button {
              border: none;

              padding:
                14px 45px;

              border-radius: 7px;

              font-size: 16px;

              font-weight: 700;

              cursor: pointer;

              min-width: 180px;
            }

            .validate {
              background: #198754;

              color: white;
            }

            .validate:hover {
              background: #157347;
            }

            .reject {
              background: #dc3545;

              color: white;
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

            @media(max-width:700px) {

              .pdf-container {
                padding: 5px;
              }

              .pdf-frame {
                height:
                  calc(100vh - 190px);

                min-height: 500px;
              }

              .actions {
                flex-direction: column;
              }

              button {
                width: 100%;
              }

            }

          </style>

        </head>


        <body>

          <div class="header">

            <div class="title">
              OLIVED - Validation de la fiche
            </div>

            <div class="reference">
              Référence :
              <strong>
                ${validation.reference}
              </strong>
            </div>

          </div>


          ${
            !isPending
              ? `
                <div class="status">

                  Cette demande a déjà été

                  ${
                    validation.status === "validated"
                      ? "VALIDÉE"
                      : "REFUSÉE"
                  }.

                </div>
              `
              : ""
          }


          <div class="pdf-container">

            <iframe
              class="pdf-frame"
              src="data:application/pdf;base64,${pdfBase64}"
            ></iframe>

          </div>


          ${
            isPending
              ? `
                <div class="actions">

                  <button
                    class="validate"
                    onclick="valider()"
                  >
                    ✓ VALIDER
                  </button>

                  <button
                    class="reject"
                    onclick="refuser()"
                  >
                    ✕ REFUSER
                  </button>

                </div>
              `
              : ""
          }


          <script>

            async function valider() {

              const confirmation =
                confirm(
                  "Voulez-vous VALIDER cette fiche ?"
                );

              if (!confirmation) {
                return;
              }

              try {

                const response =
                  await fetch(
                    "/api/validation/${token}/validate",
                    {
                      method: "POST",

                      headers: {
                        "Content-Type":
                          "application/json",
                      },
                    }
                  );

                const data =
                  await response.json();

                console.log(
                  "RÉPONSE VALIDATION :",
                  data
                );

                if (
                  !response.ok ||
                  !data.success
                ) {

                  alert(
                    data.message ||
                    "Erreur lors de la validation."
                  );

                  return;
                }

                if (
                  data.whatsappUrl
                ) {

                  window.location.href =
                    data.whatsappUrl;

                  return;
                }

                alert(
                  "✓ Fiche validée avec succès."
                );

                window.location.reload();

              } catch (error) {

                console.error(
                  "ERREUR VALIDATION :",
                  error
                );

                alert(
                  "Erreur de connexion au serveur."
                );
              }
            }


            async function refuser() {

              const confirmation =
                confirm(
                  "Voulez-vous REFUSER cette fiche ?"
                );

              if (!confirmation) {
                return;
              }

              try {

                const response =
                  await fetch(
                    "/api/validation/${token}/reject",
                    {
                      method: "POST",

                      headers: {
                        "Content-Type":
                          "application/json",
                      },
                    }
                  );

                const data =
                  await response.json();

                if (
                  !response.ok ||
                  !data.success
                ) {

                  alert(
                    data.message ||
                    "Erreur lors du refus."
                  );

                  return;
                }

                alert(
                  "La fiche a été refusée."
                );

                window.location.reload();

              } catch (error) {

                console.error(
                  error
                );

                alert(
                  "Erreur de connexion au serveur."
                );
              }
            }

          </script>

        </body>

        </html>
      `);

    } catch (error) {

      console.error(
        "ERREUR PAGE VALIDATION :",
        error
      );

      return res.status(500).send(`
        <h1>Erreur serveur</h1>

        <p>
          Impossible d'afficher la fiche.
        </p>
      `);
    }
  }
);


// ============================================================
// VALIDER PDF
// ============================================================

app.post(
  "/api/validation/:token/validate",
  async (req, res) => {

    try {

      const { token } =
        req.params;


      console.log(
        "======================================="
      );

      console.log(
        "VALIDATION PDF"
      );

      console.log(
        "Token :",
        token
      );

      console.log(
        "======================================="
      );


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
          status:
            validation.status,
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


      const visiteur =
        await getVisitorById(
          validation.visitor_id
        );


      const nomComplet =
        `${visiteur.prenom || ""} ${visiteur.nom || ""}`
          .trim();


      console.log(
        "Visiteur :",
        nomComplet
      );

      console.log(
        "Canal :",
        validation.channel
      );


      const pdfBuffer =
        await generatePdfFromHtml(
          validation.pdf_html
        );


      // ========================================================
      // EMAIL
      // ========================================================

      if (
        validation.channel ===
        "email"
      ) {

        const recipient =
          visiteur.email;


        if (!recipient) {

          return res.status(400).json({
            success: false,
            message:
              "L'adresse email du visiteur est manquante.",
          });
        }


        const transporter =
          createEmailTransporter();


        await transporter.sendMail({

          from:
            process.env.EMAIL_FROM ||
            process.env.SMTP_USER,

          to:
            recipient,

          subject:
            `Official Price Offer OLIVED - ${validation.reference}`,

          text:
            `Dear ${nomComplet},\n\n` +

            `I hope you are doing well.\n\n` +

            `Please find attached our quotation for the requested olive oil products.\n` +

            `The offer includes the product specifications, packaging options, quantities, and corresponding prices. Should you require any modifications regarding volumes, packaging, delivery terms, or payment conditions, we would be pleased to review the offer accordingly.\n` +

            `Please do not hesitate to contact us should you need any further information or clarification.\n` +

            `We look forward to hearing from you and hope to have the opportunity to work with you.\n\n` +

            `Reference: ${validation.reference}\n\n` +

            `Best regards,\n` +

            `OLIVED`,

          attachments: [
            {
              filename:
                `visiteur-${validation.visitor_id}-${validation.reference}.pdf`,

              content:
                pdfBuffer,

              contentType:
                "application/pdf",
            },
          ],
        });


        console.log(
          "EMAIL ENVOYÉ AVEC SUCCÈS"
        );
      }


      // ========================================================
      // WHATSAPP SANS META
      // ========================================================

      let whatsappUrl =
        null;


      if (
        validation.channel ===
        "whatsapp"
      ) {

        const telephone =
          visiteur.telephone ||
          visiteur.phone ||
          visiteur.whatsapp;


        if (!telephone) {

          return res.status(400).json({
            success: false,
            message:
              "Le numéro WhatsApp du visiteur est manquant.",
          });
        }


        let phone =
          String(telephone)
            .replace(/\D/g, "");


        if (
          phone.startsWith("00")
        ) {

          phone =
            phone.substring(2);
        }


        if (
          (
            phone.startsWith("2") ||
            phone.startsWith("5") ||
            phone.startsWith("9")
          ) &&
          phone.length === 8
        ) {

          phone =
            "216" + phone;
        }


        const message =
          `Dear ${nomComplet},\n\n` +

          `I hope you are doing well.\n\n` +

          `Please find attached our quotation for the requested olive oil products.\n` +

          `The offer includes the product specifications, packaging options, quantities, and corresponding prices. Should you require any modifications regarding volumes, packaging, delivery terms, or payment conditions, we would be pleased to review the offer accordingly.\n` +

          `Please do not hesitate to contact us should you need any further information or clarification.\n` +

          `We look forward to hearing from you and hope to have the opportunity to work with you.\n\n` +

          `Reference: ${validation.reference}\n\n` +

          `Best regards,\n` +

          `OLIVED`;


        whatsappUrl =
          `https://wa.me/${phone}?text=${encodeURIComponent(
            message
          )}`;


        console.log(
          "WHATSAPP URL :",
          whatsappUrl
        );
      }


      // ========================================================
      // UPDATE VALIDATION
      // ========================================================

      await pool.query(
        `
          UPDATE pdf_validations
          SET
            status = 'validated',
            validated_at = NOW()
          WHERE token = ?
        `,
        [token]
      );


      console.log(
        "VALIDATION ENREGISTRÉE EN BASE"
      );


      return res.json({
        success: true,
        message:
          "Validation effectuée avec succès.",
        reference:
          validation.reference,
        whatsappUrl,
      });

    } catch (error) {

      console.error(
        "======================================="
      );

      console.error(
        "ERREUR VALIDATION :",
        error
      );

      console.error(
        "======================================="
      );


      return res.status(500).json({
        success: false,
        message:
          "Erreur lors de la validation et de l'envoi.",
        error:
          error.message,
      });
    }
  }
);


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
      } = req.body;


      // ========================================================
      // COMMERCIAL
      // ========================================================

      const commercialId =
        req.user.id;


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

        const q =
          Number(
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

      let normalizedCommandes =
        commandes;


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

      const [result] =
        await connection.execute(
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
              commercial_id
            )

            VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?, ?
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
          ]
        );


      const visiteurId =
        result.insertId;


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


      const visitor =
        await getVisitorById(id);


      if (!visitor) {

        return res.status(404).json({
          success: false,
          message:
            "Visiteur introuvable.",
        });
      }


      if (
        !visitor.reference
      ) {

        const reference =
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
            reference,
            visitor.id,
          ]
        );


        visitor.reference =
          reference;
      }


      const commandes =
        await getCommandesByVisitorId(
          id
        );


      visitor.commandes =
        commandes;


      return res.status(200).json({
        success: true,
        data:
          visitor,
        visitor:
          visitor,
      });

    } catch (error) {

      console.error(
        "❌ GET VISITEUR :",
        error
      );


      if (
        error.message ===
        "Visiteur introuvable."
      ) {

        return res.status(404).json({
          success: false,
          message:
            error.message,
        });
      }


      return res.status(500).json({
        success: false,
        message:
          "Erreur lors de la récupération du visiteur.",
        error:
          error.message,
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