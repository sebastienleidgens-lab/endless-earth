# Mission 13B — Bibliothèque et protocole

[Galerie réelle](index.html) · [Rapport principal](../../mission-13.md) · [Catalogue](../../../public/materials/authentic/catalog.json) · [Sources CC0 et empreintes des cartes](../../../public/materials/authentic/sources.json).

L’accord « Go » après 13A ouvre **13B uniquement**. La scène est un atelier synthétique, pas une modification du pilote géographique. Aucun fichier de géographie, collision, navigation, climat, son ou matériau Mission 12 n’a été changé. Le nouveau module n’est importé que par la fixture de développement.

## Ouvrir et comparer

```sh
npm ci
npm run dev -- --port 5173
```

Atelier : `http://localhost:5173/endless-earth/fixtures/materials.html?perf=1&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z`.
Galerie : `http://localhost:5173/endless-earth/docs/mission-13-evidence/materials/index.html`.
Choisir une matière, une distance, le profil, l’heure et la météo. Les trois colonnes partagent géométrie, caméra et éclairage. La capsule mesure 1,65 m. Le village ne reçoit aucune de ces nouvelles matières avant 13C.

## Préparer hors ligne

Pillow 13 est la seule dépendance Python nécessaire ; déjà référencée pour le projet. Les JPEG 1K du fournisseur et cartes extraites des archives restent dans `work/`, hors Git. Le script vérifie chaque SHA-256 avant traitement et télécharge uniquement si le cache manque.

```sh
python scripts/prepare-authentic-materials.py
python scripts/prepare-authentic-materials.py --output work/mission-13B/rebuild
npm test
npm run build
node scripts/browser-mission-13-b.mjs
python scripts/report-mission-13-b.py
```

Comparer les SHA-256 des atlas et du catalogue entre la sortie livrée et la reconstruction. Les règles sont dans `scripts/mission-13-materials.json` et le pipeline porte son empreinte dans le catalogue. Aucune préparation dans le navigateur.

Trois atlas de **1152 × 864**, 4 × 3 cases, dix matières, chaque tuile **256²** entourée de **16 pixels** périodiques : couleur PBR JPEG, hauteur/rugosité PNG décodé en RG8, hybride PNG RGBA8. L’hybride code ton, hauteur fournisseur, chaleur relative et rugosité sèche ; son shader Lambert n’utilise pas de réponse spéculaire à cette dernière. Les normales sources sont épinglées mais non livrées : le relief de shading utilise la hauteur fournisseur. AO non ajouté. Aucun déplacement de sommets. Les cartes normalisées et leurs amplitudes ne constituent pas une géométrie physique mesurée.

Les bords sont rapprochés par une bande symétrique de 8 pixels, puis prolongés périodiquement dans les gutters. Les dimensions et changements sont inscrits au catalogue. Le traitement réduit une partie de l’éclairage photographique large, sans prétendre à un dé-éclairage exact. La teinte finale reprend la palette et les bornes de contraste Mission 12. Les UV restent métriques ; leur phase par objet est stable, sans rotation des joints ou rangs.

Le shader utilise les gradients non repliés, mipmaps et anisotropie ≤4 (1 en Éco). L’hybride retire le relief fin en Éco et revient vers une moyenne stable au loin. JPEG/PNG donnent un repli largement compatible avec le WebGL2 actuel. KTX2/Basis est différé : trois fichiers limités, aucun gain de transcodage mesuré justifiant une nouvelle dépendance. Les coûts GPU du catalogue sont des estimations arithmétiques avec mipmaps.

## Preuves

`summary.json` : 70 cas matière/lumière, trois profils, 405 rendus synchronisés/readback, médianes/P95, cycles et limites. `measurements.json.gz` garde caméras, conditions, identités, positions comparées et échantillons. Les images rapprochées, de 24 m et lointaines viennent du navigateur réel, jamais d’une génération IA.

Le témoin emploie les vrais atlas/shaders Mission 12. Les deux autres approches utilisent les mêmes surfaces. Les différences d’UV traduisent les mètres par tuile, sans différence de positions. Le PBR Standard utilise couleur, hauteur et rugosité ; l’hybride Lambert conserve l’expression diffuse du jeu. La mémoire résidente de l’atelier contient les trois approches ; ne pas l’extrapoler à une promenade.

Le test de rechargement compare quatre instantanés, dont trois remplacements de bibliothèque ; les programmes inutilisés sont libérés. Un nouveau fichier corrompu garde le dernier état valide. Le jeu compilé a été vérifié séparément : zéro requête vers `materials/authentic/`. Une partie des ressources `public/` supplémentaire est copiée dans `dist/`, mais n’est pas téléchargée par le jeu.

## Limites et arrêt

Rock Face 03 : largeur fournisseur **2,7 m**, confirmée par la fiche officielle et l’API ; les **27 m** antérieurs restent le réglage artistique du témoin Mission 12. Bricks099 et Rock023 n’ont pas d’échelle fournisseur disponible : 2 et 2,5 m sont des estimations artistiques explicites. Les formations géologiques exactes et matériaux individuels restent inconnus.

Les variantes d’une seule photographie peuvent rester reconnaissables sur 24 m. Le grain fin de la tuile et le coût du gravier doivent encore être jugés dans le village. Aucun benchmark de GPU physique, Android, longue marche ou absence de fuite infinie revendiqué. **Attendre la validation artistique et l’accord explicite du propriétaire avant 13C.**
