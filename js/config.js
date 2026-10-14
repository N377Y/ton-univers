/*
 * ============================================================
 *  PERSONNALISATION — « Aux origines de ton univers »
 * ============================================================
 *  Tout ce qui est propre à son histoire se règle ICI.
 *  Les textes entre [crochets] sont des emplacements à compléter
 *  (voir la section 9 de la bible : « Personnalisation à recueillir »).
 *
 *  ⚠ Vie privée : ce fichier est lisible par toute personne qui
 *  ouvre le code du site. N'y mettez rien de sensible ou d'intime
 *  que vous ne voudriez pas voir public.
 * ============================================================
 */
window.AU = window.AU || {};
window.AU.config = {

  /* --- Le sas ------------------------------------------------ */
  // Empreinte du code final (le code lui-même n'apparaît jamais ici).
  // Pour la générer : ouvrir outils/code.html, taper le code, copier le résultat.
  // Valeur actuelle = code provisoire « UNIVERS ».
  codeHash: 'bf0f6943ac44e072520b6defa250d554ba84ae422bc401ccd28e248f03be3a49',

  // true : à chaque retour sur le site, le code est redemandé.
  askCodeOnReturn: false,

  /* --- Acte I : l'Héritage ----------------------------------- */
  origins: {
    // Point lumineux sur la carte stylisée de l'Afrique (0–100 en x et y,
    // 0,0 = coin nord-ouest). null = aucun point mis en évidence.
    mapPoint: null,

    // 2 ou 3 tableaux liés à ses origines réelles.
    // motif : 'collines' | 'fleuve' | 'plateau' | 'savane' | 'cote'
    tableaux: [
      { title: '[Terre d’origine — à préciser]', motif: 'collines',
        palette: ['#f2b25c', '#c9743a', '#7a3b22', '#3b1d17'] },
      { title: '[Région / paysage — à préciser]', motif: 'fleuve',
        palette: ['#f7cf7a', '#b4823e', '#5e4a2b', '#2a2219'] },
      { title: '[Lieu de mémoire — à préciser]', motif: 'plateau',
        palette: ['#ffd99a', '#d08b4a', '#8c4a2f', '#40211a'] },
    ],

    // Symboles ou objets transmis (formes abstraites tant que rien n'est choisi).
    // forme : 'cercle' | 'triangle' | 'losange' | 'vague' | 'spirale'
    symbols: [
      { forme: 'cercle',   label: '[Symbole 1]', legend: '[Légende courte — fait vérifié ou métaphore ?]' },
      { forme: 'triangle', label: '[Symbole 2]', legend: '[Légende courte]' },
      { forme: 'vague',    label: '[Symbole 3]', legend: '[Légende courte]' },
      { forme: 'losange',  label: '[Symbole 4]', legend: '[Légende courte]' },
    ],

    // Sources affichées dans la carte finale (facultatif).
    sources: [],
  },

  /* --- Acte II : l'Équilibre --------------------------------- */
  // Pensées retrouvées dans la carte (« Chemin des choix »).
  thoughts: [
    'On ne choisit pas toujours ce qui arrive. On peut apprendre à choisir comment avancer.',
    'Avancer n’a jamais voulu dire ne jamais tomber.',
    'Réfléchir. Choisir. Apprendre. Recommencer.',
  ],

  /* --- Silhouettes ------------------------------------------- */
  // coiffure : 'court' | 'afro' | 'locks' | 'ras' | 'long' | 'tresses' | 'chignon' | 'queue'
  hero: { accent: '#ffd27a', hair: 'court' },
  companion: {
    accent: '#ff9fc4',
    hair: 'chignon',
    star: '[Un souvenir que vous seuls comprenez]',
  },

  /* --- Acte III : les compagnons (2 à 4) --------------------- */
  // accessoire : 'casquette' | 'echarpe' | 'sac' | 'casque' | 'aucun'
  friends: [
    { name: '[Ami·e 1]', accent: '#7fd8ff', accessoire: 'casquette', hair: 'court', memory: '[Une anecdote, un mot, un souvenir]' },
    { name: '[Ami·e 2]', accent: '#b6f28c', accessoire: 'echarpe',   hair: 'afro',  memory: '[Une anecdote, un mot, un souvenir]' },
    { name: '[Ami·e 3]', accent: '#c7a6ff', accessoire: 'sac',       hair: 'queue', memory: '[Une anecdote, un mot, un souvenir]' },
  ],

  /* --- Acte IV : l'Architecte -------------------------------- */
  tech: {
    // Les trois nœuds de la cité (n'importe quel ordre).
    nodes: ['Relier', 'Construire', 'Allumer'],
    // Titres des fenêtres de savoir (IV.3).
    learning: ['[Ce qu’il apprend en ce moment]', '[Un sujet qui l’intrigue]', '[Un horizon à venir]'],
    // Centres d'intérêt techniques confirmés (carte « Cité de demain »).
    interests: ['[Domaine professionnel]', '[Compétence]', '[Sujet en cours d’apprentissage]'],
  },

  /* --- Acte V : la convergence ------------------------------- */
  // Fragments révélés par les étoiles des chapitres (V.2).
  fragments: {
    origines: 'Des origines.',
    choix: 'Des choix.',
    passions: 'Des passions.',
    horizons: 'Des horizons.',
  },

  // Message personnel discret, affiché seulement dans la carte (« Horizon ouvert »).
  // Laisser vide pour une fin totalement neutre.
  finalMessage: '',
};
