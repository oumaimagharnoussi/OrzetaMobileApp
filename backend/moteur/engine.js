// ============================================================
// MOTEUR DE CALCUL (reprise de l'onglet MOTEUR du fichier
// OLIVED_Simulateur_Couts rev 2 obh 2 -omayma.xlsx)
//
// Une ligne par combinaison produit × contenant.
// Toutes les valeurs en TND/kg net sauf mention.
// Les lettres en commentaire renvoient aux colonnes Excel.
// ============================================================

const isNum = (v) =>
  v !== null &&
  v !== undefined &&
  v !== "" &&
  Number.isFinite(Number(v));

const n = (v) => (isNum(v) ? Number(v) : 0);


// ============================================================
// PARAMÈTRES NOMMÉS (FX_EUR, Densite, TauxFin, ...)
// ============================================================

function lireParametres(donnees) {
  const p = {};

  for (const param of donnees.parametres || []) {
    p[param.cle] = n(param.valeur);
  }

  return p;
}


// ============================================================
// PRODUITS : coût huile vrac avant stockage (colonnes E → J)
// ============================================================

function calculerProduits(donnees) {
  // Calculateur production propre : (olives + trituration - crédit) / rendement
  const coutCalcule = {};

  for (const c of donnees.calculateur || []) {
    coutCalcule[c.cle] =
      n(c.rendement) > 0
        ? (n(c.prix_olives) + n(c.trituration) - n(c.credit_sous_produits)) /
          n(c.rendement)
        : 0;
  }

  const resultats = {};

  const coutHuileTransformee = (prod, matiere) =>
    matiere / (1 - n(prod.freinte_transfo)) + n(prod.cout_transfo);

  // Les produits "produit:XXX" dépendent d'un autre produit :
  // on calcule d'abord ceux qui n'en dépendent pas.
  const matiereDe = (prod) => {
    if (isNum(prod.prix_achat_impose)) {
      return Number(prod.prix_achat_impose);
    }

    const source = prod.source_matiere || "saisie";

    if (source.startsWith("calc:")) {
      return coutCalcule[source.slice(5)] ?? 0;
    }

    if (source.startsWith("produit:")) {
      const ref = resultats[source.slice(8)];
      return ref ? ref.cout_vrac : 0;
    }

    return n(prod.matiere_saisie);
  };

  const produits = donnees.produits || [];

  const ordre = [
    ...produits.filter((p) => !(p.source_matiere || "").startsWith("produit:")),
    ...produits.filter((p) => (p.source_matiere || "").startsWith("produit:")),
  ];

  // 1er passage : E et I
  for (const prod of ordre) {
    const matiere = matiereDe(prod);
    const transformee = coutHuileTransformee(prod, matiere);

    resultats[prod.code] = {
      matiere_base: matiere,
      cout_transforme: transformee,
      cout_vrac: transformee,
    };
  }

  // J = I × (1 - coupage) + coupage × I(VOO)
  const iVOO = resultats.VOO ? resultats.VOO.cout_transforme : 0;

  for (const prod of ordre) {
    const r = resultats[prod.code];
    const h = n(prod.part_coupage);

    // Les produits dérivés relisent le coût vrac de leur source
    if ((prod.source_matiere || "").startsWith("produit:") &&
        !isNum(prod.prix_achat_impose)) {
      r.matiere_base = matiereDe(prod);
      r.cout_transforme = coutHuileTransformee(prod, r.matiere_base);
    }

    r.cout_vrac = r.cout_transforme * (1 - h) + h * iVOO;
  }

  return { coutCalcule, produits: resultats };
}


// ============================================================
// CONTENANTS (colonnes E, J, P, Q, R, S, T)
// ============================================================

function calculerContenants(donnees, p) {
  return (donnees.contenants || []).map((c) => {
    const poidsNet = n(c.volume_l) * p.Densite;
    const unitesPalette = n(c.unites_palette);

    const emballageSecondaire =
      n(c.unites_carton) > 0
        ? n(c.cout_carton) / n(c.unites_carton)
        : 0;

    const unitesFcl20 = unitesPalette * n(c.palettes_fcl20);
    const unitesFcl40 = unitesFcl20 * n(c.facteur_40_20);

    const coutTotal =
      n(c.contenant_bouchon) +
      n(c.etiquettes) +
      emballageSecondaire +
      n(c.mise_cond) +
      (unitesPalette > 0 ? n(c.cout_palette) / unitesPalette : 0);

    return {
      ...c,
      poids_net: poidsNet,
      emballage_secondaire: emballageSecondaire,
      unites_fcl20: unitesFcl20,
      unites_fcl40: unitesFcl40,
      cout_total_unite: coutTotal,
      emballage_kg: poidsNet > 0 ? coutTotal / poidsNet : 0,
      poids_fcl20: unitesFcl20 * poidsNet,
    };
  });
}


// ============================================================
// VARIABLES DU SCÉNARIO (S_FX, S_FraisFOB_FCL, S_Fret_USD)
// ============================================================

function calculerScenario(donnees, p) {
  const s = donnees.scenario || {};

  const fx =
    s.devise === "EUR" ? p.FX_EUR :
    s.devise === "USD" ? p.FX_USD :
    1;

  const fraisFob =
    (p.ExpTerre + p.ExpPort + p.ExpDocs + p.ExpEmpot) *
    (s.taille === "40 pieds" ? p.Coef40 : 1);

  const dest = (donnees.destinations || []).find(
    (d) => d.port === s.destination
  );

  const fretBrut =
    s.marche === "Export" && dest
      ? n(s.taille === "40 pieds" ? dest.fret40 : dest.fret20)
      : 0;

  const fretUsd =
    s.marche === "Export" &&
    (s.incoterm === "CFR" || s.incoterm === "CIF")
      ? fretBrut
      : 0;

  return {
    ...s,
    fx,
    frais_fob_fcl: fraisFob,
    fret_brut_usd: fretBrut,
    fret_usd: fretUsd,
    marge_forcee: isNum(s.marge_forcee) ? Number(s.marge_forcee) : null,
  };
}


// ============================================================
// MOTEUR : une ligne par produit × contenant
// ============================================================

function calculerMoteur(donnees) {
  const p = lireParametres(donnees);
  const { produits: coutsProduits } = calculerProduits(donnees);
  const contenants = calculerContenants(donnees, p);
  const sc = calculerScenario(donnees, p);

  const exportMarche = sc.marche === "Export";
  const lignes = [];

  const modePrix = String(
    (donnees.parametres || []).find((x) => x.cle === "ModeMarge")?.valeur || ""
  );

  (donnees.produits || []).forEach((prod, iProd) => {
    const cp = coutsProduits[prod.code];

    contenants.forEach((ct, iCont) => {
      const vrac = ct.famille === "Vrac";

      const G = ct.poids_net;                                   // kg net / unité
      const H = cp.cout_vrac;                                    // coût huile avant stockage
      const I = H / (1 - n(prod.freinte_stockage));              // après freinte stockage
      const J = vrac ? p.PerteVrac : p.PerteCond;                // perte manut./cond.
      const K = I / (1 - J);                                     // huile après pertes
      const L = (p.CoutStock / 1000) * n(prod.duree_stockage);   // stockage
      const M = p.CoutLabo;                                      // qualité / labo
      const N =
        (K * p.TauxFin *
          (n(prod.duree_stockage) +
            (exportMarche ? p.DelaiExport : p.DelaiLocal) / 30)) / 12;   // frais financiers
      const O = ct.cout_total_unite;                             // emballage TND/unité
      const P = G > 0 ? O / G : 0;                               // emballage TND/kg
      const Q = p.CoutFG;                                        // frais généraux
      const R = K + L + M + N + P + Q;                           // COÛT DE REVIENT EXW

      const margeCible = vrac
        ? (exportMarche ? prod.marge_vrac_export : prod.marge_vrac_local)
        : (exportMarche ? prod.marge_cond_export : prod.marge_cond_local);

      const S = sc.marge_forcee !== null ? sc.marge_forcee : n(margeCible);   // marge appliquée
      const T = exportMarche ? p.CommExport : p.CommLocal;                     // commission

      const U =
        (modePrix === "Marge sur prix de vente" ? R / (1 - S) : R * (1 + S)) /
        (1 - T);                                                 // PRIX EXW catalogue

      const V = sc.taille === "40 pieds" ? ct.unites_fcl40 : ct.unites_fcl20;  // unités / FCL
      const W = V * G;                                           // kg net / FCL

      const incotermMer = ["FOB", "CFR", "CIF"].includes(sc.incoterm);
      const incotermFret = ["CFR", "CIF"].includes(sc.incoterm);

      const X = exportMarche && incotermMer && W > 0 ? sc.frais_fob_fcl / W : 0;          // frais FOB
      const Y = exportMarche && incotermFret && W > 0 ? (sc.fret_usd * p.FX_USD) / W : 0; // fret maritime
      const Z =
        sc.marche === "Local" && sc.incoterm === "Livré local"
          ? (vrac ? p.TrLocVrac : p.TrLocCond)
          : 0;                                                   // transport local
      const AA = exportMarche && sc.incoterm === "CIF" ? p.AssurBase * p.TauxAssur : 0;  // coef. assurance

      const AB = (U + X + Y) * (1 + AA) + Z;                     // PRIX FINAL TND/kg
      const AC = sc.fx > 0 ? AB / sc.fx : 0;                     // PRIX FINAL devise/kg
      const AD = AC * G;                                         // prix par unité (devise)
      const AE = AC * p.Densite;                                 // prix par litre (devise)
      const AF = U * (1 - T) - R;                                // marge brute TND/kg
      const AG = U * (1 - T) !== 0 ? AF / (U * (1 - T)) : 0;      // marge % prix EXW net comm.
      const AH = !vrac && prod.vente_cond_autorisee === "Non" ? 0 : 1;  // autorisé

      lignes.push({
        idx_produit: iProd + 1,
        idx_contenant: iCont + 1,
        produit: prod.code,
        contenant: ct.designation,
        famille: ct.famille,
        cle: `${prod.code}|${ct.designation}`,
        kg_net_unite: G,
        cout_huile_avant_stockage: H,
        apres_freinte_stockage: I,
        perte_manut_cond: J,
        huile_apres_pertes: K,
        stockage: L,
        qualite_labo: M,
        frais_financiers: N,
        emballage_unite: O,
        emballage_kg: P,
        frais_generaux: Q,
        cout_revient_exw: R,
        marge_appliquee: S,
        commission: T,
        prix_exw_catalogue: U,
        unites_fcl: V,
        kg_net_fcl: W,
        frais_fob_kg: X,
        fret_maritime_kg: Y,
        transport_local_kg: Z,
        coef_assurance: AA,
        prix_final_tnd_kg: AB,
        prix_final_devise_kg: AC,
        prix_unite_devise: AD,
        prix_litre_devise: AE,
        marge_brute_kg: AF,
        marge_pct: AG,
        autorise: AH,
      });
    });
  });

  return {
    scenario: sc,
    lignes,
  };
}


// ============================================================
// SIMULATEUR (onglet SIMULATEUR de l'Excel)
//
// Le produit et le contenant choisis désignent une ligne du
// MOTEUR (S_Row) ; on y applique quantité, remise et incoterm.
// `entree` : { produit, contenant, quantite, unite, remise,
//              + champs du scénario (marche, incoterm, ...) }
// ============================================================

const NIVEAUX_MARGE = [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.15];

function simuler(donnees, entree = {}) {
  const p = lireParametres(donnees);

  const scenario = { ...donnees.scenario };
  for (const champ of ["marche", "incoterm", "destination", "taille", "devise"]) {
    if (entree[champ]) scenario[champ] = entree[champ];
  }
  if ("marge_forcee" in entree) {
    scenario.marge_forcee = isNum(entree.marge_forcee) ? Number(entree.marge_forcee) : null;
  }

  const { scenario: sc, lignes } = calculerMoteur({ ...donnees, scenario });

  const ligne = lignes.find(
    (l) => l.produit === entree.produit && l.contenant === entree.contenant
  );

  const prod = (donnees.produits || []).find((x) => x.code === entree.produit);

  const base = {
    scenario: sc,
    produit: entree.produit,
    designation_produit: prod ? prod.designation_fr : "",
    contenant: entree.contenant,
    famille: ligne ? ligne.famille : "",
    ligne_moteur: ligne ? lignes.indexOf(ligne) + 1 : null,
  };

  if (!ligne) {
    return { ...base, controle: "⚠ Combinaison produit/contenant introuvable" };
  }

  const fx = sc.fx;
  const remise = n(entree.remise);
  const quantite = n(entree.quantite);
  const unite = entree.unite || "Conteneurs";

  const G = ligne.kg_net_unite;
  const W = ligne.kg_net_fcl;
  const T = ligne.commission;

  // Quantité totale en kg (G11), unités (G12), conteneurs (G13)
  const kgTotal =
    unite === "Tonnes" ? quantite * 1000 :
    unite === "Unités" ? quantite * G :
    quantite * W;

  const unites = G > 0 ? Math.ceil(kgTotal / G - 1e-9) : 0;
  const conteneurs = W > 0 ? Math.ceil(kgTotal / W - 1e-9) : 0;
  const remplissage = conteneurs > 0 && W > 0 ? kgTotal / (conteneurs * W) : 0;

  // 3. Décomposition (TND/kg) : C29 → C43
  const exwNet = ligne.prix_exw_catalogue * (1 - remise);                   // C38
  const assurance =
    (exwNet + ligne.frais_fob_kg + ligne.fret_maritime_kg) * ligne.coef_assurance; // C41

  const coutRevient = ligne.cout_revient_exw;                               // C35
  const margeBrute = exwNet * (1 - T) - coutRevient;                        // C36
  const commission = exwNet * T;                                            // C37
  const prixFinal =
    exwNet + ligne.frais_fob_kg + ligne.fret_maritime_kg + assurance +
    ligne.transport_local_kg;                                               // C43

  const composantes = [
    ["huile", "Huile d'olive (matière, freintes & pertes incluses)", ligne.huile_apres_pertes],
    ["stockage", "Stockage", ligne.stockage],
    ["qualite", "Contrôle qualité & analyses", ligne.qualite_labo],
    ["frais_financiers", "Frais financiers", ligne.frais_financiers],
    ["emballage", "Contenant & emballage", ligne.emballage_kg],
    ["frais_generaux", "Frais généraux & structure", ligne.frais_generaux],
    ["cout_revient", "COÛT DE REVIENT DÉPART USINE (EXW)", coutRevient, true],
    ["marge_brute", "Marge brute (après commission)", margeBrute],
    ["commission", "Commission agent / courtier", commission],
    ["prix_exw_net", "PRIX EXW NET (après remise)", exwNet, true],
    ["frais_fob", "Frais FOB (transport port, THC, douane, empotage)", ligne.frais_fob_kg],
    ["fret", "Fret maritime", ligne.fret_maritime_kg],
    ["assurance", "Assurance cargaison", assurance],
    ["transport_local", "Transport local (livraison)", ligne.transport_local_kg],
    ["prix_final", "PRIX FINAL SELON INCOTERM", prixFinal, true],
  ].map(([cle, libelle, tnd, total]) => {
    const devise = fx > 0 ? tnd / fx : 0;
    return {
      cle,
      libelle,
      total: !!total,
      tnd_kg: tnd,
      pct_prix_final: prixFinal !== 0 ? tnd / prixFinal : 0,
      devise_kg: devise,
      devise_unite: devise * G,
      devise_total: devise * kgTotal,
    };
  });

  // 2. Résultats clés (G5 → G18)
  const prixNetKg = fx > 0 ? prixFinal / fx : 0;
  const resultats = {
    cout_revient_tnd_kg: coutRevient,
    prix_catalogue_kg:
      fx > 0
        ? ((ligne.prix_exw_catalogue + ligne.frais_fob_kg + ligne.fret_maritime_kg) *
            (1 + ligne.coef_assurance) + ligne.transport_local_kg) / fx
        : 0,
    prix_net_kg: prixNetKg,
    prix_net_unite: prixNetKg * G,
    prix_net_litre: prixNetKg * p.Densite,
    prix_net_tonne: prixNetKg * 1000,
    quantite_kg: kgTotal,
    unites,
    conteneurs,
    remplissage,
    montant_total: prixNetKg * kgTotal,
    marge_brute_totale_tnd: margeBrute * kgTotal,
    marge_sur_cout: coutRevient !== 0 ? margeBrute / coutRevient : 0,
    marge_sur_prix: exwNet - commission !== 0 ? margeBrute / (exwNet - commission) : 0,
    marge_appliquee: ligne.marge_appliquee,
  };

  // 4. Comparatif des incoterms (C48 → C52), prix net de remise
  const exportMarche = sc.marche === "Export";
  const fobKg = W > 0 ? sc.frais_fob_fcl / W : 0;
  const fretKg = W > 0 ? (sc.fret_brut_usd * p.FX_USD) / W : 0;
  const avecFret = exportMarche && sc.fret_brut_usd > 0;

  const comparatif = [
    ["EXW", exwNet],
    ["FOB", exportMarche ? exwNet + fobKg : null],
    ["CFR", avecFret ? exwNet + fobKg + fretKg : null],
    ["CIF", avecFret ? (exwNet + fobKg + fretKg) * (1 + p.AssurBase * p.TauxAssur) : null],
    ["Livré local",
      sc.marche === "Local"
        ? exwNet + (ligne.famille === "Vrac" ? p.TrLocVrac : p.TrLocCond)
        : null],
  ].map(([incoterm, tnd]) => {
    const devise = tnd !== null && fx > 0 ? tnd / fx : null;
    return {
      incoterm,
      tnd_kg: tnd,
      devise_kg: devise,
      devise_unite: devise !== null ? devise * G : null,
      devise_tonne: devise !== null ? devise * 1000 : null,
      devise_total: devise !== null ? devise * kgTotal : null,
    };
  });

  // 5. Sensibilité à la marge (C57 → G64)
  const modePrix = String(
    (donnees.parametres || []).find((x) => x.cle === "ModeMarge")?.valeur || ""
  );

  const sensibilite = NIVEAUX_MARGE.map((m) => {
    const R = coutRevient;
    const exw =
      ((modePrix === "Marge sur prix de vente" ? R / (1 - m) : R * (1 + m)) / (1 - T)) *
      (1 - remise);
    const tnd =
      (exw + ligne.frais_fob_kg + ligne.fret_maritime_kg) * (1 + ligne.coef_assurance) +
      ligne.transport_local_kg;
    const devise = fx > 0 ? tnd / fx : 0;

    return {
      marge: m,
      devise_kg: devise,
      devise_unite: devise * G,
      devise_tonne: devise * 1000,
      devise_total: devise * kgTotal,
      marge_brute_tnd: (exw * (1 - T) - R) * kgTotal,
    };
  });

  // Contrôle de cohérence (C18)
  let controle = "✔ Scénario cohérent";
  if (!ligne.autorise) {
    controle = "⚠ Produit non destiné à la vente conditionnée (vrac uniquement)";
  } else if (sc.marche === "Local" && ["FOB", "CFR", "CIF"].includes(sc.incoterm)) {
    controle = "⚠ Incoterm export incompatible avec le marché Local (choisir EXW ou Livré local)";
  } else if (exportMarche && sc.incoterm === "Livré local") {
    controle = "⚠ « Livré local » incompatible avec Export (choisir EXW, FOB, CFR ou CIF)";
  } else if (exportMarche && ["CFR", "CIF"].includes(sc.incoterm) && sc.fret_usd === 0) {
    controle = "⚠ Destination sans tarif de fret : voir PARAMETRES";
  } else if (exportMarche && sc.incoterm !== "EXW" && remplissage < 0.9) {
    controle = `⚠ Conteneur sous-rempli (${Math.round(remplissage * 100)}%) : fret réel supérieur`;
  }

  return {
    ...base,
    entree: { quantite, unite, remise },
    controle,
    autorise: ligne.autorise,
    resultats,
    composantes,
    comparatif,
    sensibilite,
  };
}


module.exports = {
  simuler,
  calculerMoteur,
  calculerProduits,
  calculerContenants,
};
