# Modèles, animations et sons — Mission 25.2

Aucun asset tiers, achat, abonnement, téléchargement de modèle ou ajout de dépendance. Les créations originales suivent le régime existant du dépôt. Aucun scan, mouvement capturé ou personnage de franchise n’est utilisé.

| Élément | Origine, transformations et limites |
| --- | --- |
| Voyageur, visage, mains, vêtements, bottes et sac | Volumes originaux du projet, prolongés dans `src/character/traveler-details.mjs` et `walker.mjs`. Couleurs de sommets, un matériau, deux index de détail partageant les attributs de peau. Yeux, doigts et cheveux sont sculptés ; aucune texture photographique. Rig conservé de 31 os. Les doigts restent partiellement groupés. |
| Marche, jogging, course et enjambement | Nouvelles clés articulaires originales dans `joint-clips.mjs`, combinées avec les cycles de `clips.mjs`. Le solveur corrige ensuite les contacts. Les autres actions restent procédurales ; ce n’est pas une animation capturée. |
| Banc, roche et tronc | Primitives et sculpture originales, collisions additives et surfaces explicitement enregistrées. Emplacements artistiques déterministes vérifiés sur le support existant, hors des marges de circulation/propriété/eau du validateur de camp. **Aucune attestation de présence géographique réelle.** Attribution visible dans le menu Sources et dans les inventaires JSON. |
| Packraft | Coque et pagaie originales existantes ; le sac stocké reprend la géométrie du sac porté. Ses trois lots maximum (coque, pagaie, sac) sont réutilisés ; la visibilité du sac est coordonnée avec celle du dos. Aucun modèle de produit reproduit. |
| Oiseaux | Géométrie originale, détails de tête/bec/yeux/pattes, palettes et proportions de familles. Trajets et perches interprétés à partir de branches chargées. Familles visuelles stylisées, aucune observation ornithologique réelle attestée. |
| Bruissements proches | Réutilisation des enregistrements existants de feuillage vert/sec, portions avec fondus, filtre passe-haut à 380 Hz et positions de branches effectivement chargées. Aucun nouveau fichier sonore tiers. Le lit diffus de canopée est conservé. |
| Contacts d’eau et souffle | Synthèse originale déterministe, dans l’AudioContext existant. Souffle discret autorisé seulement lorsque la phase de respiration porte la tête au-dessus de l’eau chargée. Il ne s’agit pas d’une captation naturelle. |
| Chants, rivière, vent, pluie, feu, pas | Octets existants inchangés. Les sources, auteurs, URLs, preuves de licence et transformations demeurent dans [sources.json](../public/audio/sources.json), [manifest.json](../public/audio/manifest.json) et [credits.html](../public/audio/credits.html). Licences CC0-1.0 / CC-BY-4.0 selon l’entrée, avec obligations d’attribution conservées. |
| Géographie | IGN / ASP / OSM et attributions conservés. Profondeur toujours estimée (`source=estimated`, `confidence=low`), sans valeur bathymétrique ni indication de sécurité réelle. |

Les empreintes des sources et médias exécutés sont consignées dans `mission-25-2-evidence/provenance.json` et `preservation.json`. Le catalogue détaillé des enregistrements réutilisés, avec leurs licences réelles, figure dans `audio-licenses.json`. La qualité perceptive requiert encore une écoute humaine au casque et sur haut-parleurs.
