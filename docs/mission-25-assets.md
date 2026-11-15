# Provenance des assets — Mission 25

| Élément | Origine et droits | Transformation / coût |
| --- | --- | --- |
| Voyageur, bottes, pouces, rig et animations M25 | Création procédurale originale dans le code du projet ; aucun modèle tiers ni personnage sous copyright repris. | 19 os, un SkinnedMesh/matériau, indices proches/Éco : 3 072/1 536 triangles ; attributs partagés. |
| Packraft, pagaie, siège et équipement rangé | Géométries originales `packraft-render.mjs` ; primitives et utilitaire de fusion de Three.js déjà présent, sous licence MIT. | 744 triangles, quatre lots par matériau ; instance cachée après rangement. |
| Marques de semelles/boue/poussière/herbe | Texture de masque RGBA 32×64 générée par `ground-marks.mjs`, originale, sans image téléchargée. | 8 192 octets source ; une texture fixe, pool instancié plafonné à 24/64/96. |
| Rides au contact de l’eau | Shader procédural M24 réutilisé, émission de pagaie M25. | Pool 4/16 selon profil ; pas de texture image. |
| Son du feu | **Campfire.wav**, Defaultv, [source Freesound 536935](https://freesound.org/people/Defaultv/sounds/536935/), **CC0-1.0**. Source HQ MP3 du fournisseur, pas le WAV original ni une captation locale revendiquée. | Fichier FLAC mono 32 kHz/18 s de M24 inchangé ; métadonnées/hashes/filtres conservés dans `mission-24-evidence/final/audio-source.json`. M25 ajuste uniquement sa voix spatiale existante. |
| Pas et ambiances | Catalogue M24 antérieur conservé, licences individuelles dans `public/audio/sources.json`, manifeste et page de crédits existants. | Aucune nouvelle ressource audio ; aucune attribution supprimée. |
| Géographie et profondeur | Contours/axes OSM ODbL et supports IGN/OSM déjà chargés ; aucun fichier géographique modifié. La profondeur artistique n’est pas une nouvelle source mesurée. | Calcul déterministe runtime, provenance `estimated`, confiance faible ; surface opaque existante inchangée. |

Aucun achat, clé API, service payant ou dépendance supplémentaire. Coût externe : **0 €**. Les primitives de code et données dérivées ne reçoivent pas une licence de modèle tiers inventée ; elles font partie des modifications originales du projet.
