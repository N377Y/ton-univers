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
  codeHash: 'e4d2fb51f79969cd4ccb2bfff42f46a5a7091fd3f62a63f923b48196c7982192',

  // true : à chaque retour sur le site, le code est redemandé.
  askCodeOnReturn: false,

  /* --- Acte I : l'Héritage ----------------------------------- */
  origins: {
    // Point lumineux sur la carte stylisée de l'Afrique (0–100 en x et y,
    // 0,0 = coin nord-ouest). null = aucun point mis en évidence.
    mapPoint: { x: 43, y: 44, label: 'Cameroun' },

    // Tableaux (jusqu'à 5), du plus ancien au plus intime.
    // motif : 'pyramides' | 'chefferie' | 'volcan' | 'foret' | 'ville' | 'collines' | 'fleuve' | 'plateau' | 'savane' | 'cote'
    // photo (facultatif) : chemin d'une image, par ex. 'img/chefferie.jpg' ; elle remplace le dessin.
    tableaux: [
      { title: 'Les pyramides de Kemet', sub: 'Égypte ancienne · la mémoire la plus lointaine', motif: 'pyramides',
        palette: ['#f6c46a', '#e09a45', '#b8722f', '#6e3f1c'] },
      { title: 'La chefferie de Batié', sub: 'Ouest-Cameroun · pays bamiléké', motif: 'chefferie',
        palette: ['#f2a65a', '#6b7a3a', '#3e4a24', '#2a1a10'] },
      { title: 'Le mont Cameroun', sub: 'Le « Char des dieux »', motif: 'volcan',
        palette: ['#f7d08a', '#8a6a7a', '#3e5a3a', '#1e2c1a'] },
      { title: 'Mbalmayo et le Nyong', sub: 'La forêt au bord de l’eau', motif: 'foret',
        palette: ['#e8c27a', '#3e6a3a', '#24452a', '#122a1a'] },
      { title: 'Mobil Omnisport, Yaoundé', sub: 'Le quartier où il a grandi', motif: 'ville',
        palette: ['#f0a060', '#a8561c', '#5a2e18', '#2a160c'] },
    ],

    // Symboles transmis. forme : 'ankh' | 'sept' | 'lion' | 'crane' | 'cercle' | 'triangle' | 'losange' | 'vague' | 'spirale'
    symbols: [
      { forme: 'ankh',  label: 'L’Ânkh', legend: 'La clé de la vie, héritée de l’Égypte ancienne.' },
      { forme: 'sept',  label: 'Le 7', legend: 'Son chiffre. Pour lui, il porte chance.' },
      { forme: 'lion',  label: 'La tête de lion', legend: 'La force tranquille, celle qui veille.' },
      { forme: 'crane', label: 'Les crânes des ancêtres', legend: 'Chez les Bamiléké, on les garde et on les honore : ceux qui nous précèdent restent avec nous.' },
    ],

    // Sources affichées dans la carte finale (facultatif).
    sources: [],
  },

  /* --- Acte II : l'Équilibre --------------------------------- */
  // Pensées citées pendant l'acte II et retrouvées dans la carte (« Chemin des choix »).
  quotes: {
    connais: { text: 'Connais-toi toi-même, et tu connaîtras l’univers et les dieux.', by: 'Inscription de Delphes, chère à Socrate' },
    controle: { text: 'Concentre-toi sur ce qui dépend de toi. Le reste ne t’appartient pas.', by: 'D’après Épictète et Marc Aurèle' },
    itachi: { text: 'Jusqu’au bout, chacun de nous reste capable du meilleur comme du pire.', by: 'D’après Itachi Uchiwa, Naruto' },
    fanon: { text: 'Chaque génération doit, dans une relative opacité, découvrir sa mission, la remplir ou la trahir.', by: 'Frantz Fanon, Les Damnés de la terre' },
  },

  /* --- Silhouettes ------------------------------------------- */
  // coiffure : 'fade' | 'boucles' | 'court' | 'afro' | 'locks' | 'ras' | 'long' | 'tresses' | 'chignon' | 'queue'
  hero: { accent: '#c98a4b', hair: 'fade' },
  companion: {
    accent: '#e48ad0',
    hair: 'boucles',
    hairColor: '#8e3f8c',
    star: 'Je ne suis peut-être pas Hinata… mais cette lune-là, c’est la nôtre.',
  },

  /* --- Acte III : les compagnons (2 à 4) --------------------- */
  // accessoire : 'casquette' | 'echarpe' | 'sac' | 'casque' | 'aucun'
  friends: [
    { name: 'Mydrane', accent: '#7fb8ff', accessoire: 'casquette', hair: 'court', memory: '« Rien cassé aujourd’hui, Junior ? »' },
  ],

  // Mangas qui l'ont accompagné : des clins d'œil dessinés dans l'acte III (aucun personnage recopié).
  mangas: ['Naruto', 'One Piece', 'Les Chevaliers du Zodiaque', 'Fullmetal Alchemist', 'Avatar'],

  /* --- Acte IV : l'Architecte -------------------------------- */
  tech: {
    // Les trois nœuds de la cité (n'importe quel ordre) : le chemin de la donnée.
    nodes: ['Collecter', 'Transformer', 'Révéler'],
    // Titres des fenêtres de savoir (IV.3).
    learning: ['Formation Data Engineer', 'Relire Les Damnés de la terre', 'La géopolitique'],
    // Ce qui l'attend derrière la porte (IV.4).
    horizon: ['Un CDI', 'Sa startup'],
    // Ce qu'on retrouve dans la carte (« Cité de demain »).
    interests: ['Data analyst et data engineer', 'En formation Data Engineer', 'Passionné de géopolitique', 'À l’horizon : un CDI, puis lancer sa startup'],
  },

  /* --- Acte V : la convergence ------------------------------- */
  // Fragments révélés par les étoiles des chapitres (V.2).
  fragments: {
    origines: 'De Batié à Yaoundé.',
    choix: 'Connais-toi toi-même.',
    passions: 'Des pages, des amis, une lune.',
    horizons: 'Des données, et demain.',
  },

  // Message personnel discret, affiché seulement dans la carte (« Horizon ouvert »).
  finalMessage: 'Merci de m’avoir laissé une place dans ton univers. La suite, on l’écrit ensemble.',

  // Vœu affiché en grand à la toute fin, sous la dernière phrase. Laisser vide pour l'enlever.
  birthday: 'Joyeux anniversaire',
};
