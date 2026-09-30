const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const {
  authenticateToken
} = require("../middleware/auth");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;


// ==========================================
// CONFIGURATION EMAIL
// ==========================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});
transporter.verify((error, success) => {
    if (error) {
      console.error("❌ SMTP ERROR :", error);
    } else {
      console.log("✅ SMTP Hostinger connecté");
    }
  });


// ==========================================
// REGISTER
// ==========================================

router.post(
  "/register",
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

      const [existing] =
        await db.query(
          `
          SELECT id
          FROM users
          WHERE email = ?
          `,
          [email.trim().toLowerCase()]
        );

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Cet email existe déjà"
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
            email.trim().toLowerCase(),
            hashedPassword
          ]
        );

      res.status(201).json({

        success: true,

        message:
          "Compte créé avec succès",

        user: {
          id: result.insertId,
          nom,
          prenom,
          email: email.trim().toLowerCase(),
          role: "commercial"
        }

      });

    } catch (error) {

      console.error(
        "REGISTER ERROR:",
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
// LOGIN
// ==========================================

router.post(
  "/login",
  async (req, res) => {

    try {

      const {
        email,
        password
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message:
            "Email et mot de passe obligatoires"
        });
      }

      const db = req.app.locals.db;

      const [users] =
        await db.query(
          `
          SELECT
            id,
            nom,
            prenom,
            email,
            password,
            role,
            actif
          FROM users
          WHERE email = ?
          `,
          [
            email.trim().toLowerCase()
          ]
        );

      if (users.length === 0) {

        return res.status(401).json({
          success: false,
          message:
            "Email ou mot de passe incorrect"
        });

      }

      const user = users[0];

      if (!user.actif) {

        return res.status(403).json({
          success: false,
          message:
            "Votre compte est désactivé"
        });

      }

      const validPassword =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!validPassword) {

        return res.status(401).json({
          success: false,
          message:
            "Email ou mot de passe incorrect"
        });

      }

      const token =
        jwt.sign(
          {
            id: user.id,
            email: user.email,
            role: user.role
          },
          JWT_SECRET,
          {
            expiresIn: "7d"
          }
        );

      res.json({

        success: true,

        message:
          "Connexion réussie",

        token,

        user: {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role
        }

      });

    } catch (error) {

      console.error(
        "LOGIN ERROR:",
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
// ME
// ==========================================

router.get(
  "/me",
  authenticateToken,
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
          WHERE id = ?
          `,
          [req.user.id]
        );

      if (users.length === 0) {

        return res.status(404).json({
          success: false,
          message:
            "Utilisateur introuvable"
        });

      }

      res.json({
        success: true,
        user: users[0]
      });

    } catch (error) {

      console.error(
        "ME ERROR:",
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
// FORGOT PASSWORD
// ==========================================

router.post(
  "/forgot-password",
  async (req, res) => {

    try {

      const {
        email
      } = req.body;

      if (!email) {

        return res.status(400).json({
          success: false,
          message:
            "Email obligatoire"
        });

      }

      const db = req.app.locals.db;

      const normalizedEmail =
        email.trim().toLowerCase();

      const [users] =
        await db.query(
          `
          SELECT
            id,
            nom,
            prenom,
            email
          FROM users
          WHERE email = ?
          `,
          [normalizedEmail]
        );

      /*
       On retourne toujours le même message
       pour ne pas révéler si un email existe.
      */

      if (users.length === 0) {

        return res.json({
          success: true,
          message:
            "Si cet email existe, un lien de réinitialisation sera envoyé."
        });

      }

      const user = users[0];

      // Token aléatoire
      const resetToken =
        crypto.randomBytes(32).toString("hex");

      // Hash du token stocké en DB
      const hashedToken =
        crypto
          .createHash("sha256")
          .update(resetToken)
          .digest("hex");

      // Expiration : 30 minutes
      const expiresAt =
        new Date(
          Date.now() +
          30 * 60 * 1000
        );

      await db.query(
        `
        UPDATE users
        SET
          reset_token = ?,
          reset_token_expires = ?
        WHERE id = ?
        `,
        [
          hashedToken,
          expiresAt,
          user.id
        ]
      );

      const frontendUrl =
        process.env.FRONTEND_URL ||
        "http://localhost:8081";

        const resetLink =
        `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

      await transporter.sendMail({

        from: process.env.SMTP_USER,

        to: user.email,

        subject:
          "Réinitialisation de votre mot de passe",

        html: `
          <div style="font-family: Arial;">

            <h2>Réinitialisation du mot de passe</h2>

            <p>
              Bonjour ${user.prenom},
            </p>

            <p>
              Vous avez demandé la réinitialisation
              de votre mot de passe.
            </p>

            <p>
              Cliquez sur le bouton ci-dessous :
            </p>

            <p>
              <a
                href="${resetLink}"
                style="
                  display:inline-block;
                  padding:12px 20px;
                  background:#222;
                  color:white;
                  text-decoration:none;
                  border-radius:6px;
                "
              >
                Réinitialiser mon mot de passe
              </a>
            </p>

            <p>
              Ce lien expire dans 30 minutes.
            </p>

            <p>
              Si vous n'êtes pas à l'origine de cette
              demande, ignorez cet email.
            </p>

          </div>
        `

      });

      res.json({

        success: true,

        message:
          "Si cet email existe, un lien de réinitialisation sera envoyé."

      });

    } catch (error) {
        console.error("❌ ERREUR ENVOI EMAIL");
        console.error("Message :", error.message);
        console.error("Code :", error.code);
        console.error("Command :", error.command);
        console.error("Response :", error.response);
      
        return res.status(500).json({
          success: false,
          message: "Erreur lors de l'envoi de l'email",
          error: error.message
        });
      }
  }
);


// ==========================================
// RESET PASSWORD
// ==========================================

router.post(
  "/reset-password",
  async (req, res) => {

    try {

      const {
        token,
        password
      } = req.body;

      if (!token || !password) {

        return res.status(400).json({
          success: false,
          message:
            "Token et nouveau mot de passe obligatoires"
        });

      }

      if (password.length < 8) {

        return res.status(400).json({
          success: false,
          message:
            "Le mot de passe doit contenir au moins 8 caractères"
        });

      }

      const hashedToken =
        crypto
          .createHash("sha256")
          .update(token)
          .digest("hex");

      const db = req.app.locals.db;

      const [users] =
        await db.query(
          `
          SELECT id
          FROM users
          WHERE
            reset_token = ?
            AND reset_token_expires > NOW()
          `,
          [hashedToken]
        );

      if (users.length === 0) {

        return res.status(400).json({
          success: false,
          message:
            "Lien invalide ou expiré"
        });

      }

      const user = users[0];

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      await db.query(
        `
        UPDATE users
        SET
          password = ?,
          reset_token = NULL,
          reset_token_expires = NULL
        WHERE id = ?
        `,
        [
          hashedPassword,
          user.id
        ]
      );

      res.json({

        success: true,

        message:
          "Mot de passe réinitialisé avec succès"

      });

    } catch (error) {

      console.error(
        "RESET PASSWORD ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);


module.exports = router;