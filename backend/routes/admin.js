const express = require("express");
const bcrypt = require("bcryptjs");

const {
  authenticateToken,
  requireAdmin
} = require("../middleware/auth");

const router = express.Router();


// ==========================================
// TOUTES LES ROUTES SONT ADMIN
// ==========================================

router.use(
  authenticateToken,
  requireAdmin
);


// ==========================================
// LISTE DES COMMERCIAUX
// ==========================================

router.get(
  "/commerciaux",
  async (req, res) => {

    try {

      const db = req.app.locals.db;

      const [users] =
        await db.query(
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
        commerciaux: users
      });

    } catch (error) {

      console.error(
        "LIST COMMERCIAUX ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);


// ==========================================
// AJOUTER COMMERCIAL
// ==========================================

router.post(
  "/commerciaux",
  async (req, res) => {

    try {

      console.log("====================================");
      console.log("AJOUT COMMERCIAL");
      console.log("BODY REÇU :", req.body);
      console.log("====================================");

      const {
        nom,
        prenom,
        email,
        password
      } = req.body;

      // Nom, prénom et email obligatoires
      if (
        !nom ||
        !prenom ||
        !email
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Le nom, le prénom et l'email sont obligatoires"
        });
      }

      const nomValue = nom.trim();
      const prenomValue = prenom.trim();
      const emailValue = email.trim().toLowerCase();

      // Vérifier si l'email existe déjà
      const db = req.app.locals.db;

      const [existing] = await db.query(
        `
        SELECT id
        FROM users
        WHERE email = ?
        `,
        [emailValue]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Cet email existe déjà"
        });
      }

      // Mot de passe OPTIONNEL
      let hashedPassword = null;

      if (
        password !== null &&
        password !== undefined &&
        String(password).trim() !== ""
      ) {

        const passwordValue =
          String(password).trim();

        // Si un mot de passe est renseigné
        // il doit contenir au moins 8 caractères
        if (passwordValue.length < 8) {
          return res.status(400).json({
            success: false,
            message:
              "Si vous renseignez un mot de passe, il doit contenir au moins 8 caractères"
          });
        }

        hashedPassword =
          await bcrypt.hash(
            passwordValue,
            10
          );
      }

      console.log(
        "PASSWORD :",
        hashedPassword
          ? "Mot de passe renseigné"
          : "NULL"
      );

      // Création du commercial
      // actif = 0 => compte inactif
      const [result] = await db.query(
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
        VALUES (?, ?, ?, ?, 'commercial', 0)
        `,
        [
          nomValue,
          prenomValue,
          emailValue,
          hashedPassword
        ]
      );

      console.log(
        "✅ COMMERCIAL CRÉÉ ID :",
        result.insertId
      );

      res.status(201).json({

        success: true,

        message:
          "Commercial créé avec succès. Le compte est inactif.",

        commercial: {
          id: result.insertId,
          nom: nomValue,
          prenom: prenomValue,
          email: emailValue,
          role: "commercial",
          actif: false
        }

      });

    } catch (error) {

      console.error(
        "❌ CREATE COMMERCIAL ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);


// ==========================================
// MODIFIER COMMERCIAL
// ==========================================

router.put(
  "/commerciaux/:id",
  async (req, res) => {

    try {

      const { id } = req.params;

      const {
        nom,
        prenom,
        email
      } = req.body;

      if (
        !nom ||
        !prenom ||
        !email
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Nom, prénom et email obligatoires"
        });

      }

      const db = req.app.locals.db;

      const normalizedEmail =
        email.trim().toLowerCase();

      const [existing] =
        await db.query(
          `
          SELECT id
          FROM users
          WHERE email = ?
          AND id != ?
          `,
          [
            normalizedEmail,
            id
          ]
        );

      if (existing.length > 0) {

        return res.status(409).json({
          success: false,
          message:
            "Cet email est déjà utilisé"
        });

      }

      const [result] =
        await db.query(
          `
          UPDATE users
          SET
            nom = ?,
            prenom = ?,
            email = ?
          WHERE
            id = ?
            AND role = 'commercial'
          `,
          [
            nom.trim(),
            prenom.trim(),
            normalizedEmail,
            id
          ]
        );

      if (result.affectedRows === 0) {

        return res.status(404).json({
          success: false,
          message:
            "Commercial introuvable"
        });

      }

      res.json({
        success: true,
        message:
          "Commercial modifié avec succès"
      });

    } catch (error) {

      console.error(
        "UPDATE COMMERCIAL ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);


// ==========================================
// ACTIVER
// ==========================================

router.put(
  "/commerciaux/:id/activer",
  async (req, res) => {

    try {

      const { id } = req.params;

      const db = req.app.locals.db;

      const [result] =
        await db.query(
          `
          UPDATE users
          SET actif = TRUE
          WHERE
            id = ?
            AND role = 'commercial'
          `,
          [id]
        );

      if (result.affectedRows === 0) {

        return res.status(404).json({
          success: false,
          message:
            "Commercial introuvable"
        });

      }

      res.json({
        success: true,
        message:
          "Commercial activé"
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


// ==========================================
// DÉSACTIVER
// ==========================================

router.put(
  "/commerciaux/:id/desactiver",
  async (req, res) => {

    try {

      const { id } = req.params;

      // Empêcher l'admin de désactiver son propre compte
      if (Number(id) === Number(req.user.id)) {

        return res.status(400).json({
          success: false,
          message:
            "Vous ne pouvez pas désactiver votre propre compte"
        });

      }

      const db = req.app.locals.db;

      const [result] =
        await db.query(
          `
          UPDATE users
          SET actif = FALSE
          WHERE
            id = ?
            AND role = 'commercial'
          `,
          [id]
        );

      if (result.affectedRows === 0) {

        return res.status(404).json({
          success: false,
          message:
            "Commercial introuvable"
        });

      }

      res.json({
        success: true,
        message:
          "Commercial désactivé"
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


module.exports = router;