// ============================================================
// LECTURE DE CARTE DE VISITE DANS LE NAVIGATEUR (WEB)
// Le téléphone lit lui-même le texte (Tesseract.js) et le QR code
// (jsQR) : bien plus rapide que le serveur Render gratuit.
// Le serveur ne fait ensuite que trier le texte en champs.
// ============================================================

// Tesseract.js et jsQR sont chargés à la demande (import dynamique) :
// ils ne font plus partie du chargement initial de l'application
let jsQRPromise = null;

function chargerJsQR() {
  if (!jsQRPromise) {
    jsQRPromise = import("jsqr")
      .then((m) => m.default || m)
      .catch((error) => {
        jsQRPromise = null;
        throw error;
      });
  }
  return jsQRPromise;
}

// Mêmes réglages que la lecture côté serveur (backend/carteVisite.js)
const CONFIANCE_MIN = 60;
const TAILLE_MAX_OCR = 1400;

// Le moteur est chargé une seule fois (données mises en cache
// par le navigateur après le premier scan)
let workerPromise = null;

function getWorker() {
  if (!workerPromise) {
    workerPromise = import("tesseract.js")
      .then((m) => (m.createWorker || m.default.createWorker)(["eng", "fra"]))
      .catch((error) => {
        workerPromise = null;
        throw error;
      });
  }

  return workerPromise;
}

// À appeler dès que l'utilisateur ouvre le scan : le moteur se
// charge pendant qu'il prend la photo
export function prechargerLecteurCarte() {
  getWorker().catch(() => {});
  chargerJsQR().catch(() => {});
}

export const lecteurCarteDisponible = true;

function chargerImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Photo illisible."));
    image.src = source;
  });
}

function dessiner(image, largeurMax) {
  const ratio = Math.min(
    1,
    largeurMax / Math.max(image.naturalWidth, image.naturalHeight)
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * ratio);
  canvas.height = Math.round(image.naturalHeight * ratio);

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return { canvas, ctx };
}

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

// Image en niveaux de « saturation » (vivacité de la couleur) :
// sépare un QR coloré (ex. vert) d'un fond gris de même luminosité
function saturation(pixels) {
  const n = pixels.length / 4;
  const sat = new Float32Array(n);
  let max = 1;

  for (let i = 0; i < n; i++) {
    const r = pixels[4 * i];
    const g = pixels[4 * i + 1];
    const b = pixels[4 * i + 2];
    sat[i] = Math.max(r, g, b) - Math.min(r, g, b);
    if (sat[i] > max) max = sat[i];
  }

  const sortie = new Uint8ClampedArray(pixels.length);

  for (let i = 0; i < n; i++) {
    const v = (sat[i] / max) * 255;
    sortie[4 * i] = v;
    sortie[4 * i + 1] = v;
    sortie[4 * i + 2] = v;
    sortie[4 * i + 3] = 255;
  }

  return sortie;
}

function lireQrCode(image, jsQR) {
  // En petit, la trame d'une photo d'écran (moiré) disparaît ; en grand,
  // un petit QR sur une carte se lit. Pour chaque taille : image
  // normale, noir et blanc, saturation.
  for (const taille of [250, 300, 400, 550, 700, 1000, TAILLE_MAX_OCR]) {
    const { canvas, ctx } = dessiner(image, taille);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);

    for (const donnees of [
      pixels.data,
      binariser(pixels.data),
      saturation(pixels.data),
    ]) {
      const resultat = jsQR(donnees, canvas.width, canvas.height);

      if (resultat?.data) return resultat.data.trim();
    }
  }

  return null;
}

export async function lireCarteNavigateur(imageBase64) {
  const source = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const [image, worker, jsQR] = await Promise.all([
    chargerImage(source),
    getWorker(),
    chargerJsQR(),
  ]);

  let qr = null;
  try {
    qr = lireQrCode(image, jsQR);
  } catch {
    qr = null;
  }

  // Image en niveaux de gris pour l'OCR
  const { canvas, ctx } = dessiner(image, TAILLE_MAX_OCR);
  ctx.globalCompositeOperation = "saturation";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";

  const { data } = await worker.recognize(
    canvas,
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
              w.text.replace(/[^A-Za-zÀ-ÿ0-9]/g, "").length >= 2
          )
          .map((w) => w.text);

        if (mots.length) lignes.push(mots.join(" "));
      })
    )
  );

  return {
    lignes: lignes.length
      ? lignes
      : String(data.text || "").split("\n"),
    qr,
  };
}
