# Mission 11 — Le monde prend vie

## Résumé et arrêt au Jalon A

Le Jalon A apporte un ciel atmosphérique Three.js, des nuages à deux altitudes, une véritable nuit, les cinq moments demandés et les six météos simulées. Le soleil, la lumière, la brume, la pluie, le vent et l’état temporel transmis à la faune et au moteur sonore partagent la même situation effective. Les commandes restent mémorisées.

**Jalon A uniquement. Validation artistique du propriétaire attendue. Le Jalon B n’a pas commencé.** Les captations, niveaux, perchoirs, matériaux de pas et budgets audio de la Mission 10.1 sont conservés. Aucune nouvelle ressource audio, voiture ou événement humain n’est ajouté. Les extraits audio comparatifs, la courbe acoustique de rivière et les pistes isolées appartiennent au Jalon B et ne sont pas présentés comme livrés.

La différence est observable dans les captures du moteur et la vidéo. Les nuages restent une interprétation légère, avec des contours parfois encore doux ; leur qualité et la lisibilité de la nuit demandent votre jugement. Aucun succès de compilation n’est assimilé à une validation artistique.

## Isolation et provenance Git

Le checkout fourni était à la Mission 08.6 (`f11f165`). Avant toute modification de l’application, interrogation de GitHub, récupération du dernier `main`, inspection de son historique et création de `mission/11-monde-vivant-immersif` sur **`0f699fa50cb9d9b8158fc88776d27ec75594f575`**. Ce main fusionne la PR #18 / Mission 10.1, après les Missions 09 et 10. Aucun travail local préexistant n’était modifié.

Une worktree détachée de ce même commit sert exclusivement à la comparaison avant, sur le port 5176. La branche de mission utilise 5173. Living Paintings / LP-01, ses branches et ses fichiers n’ont pas été modifiés. Aucune modification de `.github/workflows/`, des données `public/data/` ou `public/tiles/`, des distances, du relief, des bâtiments, de la navigation ou des collisions. Aucun merge ou déploiement de production. Le workflow Pages existant ne se déclenche que sur main ; il n’a pas été modifié.

## Audit du code effectivement exécuté

| Système inspecté | Cause confirmée sur main | Intervention du Jalon A |
| --- | --- | --- |
| `src/nature/sky.ts` | Sphère avec simple mélange zénith/horizon ; horloge réelle ou démo ×72 ; quatre météos | Nouveau ciel, interface et état effectif partagés |
| `src/nature/climate.mjs` | Lissage unique de 45 s ; aucune notion de matin/soir solaire | Six régimes ; choix solaire selon lieu/date ; transition manuelle séparée |
| `src/earthlife/cloud-layer.ts` | Plan horizontal à 230 m, champ sinusoïdal interpolé par sommets, fondu radial | Deux couches projetées sur une enveloppe courbe, détail fragment et relief d’éclairage approximatif |
| `state.mjs`, `wind.mjs` | Vent partagé continu déjà présent ; dérive nuageuse à vitesse constante indépendante de la météo | Dérive intégrée selon le même vent moyen, sans téléportation lors des changements |
| `fauna-render.ts`, préférences et budgets | Faune déjà conditionnée par jour/pluie/vent/saison ; profils bornés et spécialisation des shaders | Conservation ; nouvelles conditions effectives transmises au point existant |
| `src/living/sound.ts` | Audio déjà alimenté par `acousticClimate`, proximité à une ligne centrale OSM, pas à une berge mesurée | Conservation ; même date, soleil et météo que le rendu |
| `src/audio/profiles.mjs` | Eau : gain `.22 × (1 − smooth(4,55,distance))` ; feuillage : végétation × `.16 × smooth(.30,.72,vent)` | Diagnostic confirmé, recalibrage différé au Jalon B |
| `director.mjs`, `renderer.ts` | Oiseaux : faible probabilité, cooldowns 55–70 s, horaires/saison/pluie ; 8 s d’installation ; absence d’air permanent et d’événements routiers | Aucun changement de gains, de probabilités ou de bibliothèque |
| Ressources et licences | 82 extraits issus de 33 captations, CC0 et CC BY 4.0, manifeste avec empreintes/transformations | Fichiers et crédits inchangés |
| Boucle et profils graphiques | `dt` de mouvement plafonné à .25 s ; ombres portées désactivées en mode tuiles ; ombres de nuages légères selon profil | Temps réel séparé pour les commandes ; conservation des décisions d’ombres et des budgets existants |

Le silence du vent est donc aussi un choix explicite de la bibliothèque 10.1, pas un simple problème de volume général. L’Anglin n’est pas arbitrairement amplifié dans cette étape.

## Ciel et éclairage

Réutilisation du **Sky / modèle analytique de Preetham livré dans Three.js 0.180.0**, sous MIT. Cette solution existante évite une nouvelle dépendance, des textures téléchargées, une API ou un ray marching volumétrique. Les alternatives considérées étaient le dégradé existant, la couche plane actuelle, une projection à plusieurs altitudes et le volumétrique. La projection à deux altitudes offre ici le compromis le plus léger ; aucun comparatif universel de bibliothèques n’est revendiqué.

Le modèle est adapté avec compression de la plage lumineuse, raccord de l’horizon au brouillard, mélange diffus sous couverture épaisse et traitement nocturne explicite. La direction solaire provient du calcul géographique existant, utilisé aussi pour la lumière directionnelle. L’ambiance hémisphérique, sa teinte au sol et le contraste baissent avec les nuages et la pluie. Les façades, la végétation et l’eau reçoivent ainsi la même transformation lumineuse sans changer leurs géométries ou couleurs de données.

La nuit utilise un ciel sombre, une ambiance réduite et de petites étoiles procédurales artistiques, non une carte astronomique. Elles disparaissent avec une couverture épaisse. Aucun éclairage public ou fenêtre lumineuse n’est inventé. Pas de lune : position et phase crédibles nécessiteraient une éphéméride supplémentaire. L’absence de lune est explicite, pas présentée comme une observation du lieu.

Les ombres portées restent désactivées dans le mode tuiles existant ; activer des shadow maps sur tout le village aurait changé brutalement le coût. Les profils Équilibré et Qualité conservent les ombres de nuages projetées aux sommets. Leur macro-couverture et leur dérive sont communes au ciel ; les petits détails des nouveaux nuages et leur altitude ne donnent pas des ombres exactes. C’est une approximation documentée.

## Nuages et vent

Une enveloppe courbe couvre toutes les directions sans bord de plan autour du joueur. Deux altitudes apparentes (environ 280 et 540 m dans le repère local), du bruit à plusieurs échelles, une déformation de domaine et des variations de densité donnent de la profondeur apparente, des bords éclairés et des bases plus sombres. La densité augmente avec la couverture et l’orage assombrit aussi les nuages.

La projection utilise des coordonnées du monde. La dérive est intégrée, dans la direction commune du vent, avec une vitesse dépendant de son intensité ; changer le vent ne repositionne pas instantanément les motifs. La couche haute dérive plus lentement. Ces vitesses et hauteurs sont artistiques, pas des mesures météo. Les ombres suivent le même déplacement intégré. Les feuilles et les surfaces d’eau reçoivent le vent existant, sans augmentation générale des amplitudes ni déformation ajoutée aux troncs.

Éco conserve le ciel et la couche basse, avec la couche haute omise explicitement pour réduire le calcul. Équilibré et Qualité affichent les deux couches. Une personnalisation qui désactive les nuages reste respectée.

## Heure et météo : commandes et contrat partagé

Le panneau **« Heure et météo »** propose exactement **Matin, Après-midi, Soir, Nuit, Temps réel**. La démo ×72 reste secondaire, sous `?perf=1` ou `?time=demo`.

Les instants sont calculés à la sélection, sur la date civile **du lieu** (`Europe/Paris` pour Angles), à partir de la latitude, longitude, position solaire, lever et coucher. Matin suit le lever, après-midi suit le midi solaire, soir précède le coucher et nuit se place dans l’intervalle nocturne. Les heures ne sont pas copiées d’Angles vers Venise ou l’équateur. Tests à Angles, Venise, Quito, Sydney et Longyearbyen, en été/hiver et de part et d’autre de la ligne de date.

Aux latitudes polaires sans lever/coucher, les noms désignent des phases de la trajectoire solaire : matin à midi solaire −6 h, après-midi au midi solaire, soir à +6 h, nuit à minuit solaire. L’interface signale « soleil de minuit » ou « nuit polaire ». Choisir Nuit sous le soleil de minuit ne crée pas artificiellement une nuit.

Les instants manuels sont fixes et sauvegardés par lieu, y compris à travers une recharge. Temps réel relit l’instant courant ; seule sa présentation civile utilise le fuseau du lieu. `?date=` est une référence fixe de diagnostic/capture et ne remplace pas le fonctionnement normal. Le mélange temporel dure 2.4 s, de manière progressive ; toute la simulation consomme l’instant effectif pendant ce mélange.

| Régime simulé | Couverture | Vent moyen normalisé | Pluie | Brume |
| --- | ---: | ---: | ---: | ---: |
| Ensoleillé | .16 | .24 | 0 | 0 |
| Nuageux | .49 | .43 | 0 | .06 |
| Couvert | .90 | .52 | 0 | .22 |
| Brumeux | .65 | .12 | 0 | 1 |
| Pluvieux | .96 | .64 | .60 | .44 |
| Orageux | 1 | .95 | 1 | .56 |

Ces nombres sont des paramètres artistiques normalisés, **pas des prévisions, mètres/seconde ou quantités d’eau mesurées**. Le brouillard s’étend progressivement d’environ 320–1450 m par temps clair à 30–330 m en brume, dans le repère métrique existant.

Une commande météo utilise une constante de temps de .65 s, soit 98 % de la transition à 2.55 s. L’évolution naturelle conserve sa constante historique de 45 s. Le temps des commandes utilise le temps réel entre images, séparé du `dt` plafonné destiné aux collisions ; une machine lente n’allonge donc pas systématiquement la transition à cause du déplacement.

La pluie est rendue par un seul appel de lignes, autour de la caméra et incliné selon le vent : **260 gouttes Éco, 520 Équilibré, 900 Qualité**, sans allocation par image. Le budget des particules naturelles existant est conservé séparément. Une borne au niveau du sol réduit les traits sous le terrain local. Pas de collisions de pluie avec chaque toit, pas de flaques ou de surfaces mouillées nouvelles. L’eau ne change pas de débit quand la pluie est sélectionnée.

`scene.userData.acousticClimate` reçoit la date effective, le soleil et la même météo mutable à chaque image. La faune, les animations, la brume, la pluie et les sons existants utilisent donc ces conditions. La pluie sonore de la bibliothèque 10.1 est sollicitée par cette valeur ; son niveau et sa qualité n’ont pas été recalibrés. Pas d’horloge parallèle ajoutée au son.

Sous `?perf=1`, `window.endlessDiagnostics.climate` expose le moment, la date effective, heure/fuseau, régime cible, météo effective, constante de transition, soleil, vent/rafale et nombre de gouttes. `earthLife` conserve les coûts CPU, budgets et ressources. `audio` conserve les couches, gains réels/cibles, distances à la ligne d’eau, voix et ressources décodées. Cette complexité reste hors du panneau du joueur ordinaire.

Les sélecteurs natifs restent utilisables au clavier. Les flèches dans un champ de réglage ne font plus marcher le personnage. Les choix restent stables lors des changements de vue, d’onglet, d’arrêt/reprise du son et de la recharge. Les nouveaux objets graphiques et écouteurs du ciel sont libérés lors du remplacement HMR ou de la fermeture définitive de page ; le retour du cache de navigation conserve sa scène.

## Preuves à regarder

Ouvrir la [galerie comparative](mission-11-evidence/index.html) avec le serveur de développement. Elle propose les cinq moments, toutes les conditions météo, la vue aérienne, une vue du ciel et le soir vers l’ouest. Les images s’ouvrent aussi individuellement dans ce dossier GitHub.

- [Matin avant](mission-11-evidence/before-morning.jpg) / [après](mission-11-evidence/after-morning.jpg).
- [Après-midi avant](mission-11-evidence/before-afternoon.jpg) / [après](mission-11-evidence/after-afternoon.jpg).
- [Soir avant](mission-11-evidence/before-evening.jpg) / [après](mission-11-evidence/after-evening.jpg).
- [Nuit avant](mission-11-evidence/before-night.jpg) / [après](mission-11-evidence/after-night.jpg).
- [Pluie avant](mission-11-evidence/before-rain.jpg) / [après](mission-11-evidence/after-rain.jpg).
- [Nuages en hauteur](mission-11-evidence/after-sky-cloudy.jpg), [vue aérienne](mission-11-evidence/after-aerial-cloudy.jpg), [orage](mission-11-evidence/after-storm.jpg), [brume](mission-11-evidence/after-mist.jpg).
- [Vidéo de transition réelle](mission-11-evidence/atmosphere-transition.mp4) et [chronologie des images/commandes](mission-11-evidence/motion.json).
- [Panneau mobile portrait](mission-11-evidence/mobile-controls.jpg) / [paysage](mission-11-evidence/mobile-landscape.jpg).

Protocole : Chromium, 960 × 640, même caméra sur la berge (`x=-150, z=245`, lacet −1.1, tangage −.15), même profil Équilibré, référence du 21 juin 2026. Les instants UTC des préréglages sont identiques avant/après. La simulation est tenue pour les captures fixes ; les deux versions attendent 240 s simulées par cas pour une météo stabilisée. Le main ne possédait pas Nuageux ou Orageux : comparaisons explicitement avec Couvert ou Pluie, sans prétendre à une équivalence de ces modes.

La vidéo utilise la boucle de rendu réelle avec sélection des commandes dans l’interface. Les images sont horodatées, encodées avec leurs durées réelles, sans accélération. Faible fréquence de capture sous SwiftShader ; elle ne prouve pas la fluidité d’un GPU physique. Aucune illustration générée par IA, piste sonore ou écoute humaine n’est utilisée comme preuve.

Les badges des captures indiquent honnêtement le commit de base et les modifications locales : les captures précèdent le commit de livraison. Le titre de mission est passé à 11 avec le rapport déclaré dans `package.json`.

## Ressources, droits et coût

Budget de nouvelles ressources : **0 €**. Aucune API payante, dépendance nouvelle, texture externe ou fichier sonore nouveau.

- Three.js / Sky : [code officiel r180](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/objects/Sky.js), auteurs/contributeurs Three.js ; MIT. [Licence conservée](mission-11-evidence/THREE-LICENSE.txt). Adaptations applicatives dans `src/nature/atmosphere.ts` : composition nocturne et météo ; l’original dans la dépendance reste intact.
- Empreinte SHA-256 du Sky installé : `a19982b69e496e52d4cd7072029f0a8e5277203cbebf2277a23267e90b705640`.
- Nuages, pluie et étoiles : code procédural du projet, sans image tiers.
- Audio : `public/audio/sources.json`, `manifest.json` et `credits.html` conservés intégralement, avec auteurs, URLs, licences, transformations et empreintes existantes. SHA-256 manifeste : `59e9e25fe398ae0dc391364e39bc45693bd841d0bcefbaddc233a444ca8cbc00` ; sources : `51c5b976a9066a3ecaa23f14a5b5c8ab8506aef61503e26ca2a50785822d1696`.
- Données IGN/ASP sous Licence Ouverte 2.0 et OSM sous ODbL : crédits visibles et données inchangés.

## Tests et limites de validation

`npm run build` et **151 tests Node réussis**, dont cinq nouveaux tests sur les moments géographiques/saisonniers, le fuseau à travers la ligne de date, les cas polaires, la transition rapide/inversée et la dérive continue selon le vent. Les tests existants de navigation, collisions, relief inconnu, audio, budgets et spécialisations restent actifs.

Le [test des commandes](mission-11-evidence/controls.json) exécute le véritable `main.ts`, sans interception de sa boucle : cinq choix exacts, six météos, transitions dans les deux sens, nuit effective, stabilité temporelle, flèches dans les sélecteurs, trois vues, onglet aller/retour, activation/désactivation du son, recharge, promenade automatique, trois profils, panneaux 390 × 844 et 844 × 390. Ce test n’est pas un essai sur Android physique ou une preuve d’inactivité système prolongée.

Les mesures de rendu et cycles de ressources sont ci-dessous. Les longs parcours de 450 m, les écoutes de plusieurs minutes et l’optimisation complète du Jalon D ne sont pas revendiqués à cette étape.

Le Chrome du bureau partagé a été effectivement essayé : `chrome://gpu` y indique **WebGL désactivé**, et le moteur ne s’y initialise pas. Sa galerie HTML et la vidéo s’affichent ; elles sont ouvertes dans Desktop. Le moteur a bien été exécuté et testé dans un Chromium distinct avec les options SwiftShader explicites des scripts. Ce blocage du Chrome partagé n’est pas masqué par une fausse démonstration navigable.

## Premières mesures de performance

[Mesures brutes avant](mission-11-evidence/before.json), [après](mission-11-evidence/after.json), [synthèse](mission-11-evidence/metrics-summary.json). Huit échantillons après chauffe par profil et météo, son coupé, même caméra et viewport. Chaque durée inclut soumission, gl.finish et lecture RGBA ; c’est une mesure intrusive sur **SwiftShader logiciel**, pas un temps GPU physique ou une promesse de FPS. Les captures principales couvrent aussi le jour, la nuit et le vent renforcé de l’orage.

| Profil | Météo | Rendu + lecture avant / après (ms, médiane) | Écart logiciel | CPU atmosphère avant / après (ms) | Appels avant / après |
| --- | --- | ---: | ---: | ---: | ---: |
| eco | clear | 129.5 / 173.8 | +34.2 % | 0.10 / 0.20 | 170 / 170 |
| eco | overcast | 130.9 / 167.5 | +27.9 % | 0.10 / 0.20 | 170 / 170 |
| eco | rain | 133.2 / 173.0 | +29.9 % | 0.05 / 0.15 | 170 / 171 |
| balanced | clear | 142.7 / 181.1 | +26.9 % | 0.10 / 0.20 | 170 / 170 |
| balanced | overcast | 132.3 / 178.0 | +34.5 % | 0.10 / 0.15 | 170 / 170 |
| balanced | rain | 135.6 / 169.1 | +24.7 % | 0.10 / 0.15 | 170 / 171 |
| quality | clear | 153.1 / 183.0 | +19.5 % | 0.10 / 0.20 | 170 / 170 |
| quality | overcast | 134.9 / 173.0 | +28.3 % | 0.10 / 0.20 | 170 / 170 |
| quality | rain | 144.4 / 187.2 | +29.6 % | 0.05 / 0.15 | 170 / 171 |

Le surcoût logiciel observé reste matériel : **19.5 à 34.5 %** dans cette série. Il est signalé comme limite du Jalon A, sans déclarer la fluidité matérielle validée. Le ciel est rendu après la profondeur opaque pour éviter de calculer la diffusion derrière le terrain ; le bruit nuageux utilise un hash arithmétique, et Éco réduit aussi les octaves et l’éclairage de détail. Aucun effet météo demandé n’est silencieusement retiré. Une mesure GPU physique reste nécessaire, ainsi que le travail d’optimisation du Jalon D après approbations.

Le test de 36 cycles garde **307 géométries, 19 programmes et 7 textures**. Après destruction du ciel, nuages, pluie, faune et événements : 304 géométries et aucun panneau météo. Aucun ajout de texture pour cette mission ; la pluie ajoute un appel de rendu seulement lorsqu’elle est active. Cette stabilité des ressources renderer n’est pas une preuve exhaustive d’absence de fuite du tas JavaScript.

Le smoke test navigateur existant passe : chargement IGN/OSM, cycle des vues, marche réelle, hauteur des yeux, caméra stable après relâchement, activation sonore et viewport mobile, sans erreur JavaScript. L’activation et l’arrêt du son sont vérifiés ; **le benchmark complet son coupé/activé et les mesures de voix/décodages comparatifs n’ont pas été refaits au Jalon A**, l’audio étant conservé.

## Prévisualisation indépendante

Depuis le dépôt, sans toucher à main ni à Pages :

```sh
git fetch origin mission/11-monde-vivant-immersif
git switch mission/11-monde-vivant-immersif
npm ci
npm run dev -- --port 5173
```

Ouvrir `http://localhost:5173/endless-earth/?moment=morning&weather=clear` dans un navigateur avec WebGL. Ouvrir « Heure et météo » et essayer les cinq moments et six régimes ; le son reste activable séparément. La référence `?date=` des captures n’est pas nécessaire à cette promenade.

Galerie : `http://localhost:5173/endless-earth/docs/mission-11-evidence/index.html`.

Reproduction des preuves : lancer une worktree du commit main de référence sur le port 5176, puis `node scripts/browser-atmosphere.mjs before`, `node scripts/browser-atmosphere.mjs after`, `npm run test:atmosphere:browser` et `node scripts/browser-atmosphere-motion.mjs`. Les scripts utilisent `/usr/bin/chromium` ; la vidéo utilise `ffmpeg`.

## Points à valider par le propriétaire

Juger la douceur du matin, l’après-midi ordinaire, le soir et la lisibilité de la nuit ; observer les nouveaux nuages dans les deux vues ; essayer soleil → couvert → pluie → soleil et jour → nuit → jour ; vérifier la présence perceptible de pluie et la brume. Les volumes de rivière, vent, feuillage et oiseaux restent ceux de 10.1 et ne constituent pas une amélioration audio livrée ici.

Limitations artistiques et techniques restantes : nuages 2.5D parfois doux, ombres de leur détail approximatives, nuit sans lune ni lumières architecturales, pluie sans occlusion fine des toits/impacts/flaques, surfaces mouillées non ajoutées, orage sans éclairs ou tonnerre nouveaux, benchmarks logiciels seulement. Les données inconnues de débit, largeur mesurée, trafic et espèces locales restent inconnues.

**La poursuite au Jalon B attend votre approbation explicite du Jalon A.**
