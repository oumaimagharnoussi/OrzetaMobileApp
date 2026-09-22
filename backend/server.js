// =====================================================
// SERVER NODE.JS + EXPRESS + MYSQL
// =====================================================

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
require("dotenv").config();

// =====================================================
// APPLICATION
// =====================================================

const app = express();

const PORT = 5000;

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json({ limit: "10mb" }));

app.use(express.urlencoded({ extended: true }));

// =====================================================
// CONFIGURATION MYSQL
// =====================================================

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "visiteurs_db",
  port: Number(process.env.DB_PORT || 3306),
};

// =====================================================
// CONNEXION MYSQL
// =====================================================

let db;

// =====================================================
// CONNEXION À LA BASE
// =====================================================

async function connectDatabase() {
  try {
    console.log("=================================");
    console.log("CONNEXION À MYSQL");
    console.log("=================================");

    db = await mysql.createPool({
      ...DB_CONFIG,

      waitForConnections: true,

      connectionLimit: 10,

      queueLimit: 0,
    });

    await db.query("SELECT 1");

    console.log("MYSQL CONNECTÉ");
    console.log("Base :", DB_CONFIG.database);

    console.log("=================================");
  } catch (error) {
    console.error("ERREUR MYSQL :");
    console.error(error);

    process.exit(1);
  }
}

// =====================================================
// ROUTE PRINCIPALE
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,

    message: "Backend Node.js fonctionne correctement.",

    database: DB_CONFIG.database,

    server: `http://192.168.1.146:${PORT}`,

    endpoint: "/api/visiteurs",
  });
});

// =====================================================
// TEST MYSQL
// =====================================================

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT 1 AS mysql_ok"
    );

    res.status(200).json({
      success: true,

      message: "Connexion MySQL OK.",

      result: rows,
    });
  } catch (error) {
    console.error(
      "ERREUR TEST MYSQL :",
      error
    );

    res.status(500).json({
      success: false,

      message: "Erreur de connexion à MySQL.",

      error: error.message,
    });
  }
});

// =====================================================
// AJOUTER UN VISITEUR
// =====================================================

app.post("/api/visiteurs", async (req, res) => {
  console.log("");
  console.log("=================================");
  console.log("NOUVELLE REQUÊTE POST VISITEUR");
  console.log("=================================");

  try {
    console.log("BODY REÇU :");

    console.log(
      JSON.stringify(
        req.body,
        null,
        2
      )
    );

    // =================================================
    // RÉCUPÉRATION DES DONNÉES
    // =================================================

    const {
      // -----------------------------------------------
      // INFORMATIONS GÉNÉRALES
      // -----------------------------------------------

      nom,
      prenom,
      email,
      age,
     // sexe,
      origine,
      indicatif,
      telephone,
      societe,
      adresse_societe,
      fonction,
      langue_communication,

      // -----------------------------------------------
      // PROFILE
      // -----------------------------------------------

      profile,

      // -----------------------------------------------
      // TYPE COMMANDE
      // -----------------------------------------------

      type_commande,

      // -----------------------------------------------
      // VRAC
      // -----------------------------------------------

      qualite_grade,
      volume_estime,
      destination,
      incoterm,
      format_livraison,
      frequence_commande,
      exigences_specifiques,
      informations_complementaires,

      // -----------------------------------------------
      // CONDITIONNÉ
      // -----------------------------------------------

      pays_conditionne,
      canal_distribution,
      volumes_estimes,
      type_emballage,
      formats_souhaites,
      type_marque,
      certifications_requises,
      nom_entreprise,
      site_web,
      contact_professionnel,

      // -----------------------------------------------
      // NOUVELLE MARQUE
      // -----------------------------------------------

      marche_cible,
      quantite_prevue,
      packaging,
    } = req.body;

    // =================================================
    // FONCTION DE NETTOYAGE
    // =================================================

    const cleanString = (value) => {
      if (
        value === undefined ||
        value === null
      ) {
        return null;
      }

      const result = String(value).trim();

      return result === "" ? null : result;
    };

    // =================================================
    // INFORMATIONS GÉNÉRALES
    // =================================================

    const cleanNom = cleanString(nom);

    const cleanPrenom = cleanString(prenom);

    const cleanEmail = cleanString(email);

    const cleanTelephone =
      cleanString(telephone);

    const cleanSociete =
      cleanString(societe);

    const cleanAdresseSociete =
      cleanString(adresse_societe);

    const cleanFonction =
      cleanString(fonction);

    const cleanOrigine =
      cleanString(origine);

    const cleanIndicatif =
      cleanString(indicatif);

    //const cleanSexe =
      //cleanString(sexe);

    const cleanLangue =
      cleanString(langue_communication);

    const cleanProfile =
      cleanString(profile);

    // =================================================
    // AGE
    // =================================================

    let cleanAge = null;

    if (
      age !== undefined &&
      age !== null &&
      String(age).trim() !== ""
    ) {
      const parsedAge = Number(age);

      if (
        Number.isInteger(parsedAge) &&
        parsedAge >= 0
      ) {
        cleanAge = parsedAge;
      }
    }

    // =================================================
    // TYPE COMMANDE
    // =================================================

    const cleanTypeCommande =
      cleanString(type_commande);

    // =================================================
    // VRAC
    // =================================================

    let cleanQualiteGrade = null;
    let cleanVolumeEstime = null;
    let cleanDestination = null;
    let cleanIncoterm = null;
    let cleanFormatLivraison = null;
    let cleanFrequenceCommande = null;
    let cleanExigences = null;
    let cleanInformations = null;

    if (
      cleanTypeCommande === "vrac"
    ) {
      cleanQualiteGrade =
        cleanString(qualite_grade);

      cleanDestination =
        cleanString(destination);

      cleanIncoterm =
        cleanString(incoterm);

      cleanFormatLivraison =
        cleanString(format_livraison);

      cleanFrequenceCommande =
        cleanString(frequence_commande);

      cleanInformations =
        cleanString(
          informations_complementaires
        );

      // ---------------------------------------------
      // VOLUME
      // ---------------------------------------------

      if (
        volume_estime !== undefined &&
        volume_estime !== null &&
        String(volume_estime).trim() !== ""
      ) {
        const parsedVolume =
          Number(volume_estime);

        if (!Number.isNaN(parsedVolume)) {
          cleanVolumeEstime =
            parsedVolume;
        }
      }

      // ---------------------------------------------
      // EXIGENCES
      // ---------------------------------------------

      if (
        Array.isArray(
          exigences_specifiques
        )
      ) {
        cleanExigences =
          JSON.stringify(
            exigences_specifiques
          );
      } else {
        cleanExigences =
          cleanString(
            exigences_specifiques
          );
      }
    }

    // =================================================
    // CONDITIONNÉ
    // =================================================

    let cleanPaysConditionne = null;
    let cleanCanalDistribution = null;
    let cleanVolumesEstimes = null;
    let cleanTypeEmballage = null;
    let cleanFormatsSouhaites = null;
    let cleanTypeMarque = null;
    let cleanCertifications = null;
    let cleanNomEntreprise = null;
    let cleanSiteWeb = null;
    let cleanContactProfessionnel = null;

    // =================================================
    // NOUVELLE MARQUE
    // =================================================

    let cleanMarcheCible = null;
    let cleanQuantitePrevue = null;
    let cleanPackaging = null;

    if (
      cleanTypeCommande === "conditionné"
    ) {
      cleanPaysConditionne =
        cleanString(
          pays_conditionne
        );

      cleanCanalDistribution =
        cleanString(
          canal_distribution
        );

      cleanVolumesEstimes =
        cleanString(
          volumes_estimes
        );

      cleanTypeEmballage =
        cleanString(
          type_emballage
        );

      cleanFormatsSouhaites =
        cleanString(
          formats_souhaites
        );

      cleanTypeMarque =
        cleanString(
          type_marque
        );

      cleanNomEntreprise =
        cleanString(
          nom_entreprise
        );

      cleanSiteWeb =
        cleanString(
          site_web
        );

      cleanContactProfessionnel =
        cleanString(
          contact_professionnel
        );

      // ---------------------------------------------
      // CERTIFICATIONS
      // ---------------------------------------------

      if (
        Array.isArray(
          certifications_requises
        )
      ) {
        cleanCertifications =
          JSON.stringify(
            certifications_requises
          );
      } else {
        cleanCertifications =
          cleanString(
            certifications_requises
          );
      }

      // ---------------------------------------------
      // NOUVELLE MARQUE
      // ---------------------------------------------

      if (
        cleanTypeMarque ===
        "Création de nouvelle marque"
      ) {
        cleanMarcheCible =
          cleanString(
            marche_cible
          );

        cleanQuantitePrevue =
          cleanString(
            quantite_prevue
          );

        cleanPackaging =
          cleanString(
            packaging
          );
      }
    }

    // =================================================
    // DEBUG DES DONNÉES NETTOYÉES
    // =================================================

    console.log("");
    console.log(
      "DONNÉES NETTOYÉES :"
    );

    console.log({
      nom: cleanNom,
      prenom: cleanPrenom,
      email: cleanEmail,
      age: cleanAge,
     // sexe: cleanSexe,
      origine: cleanOrigine,
      indicatif: cleanIndicatif,
      telephone: cleanTelephone,
      societe: cleanSociete,
      adresse_societe:
        cleanAdresseSociete,
      fonction: cleanFonction,
      langue_communication:
        cleanLangue,

      profile:
        cleanProfile,

      type_commande:
        cleanTypeCommande,

      qualite_grade:
        cleanQualiteGrade,

      volume_estime:
        cleanVolumeEstime,

      destination:
        cleanDestination,

      incoterm:
        cleanIncoterm,

      format_livraison:
        cleanFormatLivraison,

      frequence_commande:
        cleanFrequenceCommande,

      exigences_specifiques:
        cleanExigences,

      informations_complementaires:
        cleanInformations,

      pays_conditionne:
        cleanPaysConditionne,

      canal_distribution:
        cleanCanalDistribution,

      volumes_estimes:
        cleanVolumesEstimes,

      type_emballage:
        cleanTypeEmballage,

      formats_souhaites:
        cleanFormatsSouhaites,

      type_marque:
        cleanTypeMarque,

      certifications_requises:
        cleanCertifications,

      nom_entreprise:
        cleanNomEntreprise,

      site_web:
        cleanSiteWeb,

      contact_professionnel:
        cleanContactProfessionnel,

      marche_cible:
        cleanMarcheCible,

      quantite_prevue:
        cleanQuantitePrevue,

      packaging:
        cleanPackaging,
    });

    // =================================================
    // INSERTION MYSQL
    // =================================================

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
        frequence_commande,
        exigences_specifiques,
        informations_complementaires,

        pays_conditionne,
        canal_distribution,
        volumes_estimes,
        type_emballage,
        formats_souhaites,
        type_marque,
        certifications_requises,
        nom_entreprise,
        site_web,
        contact_professionnel,

        marche_cible,
        quantite_prevue,
        packaging

      )

      VALUES (

        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,

        ?,
        ?,

        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,

        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,

        ?,
        
        ?

      )
    `;

    // =================================================
    // VALEURS MYSQL
    // =================================================

    const values = [

      // -----------------------------------------------
      // INFORMATIONS GÉNÉRALES
      // -----------------------------------------------

      cleanNom,
      cleanPrenom,
      cleanEmail,
      cleanAge,
      //cleanSexe,
      cleanOrigine,
      cleanIndicatif,
      cleanTelephone,
      cleanSociete,
      cleanAdresseSociete,
      cleanFonction,
      cleanLangue,

      // -----------------------------------------------
      // PROFILE
      // -----------------------------------------------

      cleanProfile,
      cleanTypeCommande,

      // -----------------------------------------------
      // VRAC
      // -----------------------------------------------

      cleanQualiteGrade,
      cleanVolumeEstime,
      cleanDestination,
      cleanIncoterm,
      cleanFormatLivraison,
      cleanFrequenceCommande,
      cleanExigences,
      cleanInformations,

      // -----------------------------------------------
      // CONDITIONNÉ
      // -----------------------------------------------

      cleanPaysConditionne,
      cleanCanalDistribution,
      cleanVolumesEstimes,
      cleanTypeEmballage,
      cleanFormatsSouhaites,
      cleanTypeMarque,
      cleanCertifications,
      cleanNomEntreprise,
      cleanSiteWeb,
      cleanContactProfessionnel,

      // -----------------------------------------------
      // NOUVELLE MARQUE
      // -----------------------------------------------

      cleanMarcheCible,
      cleanQuantitePrevue,
      cleanPackaging,
    ];

    console.log("");
    console.log(
      "INSERTION MYSQL..."
    );

    // =================================================
    // EXECUTION
    // =================================================

    const [result] =
      await db.execute(
        sql,
        values
      );

    // =================================================
    // SUCCÈS
    // =================================================

    console.log("");
    console.log(
      "================================="
    );

    console.log(
      "VISITEUR AJOUTÉ AVEC SUCCÈS"
    );

    console.log(
      "ID :",
      result.insertId
    );

    console.log(
      "================================="
    );

    return res.status(201).json({
      success: true,

      message:
        "Le visiteur a été ajouté avec succès.",

      id: result.insertId,
    });

  } catch (error) {

    console.error("");
    console.error(
      "================================="
    );

    console.error(
      "ERREUR INSERTION VISITEUR"
    );

    console.error(
      "================================="
    );

    console.error(
      error
    );

    console.error(
      "================================="
    );

    return res.status(500).json({
      success: false,

      message:
        "Erreur lors de l'ajout du visiteur.",

      error:
        error.message,
    });
  }
});

// =====================================================
// RÉCUPÉRER TOUS LES VISITEURS
// =====================================================

app.get(
  "/api/visiteurs",
  async (req, res) => {

    try {

      const [rows] =
        await db.query(`
          SELECT *
          FROM visiteurs
          ORDER BY id DESC
        `);

      res.status(200).json({

        success: true,

        count:
          rows.length,

        visiteurs:
          rows,
      });

    } catch (error) {

      console.error(
        "ERREUR GET VISITEURS :",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Impossible de récupérer les visiteurs.",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// RÉCUPÉRER UN VISITEUR PAR ID
// =====================================================

app.get(
  "/api/visiteurs/:id",
  async (req, res) => {

    try {

      const id =
        Number(req.params.id);

      if (
        !Number.isInteger(id)
      ) {

        return res.status(400).json({

          success: false,

          message:
            "ID invalide.",
        });
      }

      const [rows] =
        await db.execute(
          `
            SELECT *
            FROM visiteurs
            WHERE id = ?
          `,
          [id]
        );

      if (
        rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Visiteur introuvable.",
        });
      }

      return res.status(200).json({

        success: true,

        visiteur:
          rows[0],
      });

    } catch (error) {

      console.error(
        "ERREUR GET VISITEUR :",
        error
      );

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

// =====================================================
// DÉMARRAGE SERVEUR
// =====================================================

async function startServer() {

  try {

    await connectDatabase();

    // =================================================
    // VÉRIFICATION TABLE
    // =================================================

    const [tables] =
      await db.query(`
        SHOW TABLES LIKE 'visiteurs'
      `);

    if (
      tables.length === 0
    ) {

      console.error(
        "ERREUR : la table visiteurs n'existe pas."
      );

      process.exit(1);
    }

    console.log(
      "TABLE visiteurs OK"
    );

    // =================================================
    // DÉMARRER EXPRESS
    // =================================================

    app.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log("");

        console.log(
          "================================="
        );

        console.log(
          "SERVEUR NODE.JS DÉMARRÉ"
        );

        console.log(
          "================================="
        );

        console.log(
          `Local : http://localhost:${PORT}`
        );

        console.log(
          `Réseau : http://192.168.1.146:${PORT}`
        );

        console.log(
          `POST : http://192.168.1.146:${PORT}/api/visiteurs`
        );

        console.log(
          `GET : http://192.168.1.146:${PORT}/api/visiteurs`
        );

        console.log(
          `TEST DB : http://192.168.1.146:${PORT}/api/test-db`
        );

        console.log(
          "================================="
        );
      }
    );

  } catch (error) {

    console.error(
      "ERREUR DÉMARRAGE SERVEUR :",
      error
    );

    process.exit(1);
  }
}

// =====================================================
// START
// =====================================================

startServer();