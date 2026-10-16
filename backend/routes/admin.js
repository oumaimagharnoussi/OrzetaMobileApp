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


// ==========================================
// MOTEUR DE CALCUL (fiche MOTEUR Excel)
// ==========================================

const {
  simuler,
  calculerMoteur,
  calculerProduits,
  calculerContenants
} = require("../moteur/engine");

const {
  MOTEUR_DEFAUT,
  copie,
  ensureMoteurTable,
  lireMoteur
} = require("../moteur/store");

function reponseMoteur(donnees, updated_at) {
  const { coutCalcule, produits } = calculerProduits(donnees);

  const parametres = {};
  for (const p of donnees.parametres) {
    parametres[p.cle] = Number(p.valeur) || 0;
  }

  return {
    success: true,
    donnees,
    updated_at,
    calculs: {
      calculateur: coutCalcule,
      produits,
      contenants: calculerContenants(donnees, parametres)
    },
    ...calculerMoteur(donnees)
  };
}

// Recopie uniquement les champs modifiables, en convertissant les nombres.
// La structure (lignes, clés) reste celle de l'enregistrement actuel.
function fusionnerMoteur(actuel, recu) {
  const numOuNull = (v) =>
    v === "" || v === null || v === undefined ? null : Number(v);

  const verifierNombre = (v, champ) => {
    const x = numOuNull(v);
    if (x !== null && !Number.isFinite(x)) {
      throw new Error(`Valeur numérique invalide : ${champ}`);
    }
    return x;
  };

  const choix = (v, autorises, champ) => {
    if (!autorises.includes(v)) {
      throw new Error(`Valeur invalide pour ${champ} : ${v}`);
    }
    return v;
  };

  const resultat = copie(actuel);

  // SCÉNARIO
  if (recu.scenario) {
    const s = recu.scenario;
    const ports = resultat.destinations.map((d) => d.port);

    resultat.scenario = {
      marche: choix(s.marche, ["Local", "Export"], "marché"),
      incoterm: choix(s.incoterm, ["EXW", "FOB", "CFR", "CIF", "Livré local"], "incoterm"),
      destination: choix(s.destination, ports, "destination"),
      taille: choix(s.taille, ["20 pieds", "40 pieds"], "conteneur"),
      devise: choix(s.devise, ["TND", "EUR", "USD"], "devise"),
      marge_forcee: verifierNombre(s.marge_forcee, "marge forcée")
    };
  }

  // PARAMÈTRES (par clé)
  if (Array.isArray(recu.parametres)) {
    for (const p of resultat.parametres) {
      const r = recu.parametres.find((x) => x.cle === p.cle);
      if (!r) continue;

      p.valeur =
        p.cle === "ModeMarge"
          ? choix(r.valeur, ["Marge sur coût (markup)", "Marge sur prix de vente"], "mode de marge")
          : verifierNombre(r.valeur, p.libelle) ?? 0;
    }
  }

  // Sections tabulaires : on garde l'ordre et les clés existantes
  const sections = {
    destinations: {
      cle: "port",
      nombres: ["fret20", "fret40", "transit"]
    },
    calculateur: {
      cle: "cle",
      nombres: ["prix_olives", "rendement", "trituration", "credit_sous_produits"]
    },
    produits: {
      cle: "code",
      nombres: [
        "matiere_saisie", "prix_achat_impose", "freinte_transfo", "cout_transfo",
        "part_coupage", "duree_stockage", "freinte_stockage", "marge_vrac_local",
        "marge_vrac_export", "marge_cond_local", "marge_cond_export"
      ],
      textes: { vente_cond_autorisee: ["Oui", "Non"] }
    },
    contenants: {
      cle: "code",
      nombres: [
        "volume_l", "contenant_bouchon", "etiquettes", "unites_carton", "cout_carton",
        "mise_cond", "unites_palette", "cout_palette", "palettes_fcl20", "facteur_40_20"
      ]
    }
  };

  // Champs qui peuvent rester vides (sinon 0)
  const facultatifs = ["prix_achat_impose", "matiere_saisie"];

  for (const [nom, def] of Object.entries(sections)) {
    if (!Array.isArray(recu[nom])) continue;

    for (const ligne of resultat[nom]) {
      const r = recu[nom].find((x) => x[def.cle] === ligne[def.cle]);
      if (!r) continue;

      for (const champ of def.nombres) {
        if (!(champ in r)) continue;

        const v = verifierNombre(r[champ], `${ligne[def.cle]} / ${champ}`);
        ligne[champ] = facultatifs.includes(champ) ? v : v ?? 0;
      }

      for (const [champ, autorises] of Object.entries(def.textes || {})) {
        if (champ in r) {
          ligne[champ] = choix(r[champ], autorises, champ);
        }
      }
    }
  }

  return resultat;
}


// ==========================================
// CONSULTER LE MOTEUR
// ==========================================

router.get(
  "/moteur",
  async (req, res) => {

    try {

      const { donnees, updated_at } =
        await lireMoteur(req.app.locals.db);

      res.json(reponseMoteur(donnees, updated_at));

    } catch (error) {

      console.error("MOTEUR GET ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);


// ==========================================
// MODIFIER LE MOTEUR
// ==========================================

router.put(
  "/moteur",
  async (req, res) => {

    try {

      const db = req.app.locals.db;

      const { donnees: actuel } = await lireMoteur(db);

      let donnees;

      try {
        donnees = fusionnerMoteur(actuel, req.body?.donnees || {});
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      await db.query(
        `
        INSERT INTO moteur_config (id, donnees, updated_by)
        VALUES (1, ?, ?)
        ON DUPLICATE KEY UPDATE
          donnees = VALUES(donnees),
          updated_by = VALUES(updated_by)
        `,
        [JSON.stringify(donnees), req.user.id]
      );

      const { updated_at } = await lireMoteur(db);

      res.json(reponseMoteur(donnees, updated_at));

    } catch (error) {

      console.error("MOTEUR PUT ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);


// ==========================================
// SIMULATEUR (onglet SIMULATEUR de l'Excel)
// body : { entree: { produit, contenant, quantite, unite, remise,
//                    marche, incoterm, destination, taille, devise,
//                    marge_forcee },
//          donnees?: brouillon non enregistré (facultatif) }
// ==========================================

router.post(
  "/moteur/simuler",
  async (req, res) => {

    try {

      const { donnees: actuel } = await lireMoteur(req.app.locals.db);

      let donnees = actuel;

      try {
        if (req.body?.donnees) {
          donnees = fusionnerMoteur(actuel, req.body.donnees);
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.json({
        success: true,
        ...simuler(donnees, req.body?.entree || {})
      });

    } catch (error) {

      console.error("MOTEUR SIMULER ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);


// ==========================================
// RÉINITIALISER AUX VALEURS DU FICHIER EXCEL
// ==========================================

router.post(
  "/moteur/reinitialiser",
  async (req, res) => {

    try {

      const db = req.app.locals.db;

      await ensureMoteurTable(db);

      await db.query(
        "DELETE FROM moteur_config WHERE id = 1"
      );

      res.json(
        reponseMoteur(copie(MOTEUR_DEFAUT), null)
      );

    } catch (error) {

      console.error("MOTEUR RESET ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Erreur serveur"
      });
    }
  }
);


module.exports = router;