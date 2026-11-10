# Ressources et licences LP-01

Inventaire du 10 novembre 2026. Aucun achat, texture, modèle, police téléchargée, son, photo ou image IA. Les peintures sont les sorties du rasteriseur de géométrie simplifiée `src/baker.ts`, pas des photos ou des captures du moteur 3D existant.

| Ressource | Origine et périmètre | Licence / attribution |
|---|---|---|
| Rues, pont, emprises bâties, surface de l'Anglin | Lecture de `../../public/data/angles-osm.geojson`, extrait du 8 novembre 2026 ; géométrie découpée sans déplacement des coordonnées | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/), **© OpenStreetMap contributors**, [copyright](https://www.openstreetmap.org/copyright). Les tags `source` cadastraux/Bing présents dans la base restent des provenances de contributions OSM, pas des ressources photo importées. |
| Relief | Lecture de `../../public/data/angles-terrain.json`, échantillonnage bilinéaire du MNT IGN LiDAR HD déjà préparé dans le dépôt | **IGN, Licence Ouverte / Open Licence 2.0**, [texte](https://www.etalab.gouv.fr/licence-ouverte-open-licence/). Résolution source 10 m ; grille LP-01 5 m interpolée, donc aucun gain de précision. |
| Zones boisées et végétation | Lecture de `../../public/data/angles-environment.json`, BD Forêt V2 et zones de végétation BD TOPO V3 préparées | **IGN, Licence Ouverte 2.0** ; polygones cartographiés. Chaque arbre dessiné est procédural et non recensé individuellement. Les zones herbacées de fond sont une interprétation, pas une carte floristique. |
| `public/world.json` | Extraction et combinaison des données ci-dessus ; empreintes SHA-256 des trois entrées incluses dans le fichier | Base dérivée diffusée sous **ODbL 1.0**, avec attribution IGN conservée. Source modifiable et procédure d'extraction livrées. |
| WebP, masques, personnage, animations | Création originale déterministe LP-01 à partir de la base, sans contenu graphique tiers | Œuvres produites à partir des données précédentes ; garder les crédits OSM et IGN. Les contributions graphiques originales LP-01 sont proposées sous [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/), sans annuler les droits sur les données sous-jacentes. |
| Three.js | Projection orthographique par `OrthographicCamera` et `Vector3` ; version exacte dans `package-lock.json` | MIT, notice complète dans `public/ATTRIBUTION.txt`, issue du paquet effectivement installé. |
| TypeScript, Vite, `@types/three` | Outils de développement / compilation | Apache-2.0 pour TypeScript ; MIT pour Vite et les types. Notices des paquets installés et dépendances transitives dans leurs fichiers LICENSE. |
| Playwright / Chromium | Précalcul et tests locaux uniquement | Apache-2.0 pour Playwright ; licences libres Chromium. Ni navigateur ni Playwright distribué dans le build. |
| Texte et polices | Georgia et Arial de la plateforme, avec familles de repli | Aucune police embarquée ou redistribuée. |

Les crédits figurent dans l'interface et dans `public/ATTRIBUTION.txt`, livré avec le build. ODbL et Licence Ouverte autorisent gratuitement l'extraction et la réutilisation avec leurs obligations respectives. Les documents sources et notices locales ont été consultés ; les URL ci-dessus permettent de consulter les textes applicables. Le dépôt principal n'est pas relicencié par ce fichier.
