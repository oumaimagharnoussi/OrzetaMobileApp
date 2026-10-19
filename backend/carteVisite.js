// ============================================================
// LECTURE DE CARTE DE VISITE (GRATUIT)
// - Texte : Tesseract.js (OCR)
// - QR code : jsQR (vCard, MECARD ou lien du site)
// ============================================================

const dns = require("dns").promises;
const net = require("net");
const axios = require("axios");
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
    .replace(/ ,/g, ",")
    .replace(/^[^A-Za-zÀ-ÿ0-9(+]+/, "")
    .replace(/[^A-Za-zÀ-ÿ0-9).]+$/, "")
    // Fragments parasites de 1-2 lettres minuscules en début ou fin
    // de ligne (« li Business Development Executive »)
    .replace(/^(?:[a-zà-ÿ]{1,2} )+(?=[A-ZÀ-Ý])/, "")
    .replace(/(?: [a-zà-ÿ]{1,2})+$/, "")
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

// Noir et blanc avec contraste étiré + seuil automatique (Otsu) :
// permet de lire un QR peu contrasté (ex. vert foncé sur fond sombre)
function binariser(pixels) {
  const n = pixels.length / 4;
  const lum = new Float32Array(n);
  let min = 255;
  let max = 0;

  for (let i = 0; i < n; i++) {
    const v =
      0.299 * pixels[4 * i] +
      0.587 * pixels[4 * i + 1] +
      0.114 * pixels[4 * i + 2];
    lum[i] = v;
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const etendue = max - min || 1;
  const hist = new Array(256).fill(0);

  for (let i = 0; i < n; i++) {
    lum[i] = ((lum[i] - min) / etendue) * 255;
    hist[Math.round(lum[i])]++;
  }

  let somme = 0;
  for (let t = 0; t < 256; t++) somme += t * hist[t];

  let sommeFond = 0;
  let poidsFond = 0;
  let meilleur = 0;
  let seuil = 128;

  for (let t = 0; t < 256; t++) {
    poidsFond += hist[t];
    if (!poidsFond) continue;

    const poidsForme = n - poidsFond;
    if (!poidsForme) break;

    sommeFond += t * hist[t];

    const ecart =
      poidsFond *
      poidsForme *
      (sommeFond / poidsFond - (somme - sommeFond) / poidsForme) ** 2;

    if (ecart > meilleur) {
      meilleur = ecart;
      seuil = t;
    }
  }

  const sortie = new Uint8ClampedArray(pixels.length);

  for (let i = 0; i < n; i++) {
    const v = lum[i] > seuil ? 255 : 0;
    sortie[4 * i] = v;
    sortie[4 * i + 1] = v;
    sortie[4 * i + 2] = v;
    sortie[4 * i + 3] = 255;
  }

  return sortie;
}

function lireQrCode(image) {
  // Essayer plusieurs tailles, de la plus rapide à la plus précise :
  // un QR flou se lit parfois mieux en réduit, un petit QR en grand.
  // Pour chaque taille : image normale, puis version noir et blanc.
  for (const largeur of [400, 550, 700, 1000, null]) {
    if (largeur && image.bitmap.width <= largeur) continue;

    const copie = largeur
      ? image.clone().resize({ w: largeur })
      : image;

    const pixels = new Uint8ClampedArray(copie.bitmap.data);

    for (const donnees of [pixels, binariser(pixels)]) {
      const resultat = jsQR(
        donnees,
        copie.bitmap.width,
        copie.bitmap.height
      );

      if (resultat?.data) {
        return resultat.data.trim();
      }
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

    // Valeur brute d'une propriété (préférence éventuelle : ex. CELL)
    const brut = (cle, preference) => {
      const candidates = lignes.filter((x) =>
        new RegExp(`^(?:item\\d+\\.)?${cle}[;:]`, "i").test(x)
      );

      const l =
        (preference &&
          candidates.find((x) =>
            new RegExp(preference, "i").test(x.substring(0, x.indexOf(":")))
          )) ||
        candidates[0];

      return l ? l.substring(l.indexOf(":") + 1).trim() : null;
    };

    // Composants séparés par « ; » (sauf « \; ») puis déséchappés
    const composants = (texte) =>
      String(texte || "")
        .split(/(?<!\\);/)
        .map((x) =>
          x
            .replace(/\\n/gi, " ")
            .replace(/\\([,;\\])/g, "$1")
            .trim()
        );

    const valeur = (cle, preference) => {
      const v = brut(cle, preference);
      return v ? composants(v).join(" ").trim() || null : null;
    };

    const fn = valeur("FN");
    const n = brut("N");

    if (n) {
      const [nom, prenom] = composants(n);
      champs.nom = nom || null;
      champs.prenom = prenom || null;
    } else if (fn) {
      const mots = fn.split(" ");
      champs.prenom = mots.shift();
      champs.nom = mots.join(" ") || null;
    }

    champs.email = valeur("EMAIL");
    champs.telephone = valeur("TEL", "CELL|MOBILE");
    champs.societe = composants(brut("ORG"))[0] || null;
    champs.fonction = valeur("TITLE");
    champs.site = siteDepuisUrl(brut("URL"));

    // ADR : boîte postale ; complément ; rue ; ville ; région ; code ; pays
    const adr = brut("ADR");
    if (adr) {
      const [, , rue, ville, region, code, pays] = composants(adr);

      champs.adresse_societe =
        [
          rue,
          [code, ville].filter(Boolean).join(" "),
          region,
          pays,
        ]
          .filter(Boolean)
          .join(", ") || null;
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

// Plus grand côté de l'image lue par l'OCR : au-delà, la lecture
// est beaucoup plus lente sans être plus précise
const TAILLE_MAX_OCR = 1400;

// Le moteur OCR est chargé une seule fois puis réutilisé
// (le recharger à chaque carte prend plusieurs secondes sur Render)
let workerPromise = null;

function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker(["eng", "fra"]).catch((error) => {
      workerPromise = null;
      throw error;
    });
  }

  return workerPromise;
}

// Appelé au démarrage du serveur : le premier scan est aussi rapide
function prechargerOcr() {
  return getWorker()
    .then(() => console.log("✅ Lecteur de cartes de visite prêt"))
    .catch((error) =>
      console.error("❌ Préchargement OCR :", error.message)
    );
}

async function lireOcr(imageBuffer) {
  const worker = await getWorker();

  {
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
  }
}

async function lireCarteVisite(imageBuffer) {
  // Décoder et réduire l'image une seule fois
  const image = await Jimp.read(imageBuffer);

  if (Math.max(image.bitmap.width, image.bitmap.height) > TAILLE_MAX_OCR) {
    if (image.bitmap.width >= image.bitmap.height) {
      image.resize({ w: TAILLE_MAX_OCR });
    } else {
      image.resize({ h: TAILLE_MAX_OCR });
    }
  }

  let qr = null;
  try {
    qr = lireQrCode(image);
  } catch {
    qr = null;
  }

  const imageOcr = await image
    .clone()
    .greyscale()
    .getBuffer("image/jpeg", { quality: 85 });

  const ocr = await lireOcr(imageOcr);

  return {
    texte: ocr.texte,
    qr,
    champs: await analyserCarteComplete(ocr.lignes, qr),
  };
}

// ============================================================
// TRIER LE TEXTE LU (OCR) + LE QR CODE EN CHAMPS DU FORMULAIRE
// Utilisé par le serveur et quand la lecture est faite
// par le navigateur du téléphone.
// ============================================================

function analyserCarte(lignesOcr, qr) {
  const champsOcr = analyserTexteCarte(lignesOcr);
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

  return champs;
}

// ============================================================
// CARTE DE VISITE EN LIGNE (QR code contenant un lien)
// Le lien est ouvert par le serveur : vCard si la page en propose
// une, sinon téléphone / e-mail / nom trouvés dans la page.
// ============================================================

// Refuser les adresses internes (protection du serveur)
function adresseInterne(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }

  const v6 = ip.toLowerCase();
  return (
    v6 === "::1" ||
    v6 === "::" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") ||
    v6.startsWith("fe80") ||
    v6.startsWith("::ffff:")
  );
}

async function telechargerPagePublique(adresse, redirections = 0) {
  const url = new URL(adresse);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Lien non pris en charge.");
  }

  if (url.port && !["80", "443"].includes(url.port)) {
    throw new Error("Port non autorisé.");
  }

  const { address } = await dns.lookup(url.hostname);

  if (adresseInterne(address)) {
    throw new Error("Adresse non autorisée.");
  }

  const reponse = await axios.get(url.href, {
    timeout: 8000,
    maxRedirects: 0,
    maxContentLength: 2_000_000,
    responseType: "text",
    transformResponse: (x) => x,
    validateStatus: () => true,
    headers: { "User-Agent": "Mozilla/5.0 (OLIVED carte de visite)" },
  });

  // Suivre les redirections en revérifiant chaque adresse
  if (
    reponse.status >= 300 &&
    reponse.status < 400 &&
    reponse.headers.location &&
    redirections < 3
  ) {
    return telechargerPagePublique(
      new URL(reponse.headers.location, url).href,
      redirections + 1
    );
  }

  if (reponse.status !== 200) {
    throw new Error(`Page inaccessible (${reponse.status}).`);
  }

  return { url: url.href, contenu: String(reponse.data || "") };
}

const estVcard = (texte) => /BEGIN:VCARD/i.test(String(texte).slice(0, 1000));

function decoderHtml(texte) {
  return String(texte || "")
    .replace(/&amp;/g, "&")
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (m, c) => String.fromCharCode(Number(c)))
    .trim();
}

async function lireCarteEnLigne(lien) {
  if (!/^https?:\/\//i.test(String(lien || "").trim())) return {};

  try {
    const page = await telechargerPagePublique(lien.trim());

    if (estVcard(page.contenu)) {
      return analyserQrCode(page.contenu);
    }

    const html = page.contenu;

    // Lien vers une vCard (.vcf, vcf=1, vcard…)
    const lienVcard = html.match(
      /href=["']([^"']*(?:\.vcf|[?&](?:amp;)?vcf=|vcard)[^"']*)["']/i
    );

    if (lienVcard) {
      try {
        const vcard = await telechargerPagePublique(
          new URL(decoderHtml(lienVcard[1]), page.url).href
        );

        if (estVcard(vcard.contenu)) {
          return analyserQrCode(vcard.contenu);
        }
      } catch (error) {
        console.warn("[CARTE EN LIGNE] vCard illisible :", error.message);
      }
    }

    // Sinon : informations visibles dans la page
    const champs = {};

    const tel = html.match(/href=["']tel:([^"']+)["']/i);
    if (tel) champs.telephone = decodeURIComponent(tel[1]).trim();

    const mail = html.match(/href=["']mailto:([^"'?]+)/i);
    if (mail) champs.email = decodeURIComponent(mail[1]).trim().toLowerCase();

    const titre =
      html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/content=["']([^"']+)["'][^>]*property=["']og:title["']/i) ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i);

    if (titre) {
      // « Mohamed ZOUARI — Orzeta » -> nom de la personne
      const nomComplet = decoderHtml(titre[1]).split(/\s[—–|-]\s/)[0].trim();
      const mots = nomComplet.split(/\s+/).filter(Boolean);

      if (mots.length >= 2 && mots.length <= 4) {
        champs.prenom = mots[0];
        champs.nom = mots.slice(1).join(" ");
      }
    }

    return champs;
  } catch (error) {
    console.warn("[CARTE EN LIGNE] Lien illisible :", error.message);
    return {};
  }
}

// Champs de la carte + informations de la carte en ligne (prioritaires)
async function analyserCarteComplete(lignesOcr, qr) {
  const champs = analyserCarte(lignesOcr, qr);
  const enLigne = await lireCarteEnLigne(qr);

  Object.entries(enLigne).forEach(([cle, valeur]) => {
    if (valeur) champs[cle] = valeur;
  });

  if (enLigne.telephone) {
    Object.assign(champs, separerIndicatif(enLigne.telephone));
  }

  return champs;
}

// ============================================================
// STOCKAGE DES CARTES DE VISITE (table cartes_visite)
// ============================================================

let tableCartesPrete = false;

async function ensureCartesVisiteTable(db) {
  if (tableCartesPrete) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS cartes_visite (
      id INT AUTO_INCREMENT PRIMARY KEY,
      visiteur_id INT NOT NULL,
      image MEDIUMBLOB NOT NULL,
      mime VARCHAR(30) NOT NULL DEFAULT 'image/jpeg',
      taille INT NOT NULL DEFAULT 0,
      qr_code TEXT NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_cartes_visite_visiteur (visiteur_id)
    )
  `);

  tableCartesPrete = true;
}

// Réduit la photo (1400 px max, JPEG) pour limiter la taille en base
async function compresserImage(imageBuffer) {
  const image = await Jimp.read(imageBuffer);

  if (image.bitmap.width > 1400) {
    image.resize({ w: 1400 });
  }

  return image.getBuffer("image/jpeg", { quality: 80 });
}

async function enregistrerCarteVisite(db, {
  visiteurId,
  imageBase64,
  qrCode,
  createdBy,
}) {
  await ensureCartesVisiteTable(db);

  const brut = Buffer.from(
    String(imageBase64).replace(/^data:image\/[a-z+]+;base64,/i, ""),
    "base64"
  );

  if (brut.length < 1000) {
    throw new Error("Image de carte de visite invalide.");
  }

  const image = await compresserImage(brut);

  const [resultat] = await db.query(
    `
      INSERT INTO cartes_visite
        (visiteur_id, image, mime, taille, qr_code, created_by)
      VALUES (?, ?, 'image/jpeg', ?, ?, ?)
    `,
    [
      visiteurId,
      image,
      image.length,
      qrCode ? String(qrCode).slice(0, 2000) : null,
      createdBy || null,
    ]
  );

  return { id: resultat.insertId, taille: image.length };
}

module.exports = {
  lireCarteVisite,
  analyserCarte,
  analyserCarteComplete,
  lireCarteEnLigne,
  prechargerOcr,
  ensureCartesVisiteTable,
  enregistrerCarteVisite,
  analyserTexteCarte,
  analyserQrCode,
};
