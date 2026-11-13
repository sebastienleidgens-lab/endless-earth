# Reproduire la revue 17B

Les preuves de 17A, dans le dossier parent, restent immuables. Ce sous-dossier contient uniquement la proposition 17B. `index.html` est une galerie HTML locale ; GitHub affiche directement les images liées par le rapport Markdown.

1. Installer les dépendances avec `npm ci` si nécessaire. Exécuter `npm test` et `npm run build`.
2. Lancer `npm run dev -- --port 5317` dans le dépôt.
3. Exécuter `node scripts/prepare-forest-baseline.mjs`. Dans `work/mission-17/frozen`, lancer `node_modules/.bin/vite --host 0.0.0.0 --port 5318`. La source est épinglée à `2367820` (17A, forêt Mission 16). Les deux caches de lumière historiques sont extraits de ce commit et routés par les scripts ; les sources géographiques partagées doivent être inchangées.
4. `node scripts/prepare-forest.mjs` reconstruit le complément déterministe et la carte d’implantation.
5. `node scripts/prepare-forest-light.mjs` exporte les buffers réellement chargés et recalcule le cache actif. Les exports bruts et rasters restent dans `work/`.
6. `node scripts/study-forest-density.mjs` calcule l’indicateur de projection. L’étude MNH utilise un GeoTIFF réel obtenu à l’URL de `mnh-study.json`, enregistré dans `work/mission-17b/mnh-ign.tif`, et l’URL dans `mnh-url.txt`. `/usr/bin/python3 scripts/study-forest-mnh.py` demande GDAL et NumPy ; `python scripts/report-forest-maps.py` demande Pillow. Cette étude n’est pas nécessaire au runtime.
7. `node scripts/catalog-forest.mjs` produit l’inventaire et les octets d’atlas. Le PNG de revue est un export exact de ces octets RGBA, 512 × 256 ; le runtime utilise la même DataTexture.
8. `node scripts/browser-forest-evidence.mjs` capture huit paires du vrai jeu, onze familles et des détails dans l’atelier. Puis `node scripts/browser-forest-isolated.mjs` ajoute la neuvième paire : un sujet à l’écart dans le vrai paysage, sans masquer les autres arbres. Le personnage est conservé à son échelle native. L’atelier est synthétique et distinct du paysage du pilote.
9. Sans autre processus de test, calcul lourd ou navigateur graphique : `node scripts/benchmark-forest.mjs`. 396 rendus GPU-finish/readback : campagne couleur (3 variantes × 3 profils × 3 stations × 12 valeurs) et lumière stabilisée (2 variantes × 3 profils × 1 station × 12 valeurs). Caméra et climat complets sont comparés exactement. SwiftShader est logiciel ; ces ms ne sont pas des FPS Android.
10. Après la campagne : `node scripts/browser-forest-validation.mjs` vérifie profils, saisons, six créations/destructions de zones réellement rendues, marche native courte avec changement de profil, rechargement, et fichiers complémentaires absent/corrompu/périmé. Les buffers d’instances sont explicitement libérés.
11. `node scripts/audit-forest-placement.mjs` vérifie les ancrages, exclusions, sources et médias 17A. `node scripts/verify-forest-integration.mjs` recalcule le graphe effectif et exige son identité exacte avant d’actualiser les empreintes des raccords. Ces scripts ne préparent pas de nouveaux bâtiments/routes.
12. `node scripts/browser-forest-review.mjs` vérifie la galerie et les médias à 390 × 844 ainsi qu’en desktop. `npm run build` et le smoke test compilé restent distincts.

La marche est enregistrée à vitesse native, sans accélération, sans téléportation après la pose initiale et sans bande-son ajoutée. Le conteneur WebM est indexé par copie codec pour rendre sa durée et ses points de recherche lisibles ; les paquets encodés et leurs PTS sont comparés à l’original et restent identiques. Elle ne remplace pas le test de 30 minutes de 17D. Les quatre saisons ne sont pas déclarées artistiquement finalisées par les seuls contrôles de non-régression.

La bibliothèque et les dessins alpha sont originaux. Aucun asset externe ou outil GPL n’entre dans le runtime. Les statistiques MNH et les formations IGN/ASP sont soumises à la Licence Ouverte 2.0 ; les données et placements dérivés OSM conservent l’ODbL. Les photographies/essais de fabrication 17A restent décrits séparément.

Arrêt pour revue artistique du propriétaire. PR en brouillon, sans fusion ni déploiement. Budget supplémentaire : 0 €.
