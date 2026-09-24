// ============================================================
// OLIVED - SERVER.JS
// Backend Node.js + Express + MySQL
// ============================================================

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const axios = require("axios");
const FormData = require("form-data");
const { Readable } = require("stream");
const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer");

require("dotenv").config();

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
// HELPERS
// ============================================================

function cleanString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const str = String(value).trim();

  return str === "" ? null : str;
}

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
    return JSON.stringify(value);
  }

  try {
    JSON.parse(value);
    return value;
  } catch (error) {
    return JSON.stringify(value);
  }
}

function normalizeTypeCommande(value) {
  const valueClean = cleanString(value);

  if (!valueClean) {
    return null;
  }

  const valueLower = valueClean.toLowerCase();

  if (valueLower === "vrac") {
    return "vrac";
  }

  if (valueLower === "conditionné") {
    return "conditionné";
  }

  if (valueLower === "conditionne") {
    return "conditionné";
  }

  return valueClean;
}

// ============================================================
// GENERATION REFERENCE
// ============================================================
//
// Exemple :
// ID 85 + 1 = 86
//
// vrac        => 86V2026
// conditionné => 86B2026
//
// ============================================================

function generateReference(id, typeCommande) {
  const numero = Number(id) + 1;

  const type = normalizeTypeCommande(typeCommande);

  const lettre = type === "vrac" ? "V" : "B";

  const annee = new Date().getFullYear();

  return `${numero}${lettre}${annee}`;
}

// ============================================================
// GET VISITOR
// ============================================================

async function getVisitorById(id) {
  const visitorId = Number(id);

  if (!Number.isInteger(visitorId) || visitorId <= 0) {
    throw new Error("Identifiant visiteur invalide.");
  }

  const [rows] = await pool.query(
    `
      SELECT *
      FROM visiteurs
      WHERE id = ?
      LIMIT 1
    `,
    [visitorId]
  );

  if (!rows.length) {
    throw new Error("Visiteur introuvable.");
  }

  return rows[0];
}

// ============================================================
// PDF GENERATION
// ============================================================
//
// pdf.jsx envoie le HTML complet avec :
// pdfHtml
//
// Puppeteer utilise page.setContent().
//
// IMPORTANT :
// page.pdf() peut retourner un Uint8Array selon la version
// de Puppeteer.
//
// On convertit donc toujours le résultat en Buffer Node.js.
// Cela évite notamment :
// "source.on is not a function"
// lors de l'upload FormData vers Meta.
// ============================================================

async function generatePdfFromHtml(htmlContent) {
  let browser = null;

  try {
    if (!htmlContent || typeof htmlContent !== "string") {
      throw new Error("Contenu HTML du PDF manquant.");
    }

    if (htmlContent.trim().length < 100) {
      throw new Error(
        "Contenu HTML du PDF trop court ou invalide."
      );
    }

    console.log("=======================================");
    console.log("GÉNÉRATION PDF AVEC PUPPETEER");
    console.log("HTML reçu :", htmlContent.length, "caractères");
    console.log("=======================================");

    browser = await puppeteer.launch({
      headless: true,

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: 1280,
      height: 1800,
      deviceScaleFactor: 1,
    });

    // --------------------------------------------------------
    // Injecter directement le HTML
    // --------------------------------------------------------

    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    // --------------------------------------------------------
    // Vérifier le document
    // --------------------------------------------------------

    const documentExists = await page.evaluate(() => {
      return Boolean(document.querySelector(".document"));
    });

    if (!documentExists) {
      console.warn(
        "⚠️ L'élément .document n'a pas été trouvé dans le HTML."
      );
    }

    // --------------------------------------------------------
    // Media screen
    // --------------------------------------------------------

    await page.emulateMediaType("screen");

    // --------------------------------------------------------
    // Génération PDF
    // --------------------------------------------------------

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
    });

    // ========================================================
    // IMPORTANT
    // Conversion explicite en Buffer Node.js
    // ========================================================

    const pdfBuffer = Buffer.from(pdfData);

    console.log(
      "✅ PDF généré :",
      pdfBuffer.length,
      "bytes"
    );

    console.log(
      "Type PDF :",
      Buffer.isBuffer(pdfBuffer)
        ? "Buffer Node.js"
        : typeof pdfBuffer
    );

    await browser.close();

    browser = null;

    return pdfBuffer;
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
  const host = process.env.SMTP_HOST;

  const port = Number(
    process.env.SMTP_PORT || 465
  );

  const secure =
    String(
      process.env.SMTP_SECURE || "true"
    ).toLowerCase() === "true";

  const user = process.env.SMTP_USER;

  const pass = process.env.SMTP_PASS;

  if (!host) {
    throw new Error(
      "SMTP_HOST est manquant dans .env"
    );
  }

  if (!user) {
    throw new Error(
      "SMTP_USER est manquant dans .env"
    );
  }

  if (!pass) {
    throw new Error(
      "SMTP_PASS est manquant dans .env"
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,

    auth: {
      user,
      pass,
    },
  });
}

// ============================================================
// ROUTE TEST
// ============================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "OLIVED API fonctionne correctement.",
  });
});

// ============================================================
// TEST DATABASE
// ============================================================

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT 1 AS test"
    );

    res.json({
      success: true,
      message: "Connexion MySQL réussie.",
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
      error: error.message,
    });
  }
});

// ============================================================
// POST - AJOUT VISITEUR
// ============================================================

app.post(
  "/api/visiteurs",
  async (req, res) => {
    try {
      console.log(
        "======================================="
      );

      console.log(
        "NOUVEAU VISITEUR"
      );

      console.log(
        "======================================="
      );

      const body = req.body || {};

      // ------------------------------------------------------
      // INFORMATIONS GENERALES
      // ------------------------------------------------------

      const nom = cleanString(
        body.nom
      );

      const prenom = cleanString(
        body.prenom
      );

      const email = cleanString(
        body.email
      );

      const age =
        body.age === undefined ||
        body.age === null ||
        body.age === ""
          ? null
          : Number(body.age);

      const origine = cleanString(
        body.origine
      );

      const indicatif = cleanString(
        body.indicatif
      );

      const telephone = cleanString(
        body.telephone
      );

      const societe = cleanString(
        body.societe ||
          body.adresse_societe
          ? body.societe
          : body.company
      );

      const adresse_societe =
        cleanString(
          body.adresse_societe
        );

      const fonction = cleanString(
        body.fonction
      );

      const langue_communication =
        cleanString(
          body.langue_communication
        );

      const profile = cleanString(
        body.profile ||
          body.profil
      );

      const type_commande =
        normalizeTypeCommande(
          body.type_commande
        );

      // ------------------------------------------------------
      // VRAC
      // ------------------------------------------------------

      const qualite_grade =
        cleanString(
          body.qualite_grade
        );

      const volume_estime =
        cleanString(
          body.volume_estime
        );

      const destination =
        cleanString(
          body.destination
        );

      const incoterm =
        cleanString(
          body.incoterm
        );

      const format_livraison =
        cleanString(
          body.format_livraison
        );

      const frequence =
        cleanString(
          body.frequence
        );

      const exigences =
        cleanJson(
          body.exigences
        );

      const infos =
        cleanString(
          body.infos
        );

      // ------------------------------------------------------
      // CONDITIONNE
      // ------------------------------------------------------

      const pays_conditionne =
        cleanString(
          body.pays_conditionne
        );

      const canal =
        cleanString(
          body.canal
        );

      const volumes_conditionne =
        cleanJson(
          body.volumes_conditionne ||
            body.volumes ||
            body.volumes_souhaites
        );

      // ------------------------------------------------------
      // EMBALLAGE
      // ------------------------------------------------------

      const type_emballage =
        cleanJson(
          body.type_emballage ||
            body.emballagesSelectionnes ||
            body.emballages
        );

      const packaging =
        cleanJson(
          body.packaging ||
            body.formatsEmballage
        );

      const formats_souhaites =
        cleanJson(
          body.formats_souhaites ||
            body.formatsSouhaites
        );

      // ------------------------------------------------------
      // MARQUE
      // ------------------------------------------------------

      const type_marque =
        cleanString(
          body.type_marque
        );

      const marche_cible =
        cleanString(
          body.marche_cible
        );

      const quantite_prevue =
        cleanJson(
          body.quantite_prevue
        );

      const nouvelle_marque_formats =
        cleanJson(
          body.nouvelle_marque_formats
        );

      const nouvelle_marque_design_conditionnement =
        cleanString(
          body.nouvelle_marque_design_conditionnement
        );

      // ------------------------------------------------------
      // CONTENEUR
      // ------------------------------------------------------

      const type_conteneur =
        cleanString(
          body.type_conteneur
        );

      const nombre_palettes =
        body.nombre_palettes === undefined ||
        body.nombre_palettes === null ||
        body.nombre_palettes === ""
          ? null
          : Number(body.nombre_palettes);

      // ------------------------------------------------------
      // SQL
      // ------------------------------------------------------

      const sql = `
        INSERT INTO visiteurs (
          nom,
          prenom,
          email,
          age,
          origine,
          indicatif,
          telephone,
          societe,
          adresse_societe,
          fonction,
          langue_communication,
          profile,
          type_commande,

          qualite_grade,
          volume_estime,
          destination,
          incoterm,
          format_livraison,
          frequence,
          exigences,
          infos,

          pays_conditionne,
          canal,
          volumes_conditionne,

          type_emballage,
          packaging,
          formats_souhaites,

          type_marque,
          marche_cible,
          quantite_prevue,
          nouvelle_marque_formats,
          nouvelle_marque_design_conditionnement,

          type_conteneur,
          nombre_palettes
        )

        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?
        )
      `;

      const values = [
        nom,
        prenom,
        email,
        age,
        origine,
        indicatif,
        telephone,
        societe,
        adresse_societe,
        fonction,
        langue_communication,
        profile,
        type_commande,

        qualite_grade,
        volume_estime,
        destination,
        incoterm,
        format_livraison,
        frequence,
        exigences,
        infos,

        pays_conditionne,
        canal,
        volumes_conditionne,

        type_emballage,
        packaging,
        formats_souhaites,

        type_marque,
        marche_cible,
        quantite_prevue,
        nouvelle_marque_formats,
        nouvelle_marque_design_conditionnement,

        type_conteneur,
        nombre_palettes,
      ];

      const [result] =
        await pool.execute(
          sql,
          values
        );

      const insertedId =
        result.insertId;

      // ------------------------------------------------------
      // REFERENCE
      // ------------------------------------------------------

      const reference =
        generateReference(
          insertedId,
          type_commande
        );

      await pool.execute(
        `
          UPDATE visiteurs
          SET reference = ?
          WHERE id = ?
        `,
        [
          reference,
          insertedId,
        ]
      );

      console.log(
        "✅ Visiteur enregistré"
      );

      console.log(
        "ID :",
        insertedId
      );

      console.log(
        "REFERENCE :",
        reference
      );

      res.status(201).json({
        success: true,

        message:
          "Visiteur enregistré avec succès.",

        id: insertedId,

        reference,

        type_commande,
      });
    } catch (error) {
      console.error(
        "======================================="
      );

      console.error(
        "❌ ERREUR AJOUT VISITEUR"
      );

      console.error(
        "======================================="
      );

      console.error(error);

      res.status(500).json({
        success: false,

        message:
          "Erreur lors de l'enregistrement du visiteur.",

        error: error.message,

        sqlMessage:
          error.sqlMessage,

        sqlCode:
          error.code,
      });
    }
  }
);

// ============================================================
// GET - TOUS LES VISITEURS
// ============================================================

app.get(
  "/api/visiteurs",
  async (req, res) => {
    try {
      const [rows] =
        await pool.query(
          `
            SELECT *
            FROM visiteurs
            ORDER BY id DESC
          `
        );

      res.json({
        success: true,
        count: rows.length,
        data: rows,
      });
    } catch (error) {
      console.error(
        "❌ GET VISITEURS :",
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
// GET - VISITEUR PAR ID
// ============================================================

app.get(
  "/api/visiteurs/:id",
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

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

      // ------------------------------------------------------
      // Si ancienne donnée sans référence
      // ------------------------------------------------------

      if (!visitor.reference) {
        const reference =
          generateReference(
            visitor.id,
            visitor.type_commande
          );

        try {
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
        } catch (
          referenceError
        ) {
          console.error(
            "⚠️ Impossible de sauvegarder la référence :",
            referenceError.message
          );

          visitor.reference =
            reference;
        }
      }

      res.json({
        success: true,

        data: visitor,

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

      res.status(500).json({
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
// PUT - MODIFIER VISITEUR
// ============================================================

app.put(
  "/api/visiteurs/:id",
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

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

      const body =
        req.body || {};

      const fields = [];
      const values = [];

      const allowedFields = [
        "nom",
        "prenom",
        "email",
        "age",
        "origine",
        "indicatif",
        "telephone",
        "societe",
        "adresse_societe",
        "fonction",
        "langue_communication",
        "profile",
        "type_commande",

        "qualite_grade",
        "volume_estime",
        "destination",
        "incoterm",
        "format_livraison",
        "frequence",
        "exigences",
        "infos",

        "pays_conditionne",
        "canal",
        "volumes_conditionne",

        "type_emballage",
        "packaging",
        "formats_souhaites",

        "type_marque",
        "marche_cible",
        "quantite_prevue",
        "nouvelle_marque_formats",
        "nouvelle_marque_design_conditionnement",

        "type_conteneur",
        "nombre_palettes",

        "qualification",
      ];

      for (
        const field of allowedFields
      ) {
        if (
          body[field] !== undefined
        ) {
          fields.push(
            `${field} = ?`
          );

          if (
            [
              "exigences",
              "volumes_conditionne",
              "type_emballage",
              "packaging",
              "formats_souhaites",
              "quantite_prevue",
              "nouvelle_marque_formats",
            ].includes(field)
          ) {
            values.push(
              cleanJson(
                body[field]
              )
            );
          } else {
            values.push(
              body[field]
            );
          }
        }
      }

      if (!fields.length) {
        return res.status(400).json({
          success: false,

          message:
            "Aucune donnée à modifier.",
        });
      }

      values.push(id);

      const sql = `
        UPDATE visiteurs
        SET ${fields.join(", ")}
        WHERE id = ?
      `;

      await pool.execute(
        sql,
        values
      );

      const visitor =
        await getVisitorById(id);

      res.json({
        success: true,

        message:
          "Visiteur modifié avec succès.",

        data: visitor,
      });
    } catch (error) {
      console.error(
        "❌ PUT VISITEUR :",
        error
      );

      res.status(500).json({
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
// DELETE - SUPPRIMER VISITEUR
// ============================================================

app.delete(
  "/api/visiteurs/:id",
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

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
// QUALIFICATION - POST
// ============================================================

app.post(
  "/api/visiteurs/:id/qualification",
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

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

      const qualification =
        cleanString(
          req.body?.qualification
        );

      if (!qualification) {
        return res.status(400).json({
          success: false,

          message:
            "La qualification est obligatoire.",
        });
      }

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

      const visitor =
        await getVisitorById(id);

      res.json({
        success: true,

        message:
          "Qualification enregistrée avec succès.",

        qualification,

        data: visitor,
      });
    } catch (error) {
      console.error(
        "❌ ERREUR QUALIFICATION :",
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
// QUALIFICATION - PUT
// ============================================================

app.put(
  "/api/visiteurs/:id/qualification",
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

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

      const qualification =
        cleanString(
          req.body?.qualification
        );

      if (!qualification) {
        return res.status(400).json({
          success: false,

          message:
            "La qualification est obligatoire.",
        });
      }

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

      res.json({
        success: true,

        message:
          "Qualification mise à jour.",

        qualification,
      });
    } catch (error) {
      console.error(
        "❌ PUT QUALIFICATION :",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Erreur qualification.",

        error:
          error.message,
      });
    }
  }
);

// ============================================================
// EMAIL - ENVOYER LE PDF
// ============================================================
//
// pdf.jsx envoie :
//
// {
//   visitorId,
//   reference,
//   nomComplet,
//   toEmail,
//   pdfHtml
// }
//
// ============================================================

app.post(
  "/api/email/send",
  async (req, res) => {
    try {
      console.log("");
      console.log(
        "======================================="
      );
      console.log(
        "ENVOI EMAIL"
      );
      console.log(
        "======================================="
      );

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

      console.log(
        "Visitor ID :",
        id
      );

      console.log(
        "Reference reçue :",
        reference
      );

      console.log(
        "PDF HTML :",
        pdfHtml
          ? `${pdfHtml.length} caractères`
          : "MANQUANT"
      );

      // ------------------------------------------------------
      // Vérification ID
      // ------------------------------------------------------

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

      // ------------------------------------------------------
      // Vérification HTML
      // ------------------------------------------------------

      if (
        !pdfHtml ||
        typeof pdfHtml !==
          "string" ||
        pdfHtml.trim()
          .length < 100
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Le contenu HTML du PDF est manquant ou invalide.",
        });
      }

      // ------------------------------------------------------
      // Visiteur
      // ------------------------------------------------------

      const visitor =
        await getVisitorById(id);

      // ------------------------------------------------------
      // Reference
      // ------------------------------------------------------

      let finalReference =
        cleanString(reference) ||
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

      // ------------------------------------------------------
      // Destinataire
      // ------------------------------------------------------

      const recipient =
        cleanString(toEmail) ||
        cleanString(
          visitor.email
        ) ||
        cleanString(
          process.env.EMAIL_TO
        ) ||
        "Contact@olived.tn";

      console.log(
        "Destinataire :",
        recipient
      );

      console.log(
        "Référence finale :",
        finalReference
      );

      // ------------------------------------------------------
      // Génération PDF
      // ------------------------------------------------------

      const pdfBuffer =
        await generatePdfFromHtml(
          pdfHtml
        );

      console.log(
        "PDF prêt pour email :",
        pdfBuffer.length,
        "bytes"
      );

      // ------------------------------------------------------
      // SMTP
      // ------------------------------------------------------

      const transporter =
        createEmailTransporter();

      await transporter.verify();

      console.log(
        "✅ SMTP OK"
      );

      // ------------------------------------------------------
      // Nom client
      // ------------------------------------------------------

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

      // ------------------------------------------------------
      // Email
      // ------------------------------------------------------

      const mailSubject =
        `Official Price Offer OLIVED - ${finalReference}`;

      const mailText =
        cleanString(message) ||
        `Dear ${finalNomComplet},

        I hope you are doing well.

        Please find attached our quotation for the requested olive oil products.
        
        The offer includes the product specifications, packaging options, quantities, and corresponding prices. Should you require any modifications regarding volumes, packaging, delivery terms, or payment conditions, we would be pleased to review the offer accordingly.
        
        Please do not hesitate to contact us should you need any further information or clarification.
        
        We look forward to hearing from you and hope to have the opportunity to work with you.

Reference: ${finalReference}

Best regards,
OLIVED`;

      const mailHtml = `
        <div
          style="
            font-family: Arial, sans-serif;
            line-height: 1.6;
          "
        >
          <p>
            Dear ${finalNomComplet},
          </p>

          <p>
          I hope you are doing well.

          Please find attached our quotation for the requested olive oil products.
          
          The offer includes the product specifications, packaging options, quantities, and corresponding prices. Should you require any modifications regarding volumes, packaging, delivery terms, or payment conditions, we would be pleased to review the offer accordingly.
          
          Please do not hesitate to contact us should you need any further information or clarification.
          
          We look forward to hearing from you and hope to have the opportunity to work with you.
          </p>

          <p>
            <strong>Reference:</strong>
            ${finalReference}
          </p>

          <p>
            Best regards,<br>
            <strong>OLIVED</strong>
          </p>
        </div>
      `;

      const info =
        await transporter.sendMail({
          from:
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

      console.log(
        "======================================="
      );

      console.log(
        "✅ EMAIL ENVOYÉ"
      );

      console.log(
        "Message ID :",
        info.messageId
      );

      console.log(
        "Destinataire :",
        recipient
      );

      console.log(
        "Reference :",
        finalReference
      );

      console.log(
        "======================================="
      );

      res.json({
        success: true,

        message:
          "Email envoyé avec succès.",

        messageId:
          info.messageId,

        reference:
          finalReference,

        recipient,

        filename:
          `Official_Price_Offer_${finalReference}.pdf`,
      });
    } catch (error) {
      console.error(
        "======================================="
      );

      console.error(
        "❌ ERREUR ENVOI EMAIL"
      );

      console.error(
        "======================================="
      );

      console.error(error);

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
// WHATSAPP - ENVOYER PDF
// ============================================================
//
// pdf.jsx envoie :
//
// {
//   visitorId,
//   reference,
//   telephone,
//   nomComplet,
//   pdfHtml
// }
//
// ============================================================

app.post(
  "/api/whatsapp/send",
  async (req, res) => {
    try {
      console.log("");
      console.log(
        "======================================="
      );
      console.log(
        "ENVOI WHATSAPP"
      );
      console.log(
        "======================================="
      );

      const {
        visitorId,
        visiteurId,
        reference,
        telephone,
        nomComplet,
        pdfHtml,
      } = req.body || {};

      const id =
        Number(
          visitorId ||
            visiteurId
        );

      console.log(
        "Visitor ID :",
        id
      );

      console.log(
        "Reference :",
        reference
      );

      console.log(
        "PDF HTML :",
        pdfHtml
          ? `${pdfHtml.length} caractères`
          : "MANQUANT"
      );

      // ------------------------------------------------------
      // Vérification ID
      // ------------------------------------------------------

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

      // ------------------------------------------------------
      // Vérification HTML
      // ------------------------------------------------------

      if (
        !pdfHtml ||
        typeof pdfHtml !==
          "string" ||
        pdfHtml.trim()
          .length < 100
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Le contenu HTML du PDF est manquant ou invalide.",
        });
      }

      // ------------------------------------------------------
      // VISITEUR
      // ------------------------------------------------------

      const visitor =
        await getVisitorById(id);

      // ------------------------------------------------------
      // REFERENCE
      // ------------------------------------------------------

      let finalReference =
        cleanString(reference) ||
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

      // ------------------------------------------------------
      // TELEPHONE
      // ------------------------------------------------------

      let indicatif =
        cleanString(
          visitor.indicatif
        ) || "";

      let phone =
        cleanString(
          telephone
        ) ||
        cleanString(
          visitor.telephone
        ) ||
        "";

      // ------------------------------------------------------
      // Nettoyage indicatif
      // ------------------------------------------------------

      indicatif =
        indicatif.replace(
          /[^\d+]/g,
          ""
        );

      // ------------------------------------------------------
      // Nettoyage téléphone
      // ------------------------------------------------------

      phone =
        phone.replace(
          /\D/g,
          ""
        );

      // ------------------------------------------------------
      // Construire numéro complet
      // ------------------------------------------------------

      let whatsappNumber =
        `${indicatif}${phone}`;

      whatsappNumber =
        whatsappNumber.replace(
          /\D/g,
          ""
        );

      // ------------------------------------------------------
      // Cas où le téléphone envoyé
      // contient déjà le préfixe
      // ------------------------------------------------------

      if (
        whatsappNumber.startsWith(
          "00"
        )
      ) {
        whatsappNumber =
          whatsappNumber.substring(2);
      }

      // ------------------------------------------------------
      // Vérification
      // ------------------------------------------------------

      if (!whatsappNumber) {
        return res.status(400).json({
          success: false,

          message:
            "Numéro de téléphone WhatsApp introuvable.",
        });
      }

      console.log(
        "Numéro WhatsApp :",
        whatsappNumber
      );

      // ------------------------------------------------------
      // PDF
      // ------------------------------------------------------

      const pdfBuffer =
        await generatePdfFromHtml(
          pdfHtml
        );

      console.log(
        "PDF WhatsApp généré :",
        pdfBuffer.length,
        "bytes"
      );

      // ------------------------------------------------------
      // Vérifier Buffer
      // ------------------------------------------------------

      if (
        !Buffer.isBuffer(
          pdfBuffer
        )
      ) {
        throw new Error(
          "Le PDF généré n'est pas un Buffer Node.js."
        );
      }

      console.log(
        "Buffer PDF OK :",
        Buffer.isBuffer(
          pdfBuffer
        )
      );

      // ------------------------------------------------------
      // VARIABLES META
      // ------------------------------------------------------

      const accessToken =
        process.env.WHATSAPP_ACCESS_TOKEN;

      const phoneNumberId =
        process.env.WHATSAPP_PHONE_NUMBER_ID;

      const graphVersion =
        process.env.WHATSAPP_GRAPH_VERSION ||
        "v23.0";

      if (!accessToken) {
        return res.status(500).json({
          success: false,

          message:
            "WHATSAPP_ACCESS_TOKEN est manquant dans .env",
        });
      }

      if (!phoneNumberId) {
        return res.status(500).json({
          success: false,

          message:
            "WHATSAPP_PHONE_NUMBER_ID est manquant dans .env",
        });
      }

      // ------------------------------------------------------
      // URL MEDIA
      // ------------------------------------------------------

      const uploadUrl =
        `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/media`;

      console.log(
        "Upload URL :",
        uploadUrl
      );

      // ------------------------------------------------------
      // FORMDATA
      // ------------------------------------------------------

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

      // ======================================================
      // CORRECTION PRINCIPALE
      // ======================================================
      //
      // On utilise un vrai Readable Stream Node.js.
      //
      // Cela évite :
      //
      // source.on is not a function
      //
      // ======================================================

      const pdfStream =
        Readable.from(
          pdfBuffer
        );

      form.append(
        "file",
        pdfStream,
        {
          filename:
            `Official_Price_Offer_${finalReference}.pdf`,

          contentType:
            "application/pdf",

          knownLength:
            pdfBuffer.length,
        }
      );

      // ------------------------------------------------------
      // HEADERS
      // ------------------------------------------------------

      const formHeaders =
        form.getHeaders();

      const uploadHeaders = {
        ...formHeaders,

        Authorization:
          `Bearer ${accessToken}`,
      };

      console.log(
        "Envoi PDF vers Meta..."
      );

      // ------------------------------------------------------
      // UPLOAD MEDIA
      // ------------------------------------------------------

      const uploadResponse =
        await axios.post(
          uploadUrl,

          form,

          {
            headers:
              uploadHeaders,

            maxContentLength:
              Infinity,

            maxBodyLength:
              Infinity,

            timeout:
              60000,
          }
        );

      console.log(
        "Réponse upload Meta :",
        JSON.stringify(
          uploadResponse.data,
          null,
          2
        )
      );

      // ------------------------------------------------------
      // MEDIA ID
      // ------------------------------------------------------

      const mediaId =
        uploadResponse.data?.id;

      if (!mediaId) {
        throw new Error(
          "WhatsApp n'a pas retourné de media ID."
        );
      }

      console.log(
        "✅ Media ID WhatsApp :",
        mediaId
      );

      // ------------------------------------------------------
      // NOM CLIENT
      // ------------------------------------------------------

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

      console.log(
        "Nom client :",
        finalNomComplet
      );

      // ------------------------------------------------------
      // URL MESSAGES
      // ------------------------------------------------------

      const sendUrl =
        `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;

      // ------------------------------------------------------
      // MESSAGE WHATSAPP
      // ------------------------------------------------------

      const whatsappPayload = {
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

      console.log(
        "Envoi document WhatsApp..."
      );

      // ------------------------------------------------------
      // ENVOI MESSAGE
      // ------------------------------------------------------

      const whatsappResponse =
        await axios.post(
          sendUrl,

          whatsappPayload,

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

      // ------------------------------------------------------
      // RESULTAT
      // ------------------------------------------------------

      const messageId =
        whatsappResponse.data
          ?.messages?.[0]?.id;

      console.log(
        "======================================="
      );

      console.log(
        "✅ WHATSAPP ENVOYÉ"
      );

      console.log(
        "Message ID :",
        messageId
      );

      console.log(
        "Numéro :",
        whatsappNumber
      );

      console.log(
        "Reference :",
        finalReference
      );

      console.log(
        "======================================="
      );

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
        "======================================="
      );

      console.error(
        "❌ ERREUR WHATSAPP"
      );

      console.error(
        "======================================="
      );

      console.error(
        "Message :",
        error.message
      );

      // ------------------------------------------------------
      // Erreur Axios / Meta
      // ------------------------------------------------------

      if (error.response) {
        console.error(
          "HTTP :",
          error.response.status
        );

        console.error(
          "DATA :",
          JSON.stringify(
            error.response.data,
            null,
            2
          )
        );

        console.error(
          "HEADERS :",
          JSON.stringify(
            error.response.headers,
            null,
            2
          )
        );
      }

      // ------------------------------------------------------
      // Réponse utilisateur
      // ------------------------------------------------------

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
// ROUTE - TUNISIE + VRAC
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

      res.json({
        success: true,

        count:
          rows.length,

        data:
          rows,
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
// START SERVER
// ============================================================

async function startServer() {
  try {
    // --------------------------------------------------------
    // TEST MYSQL
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // START EXPRESS
    // --------------------------------------------------------

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log("");

        console.log(
          "======================================="
        );

        console.log(
          "OLIVED SERVER"
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
          "API test :"
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

    console.error(error);

    process.exit(1);
  }
}

// ============================================================
// LANCEMENT
// ============================================================

startServer();