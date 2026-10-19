// ============================================================
// LECTURE DE CARTE DE VISITE DANS LE NAVIGATEUR (WEB)
// Le téléphone lit lui-même le texte (Tesseract.js) et le QR code
// (jsQR) : bien plus rapide que le serveur Render gratuit.
// Le serveur ne fait ensuite que trier le texte en champs.
// ============================================================

import { createWorker } from "tesseract.js";
import jsQR from "jsqr";

// Mêmes réglages que la lecture côté serveur (backend/carteVisite.js)
const CONFIANCE_MIN = 60;
const TAILLE_MAX_OCR = 1400;

// Le moteur est chargé une seule fois (données mises en cache
// par le navigateur après le premier scan)
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

// À appeler dès que l'utilisateur ouvre le scan : le moteur se
// charge pendant qu'il prend la photo
export function prechargerLecteurCarte() {
  getWorker().catch(() => {});
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

function lireQrCode(image) {
  // De la plus rapide à la plus précise
  for (const taille of [700, 1000, TAILLE_MAX_OCR]) {
    const { canvas, ctx } = dessiner(image, taille);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const resultat = jsQR(pixels.data, canvas.width, canvas.height);

    if (resultat?.data) return resultat.data.trim();
  }

  return null;
}

export async function lireCarteNavigateur(imageBase64) {
  const source = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const [image, worker] = await Promise.all([
    chargerImage(source),
    getWorker(),
  ]);

  let qr = null;
  try {
    qr = lireQrCode(image);
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
