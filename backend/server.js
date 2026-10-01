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


// ============================================================
// APP
// ============================================================

const app = express();

const PORT = Number(process.env.PORT || 5000);


// ============================================================
// MIDDLEWARE
// ============================================================

// CORS
app.use(cors());

// JSON
app.use(
  express.json({
    limit: "15mb",
  })
);

// Form data
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
    console.error("❌ ERREUR MYSQL :", error.message);
  });


// ============================================================
// RENDRE MYSQL DISPONIBLE DANS LES ROUTES
// ============================================================

app.locals.db = pool;


// ============================================================
// ROUTES AUTHENTIFICATION
// ============================================================

const authRoutes = require("./routes/auth");

app.use("/api/auth", authRoutes);


// ============================================================
// ROUTES ADMIN
// ============================================================

const adminRoutes = require("./routes/admin");

app.use("/api/admin", adminRoutes);


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
// TEST SERVEUR
// ============================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API OLIVED fonctionne",
  });
});


// ============================================================
// TEST AUTH
// ============================================================

// Cette route permet de vérifier que /api/auth est bien chargé.
// Tu peux ensuite la supprimer si tu veux.

app.get("/api/test-auth", (req, res) => {
  res.json({
    success: true,
    message: "Serveur et routes principales fonctionnent",
  });
});


// ============================================================
// TES AUTRES ROUTES EXISTANTES
// ============================================================
//
// ⚠️ IMPORTANT :
// À partir d'ici, garde tout ton code actuel.
//
// Exemple :
//
// app.post("/api/visiteurs", ...);
// app.get("/api/visiteurs", ...);
// app.get("/api/visiteurs/:id", ...);
// app.put(...);
// app.post("/api/email/send", ...);
// etc.
//
// NE REMPLACE PAS tes routes existantes par des exemples.
//


// ============================================================
// DEMARRAGE SERVEUR
// ============================================================

app.listen(PORT, () => {
  console.log("=================================");
  console.log("🚀 SERVEUR DÉMARRÉ");
  console.log(`📡 http://localhost:${PORT}`);
  console.log(`🔐 Auth : http://localhost:${PORT}/api/auth`);
  console.log(`👑 Admin : http://localhost:${PORT}/api/admin`);
  console.log("=================================");
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
    const valueClean = value.trim();

    if (
      valueClean === "" ||
      valueClean === "null"
    ) {
      return null;
    }

    try {
      const parsed = JSON.parse(valueClean);

      return JSON.stringify(parsed);
    } catch (error) {
      return JSON.stringify(valueClean);
    }
  }

  return JSON.stringify(value);
}

// ============================================================
// PARSE JSON
// ============================================================

function parseJson(value, fallback = null) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  if (typeof value === "object") {
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
  const valueClean = cleanString(value);

  if (!valueClean) {
    return null;
  }

  const lower = valueClean.toLowerCase();

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
// COMMANDES MULTIPLES
// ============================================================
//
// Exemple :
//
// commandes: [
//   {
//     type_commande: "vrac",
//     categorie: "...",
//     volume_estime: "..."
//   },
//   {
//     type_commande: "vrac",
//     categorie: "...",
//     volume_estime: "..."
//   }
// ]
//
// Impossible de mélanger :
//
// Vrac + Conditionné
//
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
//
// ID 85 + 1 + V + 2026
// => 86V2026
//
// ID 85 + 1 + B + 2026
// => 86B2026
//
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
        waitUntil:
          "networkidle0",
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
// EMAIL
// ============================================================

function createEmailTransporter() {
  const host =
    process.env.SMTP_HOST;

  const port =
    Number(
      process.env.SMTP_PORT || 465
    );

  const secure =
    String(
      process.env.SMTP_SECURE ||
        "true"
    ).toLowerCase() ===
    "true";

  const user =
    process.env.SMTP_USER;

  const pass =
    process.env.SMTP_PASS;

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

app.post(
  "/api/visiteurs",
  authenticateToken,
  requireUser,
  async (req, res) => {

    try {

      const {
        nom,
        prenom,
        email
      } = req.body;

      // Le commercial connecté
      const commercialId = req.user.id;

      console.log("Utilisateur connecté :", req.user);

      console.log(
        "Visiteur créé par commercial ID :",
        commercialId
      );

      // Ton INSERT ici
      // ...

      res.json({
        success: true,
        message: "Visiteur ajouté",
        commercial_id: commercialId
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);

// ============================================================
// POST VISITEUR
// ============================================================

app.post(
  "/api/visiteurs",
  async (req, res) => {
    try {
      const body =
        req.body || {};

      console.log("");
      console.log(
        "======================================="
      );
      console.log(
        "NOUVEAU VISITEUR"
      );
      console.log(
        "======================================="
      );

      // ======================================================
      // INFORMATIONS GENERALES
      // ======================================================

      const nom =
        cleanString(
          body.nom
        );

      const prenom =
        cleanString(
          body.prenom
        );

      const email =
        cleanString(
          body.email
        );

      const origine =
        cleanString(
          body.origine
        );

      const indicatif =
        cleanString(
          body.indicatif
        );

      const telephone =
        cleanString(
          body.telephone
        );

      const societe =
        cleanString(
          body.societe ??
          body.company
        );

      const adresse_societe =
        cleanString(
          body.adresse_societe
        );

      const fonction =
        cleanString(
          body.fonction
        );

      const genre =
        cleanString(
          body.genre
        );

      const langue_communication =
        cleanString(
          body.langue_communication
        );

      const profile =
        cleanString(
          body.profile ??
          body.profil
        );

      const site =
        cleanString(
          body.site
        );

      const site_web =
        cleanString(
          body.site_web ??
          body.siteWeb
        );

      const nom_entreprise =
        cleanString(
          body.nom_entreprise
        );

      const contact_professionnel =
        cleanString(
          body.contact_professionnel
        );

      const periode_volume =
        cleanString(
          body.periode_volume
        );

      // ======================================================
      // TYPE COMMANDE
      // ======================================================

      const type_commande =
        normalizeTypeCommande(
          body.type_commande
        );

      // ======================================================
      // QUALIFICATION
      // ======================================================

      let qualification = null;

      if (
        body.qualification !==
          undefined &&
        body.qualification !==
          null &&
        body.qualification !== ""
      ) {
        const q =
          Number(
            body.qualification
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

        qualification = q;
      }

      // ======================================================
      // VRAC
      // ======================================================

      const categorie =
        cleanString(
          body.categorie
        );

      const qualite_grade =
        cleanString(
          body.qualite_grade
        );

      let volume_estime = null;

      if (
        body.volume_estime !==
          undefined &&
        body.volume_estime !==
          null &&
        body.volume_estime !== ""
      ) {
        volume_estime =
          Number(
            body.volume_estime
          );
      }

      const destination =
        cleanString(
          body.destination
        );

      const destinationport =
        cleanString(
          body.destinationport
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
          body.frequence ??
          body.frequence_commande
        );

      const exigences =
        cleanJson(
          body.exigences ??
          body.exigences_specifiques
        );

      const infos =
        cleanString(
          body.infos ??
          body.informations_complementaires
        );

      // ======================================================
      // CONDITIONNE
      // ======================================================

      const pays_conditionne =
        cleanString(
          body.pays_conditionne
        );

      const canal =
        cleanString(
          body.canal
        );

      const canal_distribution =
        cleanString(
          body.canal_distribution
        );

      const volumes_conditionne =
        cleanString(
          body.volumes_conditionne ??
          body.volumes_estimes ??
          body.volumes ??
          body.volumes_souhaites
        );

      // ======================================================
      // TYPE EMBALLAGE
      // ======================================================

      let type_emballage = null;

      if (
        body.type_emballage !==
          undefined &&
        body.type_emballage !==
          null
      ) {
        try {
          type_emballage =
            typeof body.type_emballage ===
            "string"
              ? JSON.stringify(
                  JSON.parse(
                    body.type_emballage
                  )
                )
              : JSON.stringify(
                  body.type_emballage
                );
        } catch (error) {
          return res.status(400).json({
            success: false,

            message:
              "Le champ type_emballage contient un JSON invalide.",
          });
        }
      }

      // ======================================================
      // PACKAGING
      // ======================================================

      const packaging =
        cleanJson(
          body.packaging ??
          body.formatsEmballage
        );

      // ======================================================
      // FORMATS
      // ======================================================

      const formats_souhaites =
        cleanJson(
          body.formats_souhaites ??
          body.formatsSouhaites
        );

      // ======================================================
      // MARQUE
      // ======================================================

      const type_marque =
        cleanString(
          body.type_marque
        );

      const nom_label =
        cleanString(
          body.nom_label
        );

      const marche_cible =
        cleanString(
          body.marche_cible
        );

      const quantite_prevue =
        cleanString(
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

      // ======================================================
      // CONTENEUR
      // ======================================================

      const type_conteneur =
        cleanString(
          body.type_conteneur
        );

      const nombre_fcl =
        body.nombre_fcl ===
          undefined ||
        body.nombre_fcl ===
          null ||
        body.nombre_fcl === ""
          ? null
          : Number(
              body.nombre_fcl
            );

      const nombre_palettes =
        body.nombre_palettes ===
          undefined ||
        body.nombre_palettes ===
          null ||
        body.nombre_palettes === ""
          ? null
          : Number(
              body.nombre_palettes
            );

      // ======================================================
      // CERTIFICATIONS
      // ======================================================

      const certifications_requises =
        cleanJson(
          body.certifications_requises
        );

      // ======================================================
      // EXIGENCES SPECIFIQUES
      // ======================================================

      const exigences_specifiques =
        cleanJson(
          body.exigences_specifiques
        );

      // ======================================================
      // COMMANDES MULTIPLES
      // ======================================================

      let commandes = null;

      try {
        commandes =
          normalizeCommandes(
            body.commandes,
            type_commande
          );
      } catch (error) {
        return res.status(400).json({
          success: false,

          message:
            error.message,
        });
      }

      const commandesSql =
        commandes === null
          ? null
          : JSON.stringify(
              commandes
            );

      console.log(
        "TYPE COMMANDE :",
        type_commande
      );

      console.log(
        "NOMBRE COMMANDES :",
        commandes
          ? commandes.length
          : 0
      );

      // ======================================================
      // SQL
      // ======================================================

      const sql = `
  INSERT INTO visiteurs (
    nom,
    prenom,
    email,
    origine,
    indicatif,
    telephone,
    societe,
    adresse_societe,
    fonction,
    site_web,
    nom_entreprise,
    langue_communication,
    profile,
    type_commande,
    categorie,
    qualite_grade,
    volume_estime,
    destination,
    destinationport,
    incoterm,
    format_livraison,
    frequence,
    exigences,
    infos,
    site,
    pays_conditionne,
    canal,
    canal_distribution,
    volumes_conditionne,
    type_emballage,
    packaging,
    formats_souhaites,
    contact_professionnel,
    type_marque,
    nom_label,
    marche_cible,
    quantite_prevue,
    nouvelle_marque_formats,
    nouvelle_marque_design_conditionnement,
    type_conteneur,
    nombre_fcl,
    nombre_palettes,
    certifications_requises,
    periode_volume,
    genre,
    exigences_specifiques,
    qualification,
    commandes,

    nom,
    prenom,
    email,
    commercial_id
  )
  VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?
  )
`;
      const values = [
        nom,
        prenom,
        email,
        origine,
        indicatif,
        telephone,
        societe,
        adresse_societe,
        fonction,
        site_web,
        nom_entreprise,
        langue_communication,
        profile,
        type_commande,
        categorie,
        qualite_grade,
        volume_estime,
        destination,
        destinationport,
        incoterm,
        format_livraison,
        frequence,
        exigences,
        infos,
        site,
        pays_conditionne,
        canal,
        canal_distribution,
        volumes_conditionne,
        type_emballage,
        packaging,
        formats_souhaites,
        contact_professionnel,
        type_marque,
        nom_label,
        marche_cible,
        quantite_prevue,
        nouvelle_marque_formats,
        nouvelle_marque_design_conditionnement,
        type_conteneur,
        nombre_fcl,
        nombre_palettes,
        certifications_requises,
        periode_volume,
        genre,
        exigences_specifiques,
        qualification,
        commandesSql,
        nom,
    prenom,
    email,
    commercialId,
      ];

      console.log("=======================================");
      console.log("DEBUG SQL INSERT");
      console.log("Nombre de valeurs :", values.length);
      
      const nombrePlaceholders = (sql.match(/\?/g) || []).length;
      
      console.log("Nombre de ? :", nombrePlaceholders);
      
      if (nombrePlaceholders !== values.length) {
        console.error("❌ ERREUR : nombre de colonnes/valeurs différent !");
        console.error("Placeholders :", nombrePlaceholders);
        console.error("Values :", values.length);
        console.error("Valeurs :", values);
      
        return res.status(500).json({
          success: false,
          error: "Nombre de colonnes SQL différent du nombre de valeurs",
          placeholders: nombrePlaceholders,
          values: values.length
        });
      }
      
      console.log("✅ Nombre de placeholders :", nombrePlaceholders);
      console.log("✅ Nombre de valeurs :", values.length);
      // ======================================================
      // INSERT
      // ======================================================

      const [result] =
        await pool.execute(
          sql,
          values
        );

      const insertedId =
        result.insertId;

      // ======================================================
      // REFERENCE
      // ======================================================

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

      // ======================================================
      // RESPONSE
      // ======================================================

      res.status(201).json({
        success: true,

        message:
          "Visiteur enregistré avec succès.",

        id:
          insertedId,

        reference,

        type_commande,

        qualification,

        commandes:
          commandes || [],
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

      console.error(
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Erreur lors de l'enregistrement du visiteur.",

        error:
          error.message,

        sqlMessage:
          error.sqlMessage,

        sqlCode:
          error.code,
      });
    }
  }
);

app.get(
  "/api/visiteurs",
  authenticateToken,
  requireUser,
  async (req, res) => {

    try {

      const [visiteurs] = await pool.query(
        `
        SELECT *
        FROM visiteurs
        ORDER BY id DESC
        `
      );

      res.json({
        success: true,
        visiteurs
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);
app.get(
  "/api/visiteurs",
  authenticateToken,
  requireUser,
  async (req, res) => {

    try {

      let visiteurs;

      // ADMIN
      if (req.user.role === "admin") {

        [visiteurs] = await pool.query(
          `
          SELECT *
          FROM visiteurs
          ORDER BY id DESC
          `
        );

      }

      // COMMERCIAL
      else {

        [visiteurs] = await pool.query(
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
        visiteurs
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);
app.get(
  "/api/admin/commerciaux",
  authenticateToken,
  requireAdmin,
  async (req, res) => {

    try {

      const [commerciaux] = await pool.query(
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
        commerciaux
      });

    } catch (error) {

      console.error(
        "GET COMMERCIAUX ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);
const bcrypt = require("bcryptjs");

app.post(
  "/api/admin/commerciaux",
  authenticateToken,
  requireAdmin,
  async (req, res) => {

    try {

      const {
        nom,
        prenom,
        email,
        password
      } = req.body;

      if (
        !nom ||
        !prenom ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message: "Tous les champs sont obligatoires"
        });
      }

      // Vérifier si l'email existe
      const [existing] = await pool.query(
        `
        SELECT id
        FROM users
        WHERE email = ?
        `,
        [email]
      );

      if (existing.length > 0) {

        return res.status(409).json({
          success: false,
          message: "Cet email existe déjà"
        });

      }

      // Hasher le mot de passe
      const hashedPassword =
        await bcrypt.hash(password, 10);

      // Créer le commercial
      const [result] = await pool.query(
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
        VALUES (?, ?, ?, ?, 'commercial', TRUE)
        `,
        [
          nom,
          prenom,
          email,
          hashedPassword
        ]
      );

      res.status(201).json({
        success: true,
        message: "Commercial créé avec succès",
        commercialId: result.insertId
      });

    } catch (error) {

      console.error(
        "CREATE COMMERCIAL ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);

app.put(
  "/api/admin/commerciaux/:id/desactiver",
  authenticateToken,
  requireAdmin,
  async (req, res) => {

    try {

      const { id } = req.params;

      const [result] = await pool.query(
        `
        UPDATE users
        SET actif = FALSE
        WHERE id = ?
        AND role = 'commercial'
        `,
        [id]
      );

      if (result.affectedRows === 0) {

        return res.status(404).json({
          success: false,
          message: "Commercial introuvable"
        });

      }

      res.json({
        success: true,
        message: "Commercial désactivé"
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);

app.put(
  "/api/admin/commerciaux/:id/activer",
  authenticateToken,
  requireAdmin,
  async (req, res) => {

    try {

      const { id } = req.params;

      const [result] = await pool.query(
        `
        UPDATE users
        SET actif = TRUE
        WHERE id = ?
        AND role = 'commercial'
        `,
        [id]
      );

      if (result.affectedRows === 0) {

        return res.status(404).json({
          success: false,
          message: "Commercial introuvable"
        });

      }

      res.json({
        success: true,
        message: "Commercial activé"
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);
app.get(
  "/api/auth/me",
  authenticateToken,
  async (req, res) => {

    try {

      const [users] = await pool.query(
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

      if (users.length === 0) {

        return res.status(404).json({
          success: false,
          message: "Utilisateur introuvable"
        });

      }

      res.json({
        success: true,
        user: users[0]
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);

// ============================================================
// GET TOUS LES VISITEURS
// ============================================================

/*app.get(
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
);*/

// ============================================================
// GET VISITEUR PAR ID
// ============================================================

app.get(
  "/api/visiteurs/:id",
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

      // ======================================================
      // REFERENCE
      // ======================================================

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

      // ======================================================
      // COMMANDES
      // ======================================================

      visitor.commandes =
        parseJson(
          visitor.commandes,
          []
        );

      res.json({
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
// PUT VISITEUR
// ============================================================

app.put(
  "/api/visiteurs/:id",
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
        "langue_communication",
        "profile",
        "site_web",
        "nom_entreprise",
        "type_commande",
        "categorie",
        "qualite_grade",
        "volume_estime",
        "destination",
        "destinationport",
        "canal_distribution",
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
        "nom_label",
        "marche_cible",
        "quantite_prevue",
        "nouvelle_marque_formats",
        "nouvelle_marque_design_conditionnement",
        "periode_volume",
        "type_conteneur",
        "nombre_fcl",
        "nombre_palettes",
        "contact_professionnel",
        "genre",
        "certifications_requises",
        "exigences_specifiques",
        "qualification",
        "commandes",
      ];

      const jsonFields = [
        "exigences",
        "volumes_conditionne",
        "type_emballage",
        "packaging",
        "formats_souhaites",
        "nouvelle_marque_formats",
        "certifications_requises",
        "exigences_specifiques",
      ];

      const fields = [];
      const values = [];

      for (
        const field of allowedFields
      ) {
        if (
          body[field] ===
          undefined
        ) {
          continue;
        }

        // ====================================================
        // COMMANDES
        // ====================================================

        if (
          field === "commandes"
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

          fields.push(
            "commandes = ?"
          );

          values.push(
            normalized === null
              ? null
              : JSON.stringify(
                  normalized
                )
          );

          continue;
        }

        // ====================================================
        // QUALIFICATION
        // ====================================================

        if (
          field ===
          "qualification"
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

        // ====================================================
        // JSON
        // ====================================================

        if (
          jsonFields.includes(
            field
          )
        ) {
          fields.push(
            `${field} = ?`
          );

          values.push(
            cleanJson(
              body[field]
            )
          );

          continue;
        }

        // ====================================================
        // TYPE COMMANDE
        // ====================================================

        if (
          field ===
          "type_commande"
        ) {
          const type =
            normalizeTypeCommande(
              body[field]
            );

          // Si le type change, on vérifie
          // les commandes existantes.
          if (
            currentVisitor.commandes &&
            type
          ) {
            const oldCommandes =
              parseJson(
                currentVisitor.commandes,
                []
              );

            if (
              oldCommandes.length
            ) {
              const oldType =
                normalizeTypeCommande(
                  currentVisitor.type_commande
                );

              if (
                oldType &&
                oldType !== type
              ) {
                return res.status(400).json({
                  success: false,

                  message:
                    "Impossible de changer le type de commande après l'ajout de commandes.",
                });
              }
            }
          }

          fields.push(
            "type_commande = ?"
          );

          values.push(type);

          continue;
        }

        // ====================================================
        // AUTRES
        // ====================================================

        fields.push(
          `${field} = ?`
        );

        values.push(
          body[field]
        );
      }

      if (
        !fields.length
      ) {
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

      const updated =
        await getVisitorById(id);

      updated.commandes =
        parseJson(
          updated.commandes,
          []
        );

      res.json({
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
// DELETE VISITEUR
// ============================================================

app.delete(
  "/api/visiteurs/:id",
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
      } =
        req.body || {};

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
        typeof pdfHtml !==
          "string" ||
        pdfHtml.trim().length <
          100
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

      if (
        !finalReference
      ) {
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

      await transporter.verify();

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
            font-family: Arial, sans-serif;
            line-height: 1.6;
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
// WHATSAPP - ENVOYER PDF
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
      } =
        req.body || {};

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
        typeof pdfHtml !==
          "string" ||
        pdfHtml.trim().length <
          100
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Le contenu HTML du PDF est manquant.",
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

      if (
        !finalReference
      ) {
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

      // ======================================================
      // NUMERO WHATSAPP
      // ======================================================

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
        whatsappNumber.startsWith(
          "00"
        )
      ) {
        whatsappNumber =
          whatsappNumber.substring(
            2
          );
      }

      // ======================================================
      // ENV WHATSAPP
      // ======================================================

      const accessToken =
        process.env
          .WHATSAPP_ACCESS_TOKEN;

      const phoneNumberId =
        process.env
          .WHATSAPP_PHONE_NUMBER_ID;

      const graphVersion =
        process.env
          .WHATSAPP_GRAPH_VERSION ||
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

      // ======================================================
      // GENERATION PDF
      // ======================================================

      const pdfBuffer =
        await generatePdfFromHtml(
          pdfHtml
        );

      // ======================================================
      // UPLOAD MEDIA WHATSAPP
      // ======================================================

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

      // ======================================================
      // ENVOI DOCUMENT
      // ======================================================

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
        whatsappResponse.data
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
// MIGRATION COMMANDES
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
    // CREATION AUTOMATIQUE COMMANDES
    // ========================================================

    await ensureCommandesColumn();

    // ========================================================
    // START
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