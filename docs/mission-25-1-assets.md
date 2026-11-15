# Sources et licences — Mission 25.1

Aucun achat, service, compte, clé, abonnement, modèle, texture, enregistrement ou animation tiers ajouté. Les dépendances et leur fichier de verrouillage sont conservés. La bibliothèque Three.js existante reste sous sa licence MIT.

| Élément | Provenance et limites |
| --- | --- |
| Rig 31 os, doigts regroupés, clavicules, cou et couvercle du sac | Géométrie et skinning originaux du projet, prolongés dans `src/character/walker.mjs`. Aucun personnage de franchise, scan ou modèle téléchargé. Les doigts sont regroupés pour la prise ; ce n’est pas une main anatomique intégrale. |
| Clips marche/jogging/course | Clés et phases originales dans `src/character/clips.mjs`, sans motion capture, retargeting ou animation commerciale. Le placement des pieds est corrigé par le solveur existant après lecture des cycles. Nage/assise/pagaie conservent des poses procédurales, avec couches d’ajustement. |
| Packraft | Primitives originales M25, nouvelle fusion par couleurs de sommets ; un lot de coque et un lot de pagaie, 488 triangles. Pas de produit de marque reproduit. |
| Silhouettes d’oiseaux | Corps et ailes originaux, familles génériques petit passereau / longues ailes / oies interprétées. Les positions sur branches proviennent de la géométrie des arbres effectivement générés. Ce ne sont pas des observations d’individus réels. Les chants ne certifient pas l’identité visuelle de chaque silhouette générique. |
| Contacts aquatiques sonores | Synthèse originale déterministe dans `src/audio/water-synthesis.mjs`, dans l’AudioContext existant. Ce sont des bruitages de jeu, **pas des captations naturelles**. Aucun son tiers et aucune licence de son inventée. Les limites auditives restent soumises aux prises natives. |
| Chants, feu, vent, rivière et pas | Fichiers existants inchangés. Sources, auteurs, licences CC0-1.0 / CC-BY-4.0, preuves de licences et transformations dans `public/audio/sources.json`, `public/audio/manifest.json` et `public/audio/credits.html`. Les tests relisent les octets et vérifient les empreintes. Aucun chant non vérifié n’est téléchargé ou étiqueté comme nouvelle espèce. |
| Géographie et profondeur | Données OSM (ODbL) et IGN/ASP avec attributions existantes inchangées. Réseau dérivé de l’eau chargée, support M23 et refus physiques existants. Le fond M25 reste `source=estimated`, `confidence=low` : aucune bathymétrie ou sécurité réelle validée. |

Les empreintes des nouveaux fichiers et celles des sources conservées sont dans `mission-25-1-evidence/preservation.json`. Les créations originales de code suivent le régime existant du dépôt ; aucune nouvelle licence de modèle ou d’animation tiers ne leur est attribuée.
