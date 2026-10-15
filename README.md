# Aux origines de ton univers

Le site qui sert d'épilogue à l'escape game physique. Le joueur scanne un QR code, saisit le code
de l'énigme finale, puis regarde une histoire animée de 6 à 8 minutes en cinq actes. Une carte
de son univers reste ensuite accessible.

Le site suit le storyboard *« Bible narrative et storyboard du site interactif » v1.0*.

- **Statique** : HTML, CSS et JavaScript, sans dépendance ni étape de compilation.
- **Mobile d'abord** : écran vertical ; le mode paysage recadre la scène.
- **Impossible de se bloquer** : « Continuer » est toujours là, chaque interaction est facultative
  ou se déclenche toute seule, et il n'y a aucun compte à rebours.
- **Son coupé par défaut** : il est proposé juste après le déverrouillage. Musique et effets sont
  synthétisés en direct, donc aucune musique sous licence. Une piste par acte : aventure africaine
  (djembé, kalimba, cuivres), réflexion (piano, cordes), opening de manga (batterie, guitare
  saturée), science-fiction (arpèges synthétiques) et un final qui reprend les thèmes.
- **Mise en scène** : caméra qui suit et zoome, cartons d'acte façon générique de film, grain et
  vignettage, texte qui apparaît mot à mot, séquence « opening » en plans rapides dans l'acte III.
- **Accessibilité** : option « Réduire les animations » (activée d'office si le système la
  demande), navigation au clavier (Tab, Entrée, flèches ← →), boutons explicites.
- **Progression enregistrée** sur l'appareil, avec les choix « Reprendre » et « Recommencer ».

## Structure

```
index.html          page unique
css/style.css       mise en page, thèmes par acte, animations des silhouettes
js/config.js        ★ TOUTE LA PERSONNALISATION (textes, amis, origines, code…)
js/scenes.js        les 22 scènes du storyboard (S0.2 → V.3)
js/app.js           moteur : enchaînement, sas, carte finale, sauvegarde, réglages
js/gfx.js           silhouettes sans visage, étoiles, ciels, collines (SVG)
js/particles.js     la poussière dorée (canvas)
js/audio.js         ambiance sonore générée (Web Audio)
js/sha256.js        vérification du code
outils/code.html    génère l'empreinte du code final
```

## Personnaliser (section 9 de la bible)

Tout se règle dans **`js/config.js`**. Les textes entre `[crochets]` sont des emplacements à remplir :

| Élément | Champ de `config.js` |
|---|---|
| Code final | `codeHash` (voir ci-dessous) |
| Origines : tableaux, paysages, couleurs | `origins.tableaux` (2 ou 3) |
| Point sur la carte d'Afrique | `origins.mapPoint` |
| Symboles transmis et leurs légendes | `origins.symbols` |
| Citations de l'acte II (Socrate, Épictète, Itachi, Fanon) | `quotes` |
| Mangas évoqués dans l'acte III | `mangas` |
| Amis : nom, couleur, accessoire, souvenir | `friends` (2 à 4) |
| Silhouettes : couleur et coiffure | `hero`, `companion`, `friends[].hair` |
| Votre rencontre : couleur, souvenir de l'étoile | `companion` |
| Informatique : nœuds, apprentissages, intérêts | `tech` |
| Fragments de la constellation | `fragments` |
| Message personnel (carte uniquement) | `finalMessage` |

Les textes à l'écran (une ou deux phrases par scène) sont écrits dans `js/scenes.js`
(appels à `c.say('…')`).

### Changer le code final

1. Ouvrir `outils/code.html` dans un navigateur.
2. Taper le code. Majuscules, accents, espaces et ponctuation ne comptent pas.
3. Copier l'empreinte affichée dans `codeHash`.

Le code actuel est celui du jeu physique (4 chiffres). Seule son empreinte figure dans le code source, si bien
qu'on ne peut pas le lire en ouvrant les fichiers. Attention toutefois : comme le prévoit la bible,
c'est une **barrière narrative et non une vraie protection**.

## Tester en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Pour relire une scène précise une fois le sas franchi : `http://localhost:8000/?scene=III.4`.
Pour revenir au tout début, il faut effacer les données du site dans le navigateur.

## Mise en ligne (GitHub Pages, gratuit)

1. Dans *Settings → Pages* du dépôt, choisir *Deploy from a branch*, puis la branche et le dossier `/ (root)`.
2. L'adresse publique a la forme `https://<compte>.github.io/ton-univers/`.
3. Générer un QR code de cette adresse et l'essayer sur plusieurs téléphones avant d'imprimer
   (Android et iPhone, Safari et Chrome).

La page contient `noindex` : les moteurs de recherche ne devraient pas la référencer.

## Vie privée

Tout ce qui se trouve dans `js/config.js` est **public** pour quiconque connaît l'adresse.
N'y mettez ni données sensibles ni souvenirs intimes. Pour un accès vraiment privé, il faut une
authentification côté serveur ou un hébergement adapté (section 7 de la bible).

## Liste de tests (section 7)

- [ ] Android et iPhone, Safari et Chrome
- [ ] Débit mobile
- [ ] Code erroné, puis code correct
- [ ] Bouton retour et actualisation en cours d'histoire (la reprise doit être proposée)
- [ ] Son coupé ou activé, option « Réduire les animations »
- [ ] Orientation horizontale
