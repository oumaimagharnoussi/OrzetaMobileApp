// ============================================================
// LECTURE DE CARTE DE VISITE (GRATUIT)
// - Texte : Tesseract.js (OCR)
// - QR code : jsQR (vCard, MECARD ou lien du site)
// ============================================================

const { createWorker } = require("tesseract.js");
const { Jimp } = require("jimp");
const jsQR = require("jsqr");

const EMAIL_REGEX =
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

// Accepte aussi « www.olived tn » (point mal lu par l'OCR)
const WEBSITE_REGEX =
  /\b(?:https?:\/\/)?(www\.[A-Za-z0-9-]+[. ][A-Za-z]{2,6}(?:\.[A-Za-z]{2,3})?)\b/i;

const PHONE_REGEX =
  /(?:\+|00|\(\+)?\d[\d\s().\/-]{6,}\d/g;

// Confiance minimale d'un mot OCR (élimine le bruit de l'arrière-plan)
const CONFIANCE_MIN = 60;

const EMAIL_PUBLICS = [
  "gmail", "yahoo", "hotmail", "outlook", "live", "icloud",
  "aol", "gmx", "msn", "topnet", "planet",
];

const MOTS_FONCTION = [
  "directeur", "directrice", "director", "manager", "gérant", "gerant",
  "ceo", "coo", "cfo", "cto", "président", "president", "fondateur",
  "founder", "owner", "responsable", "head of", "chef", "chargé", "charge",
  "commercial", "sales", "export", "achat", "achats", "purchasing",
  "buyer", "acheteur", "ingénieur", "ingenieur", "engineer", "assistant",
  "assistante", "consultant", "officer", "partner", "associé", "marketing",
  "business", "development", "procurement", "trader", "executive",
  "coordinator", "coordinateur", "supervisor", "superviseur", "agent",
  "representative", "représentant", "specialist", "analyst",
];

const MOTS_SOCIETE = [
  "sarl", "s.a.r.l", "suarl", "s.a", "llc", "ltd", "limited", "gmbh",
  "inc", "corp", "company", "group", "groupe", "spa", "srl", "trading",
  "industries", "industrie", "international", "société", "societe",
  "holding", "huilerie",
];

const MOTS_ADRESSE = [
  "rue", "avenue", "av.", "street", "road", "rd.", "route", "zone", "z.i",
  "bp", "b.p", "km", "cité", "cite", "immeuble", "imm.", "building",
  "étage", "floor", "boulevard", "bd", "lot", "résidence", "residence",
  "p.o. box", "lac", "tunis", "tunisia", "tunisie", "sfax", "sousse",
  "nabeul", "monastir", "mahdia", "ariana", "bizerte", "gabes", "kairouan",
];

// Titres de rubriques à ignorer (ex. « HEAD OFFICE »)
const MOTS_RUBRIQUE = [
  "head office", "siège", "siege", "production facility", "usine",
  "factory", "office", "showroom", "branch",
];

const MOTS_TELEPHONE = [
  "tel", "tél", "phone", "mob", "mobile", "gsm", "cel", "port", "fax",
  "whatsapp",
];

const INDICATIFS = [
  "216", "213", "212", "218", "971", "966", "974", "965", "351", "33",
  "34", "39", "49", "44", "86", "90", "41", "32", "31", "1",
];

function contientMot(ligne, mots) {
  return mots.some((mot) =>
    new RegExp(
      `(^|[^a-zà-ÿ])${mot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-zà-ÿ]|$)`,
      "i"
    ).test(ligne)
  );
}

function majusculeInitiale(texte) {
  return String(texte || "")
    .toLowerCase()
    .replace(/(^|[\s-])([a-zà-ÿ])/g, (m, s, c) => s + c.toUpperCase());
}

function nettoyerLigne(ligne) {
  return String(ligne || "")
    .replace(/[|_©®™•·«»"{}[\]]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[^A-Za-zÀ-ÿ0-9(+]+/, "")
    .replace(/[^A-Za-zÀ-ÿ0-9).]+$/, "")
    .trim();
}

function siteDepuisUrl(url) {
  const m = String(url || "").match(
    /^(?:https?:\/\/)?(?:www\.)?([A-Za-z0-9.-]+\.[A-Za-z]{2,})/i
  );

  return m ? `www.${m[1].toLowerCase()}` : null;
}

// ============================================================
// QR CODE
// ============================================================

async function lireQrCode(imageBuffer) {
  let image;

  try {
    image = await Jimp.read(imageBuffer);
  } catch {
    return null;
  }

  // Essayer plusieurs tailles : un petit QR se lit mieux en grand,
  // un QR flou se lit parfois mieux en réduit
  for (const largeur of [null, 1000, 700]) {
    const copie = image.clone();

    if (largeur && copie.bitmap.width > largeur) {
      copie.resize({ w: largeur });
    }

    const resultat = jsQR(
      new Uint8ClampedArray(copie.bitmap.data),
      copie.bitmap.width,
      copie.bitmap.height
    );

    if (resultat?.data) {
      return resultat.data.trim();
    }
  }

  return null;
}

function analyserQrCode(contenu) {
  const champs = {};

  if (!contenu) return champs;

  // ---------- vCard ----------
  if (/BEGIN:VCARD/i.test(contenu)) {
    const lignes = contenu
      .replace(/\r?\n[ \t]/g, "")
      .split(/\r?\n/);

    const valeur = (cle) => {
      const l = lignes.find((x) =>
        new RegExp(`^${cle}[;:]`, "i").test(x)
      );
      return l ? l.substring(l.indexOf(":") + 1).trim() : null;
    };

    const fn = valeur("FN");
    const n = valeur("N");

    if (n) {
      const [nom, prenom] = n.split(";");
      champs.nom = nom || null;
      champs.prenom = prenom || null;
    } else if (fn) {
      const mots = fn.split(" ");
      champs.prenom = mots.shift();
      champs.nom = mots.join(" ") || null;
    }

    champs.email = valeur("EMAIL");
    champs.telephone = valeur("TEL");
    champs.societe = valeur("ORG")?.split(";")[0] || null;
    champs.fonction = valeur("TITLE");
    champs.site = siteDepuisUrl(valeur("URL"));

    const adr = valeur("ADR");
    if (adr) {
      champs.adresse_societe =
        adr.split(";").map((x) => x.trim()).filter(Boolean).join(", ");
    }

    return champs;
  }

  // ---------- MECARD ----------
  if (/^MECARD:/i.test(contenu)) {
    const valeur = (cle) => {
      const m = contenu.match(new RegExp(`${cle}:([^;]*)`, "i"));
      return m ? m[1].trim() : null;
    };

    const n = valeur("N");
    if (n) {
      const [nom, prenom] = n.split(",");
      champs.nom = nom || null;
      champs.prenom = prenom || null;
    }

    champs.email = valeur("EMAIL");
    champs.telephone = valeur("TEL");
    champs.societe = valeur("ORG");
    champs.site = siteDepuisUrl(valeur("URL"));
    champs.adresse_societe = valeur("ADR");

    return champs;
  }

  // ---------- Lien simple ----------
  if (/^(https?:\/\/|www\.)/i.test(contenu)) {
    champs.site = siteDepuisUrl(contenu);
  } else if (EMAIL_REGEX.test(contenu)) {
    champs.email = contenu.match(EMAIL_REGEX)[0].toLowerCase();
  }

  return champs;
}

// ============================================================
// TÉLÉPHONE
// ============================================================

function separerIndicatif(brut) {
  let chiffres = String(brut || "").replace(/\D/g, "");

  if (!chiffres) return { indicatif: null, telephone: null };

  if (chiffres.startsWith("00")) chiffres = chiffres.substring(2);

  const international =
    /^\s*(\+|00|\(\+)/.test(brut) || chiffres.length > 9;

  if (international) {
    const trouve = INDICATIFS.find((ind) => chiffres.startsWith(ind));

    if (trouve) {
      return {
        indicatif: `+${trouve}`,
        telephone: chiffres.substring(trouve.length),
      };
    }

    return { indicatif: null, telephone: `+${chiffres}` };
  }

  return { indicatif: null, telephone: chiffres };
}

function extraireTelephone(lignes) {
  const candidats = [];

  lignes.forEach((ligne, index) => {
    if (/fax/i.test(ligne) && !/tel|mob|gsm/i.test(ligne)) return;

    (ligne.match(PHONE_REGEX) || []).forEach((m) => {
      const chiffres = m.replace(/\D/g, "");

      if (chiffres.length < 8 || chiffres.length > 15) return;

      const local = chiffres.replace(/^(00)?216/, "");

      let score = 0;
      if (/mob|gsm|cel|port|whatsapp/i.test(ligne)) score += 3;
      if (contientMot(ligne, MOTS_TELEPHONE)) score += 1;
      // Mobile tunisien (2x, 4x, 5x, 9x) plutôt que fixe (7x)
      if (/^[2459]\d{7}$/.test(local)) score += 2;
      // Le premier numéro de la carte est souvent le principal
      score -= index * 0.01;

      candidats.push({ brut: m.trim(), score });
    });
  });

  if (!candidats.length) return { indicatif: null, telephone: null };

  candidats.sort((a, b) => b.score - a.score);

  return separerIndicatif(candidats[0].brut);
}

// ============================================================
// NOM / PRÉNOM
// ============================================================

function extraireNomPrenom(lignes, exclues) {
  const candidates = lignes.filter((l) => {
    if (exclues.has(l)) return false;
    if (/[0-9@:/]/.test(l)) return false;
    if (contientMot(l, MOTS_FONCTION)) return false;
    if (contientMot(l, MOTS_SOCIETE)) return false;
    if (contientMot(l, MOTS_ADRESSE)) return false;
    if (contientMot(l, MOTS_RUBRIQUE)) return false;

    const mots = l.split(" ").filter(Boolean);
    if (mots.length < 2 || mots.length > 4) return false;

    return mots.every((m) => /^[A-Za-zÀ-ÿ'.-]{2,}$/.test(m));
  });

  if (!candidates.length) return { prenom: null, nom: null };

  const mots = candidates[0].split(" ").filter(Boolean);

  // Un mot entièrement en MAJUSCULES est en général le nom de famille
  const estMaj = (m) => m.length > 1 && m === m.toUpperCase();
  const toutEnMaj = mots.every(estMaj);

  let prenomMots;
  let nomMots;

  if (!toutEnMaj && mots.some(estMaj)) {
    nomMots = mots.filter(estMaj);
    prenomMots = mots.filter((m) => !estMaj(m));
  } else {
    prenomMots = [mots[0]];
    nomMots = mots.slice(1);
  }

  return {
    prenom: majusculeInitiale(prenomMots.join(" ")) || null,
    nom: majusculeInitiale(nomMots.join(" ")) || null,
  };
}

// ============================================================
// ANALYSE DU TEXTE OCR
// ============================================================

function analyserTexteCarte(lignesBrutes) {
  const lignes = (Array.isArray(lignesBrutes)
    ? lignesBrutes
    : String(lignesBrutes || "").split(/\r?\n/)
  )
    .map(nettoyerLigne)
    .filter((l) => l.length >= 3 && /[A-Za-zÀ-ÿ0-9]{2}/.test(l));

  const utilisees = new Set();

  // E-mail
  let email = null;
  for (const l of lignes) {
    const m = l.replace(/\s+@\s+/g, "@").match(EMAIL_REGEX);
    if (m) {
      email = m[0].toLowerCase();
      utilisees.add(l);
      break;
    }
  }

  // Site web
  let site = null;
  const lignesSite = new Set();
  for (const l of lignes) {
    const m = l.match(WEBSITE_REGEX);
    if (m) {
      if (!site) site = siteDepuisUrl(m[1].replace(/ /g, "."));
      lignesSite.add(l);
      utilisees.add(l);
    }
  }

  const domaineEmail = email ? email.split("@")[1] : null;
  const emailPro =
    domaineEmail &&
    !EMAIL_PUBLICS.some((p) => domaineEmail.startsWith(`${p}.`));

  // Téléphone
  const { indicatif, telephone } = extraireTelephone(lignes);

  lignes.forEach((l) => {
    if (l.replace(/\D/g, "").length >= 8 && !contientMot(l, MOTS_ADRESSE)) {
      utilisees.add(l);
    }
  });

  // Rubriques (« HEAD OFFICE »…)
  lignes.forEach((l) => {
    if (contientMot(l, MOTS_RUBRIQUE) && l.split(" ").length <= 4) {
      utilisees.add(l);
    }
  });

  // Fonction
  let fonction = null;
  for (const l of lignes) {
    if (utilisees.has(l) || /[0-9@]/.test(l)) continue;
    if (contientMot(l, MOTS_FONCTION) && l.split(" ").length <= 7) {
      fonction = l;
      utilisees.add(l);
      break;
    }
  }

  // Société
  let societe = null;
  for (const l of lignes) {
    if (utilisees.has(l) || /@/.test(l) || l.length < 4) continue;
    if (contientMot(l, MOTS_SOCIETE) && !contientMot(l, MOTS_ADRESSE)) {
      societe = l;
      utilisees.add(l);
      break;
    }
  }

  // Adresse : premier bloc d'adresse (2 lignes maximum)
  const lignesAdresse = [];
  for (const ligne of lignes) {
    if (lignesAdresse.length >= 2) break;

    // Une ligne peut contenir le site ET l'adresse : retirer le site
    const l = lignesSite.has(ligne)
      ? nettoyerLigne(ligne.replace(WEBSITE_REGEX, " "))
      : ligne;

    if (!l || EMAIL_REGEX.test(l)) continue;
    if (utilisees.has(ligne) && !lignesSite.has(ligne)) continue;

    if (contientMot(l, MOTS_ADRESSE) || /\b\d{4,5}\b/.test(l)) {
      lignesAdresse.push(l);
      utilisees.add(ligne);
    } else if (lignesAdresse.length) {
      break;
    }
  }

  // Nom / prénom
  const { prenom, nom } = extraireNomPrenom(lignes, utilisees);

  return {
    nom,
    prenom,
    email,
    indicatif,
    telephone,
    site,
    societe,
    fonction,
    adresse_societe: lignesAdresse.length
      ? lignesAdresse.join(", ")
      : null,
    _domaineEmailPro: emailPro ? domaineEmail : null,
  };
}

// ============================================================
// LECTURE COMPLÈTE
// ============================================================

async function lireOcr(imageBuffer) {
  const worker = await createWorker(["eng", "fra"]);

  try {
    const { data } = await worker.recognize(
      imageBuffer,
      {},
      { text: true, blocks: true }
    );

    // Garder seulement les mots lus avec une bonne confiance
    const lignes = [];

    (data.blocks || []).forEach((block) =>
      (block.paragraphs || []).forEach((para) =>
        (para.lines || []).forEach((ligne) => {
          const mots = (ligne.words || [])
            .filter(
              (w) =>
                w.confidence >= CONFIANCE_MIN &&
                // Ignorer les caractères isolés (« 3 », « { », « ñ »…)
                w.text.replace(/[^A-Za-zÀ-ÿ0-9]/g, "").length >= 2
            )
            .map((w) => w.text);

          if (mots.length) lignes.push(mots.join(" "));
        })
      )
    );

    return {
      texte: data.text,
      lignes: lignes.length ? lignes : String(data.text || "").split("\n"),
    };
  } finally {
    // Libérer la mémoire (important sur Render)
    await worker.terminate();
  }
}

async function lireCarteVisite(imageBuffer) {
  const [ocr, qr] = await Promise.all([
    lireOcr(imageBuffer),
    lireQrCode(imageBuffer).catch(() => null),
  ]);

  const champsOcr = analyserTexteCarte(ocr.lignes);
  const champsQr = analyserQrCode(qr);

  // Les informations du QR code sont plus fiables que l'OCR
  const champs = { ...champsOcr };

  Object.entries(champsQr).forEach(([cle, valeur]) => {
    if (valeur) champs[cle] = valeur;
  });

  if (champsQr.telephone) {
    Object.assign(champs, separerIndicatif(champsQr.telephone));
  }

  // Société déduite du site (ou de l'e-mail pro) si non trouvée
  if (!champs.societe) {
    const domaine =
      champs.site?.replace(/^www\./, "") || champsOcr._domaineEmailPro;

    if (domaine) {
      champs.societe = majusculeInitiale(domaine.split(".")[0]);
    }
  }

  if (!champs.site && champsOcr._domaineEmailPro) {
    champs.site = `www.${champsOcr._domaineEmailPro}`;
  }

  delete champs._domaineEmailPro;

  return {
    texte: ocr.texte,
    qr,
    champs,
  };
}

module.exports = {
  lireCarteVisite,
  analyserTexteCarte,
  analyserQrCode,
};
