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
    // =================================================
    // BODY REÇU
    // =================================================

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

      // Nouveaux champs séparés
      nouvelle_marque_formats,
      nouvelle_marque_design_conditionnement,

      // -----------------------------------------------
      // AUTRES CHAMPS
      // -----------------------------------------------

      nouvelle_marque_nom,
      nouvelle_marque_description,
      nouvelle_marque_positionnement,
      nouvelle_marque_cible,
      nouvelle_marque_pays_lancement,
      nouvelle_marque_volume_previsionnel,
      nouvelle_marque_certifications,
      nouvelle_marque_design_conditionnement: nouvelleMarqueDesignConditionnementBody,

      profile: profileBody,
      type_emballage: typeEmballageBody,
      marche_cible: marcheCibleBody,
      quantite_prevue: quantitePrevueBody,
      packaging,
      type_conteneur,
      nombre_palettes,
    } = req.body;

    // =================================================
    // FONCTION NETTOYAGE
    // =================================================

    const cleanString = (value) => {
      if (
        value === undefined ||
        value === null
      ) {
        return null;
      }

      const result = String(value).trim();

      return result === ""
        ? null
        : result;
    };

    // =================================================
    // INFORMATIONS GÉNÉRALES
    // =================================================

    const cleanNom =
      cleanString(nom);

    const cleanPrenom =
      cleanString(prenom);

    const cleanEmail =
      cleanString(email);

    const cleanAge =
      age !== undefined &&
      age !== null &&
      String(age).trim() !== ""
        ? Number(age)
        : null;

    const cleanOrigine =
      cleanString(origine);

    const cleanIndicatif =
      cleanString(indicatif);

    const cleanTelephone =
      cleanString(telephone);

    const cleanSociete =
      cleanString(societe);

    const cleanAdresseSociete =
      cleanString(adresse_societe);

    const cleanFonction =
      cleanString(fonction);

    const cleanLangue =
      cleanString(
        langue_communication
      );

    // =================================================
    // PROFILE
    // =================================================

    const cleanProfile =
      cleanString(profileBody || profile);

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
        cleanString(
          qualite_grade
        );

      cleanDestination =
        cleanString(
          destination
        );

      cleanIncoterm =
        cleanString(
          incoterm
        );

      cleanFormatLivraison =
        cleanString(
          format_livraison
        );

      cleanFrequenceCommande =
        cleanString(
          frequence_commande
        );

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

        if (
          !Number.isNaN(parsedVolume)
        ) {
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

    let cleanNouvelleMarqueFormats = null;
    let cleanNouvelleMarqueDesignConditionnement = null;

    // =================================================
    // AUTRES CHAMPS NOUVELLE MARQUE
    // =================================================

    let cleanNouvelleMarqueNom = null;
    let cleanNouvelleMarqueDescription = null;
    let cleanNouvelleMarquePositionnement = null;
    let cleanNouvelleMarqueCible = null;
    let cleanNouvelleMarquePaysLancement = null;
    let cleanNouvelleMarqueVolumePrevisionnel = null;
    let cleanNouvelleMarqueCertifications = null;

    // =================================================
    // TYPE EMBALLAGE / QUANTITÉ
    // =================================================

    let cleanTypeConteneur = null;
    let cleanNombrePalettes = null;

    // =================================================
    // SI CONDITIONNÉ
    // =================================================

    if (
      cleanTypeCommande === "conditionné"
    ) {
      // ---------------------------------------------
      // INFORMATIONS CONDITIONNÉ
      // ---------------------------------------------

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

      // ---------------------------------------------
      // TYPE EMBALLAGE NORMAL
      // ---------------------------------------------

      cleanTypeEmballage =
        cleanString(
          typeEmballageBody ||
          type_emballage
        );

      // ---------------------------------------------
      // FORMATS NORMAL
      // ---------------------------------------------

      cleanFormatsSouhaites =
        cleanString(
          formats_souhaites
        );

      // ---------------------------------------------
      // TYPE MARQUE
      // ---------------------------------------------

      cleanTypeMarque =
        cleanString(
          type_marque
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
      // ENTREPRISE
      // ---------------------------------------------

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
      // NOUVELLE MARQUE
      // ---------------------------------------------

      if (
        cleanTypeMarque ===
        "Création de nouvelle marque"
      ) {
        cleanMarcheCible =
          cleanString(
            marche_cible ||
            marcheCibleBody
          );

        cleanQuantitePrevue =
          cleanString(
            quantite_prevue ||
            quantitePrevueBody
          );

        // -------------------------------------------
        // FORMATS NOUVELLE MARQUE
        // -------------------------------------------

        if (
          nouvelle_marque_formats !==
            undefined &&
          nouvelle_marque_formats !==
            null
        ) {
          if (
            Array.isArray(
              nouvelle_marque_formats
            ) ||
            typeof nouvelle_marque_formats ===
              "object"
          ) {
            cleanNouvelleMarqueFormats =
              JSON.stringify(
                nouvelle_marque_formats
              );
          } else {
            cleanNouvelleMarqueFormats =
              cleanString(
                nouvelle_marque_formats
              );
          }
        }

        // -------------------------------------------
        // DESIGN / EMBALLAGE NOUVELLE MARQUE
        // -------------------------------------------

        const designConditionnement =
          nouvelle_marque_design_conditionnement ||
          nouvelleMarqueDesignConditionnement;

        if (
          designConditionnement !==
            undefined &&
          designConditionnement !==
            null
        ) {
          if (
            Array.isArray(
              designConditionnement
            ) ||
            typeof designConditionnement ===
              "object"
          ) {
            cleanNouvelleMarqueDesignConditionnement =
              JSON.stringify(
                designConditionnement
              );
          } else {
            cleanNouvelleMarqueDesignConditionnement =
              cleanString(
                designConditionnement
              );
          }
        }

        // -------------------------------------------
        // INFORMATIONS SUPPLÉMENTAIRES
        // -------------------------------------------

        cleanNouvelleMarqueNom =
          cleanString(
            nouvelle_marque_nom
          );

        cleanNouvelleMarqueDescription =
          cleanString(
            nouvelle_marque_description
          );

        cleanNouvelleMarquePositionnement =
          cleanString(
            nouvelle_marque_positionnement
          );

        cleanNouvelleMarqueCible =
          cleanString(
            nouvelle_marque_cible
          );

        cleanNouvelleMarquePaysLancement =
          cleanString(
            nouvelle_marque_pays_lancement
          );

        cleanNouvelleMarqueVolumePrevisionnel =
          cleanString(
            nouvelle_marque_volume_previsionnel
          );

        cleanNouvelleMarqueCertifications =
          cleanString(
            nouvelle_marque_certifications
          );
      }

      // ---------------------------------------------
      // TYPE CONTENEUR
      // ---------------------------------------------

      cleanTypeConteneur =
        cleanString(
          type_conteneur
        );

      // ---------------------------------------------
      // NOMBRE PALETTES
      // ---------------------------------------------

      if (
        nombre_palettes !== undefined &&
        nombre_palettes !== null &&
        String(nombre_palettes).trim() !== ""
      ) {
        const parsedPalettes =
          Number(nombre_palettes);

        if (
          Number.isInteger(
            parsedPalettes
          )
        ) {
          cleanNombrePalettes =
            parsedPalettes;
        }
      }
    }

    // =================================================
    // DEBUG
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

      // VRAC
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

      // CONDITIONNÉ
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

      // NOUVELLE MARQUE
      marche_cible:
        cleanMarcheCible,

      quantite_prevue:
        cleanQuantitePrevue,

      nouvelle_marque_formats:
        cleanNouvelleMarqueFormats,

      nouvelle_marque_design_conditionnement:
        cleanNouvelleMarqueDesignConditionnement,

      nouvelle_marque_nom:
        cleanNouvelleMarqueNom,

      nouvelle_marque_description:
        cleanNouvelleMarqueDescription,

      nouvelle_marque_positionnement:
        cleanNouvelleMarquePositionnement,

      nouvelle_marque_cible:
        cleanNouvelleMarqueCible,

      nouvelle_marque_pays_lancement:
        cleanNouvelleMarquePaysLancement,

      nouvelle_marque_volume_previsionnel:
        cleanNouvelleMarqueVolumePrevisionnel,

      nouvelle_marque_certifications:
        cleanNouvelleMarqueCertifications,

      // QUANTITÉ
      type_conteneur:
        cleanTypeConteneur,

      nombre_palettes:
        cleanNombrePalettes,
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

    nouvelle_marque_formats,
    nouvelle_marque_design_conditionnement,

    nouvelle_marque_nom,
    nouvelle_marque_description,
    nouvelle_marque_positionnement,
    nouvelle_marque_cible,
    nouvelle_marque_pays_lancement,
    nouvelle_marque_volume_previsionnel,
    nouvelle_marque_certifications,

    type_conteneur,
    nombre_palettes

  )

  VALUES (

    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,

    ?, ?,

    ?, ?, ?, ?, ?, ?, ?, ?,

    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,

    ?, ?,

    ?, ?,

    ?, ?, ?, ?, ?, ?, ?,

    ?, ?

  )
`;

    // =================================================
    // VALEURS
    // =================================================

    const values = [

      // -----------------------------------------------
      // INFORMATIONS GÉNÉRALES
      // -----------------------------------------------
    
      cleanNom,
      cleanPrenom,
      cleanEmail,
      cleanAge,
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
    
      // -----------------------------------------------
      // TYPE COMMANDE
      // -----------------------------------------------
    
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
    
      cleanNouvelleMarqueFormats,
      cleanNouvelleMarqueDesignConditionnement,
    
      cleanNouvelleMarqueNom,
      cleanNouvelleMarqueDescription,
      cleanNouvelleMarquePositionnement,
      cleanNouvelleMarqueCible,
      cleanNouvelleMarquePaysLancement,
      cleanNouvelleMarqueVolumePrevisionnel,
      cleanNouvelleMarqueCertifications,
    
      // -----------------------------------------------
      // QUANTITÉ / CONTENEUR
      // -----------------------------------------------
    
      cleanTypeConteneur,
      cleanNombrePalettes
    
    ];
    // =================================================
    // VÉRIFICATION NOMBRE PARAMÈTRES
    // =================================================

    console.log("");
    console.log(
      "NOMBRE DE VALEURS :",
      values.length
    );

    // =================================================
    // INSERTION
    // =================================================

    console.log("");
    console.log(
      "INSERTION MYSQL..."
    );

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

      id:
        result.insertId,
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
      "MESSAGE :",
      error.message
    );

    console.error(
      "SQL CODE :",
      error.code
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
// ENREGISTRER LA QUALIFICATION DU VISITEUR
// =====================================================
app.put("/api/visiteurs/:id/qualification", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const qualification = Number(req.body.qualification);

    // Vérifier l'identifiant
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Identifiant du visiteur invalide.",
      });
    }

    // Vérifier la qualification : uniquement de 1 à 5
    if (
      !Number.isInteger(qualification) ||
      qualification < 1 ||
      qualification > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "La qualification doit être comprise entre 1 et 5.",
      });
    }

    // Enregistrer la qualification dans MySQL
    const [result] = await db.execute(
      "UPDATE visiteurs SET qualification = ? WHERE id = ?",
      [qualification, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Visiteur introuvable.",
      });
    }

    return res.json({
      success: true,
      message: "Qualification enregistrée avec succès.",
      id,
      qualification,
    });
  } catch (error) {
    console.error("ERREUR ENREGISTREMENT QUALIFICATION :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'enregistrement de la qualification.",
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