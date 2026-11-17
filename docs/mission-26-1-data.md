# Mission 26.1 — Données, précision et droits

## Sources acquises

- IGN Géoplateforme, MNT numérique LiDAR HD : 499 demandes de carrés 4096 m, 2049 × 2049 points à pas effectif de 2 m. Les URL, dates de récupération, tailles et SHA des GeoTIFF originaux et des packs figurent dans `public/planet/fr-86/contact-2m/manifest.json`. Licence Ouverte 2.0. Les GeoTIFF originaux sont gardés localement sans altération, compressés de façon réversible ; les packs publiés sont des dérivés identifiés.
- IGN MNT natif 0,5 m autour d’Angles : 30 fichiers acquis et normalisés, dont neuf empreintes historiques M08.5 vérifiées. Les [métadonnées WFS](mission-26-1-evidence/sources/lidar-pilot-metadata.json), [reçus natifs](mission-26-1-evidence/sources/native-pilot-mnt.json) et [normalisation](mission-26-1-evidence/sources/normalized-pilot-mnt.json) sont conservés. Le défaut connu de déclaration CRS de la sérialisation WMS est corrigé selon le contrat métrique vérifié, sans changer les valeurs. Cette série est une référence locale ; elle ne remplace pas silencieusement les packs historiques.
- OSM / API Geo / RGE : corpus M26 conservé, 499 tuiles et 265 communes. Les droits et limites restent ceux de [M26](mission-26-data.md). Les identifiants, directions, contours et restrictions ne sont pas déplacés pour compléter un itinéraire.
- SNCF Réseau, Liste des gares : 103 enregistrements acquis dans une emprise bornée, 64 concernent la Vienne, 60 codes UIC uniques dont 24 marqués voyageurs dans cette source. [Réponse originale](mission-26-1-evidence/sources/sncf-gares-original.json), URL, empreinte et date dans `public/planet/fr-86/stations.json`. ODbL. Ce n’est pas un état de service en temps réel.

## Ce que signifie « 2 m »

Il s’agit du pas effectif demandé au service numérique. Ce n’est ni une précision verticale de 2 m, ni une campagne uniforme de relevé natif 0,5 m, ni une preuve de façade détaillée. Les dates d’acquisition 2023 et d’édition 2025 vérifiées autour d’Angles ne sont pas extrapolées au département.

Les valeurs non finies ou négatives et leur marge de 4 m sont marquées inconnues pour limiter les mélanges de nodata du service dans cette région continentale. Cette règle n’est pas généralisable aux régions sous le niveau de la mer. Les originaux rejetés restent archivés et le défaut de transfert de deux GeoTIFF a été repris avant admission. Le codec garde un entier uint16 au centimètre et une différence modulaire par ligne, puis gzip. Son erreur de quantification maximale est 0,005 m, distincte de l’erreur du relevé. Les frontières de carrés présentent au maximum 0,01 m d’écart de quantification dans l’audit.

L’[audit des packs](mission-26-1-evidence/contact-audit.json) et la [carte de couverture](mission-26-1-evidence/contact-coverage.svg) indiquent les lacunes. Le taux de 98,4408 % porte sur les échantillons des carrés, y compris leurs marges extérieures à la Vienne. Les échantillons absents replient explicitement vers la source RGE 128 m ; une telle zone n’est pas qualifiée de contact fin.

## Eau, accès et reconstruction

Les contours d’eau viennent d’OSM. Leur rendu et les accès de berge sont vérifiés dans les cellules chargées. Le fond reste une reconstruction de jeu estimée, de confiance faible : aucune profondeur mesurée, garantie de navigation réelle ou sécurité nautique n’est revendiquée. Les ponts, barrages, seuils, passages privés et retours non vérifiés restent fermés. La possibilité technique d’estimer un fond ne prouve pas l’existence de trois nouveaux parcours admis.

## Volume, coût et reproduction

Les packs fins totalisent 1 407 876 165 octets. Ils ne sont ni tous préchargés par le navigateur ni copiés dans l’artefact statique. Les acquisitions et le stockage dans le dépôt public n’introduisent aucun achat. L’URL des données est épinglée à un commit et les empreintes restent vérifiées. La capacité d’un hébergement gratuit pour une extension France/monde reste une décision future explicite.

`python scripts/acquire-planet-contact.py --dry-run` fournit le plafond de transfert avant acquisition. `node scripts/audit-mission-26-1-contact.mjs` contrôle tous les packs. Les dépendances scientifiques sont dans `scripts/planet-requirements.txt`. Les sources étant évolutives, une nouvelle récupération doit créer de nouveaux reçus et empreintes ; elle ne doit pas écraser les preuves historiques.
