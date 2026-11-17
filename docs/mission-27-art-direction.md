# Mission 27 — Direction artistique et limites de la référence

Document technique accompagnant le [rapport final](mission-27.md). Il définit les intentions et la grille de revue ; il ne prononce pas une acceptation artistique départementale.

## Référence disponible

Référence de code : `1d330cab93847a4026194088c60d378c71c0b8f7`, fusion effective de la PR #38 dans `main`, contenant M26.4. Les empreintes initiales sont relevées dans `work/mission-27/baseline/hashes.json` ; leur bilan de conservation appartient au reçu final de préservation.

Quatre captures statiques initiales sont conservées : [première personne](mission-27-evidence/gallery/angles-before-first.png), [troisième personne](mission-27-evidence/gallery/angles-before-third.png), [vue aérienne](mission-27-evidence/gallery/angles-before-aerial.png) et [tactile](mission-27-evidence/gallery/angles-before-mobile.png). Leurs SHA-256 sont dans l’[inventaire de parité](mission-27-evidence/immersive-parity-inventory.json). La première personne et la vue aérienne ont été inspectées visuellement pour ce document. Les deux autres sont inventoriées ; cela ne constitue pas une revue détaillée de leur contenu.

Les images inspectées montrent une végétation ramifiée, des couleurs sourdes, des silhouettes de maisons sur l’horizon, un contraste d’ombre lisible et une interface sobre. Elles montrent également des surfaces de sol assez uniformes, des ruptures de pente apparentes et le message **« Le paysage suivant est indisponible · déplacement arrêté »**. Cet état initial est conservé tel quel. Il ne vaut pas référence saine de chargement, panorama complet du pilote ou comparaison départementale réussie.

Cette baseline est **limitée** : captures fixes d’un même secteur, sans campagne appariée de saisons/heures, sans transect sonore, sans parcours natif complet ni mesure perceptive des transitions. Les anciennes galeries M23–M26.4 documentent des scènes supplémentaires et des défauts historiques ; elles gardent leur identité et leur version. Elles ne sont pas renommées preuves M27.

## Identité visuelle à conserver

Le projet vise une 3D douce, chaleureuse et accueillante, avec des matériaux lisibles et des paysages qui donnent envie de marcher. Le soin doit porter sur la composition et les transitions entre lieux, autant que sur le nombre de détails. Une prairie ouverte ou un champ nu peuvent être aboutis grâce à leur sol, leur relief, leur lumière et leur ambiance.

La géographie source reste le squelette : emprises, voies, hydrographie, relief, niveaux et restrictions. La variation décorative ne doit pas changer les appuis, ouvrir une propriété, ajouter un pont praticable ni attester un monument. Les hauteurs ou toitures inférées doivent conserver cette provenance. Une façade et une fenêtre opaques peuvent suggérer un bâtiment habité sans promettre un intérieur visitable.

Les quatre objectifs de revue sont réalisme, immersion, poésie et plaisir de l’exploration. Aucun compteur de plantes ou de fenêtres ne suffit à les déclarer atteints.

## Contrats par milieu

| Milieu | Composition recherchée | Variation admise | Contrôle indispensable |
|---|---|---|---|
| Rue de bourg | Façades lisibles, rythme des ouvertures, toitures et alignements source | Teintes, menuiseries, encadrements et patine plausibles | Façades face/profil/arrière, fermeture des volumes, contact au sol, collision historique |
| Centre urbain | Densité et gabarits de la source, perspectives, diversité des usages | Palettes et détails contextualisés | Ne pas transformer Poitiers/Châtellerault en copie d’Angles ; monuments génériques signalés |
| Périphérie/activité | Volumes techniques crédibles, emprises de voirie et ouvertures adaptées | Palette utilitaire, toitures compatibles avec les attributs | Pas de toiture pittoresque systématique sur hangar ; aucune emprise sur chaussée |
| Hameau/agriculture | Groupes bâtis et espaces ouverts, transitions vers parcelles | Variantes simples de façade et matière secondaire | Fonction réelle connue ou inférée explicitement ; pas d’activité inventée comme observée |
| Forêt/lisière | Profondeur, variété de silhouettes, sol ombré et espaces respirants | Petites plantes, feuilles, pierres et bois mort adaptés | Ancrage et passage libres ; identité tronc/ombre ; mouvement et son en continuité |
| Prairie/bocage | Ouverture, texture et vent discrets, haies quand documentées | Touffes et variation végétale contextualisée | Pas de remplissage uniforme ni haie créant un faux passage ou une barrière nouvelle |
| Champ ouvert | Parcelle, saison, matière du sol et horizon | Micro-détail visuel secondaire | Un faible nombre d’objets hauts n’est pas automatiquement un manque artistique |
| Berge/zone humide | Transition eau-sol-végétation, lecture des rives | Roseaux, pierres, petits bois dans les marges compatibles | Pas de largeur navigable, seuil, profondeur ou accès réel inventé |
| Pont/infrastructure | Silhouette, niveaux et raccords documentés | Aspect secondaire prudent | Dessus/dessous, appui rendu/physique, hauteur libre inconnue toujours refusée |
| Données rares | Paysage de repli cohérent avec sa précision connue | Détail explicitement procédural | Pas de faux relief fin ou de précision LiDAR certifiée ; lacunes visibles au diagnostic |

Ces contrats sont des objectifs de revue. Ils ne signifient pas que tous les milieux ont déjà reçu une bibliothèque ou une validation équivalente.

## Palette et grammaire du candidat

La voie M27 en cours d’intégration emploie des packs régionaux versionnés et des plans déterministes liés aux empreintes source. `src/enrichment/architecture.mjs` prévoit des matériaux et ouvertures opaques, une variation de palette, un gabarit lié aux attributs disponibles et des toitures adaptées aux cas pris en charge. Les empreintes complexes et monuments ne doivent pas se voir attribuer une reconstruction authentique par cette seule grammaire. Leurs replis fermés et warnings doivent rester comptés.

`src/enrichment/render.ts` prépare de petites familles instanciées : herbes, fougères, roseaux, pierres et bois mort. Les plantes réemploient `lifeUniforms` et `windGLSL`, avec le même chemin de mouvement pour leur profondeur d’ombre. L’éclairage et la neige utilisent les récepteurs existants. Le champ d’exposition neige reste toutefois celui réellement disponible : enregistrer un matériau ne crée pas une couverture départementale de neige.

Ces observations portent sur le code candidat, **pas sur un rendu certifié des 499 tuiles**. Les comptes générés, chargés, rendus et visibles doivent rester distincts dans les reçus finaux. Un paramètre `animated` ou l’existence d’un shader n’attestent pas un mouvement observé à l’écran.

Les transformations, palettes et identités fondamentales doivent rester cohérentes entre Éco, Équilibré et Qualité. La simplification doit réduire le coût en conservant la lecture du milieu. Les profils ne doivent pas relancer le hasard ou changer les sources géographiques.

## Parité du monde vivant : résultat encore ouvert

L’[inventaire structuré](mission-27-evidence/immersive-parity-inventory.json) décrit quatorze familles de systèmes, leurs chemins, branchements, dépendances au pilote, tests pertinents et risques. Son niveau de preuve est l’inspection des sources ; il ne remplit pas un audit d’observation des 499 tuiles.

Les principaux partages déjà présents dans M26.4 sont l’horloge météo/ciel, le champ de vent des couronnes départementales, l’habitat envoyé aux contrôleurs globaux, le joueur, les contacts aquatiques, le Soundscape unique, les supports admis et les transports. Les principales différences demeurent la forêt départementale simplifiée, l’eau départementale sans le shader aquatique historique, les indices acoustiques et perchoirs liés au pilote, l’exposition neige, les interactions sémantiques et le camp refusé hors pilote.

Le candidat d’enrichissement ne suffit donc pas à clore A47–A52. Les futures corrections doivent adapter les fournisseurs d’objets et d’ancres aux systèmes existants, sans créer un deuxième vent, une deuxième météo ou un deuxième mix sonore. Les refus d’accès et d’activité restent autoritaires.

## Grille humaine A56

La revue doit visionner une séquence native continue à hauteur humaine, avec le son du jeu et une cadence permettant de juger le mouvement. Elle doit consigner version, lieu source, profil, météo/date/heure, viewport/framebuffer, FPS réellement rendus, FPS de capture et type de matériel. Un film SwiftShader à basse cadence permet de repérer certains défauts mais ne valide pas le naturel ni la fluidité.

| Axe | Question de revue | Échelle proposée | Résultat de ce document |
|---|---|---|---|
| Composition | Les plans proches, moyens et lointains donnent-ils de la profondeur et des perspectives intéressantes ? | 1–5 avec commentaire et timestamp | Non évalué sur séquence native |
| Variété | Les différences de matière, silhouette et habitat paraissent-elles naturelles sur la durée ? | 1–5 avec répétitions signalées | Non évalué |
| Mouvement | Vent, feuillage, oiseaux, eau et personnage évoluent-ils sans rupture gênante ? | 1–5 avec événements signalés | Non évalué |
| Ambiance sonore | Les distances, transitions, silences et contacts invitent-ils à écouter ? | 1–5, matériel d’écoute indiqué | Non évalué |
| Continuité | Les tuiles, profils, demi-tours et changements de mode restent-ils perceptivement cohérents ? | 1–5 et liste d’artefacts | Non évalué |
| Envie d’explorer | La promenade donne-t-elle envie de ralentir, s’arrêter et poursuivre ? | Commentaire humain argumenté | Non évalué |

Les notes ne sont pas automatiquement agrégées en succès. Un défaut bloquant de géographie, d’accès, de volume ou de streaming ne peut pas être compensé par une belle palette. **A56 demeure NON VALIDÉ dans cette revue** : aucune appréciation humaine d’une séquence immersive native complète n’est fabriquée à partir des captures fixes.

## Campagne de revue à poursuivre

La campagne attend les 22 stations définies dans la mission, calculées depuis les données du dépôt, et un échantillon stratifié reproductible sur les tuiles. Elle doit inclure Angles, Poitiers ancien/périphérie, Châtellerault, Chauvigny, Montmorillon, les autres secteurs cités, forêt/lisière, campagne ouverte, bocage, rivières, ponts documentés, bordure départementale et fallback. Une station manquante doit rester explicitement non capturée.

Pour les comparaisons, conserver le lieu, la caméra, la graine, le profil, le soleil et la météo ; enregistrer leurs différences réelles quand l’appariement est imparfait. Répéter sous trois moments solaires et plusieurs saisons appropriées, avec caméra fixe et mobile, approche/recul, rotation et demi-tour. Vérifier la silhouette, la teinte, l’ombre et le son, ainsi que l’appui du joueur. Les captures accélérées et simulations de longue distance gardent leur propre type de preuve.

Les fixtures montagne et hors Europe doivent exercer le même pipeline avec d’autres packs, et garder leur étiquette synthétique lorsqu’elles le sont. Elles vérifient la portabilité de mécanismes ; elles ne prouvent pas l’existence d’un territoire réellement documenté ou la qualité départementale.

Les limites et artefacts observés restent consignés dans le registre résiduel final. Cette direction artistique conserve les défauts de la référence et les points non évalués ; elle ne remplace ni la galerie finale, ni l’audit des volumes, ni le jugement perceptif demandé.
