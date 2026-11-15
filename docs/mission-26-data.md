# Mission 26 — données, références et licences

Les données distribuées sont distinctes des reconstructions et de la simulation. Aucune clé de jeu, service payant, carte Google, photographie réservée ou modèle commercial ajouté.

## Sources effectivement utilisées

| Couche | Acquisition et portée | Référence / licence / limite |
| --- | --- | --- |
| Emprise et communes | API Geo, contours des **265 communes** renvoyées pour le département 86 ; union géométrique en Lambert-93 | IGN / API Geo, Licence Ouverte 2.0. L’édition COG 2026 n’est pas indépendamment auditée. Les points de noms de communes sont des points représentatifs de polygones, pas des centres-bourgs relevés. |
| Relief départemental | **879 255 points** de l’API `ign_rge_alti_wld`, grille de **128 m**, avec marge autour de l’emprise | IGN / RGE ALTI, Licence Ouverte 2.0, hauteurs normales IGN69. La réponse ponctuelle ne prouve pas la résolution native de chaque source amont ; aucun nouveau LiDAR HD à 0,5 m revendiqué. |
| Vecteurs | Extrait départemental `vienne.osm.pbf`, **61 804 280 octets**, OpenStreetMap France | © OpenStreetMap contributors, ODbL 1.0. Instantané PBF : `2026-11-15T01:23:36Z` (champ de réplication source), date d’acquisition et SHA-256 dans les preuves. Statuts, hauteurs, sens, accès et ouvrages peuvent manquer ou être périmés. |
| Pilote | Données IGN/ASP/OSM et paquets historiques déjà présents | Licences et références historiques conservées. Relief fin et réserves M23 restent distincts de la nouvelle grille départementale. |

URLs et empreintes complètes : [sources.json](mission-26-evidence/sources.json). Les longs appels Overpass ont échoué ; l’extrait PBF a été utilisé. Des dalles **Copernicus GLO-90 / EGM2008** ont été vérifiées et téléchargées en cache de recherche, mais **ne sont pas utilisées dans les tuiles livrées**. Aucune conversion implicite EGM2008 → IGN69 n’a été effectuée.

BD TOPO départementale, OCS GE départementale, inventaires forestiers détaillés, SNCF Réseau, références aéronautiques officielles et nouvelles données Météo-France ne sont pas présentés comme importés. Le climat et les sons existants sont réutilisés ; ce n’est pas une météo mesurée à chaque emplacement ni un trafic réel.

## Couverture mesurée

L’union des contours choisis mesure **7 025,633 km²**, et non exactement les 6 990 km² indicatifs de la mission. Cet écart de référentiel/surface demeure explicite ; le contour n’est pas déformé pour obtenir le nombre attendu.

**499 / 499 tuiles** de 4 096 m ont été produites. La couverture administrative de données de base vaut 100 %, sans cellule `nodata` dans le produit. Le terrain interpole une grille à 128 m ; ravins, falaises, berges, talus et petits ouvrages ne peuvent pas être annoncés fidèles à cette résolution. Les carrés de bord comportent aussi des marges de données hors contour administratif.

Les tuiles compressées totalisent **77 405 799 octets**. Elles sont demandées au voisinage ; le département n’est pas intégralement transféré au navigateur au démarrage. Les fichiers `.tile` et `overview.pack` sont des gzip opaques pour éviter une décompression HTTP transparente avant vérification de leur empreinte.

L’[audit indépendant](mission-26-evidence/tile-audit.json) contrôle chaque empreinte, taille compressée/décodée, schéma et hauteur finie. **938 paires de bords** partagent les mêmes échantillons, écart maximum 0 m. Cela ne valide **pas** le raccord entre l’ancien pilote raffiné et la nouvelle grille, ni tous les supports jouables, ni les passages d’ouvrages.

## Inventaire géographique

| Famille source | Objets distincts | Longueur source dans l’emprise |
| --- | ---: | ---: |
| Voies `highway` (routes et chemins confondus) | 99 394 | 29 425,451 km |
| Rail, tous statuts et voies parallèles | 1 388 | 934,413 km |
| Hydrographie, lignes et surfaces | 12 094 | 2 579,210 km de lignes |
| Aviation / aérodromes / pistes | 92 | 17,868 km de lignes |
| Bâtiments | 530 242 | Sans affirmation de hauteur ou façade mesurée |
| Occupation des sols | 20 426 | Interprétation écologique générique |
| Barrières | 27 817 | Tags et géométrie de source |

Ces nombres décrivent les objets importés et ne sont **pas** des kilomètres de trajets jouables. Les longueurs complètes de ways aux frontières peuvent dépasser les longueurs découpées ; cette distinction figure dans l’audit. Les sommes par politique d’accès sont de l’**éligibilité de métadonnées**, pas une validation exhaustive par le contrôleur.

## Confiance et reconstructions

- Relief entre points : interpolation inférée ; aucune précision centimétrique déduite des deux décimales stockées.
- Bâtiments : emprise OSM ; hauteur taguée ou hauteur générique inférée, toitures et façades simplifiées. Pas d’intérieurs inventés.
- Forêts : occupation cartographiée ; individus, essences et silhouettes générés, pas un inventaire botanique. Les typologies écologiques détaillées restent ouvertes.
- Routes : largeur taguée sinon inférée par classe. Accès et sens interprétés selon une politique régionale déclarée ; ils ne garantissent pas un droit d’accès réel. Propriétés explicitement privées, barrières, eau et ouvrages non vérifiés restent bloquants.
- Eau nouvelle : géométrie présente, profondeur et hauteur libre sous pont inconnues. **Pas d’admission automatique au packraft.** Le fond du pilote reste estimé pour le jeu, de confiance basse.
- Trains, avions et trafic : simulation originale, sans flux réel ni horaires réels revendiqués.

## Régénération et reprise

```sh
python -m pip install --target work/mission-26/python -r scripts/planet-requirements.txt
python scripts/acquire-planet.py --only admin
python scripts/acquire-planet.py --only osm
python scripts/acquire-planet-elevation.py --step 128 --dry-run
python scripts/acquire-planet-elevation.py --step 128
python scripts/prepare-planet.py --dry-run
python scripts/prepare-planet.py --resume
python scripts/prepare-planet.py --tile 122:1599
node scripts/audit-planet.mjs
```

Les requêtes d’altitude sont séquentielles, mises en cache par lot et reprenables ; les journaux d’acquisition fusionnent leurs mises à jour sous verrou. `--sector xmin,ymin,xmax,ymax` permet une sélection Lambert-93. Les données brutes et paquets Python restent dans `work/`, hors fichiers distribués. Le cache brut et les dépendances nécessaires doivent être conservés ou réacquis ; ils ne sont pas des livrables Git.

Les scripts de préparation du pilote ne sont pas remplacés. Les deux manifestes historiques de décoration reçoivent seulement une déclaration de transformation d’apparence et une nouvelle empreinte du matériau ; leurs paquets binaires, positions, ancrages et empreintes des sources sont inchangés.

## Redistribution

Le relief et les contours IGN conservent la Licence Ouverte 2.0. Les données vectorielles dérivées d’OSM conservent l’ODbL 1.0 et leur attribution. Les couches et leur provenance sont identifiables dans le produit ; le code applicatif n’est pas déclaré sous ODbL du seul fait de leur usage. L’extrait source reste récupérable via son URL et son empreinte ; aucun octet privé ou jeton n’est distribué. Les attributions des sons et matières historiques restent accessibles depuis le jeu.
