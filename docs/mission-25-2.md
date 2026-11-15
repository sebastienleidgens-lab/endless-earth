# Mission 25.2 — Finition artistique et réalisme sensoriel

Cette extension améliore le voyageur, ajoute trois interactions artistiques collisionnées et prolonge le paysage sonore et animal de M25.1. **Implémentation technique en validation ; mission artistique partielle.** Aucune validation humaine du rendu ou de l’écoute, aucun GPU physique ou téléphone réel disponible. Aucun merge et aucun déploiement.

La [PR brouillon #37](https://github.com/sebastienleidgens-lab/endless-earth/pull/37) cible `mission/25-1-voyageur-monde-vivant`, elle-même dans la [PR brouillon #36](https://github.com/sebastienleidgens-lab/endless-earth/pull/36). La base exacte est `ffbbd765ec75bdcddd0bdb3b58933e46d585b7db`. M25.1 reste non fusionnée. Voir l’[audit initial](mission-25-2-audit.md), commité séparément.

## Résultat et méthode

Le voyageur possède un visage sculpté, des yeux composés, une implantation de cheveux, des mains à quatre doigts et pouce, des plis, poches, coutures et attaches de sac. Il conserve 31 os et un matériau. Les clés articulaires originales de cuisse/genou/pied précèdent les corrections d’appui ; la jambe libre lit son animation de base, l’appui conserve son contact monde. Le retour neutre utilise un petit pas levé. Les mesures distinguent erreur de semelle, erreur d’ancrage et déplacement effectif du point planté.

Le banc, la roche et le tronc sont des **décors artistiques inventés**, déclarés au joueur et dans les JSON. Le validateur exige le support géographique existant et ses marges hors voies, eau, arbres et propriétés. Les collisions sont additives. L’approche, le bassin, les membres, la tête et le sac sont testés le long de trajectoires subdivisées. Aucun collider géographique n’est désactivé pour réussir l’action.

La préparation des accès aquatiques et du graphe est découpée. Le voisinage des rives est indexé ; un cache exact borné évite de confondre des points situés de part et d’autre d’un obstacle. Le sac du bateau reprend sa géométrie portée. Les contacts d’eau et la respiration discrète utilisent le contexte sonore existant et des positions de joints observées.

Les ailes lisent l’horloge commune à chaque rendu ; les corps extrapolent entre les mises à jour bornées de la faune. Les perchoirs proviennent de branches chargées, les vols ont une destination de branche et une courbe d’altitude. Les familles reçoivent proportions et palettes distinctes. Les chants existants identifiés sont associés aux identités visuelles compatibles. Le bruissement proche est attaché à des branches, modulé par le vent partagé, filtré et limité au budget audio existant.

## Acceptation propriétaire — neuf demandes, ordre M25.1

Les films et chiffres finaux sont en cours d’archivage dans la [galerie locale](mission-25-2-evidence/index.html). Les statuts ci-dessous restent prudents tant que les preuves et la revue humaine ne ferment pas chaque critère.

| # | Demande | Statut | Preuves et limites |
| --- | --- | --- | --- |
| 1 | Packraft / performance | Partiel | Préparation découpée, index de rive, cache exact ; mesures avant/après dans `benchmarks.json`. Le coût total et le travail initial ne respectent pas encore tous les budgets. Longs trajets finaux en cours de vérification. |
| 2 | Personnage / rig | Partiel | Comparaisons à quatre angles et tour 360°, volumes et clips originaux, 31 os. Revue artistique humaine non validée ; style encore simplifié. |
| 3 | Course | Partiel | Appuis mesurés, accélération, arrêt, inclinaison et contre-rotation. Tests à 4/8/30/60/120 Hz et dt irréguliers ; films finaux en cours. |
| 4 | Interactions | Partiel | Banc et roche avec assise/relevé, tronc avec trajectoire et collision. Tests de refus du passage et des murs ; revue perceptive et transitions à évaluer. |
| 5 | Nage | Partiel | Trois accès réels à refilmer, transitions conservatrices, bruitages originaux et souffle lié à la tête émergée. Fond et profondeur estimés ; naturel subjectif non validé. |
| 6 | Vent | Partiel | Champ climatique commun préservé, hiérarchie végétale existante, bruissement localisé. Trace de trois heures simulées explicitement distincte des cinq minutes natives. |
| 7 | Chants | Partiel | Quatre familles sonores déjà vérifiées, identité des passereaux visibles, silences et variantes. Aucun nouveau chant tiers ; écoute humaine non validée. |
| 8 | Oiseaux visibles | Partiel | Familles distinctes, ailes continues, destination de branche et groupes saisonniers. Captures natives proches, lointaines et d’oies à contrôler ; aucune présence réelle attestée. |
| 9 | Audio spatial | Partiel | Sources ponctuelles, rivière linéaire, zones diffuses, oiseaux mobiles et écouteur caméra. Promenade finale de huit minutes à vérifier ; casque, haut-parleurs et clipping à contrôler. |

## Validation reproductible

`npm test` puis `npm run build`. Pour les captures : `node scripts/build-mission-25-2.mjs . work/mission-25-2/compiled`, puis `npx vite preview --host 0.0.0.0 --port 5372 --outDir work/mission-25-2/compiled`. Jeu : `http://localhost:5372/endless-earth/`.

La référence est un worktree détaché au SHA M25.1 exact, compilé avec le même module d’instrumentation explicite. Les preuves utilisent le jeu compilé et sa boucle, ses contrôleurs, ses collisions et son unique AudioContext. Les placements de diagnostic ont lieu avant l’enregistrement ; le pilotage programmé ne fournit que des commandes d’entrée. Ni positions imposées pendant les trajets, ni interpolation des images, ni accélération du temps des films.

La galerie est un fichier autonome : `docs/mission-25-2-evidence/index.html`. On peut aussi servir le dépôt avec `python3 -m http.server 5374 --directory .` et ouvrir `http://localhost:5374/docs/mission-25-2-evidence/index.html`.

Les vidéos originales, traces, SHA-256, mesures compilées, licences et inventaire des fichiers protégés accompagnent la galerie. `node scripts/summarize-mission-25-2.mjs` recalcule l’index et les empreintes. Les commits d’évidence ultérieurs ne changent pas les sources exécutées.

## Sources et limites connues, dettes ouvertes

Voir [les modèles, animations et licences](mission-25-2-assets-and-licenses.md). Aucun achat, nouvelle dépendance ou asset tiers. Les enregistrements existants conservent les attributions et preuves de licence.

Les défauts géométriques M23, raccords et discontinuités de relief restent ouverts. Aucun pont ni passage sous pont non prouvé n’est rendu navigable. Les sources IGN/ASP/OSM, les voies et les propriétés ne sont pas corrigées arbitrairement. L’Anglin n’a pas de bathymétrie mesurée dans ce jeu ; les profondeurs servent uniquement au gameplay.

Le camp verrouille toujours les déplacements. Aucun éloignement du feu actif n’est prétendu ; la progression spatiale se contrôle avec la rivière et les oiseaux. Les budgets HRTF et de voix sont conservés, sans second mix.

SwiftShader constitue seulement un environnement logiciel de comparaison. Les tests tactiles à 390×844 ne valident ni les performances Android ni une carte graphique réelle. La mémoire des attributs est une estimation par les miroirs CPU, pas une mesure des allocations du pilote GPU. La revue artistique indépendante, l’écoute humaine et les critères subjectifs restent non validés. **La mission n’est pas déclarée terminée.**
