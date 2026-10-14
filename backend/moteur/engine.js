// ============================================================
// MOTEUR DE CALCUL (reprise de l'onglet MOTEUR du fichier
// OLIVED_Simulateur_Couts.xlsx)
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


module.exports = {
  calculerMoteur,
  calculerProduits,
  calculerContenants,
};
