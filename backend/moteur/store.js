// ============================================================
// STOCKAGE DE LA FICHE MOTEUR (table moteur_config, 1 ligne)
// ============================================================

const { calculerMoteur } = require("./engine");
const MOTEUR_DEFAUT = require("./defaults.json");

const copie = (v) => JSON.parse(JSON.stringify(v));

let moteurTablePrete = false;

async function ensureMoteurTable(db) {
  if (moteurTablePrete) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS moteur_config (
      id INT PRIMARY KEY,
      donnees LONGTEXT NOT NULL,
      updated_by INT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  moteurTablePrete = true;
}

// Données modifiées par l'admin, ou valeurs du fichier Excel par défaut
async function lireMoteur(db) {
  await ensureMoteurTable(db);

  const [rows] = await db.query(
    "SELECT donnees, updated_at FROM moteur_config WHERE id = 1"
  );

  if (rows.length === 0) {
    return {
      donnees: copie(MOTEUR_DEFAUT),
      updated_at: null
    };
  }

  return {
    donnees: JSON.parse(rows[0].donnees),
    updated_at: rows[0].updated_at
  };
}


// ============================================================
// GRILLES DE PRIX (offre commerciale)
//
// Le marché (marges, commission, délai de paiement) vient du
// scénario défini par l'admin ; l'incoterm est forcé à EXW et
// la devise à EUR.
//
// - vrac        : prix EUR par litre, par produit et contenant
// - conditionne : prix EUR par unité + unités par FCL 20 pieds
// ============================================================

function grillePrix(donnees) {
  const { lignes } = calculerMoteur({
    ...donnees,
    scenario: {
      ...donnees.scenario,
      incoterm: "EXW",
      devise: "EUR",
      // Unités / FCL toujours exprimées pour un FCL 20 pieds
      taille: "20 pieds"
    }
  });

  const vrac = {};
  const conditionne = {};

  for (const l of lignes) {
    if (l.famille === "Vrac") {
      vrac[l.produit] = vrac[l.produit] || {};
      vrac[l.produit][l.contenant] = l.prix_litre_devise;
      continue;
    }

    conditionne[l.produit] = conditionne[l.produit] || {};
    conditionne[l.produit][l.contenant] = {
      prix_unite: l.prix_unite_devise,
      unites_fcl20: l.unites_fcl,
      autorise: l.autorise
    };
  }

  return {
    devise: "EUR",
    incoterm: "EXW",
    marche: donnees.scenario?.marche || null,
    vrac,
    conditionne
  };
}


module.exports = {
  MOTEUR_DEFAUT,
  copie,
  ensureMoteurTable,
  lireMoteur,
  grillePrix
};
