# Mission 27 — Sources, acquisitions et droits

Audit réalisé le 17 novembre 2026 sur la base M26.4 `1d330cab93847a4026194088c60d378c71c0b8f7`. Les [reçus sources](mission-27-evidence/source-manifest.json) distinguent corpus historique, documentation HTTP vérifiée et produits candidats non acquis. Le [registre des assets](mission-27-evidence/licenses-and-assets.json) conserve les références, licences et empreintes des sons et matériaux historiques. Cet audit ne certifie ni une nouvelle couverture LiDAR à 50 cm, ni le rendu artistique de chaque tuile.

## Corpus réellement présent et réutilisable

| Couche | Version et portée | Droits, précision et limites |
| --- | --- | --- |
| Contours administratifs | API Geo / IGN, 265 communes acquises le 15 novembre 2026, union déclarée de 7 025,633 km² | Licence Ouverte 2.0 ; édition COG non auditée indépendamment. Les points représentatifs ne sont pas nécessairement les centres-bourgs. |
| Relief de base | 499 tuiles de 4 096 m ; échantillonnage API RGE ALTI à 128 m | Licence Ouverte 2.0, EPSG:2154 / IGN69. Interpolation entre échantillons ; le pas n'est pas l'exactitude source. |
| Contact fin existant | 499 packs IGN MNT LiDAR HD dérivés, 2 m effectifs, acquis du 16 novembre 2026 08:48:01 au 09:25:42 UTC | Licence Ouverte 2.0 ; EPSG:2154 / IGN69 ; 1 407 876 165 octets compressés. Taille et SHA relus conformes **499/499** cette session ; aucun décodage ni rendu supplémentaire déduit de ce contrôle. |
| MNT natif du pilote | Manifeste historique de 30 fichiers à 0,5 m autour d'Angles, acquisition M26.1 | Référence **locale** ; reçu et empreinte du manifeste vérifiés. Les GeoTIFF bruts n'ont pas été nouvellement acquis ni vérifiés par cet audit. Aucun remplacement silencieux du relief courant. |
| Vecteurs géographiques | Extrait OpenStreetMap France `vienne.osm.pbf` de 61 804 280 octets, instantané source du 15 novembre 2026 01:23:36 UTC | © OpenStreetMap contributors, ODbL 1.0 ; emprises et tags conservés. Date d'extrait distincte de l'observation de chaque objet. Absence de tag ≠ accès public ou attribut mesuré. |
| Gares | Inventaire historique SNCF Réseau, acquisition du 16 novembre 2026, emprise bornée | ODbL. Identifiants, dates et URL dans `public/planet/fr-86/stations.json` ; présence dans l'inventaire ≠ service voyageurs fonctionnel. |
| Matières, modèles, sons | Fichiers historiques du pilote et reçus individuels conservés | Matières Poly Haven/ambientCG et sons Freesound individuellement identifiés CC0 ; autres éléments selon leur manifeste historique. Aucun nouvel asset tiers dans cet audit. |

Les 499 packs fins sont épinglés au commit de données `acb0a73b396229bf90731b90a558a8d5d072a9ec`. Leur base HTTPS est déclarée dans `public/planet/fr-86/manifest.json` ; le runtime conserve vérification SHA, requêtes de proximité et budgets. Ils n'entrent pas tous dans le téléchargement initial du jeu. Le transfert Git de cette session a récupéré le corpus et ses preuves historiques : **ce n'est pas une nouvelle acquisition M27 de 1,408 Go de LiDAR**. Le volume du transfert Git n'est pas mesuré ici.

Le taux moyen de valeurs fines valides vaut **98,4408 % des échantillons des carrés complets**, marges extérieures incluses. Ce n'est pas le pourcentage de surface fine du contour administratif. Les valeurs absentes restent explicites. L'erreur maximale de quantification du codec, 0,005 m, est distincte de l'exactitude absolue du relevé. La politique historique excluant valeurs négatives et voisinage de 4 m reste limitée à ce corpus continental ; elle ne convient pas universellement aux territoires sous le niveau marin.

## Vérifications officielles nouvelles, sans acquisition de rasters

Les APIs data.gouv de **MNT, MNS et MNH LiDAR HD**, **BD Forêt**, **BD ORTHO** et **BD TOPO** répondent HTTP 200 et déclarent `lov2`, soit Licence Ouverte 2.0. Les URLs, dates de vérification, empreintes et ressources annoncées sont consignées dans le manifeste. Leur plage temporelle de catalogue n'est pas reportée comme date de relevé de chaque dalle.

L'inventaire WFS générique `IGNF_LIDAR-HD_METADONNEE:metadata` a été interrogé avec le rectangle EPSG:2154 `[464432,6553087,562817,6679341]` : **12 538 enregistrements correspondants**, puis **trois métadonnées** reçues avec géométrie et URLs MNT/MNS/MNH à 0,5 m. Ces exemples déclarent LAMB93 / IGN69, acquisition du 25 mars 2024 et édition du 18 février 2025. Le nombre porte sur le rectangle englobant et peut inclure marges ou versions ; il ne démontre ni nombre unique de dalles, ni couverture exacte de la Vienne, ni disponibilité de chaque raster. **Aucun raster de cet inventaire n'a été téléchargé ou intégré.**

Les six requêtes sur les espaces de noms de dalles spécifiques `IGNF_MNT_LIDAR-HD:dalle`, MNS et MNH renvoient HTTP 400 (`Unknown namespace`). Elles sont conservées comme échecs ; la réponse du WFS générique ne les transforme pas en succès. La disponibilité annoncée par un catalogue ne prouve pas le fonctionnement d'un endpoint.

Les descriptions officielles LiDAR précisent l'exclusion des **ZICAD** avec nodata ; BD ORTHO mentionne également ces restrictions. Aucune limite vectorielle ZICAD n'a été acquise ni auditée cette session. Aucun trou n'est reconstruit comme mesure et aucun contournement de restriction n'est entrepris. La cartographie exhaustive de ces frontières demeure ouverte.

| Produit candidat | Vérification réalisée | Intégration M27 et lacune |
| --- | --- | --- |
| MNT/MNS/MNH LiDAR HD | Catalogue, licence, métadonnées WFS bornées et trois exemples natifs | Aucun nouveau raster ; couverture 50 cm et comparaison départementales **non démontrées**. |
| BD TOPO | Catalogue courant décrit la version 3.5 et les identifiants stables | Aucun vecteur départemental nouvellement importé. Le PDF 3.4 fourni par la mission redirige vers une page HTML cartes.gouv.fr ; son contenu PDF n'est pas vérifié. |
| BD Forêt V2 | Catalogue : formations ≥5 000 m², photo-interprétation produite entre 2007 et 2018 | Aucun polygone nouveau ; millésime précis Vienne non établi. Ne pas considérer cette source comme inventaire botanique actuel. |
| BD ORTHO | Catalogue : produit courant annoncé à 20 cm, acquisitions départementales | Aucune image importée ; millésime exact Vienne et assemblage local non audités. Aucun placage photographique ajouté au sol. |
| OCS GE | Page officielle accessible | Aucun produit acquis ni audit exhaustif de licence/édition/couverture par dalle ; candidat uniquement. |
| Copernicus Tree Cover / Forests | Page officielle accessible | Aucune couche importée ; licence du produit précis, millésime, résolution locale et couverture restent à établir. Les anciens caches GLO-90 ne sont pas les couches forestières ni le relief livré. |
| Geofabrik Poitou-Charentes | Page de téléchargement accessible | Aucun nouvel extrait acquis ; le jeu conserve l'extrait OSM France épinglé existant. |

## Provenance et droits de redistribution

Le vocabulaire canonique du reçu est `observed`, `source-derived`, `inferred`, `procedural-decorative`, `unverified`, `restricted`. Les synonymes éditoriaux `derived`, `procedural-fiction`, `unknown` correspondent respectivement à `source-derived`, `procedural-decorative`, `unverified`. Un détail généré n'acquiert pas le statut observé parce qu'il est plausible.

Les emprises OSM restent source-derived ; hauteurs sans tags, formes de toiture et détails d'ouvertures restent inférés ou décoratifs. Les plantes, espèces, phases, pierres et accessoires inventés ne sont ni positions relevées ni inventaires écologiques. Aucune précision de berge, profondeur ou hauteur libre n'est inventée comme mesure. Décoration et permission de déplacement demeurent deux responsabilités distinctes.

Les attributions IGN/API Geo, version et modifications doivent rester identifiables conformément à la Licence Ouverte 2.0. Les couches et bases dérivées d'OSM conservent les obligations ODbL applicables, dont attribution et obligations de redistribution des bases dérivées ; une nouvelle grammaire de façades n'efface pas ces droits. Le code applicatif n'est pas déclaré automatiquement sous ODbL par le seul usage des données. Les licences individuelles et reçus d'assets sont conservés ; une politique CC0 générale ne certifie pas un fichier tiers quelconque.

Les pages Poly Haven et ambientCG vérifiées cette session confirment leurs politiques CC0. Aucune texture, HDRI ou modèle nouveau n'a été importé. La vieille URL de licence Etalab redirige vers l'accueil data.gouv ; l'URL du PDF Etalab v2 répond bien en PDF et son empreinte est conservée. Un statut HTTP 200 est interprété avec le type MIME, la redirection et le contenu reçu.

## Coûts, cache et reproduction

**Aucun achat, abonnement, API payante, service récurrent ou dépendance supplémentaire.** Les nouvelles requêtes de cet audit ne récupèrent que métadonnées, pages de licence et documentation bornées ; leurs octets lus sont comptés dans `mission27Acquisition.httpMetadataBytesRead`. Les 499 packs existants sont relus localement sans réinterroger leur fournisseur. Le stockage des reçus M27 s'ajoute au dépôt ; l'hébergement gratuit futur n'est pas garanti à l'échelle terrestre.

Pour refaire la vérification des packs sans acquisition :

```sh
node scripts/audit-mission-26-1-contact.mjs
```

Le manifeste M27 donne les requêtes HTTP exactes, leurs horodatages et empreintes ; une nouvelle réponse peut évoluer et doit créer un nouveau reçu. Les scripts de recherche de cette session restent dans `work/mission-27/sources/` ; ils ne sont pas des dépendances du jeu. Les commandes de préparation historique et licences d'origine restent dans [M26](mission-26-data.md) et [M26.1](mission-26-1-data.md).

L'étape manquante est un import sélectif documenté des produits supplémentaires lorsque leur gain artistique/physique est vérifié. Cet audit n'en revendique pas l'exécution et ne modifie aucune géométrie source, donnée fine ou permission d'accès.
