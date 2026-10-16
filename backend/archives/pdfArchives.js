// ============================================================
// ARCHIVES DES FICHES PDF VALIDÉES (offres de prix)
//
// Seules les fiches validées sont conservées : l'archivage est fait
// par le serveur au moment de la validation (lien envoyé au validateur).
// Chaque fiche validée est conservée :
// - dans la base (table pdf_archives) : le PDF lui-même + le HTML
//   d'origine. C'est la copie de référence : elle survit aux
//   redéploiements du serveur.
// - dans un fichier sur le disque (PDF_ARCHIVE_DIR) :
//     <dossier>/<id visiteur>/OLIVED_<référence>_v<version>.pdf
//   Si le fichier a disparu (disque effacé), il est recréé depuis la base.
//
// Une même fiche (HTML identique) n'est archivée qu'une fois :
// une nouvelle version n'est créée que si son contenu change.
// ============================================================

const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const jwt = require("jsonwebtoken");

const DOSSIER_ARCHIVES =
  process.env.PDF_ARCHIVE_DIR ||
  path.join(__dirname, "..", "archives_pdf");


let tablePrete = false;

async function ensureArchivesTable(db) {
  if (tablePrete) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS pdf_archives (
      id INT AUTO_INCREMENT PRIMARY KEY,
      visiteur_id INT NOT NULL,
      reference VARCHAR(50) NULL,
      version INT NOT NULL DEFAULT 1,
      source VARCHAR(30) NOT NULL DEFAULT 'validation',
      nom_fichier VARCHAR(255) NOT NULL,
      chemin_fichier VARCHAR(500) NULL,
      taille INT NOT NULL DEFAULT 0,
      empreinte CHAR(64) NOT NULL,
      pdf MEDIUMBLOB NOT NULL,
      html LONGTEXT NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_pdf_archives_visiteur (visiteur_id),
      INDEX idx_pdf_archives_reference (reference)
    )
  `);

  tablePrete = true;
}

const nomFichierSur = (texte) =>
  String(texte || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "fiche";

const cheminAbsolu = (cheminRelatif) =>
  path.join(DOSSIER_ARCHIVES, cheminRelatif);

async function ecrireFichier(cheminRelatif, pdf) {
  const chemin = cheminAbsolu(cheminRelatif);
  await fs.mkdir(path.dirname(chemin), { recursive: true });
  await fs.writeFile(chemin, pdf);
}


// ============================================================
// ARCHIVER UNE FICHE
// pdfBuffer facultatif : sinon le PDF est généré depuis le HTML.
// Retourne { archive, doublon }.
// ============================================================

async function archiverPdf(db, {
  visiteurId,
  reference,
  html,
  pdfBuffer,
  source = "validation",
  userId = null,
  generatePdfFromHtml,
}) {
  await ensureArchivesTable(db);

  if (!visiteurId) throw new Error("Identifiant visiteur manquant.");
  if (!html || typeof html !== "string") throw new Error("HTML de la fiche manquant.");

  const empreinte = crypto.createHash("sha256").update(html).digest("hex");

  // Même contenu que la dernière version : rien à archiver
  const [dernieres] = await db.query(
    `
      SELECT id, visiteur_id, reference, version, source, nom_fichier,
             taille, created_at, empreinte
      FROM pdf_archives
      WHERE visiteur_id = ?
      ORDER BY version DESC
      LIMIT 1
    `,
    [visiteurId]
  );

  if (dernieres.length && dernieres[0].empreinte === empreinte) {
    const { empreinte: _e, ...archive } = dernieres[0];
    return { archive, doublon: true };
  }

  const pdf = pdfBuffer || (await generatePdfFromHtml(html));

  if (!pdf || !pdf.length) throw new Error("Le PDF généré est vide.");

  const version = dernieres.length ? dernieres[0].version + 1 : 1;
  const nomFichier = `OLIVED_${nomFichierSur(reference || `visiteur_${visiteurId}`)}_v${version}.pdf`;
  const cheminRelatif = path.join(String(visiteurId), nomFichier);

  const [resultat] = await db.query(
    `
      INSERT INTO pdf_archives
        (visiteur_id, reference, version, source, nom_fichier, chemin_fichier,
         taille, empreinte, pdf, html, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      visiteurId,
      reference || null,
      version,
      source,
      nomFichier,
      cheminRelatif,
      pdf.length,
      empreinte,
      pdf,
      html,
      userId,
    ]
  );

  // Copie fichier : un échec n'empêche pas l'archivage en base
  try {
    await ecrireFichier(cheminRelatif, pdf);
  } catch (error) {
    console.error("ARCHIVE PDF : écriture du fichier impossible :", error.message);
  }

  console.log(
    `ARCHIVE PDF : ${nomFichier} (${pdf.length} octets, source ${source})`
  );

  return {
    archive: {
      id: resultat.insertId,
      visiteur_id: visiteurId,
      reference: reference || null,
      version,
      source,
      nom_fichier: nomFichier,
      taille: pdf.length,
      created_at: new Date(),
    },
    doublon: false,
  };
}


// ============================================================
// ROUTES  (montées sur /api/pdf-archives, lecture seule)
// Droits : admin = tout ; commercial = ses visiteurs
// ============================================================

function creerRouterArchives({ generatePdfFromHtml }) {
  const router = express.Router();

  // ----------------------------------------------------------
  // LISTE  ?visiteur_id=  ?q= (référence, nom, société)
  // ----------------------------------------------------------
  router.get("/", async (req, res) => {
    try {
      const db = req.app.locals.db;
      await ensureArchivesTable(db);

      const conditions = [];
      const valeurs = [];

      if (req.user.role !== "admin") {
        conditions.push("v.commercial_id = ?");
        valeurs.push(req.user.id);
      }

      if (req.query.visiteur_id) {
        conditions.push("a.visiteur_id = ?");
        valeurs.push(Number(req.query.visiteur_id));
      }

      const q = String(req.query.q || "").trim();
      if (q) {
        conditions.push(
          "(a.reference LIKE ? OR v.nom LIKE ? OR v.prenom LIKE ? OR v.societe LIKE ?)"
        );
        valeurs.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
      }

      const [archives] = await db.query(
        `
          SELECT a.id, a.visiteur_id, a.reference, a.version, a.source,
                 a.nom_fichier, a.taille, a.created_at, a.created_by,
                 v.nom, v.prenom, v.societe, v.type_commande
          FROM pdf_archives a
          JOIN visiteurs v ON v.id = a.visiteur_id
          ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
          ORDER BY a.created_at DESC, a.id DESC
          LIMIT 500
        `,
        valeurs
      );

      res.json({ success: true, archives });
    } catch (error) {
      console.error("ARCHIVE PDF LISTE :", error);
      res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  });

  // ----------------------------------------------------------
  // LIEN D'OUVERTURE : lien signé valable 10 minutes, utilisable
  // directement par le navigateur (web) ou le téléphone
  // ----------------------------------------------------------
  router.get("/:id/lien", async (req, res) => {
    try {
      const db = req.app.locals.db;
      await ensureArchivesTable(db);

      const [rows] = await db.query(
        `
          SELECT a.id, v.commercial_id
          FROM pdf_archives a
          JOIN visiteurs v ON v.id = a.visiteur_id
          WHERE a.id = ?
          LIMIT 1
        `,
        [Number(req.params.id)]
      );

      if (!rows.length) {
        return res.status(404).json({ success: false, message: "Fiche introuvable." });
      }

      if (
        req.user.role !== "admin" &&
        Number(rows[0].commercial_id) !== Number(req.user.id)
      ) {
        return res.status(403).json({ success: false, message: "Accès refusé." });
      }

      const jeton = jwt.sign(
        { archiveId: rows[0].id, usage: "pdf-archive" },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
      );

      // Derrière le proxy de Render, le protocole réel est dans x-forwarded-proto
      const protocole =
        String(req.get("x-forwarded-proto") || "").split(",")[0].trim() ||
        req.protocol;

      const base = `${protocole}://${req.get("host")}/api/pdf-fichier/${jeton}`;

      res.json({
        success: true,
        url: base,
        url_telechargement: `${base}?download=1`,
      });
    } catch (error) {
      console.error("ARCHIVE PDF LIEN :", error);
      res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  });

  return router;
}


// ============================================================
// FICHIER PDF  GET /api/pdf-fichier/:jeton  (?download=1)
// Accès par le lien signé uniquement (pas d'en-tête Authorization).
// ============================================================

async function envoyerFichierArchive(req, res) {
  try {
    let charge;
    try {
      charge = jwt.verify(req.params.jeton, process.env.JWT_SECRET);
    } catch {
      return res.status(401).send("Lien expiré ou invalide. Rouvrez la fiche depuis l'application.");
    }

    if (charge?.usage !== "pdf-archive") {
      return res.status(401).send("Lien invalide.");
    }

    const db = req.app.locals.db;
    await ensureArchivesTable(db);

    const [rows] = await db.query(
      "SELECT nom_fichier, chemin_fichier, pdf FROM pdf_archives WHERE id = ? LIMIT 1",
      [Number(charge.archiveId)]
    );

    if (!rows.length) return res.status(404).send("Fiche introuvable.");

    const archive = rows[0];

    // Fichier sur disque, sinon copie de la base (et on recrée le fichier)
    let pdf = null;
    if (archive.chemin_fichier) {
      try {
        pdf = await fs.readFile(cheminAbsolu(archive.chemin_fichier));
      } catch {
        pdf = null;
      }
    }

    if (!pdf) {
      pdf = archive.pdf;
      if (archive.chemin_fichier) {
        ecrireFichier(archive.chemin_fichier, pdf).catch(() => {});
      }
    }

    const disposition = req.query.download === "1" ? "attachment" : "inline";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdf.length);
    res.setHeader("Content-Disposition", `${disposition}; filename="${archive.nom_fichier}"`);
    res.setHeader("Cache-Control", "private, no-store");
    res.end(pdf);
  } catch (error) {
    console.error("ARCHIVE PDF FICHIER :", error);
    res.status(500).send("Erreur serveur");
  }
}


module.exports = {
  DOSSIER_ARCHIVES,
  ensureArchivesTable,
  archiverPdf,
  creerRouterArchives,
  envoyerFichierArchive,
};
