# Mission 03 — Le monde respire

## Résultat

Branche `mission/03-le-monde-respire`, basée sur `main` 5f5c0ca (Mission 02 fusionnée). Le checkout initial était en retard ; récupération de main et conservation de sa navigation, de l'avatar articulé et des caméras protégées.

Le mode géographique réel avec relief IGN est maintenant le mode par défaut (`?tiles=0` conserve l'ancien aperçu plat). Le point de départ est choisi sur une voie OSM praticable avant l'activation des commandes automatiques. À Angles, le test Chromium trouve la Ruelle de la Forge : environ 50 m validés, pas une promenade de cinq minutes.

## Promenade

Bouton marche/arrêt, accélération jusqu'à 1,35 m/s, ralentissement à l'arrivée, suivi caméra et animation des membres existante. Toute entrée clavier/joystick reprend le contrôle. Perte de focus ou onglet masqué : pause. Le repère forteresse reste un outil de localisation aérien existant et interrompt explicitement la marche ; le contrôleur automatique ne téléporte jamais.

Le planificateur réutilisable consomme des polylignes en mètres locaux et un prédicat de sécurité, sans modifier les coordonnées géographiques sources. Il choisit un tronçon de voie existante, dans un sens ou l'autre, à moins de 80 cm du personnage. Il valide tous les 25 cm bâtiments, limites, eau, restrictions, barrières et pente ; validation répétée pendant la marche et déplacement via les collisions de Mission 02. Pas de raccord fictif entre voies, pas de pont/tunnel/gué inventé. Arrêt explicatif si aucun trajet, obstacle ou fin du tronçon. Les restrictions OSM ne garantissent pas l'accessibilité actuelle sur le terrain.

## Ambiance

Nuages opaques stylisés instanciés (un draw call), dérive lente, lumière et ciel interpolés sur un cycle de vingt minutes, coucher chaleureux. Vent subtil par shader des couronnes opaques : conservation du batching, du depth test et du LOD hystérétique existants ; pas de reconstruction des matrices d'arbres par frame. Quatre oiseaux décoratifs maximum, vols intermittents autour des arbres effectivement rendus (OSM ou végétation illustrative), deux en Éco. Leur présence et leur animation sont illustratives, jamais des observations de faune réelle.

Son explicitement activé via Web Audio : vent filtré modulé, eau atténuée à proximité des points de cours d'eau, pas déclenchés par distance parcourue, timbres herbe/terre/gravier/route issus des surfaces OSM, chants espacés avec panorama et atténuation. Synthèse originale uniquement, aucune ressource audio externe ni licence supplémentaire. Le son de pas reste stylisé (oscillateurs), pas un enregistrement réaliste ; l'eau repose sur la distance aux sommets des lignes et les chants utilisent un panoramique stéréo simplifié.

Deux profils existants conservés : Éco / Qualité, choix automatique selon les premières secondes de rendu, bouton de changement manuel. Nombre de nuages/oiseaux réduit en Éco ; ombres coupées dans le mode géographique comme en Mission 02. Aucun trafic ni simulation d'habitants ajouté.

## Vérifications

- Avant modification : 11 tests et build réussis sur le checkout initial ; après mise à jour de main : 23 tests existants.
- Après mission : `npm test` : 28 tests réussis, dont sélection des voies, refus des raccords éloignés, obstacles statiques/dynamiques, vitesse bornée, arrivée, interruption, vent et surfaces.
- `npm run build` : succès. Avertissement Vite conservé : bundle supérieur à 500 ko, environ 572 ko non compressés.
- `node scripts/browser-living.mjs` : Chromium système, rendu SwiftShader ; chargement réel, Auto Walk avec déplacement mesuré, trois vues, reprise clavier, son activé/désactivé, arrêt par bouton, viewport 390 × 844, aucune erreur JavaScript.
- Captures locales dans `work/visual/`, inspection de l'avatar et de l'interface ; correction du bouton de profil qui était couvert par le panneau.
- Rendu logiciel : environ 6–8 FPS, 95–99 draw calls, environ 302–309 milliers de triangles pendant les premières captures. Ce résultat ne mesure pas un GPU matériel ; Android réel non testé.

## Limites à revoir

La marche longue distance, les connexions entre plusieurs voies, la validation terrain réelle, les performances GPU/mobile réelles, l'écoute humaine sur casque et la qualité artistique du coucher complet ne sont pas validées. Les nuages et oiseaux sont des premières formes légères. Les captures des trois vues seules ne prouvent pas l'absence de scintillement ou de popping pendant une longue session. Conserver les attributions OSM/IGN existantes ; aucune donnée externe ajoutée. Aucun déploiement et aucune fusion autorisés par cette mission.

Contrôle supplémentaire : aucun arbre ponctuel OSM dans cet extrait ; ancrage des oiseaux/chants corrigé sur les arbres rendus, avec assertion Chromium de présence des ancrages. Dernier passage logiciel : environ 11 FPS, 102 draw calls et 315 milliers de triangles.

Nouvelle exécution Chromium après correction : 2 147 ancrages de végétation, assertion de présence réussie, scénario complet réussi. Le test de reprise manuelle attend maintenant l'état observé plutôt qu'un délai arbitraire de 100 ms (insuffisant sous SwiftShader chargé). Mesures logicielles variables : 3–11 FPS selon la charge, jusqu'à 103 draw calls / 315 282 triangles ; aucune conclusion GPU. Capture supplémentaire vers le ciel inspectée : nuage stylisé visible ; un essai de capture a expiré avant une nouvelle capture réussie à résolution réduite. Console de cet essai : 404 de ressource, sans erreur de shader observée. Le cycle complet du coucher et une longue observation du feuillage restent à examiner.

## Dernière vérification avant fusion — 8 novembre 2026

### Corrections

- 404 reproduite et identifiée par Chromium DevTools Protocol (`Network.responseReceived` et `Log.entryAdded`) : **`http://localhost:5173/favicon.ico`**, requête automatique de l'icône du navigateur. Aucune ressource géographique ou audio du jeu ne manquait. Ajout de `public/favicon.svg` original et lien explicite avec la base Vite (`/endless-earth/favicon.svg`), également copié dans le build.
- Déplacement automatique : suppression du glissement latéral lors d'une collision, arrêt dès que le déplacement réalisé diffère du déplacement prévu. Le mode manuel garde le glissement existant. Les remparts rendus (`historic=castle/ruins/citywalls`, `barrier=city_wall`) étaient absents de la navigation : ajout des collisions sur leur contour, avec leur épaisseur de rendu de 1,25 m et les 30 cm de rayon du personnage ; intérieur de cour préservé. Fermeture des contours prise en compte même si le dernier sommet n'est pas dupliqué.
- Audio : sérialisation des transitions `resume`/`suspend`, réutilisation du contexte et des deux sources d'ambiance, annulation des anciennes automations de gain lors d'un basculement. L'état n'est validé qu'après réussite de la transition.
- Feuillage : intégration d'une vitesse de phase bornée. L'ancienne multiplication du temps par l'intensité des rafales aurait accéléré les oscillations au fil d'une longue session.
- Mise à jour du smoke test de Mission 02 pour les commandes audio actuelles et les deux zones de statut.

### Sécurité et répétitions

`npm test` : les **28 tests initiaux ont été relancés avec succès**, puis deux tests de régression ajoutés : **30/30** réussis. Ils combinent Auto Walk, le vrai noyau de navigation et les collisions, à 120 Hz, 30 Hz et avec des frames de 250 ms. Bâtiment, accès privé, interdiction piétonne, eau, mur, ruines, pont sans tablier et tunnel : arrêt avant la zone, sans traversée. Le test diagonal vérifie l'absence de déviation automatique et conserve le glissement manuel.

`node scripts/browser-safety.mjs` : cinq obstacles ajoutés **après** le départ dans Chromium (bâtiment, zone privée, eau, mur, rempart historique). Arrêt explicatif dans les cinq cas ; chaque position relevée à chaque frame reste autorisée, sans passage de l'autre côté. Ces fixtures restent uniquement en mémoire du navigateur de test et ne modifient pas les données du dépôt.

`node scripts/browser-living.mjs` renforce la surveillance des réponses HTTP et des erreurs console/CDP. Audio : six cycles marche/arrêt, puis douze clics rapides (24 basculements au total), avec vérification des états `running`/`suspended`, un seul contexte, deux sources d'ambiance et exactement douze `resume`/douze `suspend`. Trois vues, Auto Walk, reprise manuelle et viewport mobile conservés dans le scénario.

### Inspection visuelle et limites

`node scripts/browser-visual.mjs` : capture vidéo de 22,24 s et dix captures, nuages pendant un déplacement du personnage (positions enregistrées) puis arbres pendant une orbite de caméra près du château. Inspection des captures pleine taille et de deux planches de seize images à 4 images/s extraites de la vidéo : **aucun scintillement visible ni disparition anormale de couronnes observés sur ces séquences**. Le changement ponctuel de densité lors du passage automatique Qualité → Éco reste un changement de profil prévu.

La capture vidéo utilise le ffmpeg système via un chemin de cache Playwright temporaire dans cet environnement (le binaire vidéo Playwright n'était pas installé). Captures et vidéo sont dans `work/visual/final/`, exclu de Git. Ce contrôle est un échantillon visuel sous **Chromium/SwiftShader** ; il ne constitue pas une garantie pour tous les trajets, toutes les durées ou les GPU matériels. Écoute humaine sur casque et matériel Android toujours non réalisées.

Résultats finaux sur cette révision : `npm test` **30/30**, `npm run build` **réussi** (seul avertissement de taille Vite existant), `npm run test:browser` **réussi**, `node scripts/browser-living.mjs` **réussi**, `node scripts/browser-safety.mjs` **réussi**. Dernier contrôle CDP : **aucune réponse HTTP ≥ 400 et aucune erreur réseau console** ; le scénario Mission 03 ne relève aucune erreur JavaScript/console. Branche existante et PR n°7 conservées en brouillon, sans fusion ni déploiement.
