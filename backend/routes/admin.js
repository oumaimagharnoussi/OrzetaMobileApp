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
          message:
            "Tous les champs sont obligatoires"
        });

      }

      if (password.length < 8) {

        return res.status(400).json({
          success: false,
          message:
            "Le mot de passe doit contenir au moins 8 caractères"
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
          `,
          [normalizedEmail]
        );

      if (existing.length > 0) {

        return res.status(409).json({
          success: false,
          message:
            "Cet email existe déjà"
        });

      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const [result] =
        await db.query(
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
            nom.trim(),
            prenom.trim(),
            normalizedEmail,
            hashedPassword
          ]
        );

      res.status(201).json({

        success: true,

        message:
          "Commercial créé avec succès",

        commercial: {
          id: result.insertId,
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: normalizedEmail,
          role: "commercial",
          actif: true
        }

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