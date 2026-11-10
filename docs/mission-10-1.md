# Mission 10.1 — Le monde retrouve sa vraie voix

## Statut

La Mission 10 a été jugée décevante par la première écoute du propriétaire : grondement, oiseaux répétitifs et pas artificiels. Ces retours sont traités comme des défauts artistiques majeurs. Cette correction garde le moteur commun, retire les sons de remplissage et intègre des contacts/chants réellement enregistrés. **Aucune écoute humaine de ma part ni validation perceptive définitive n’est revendiquée. Le propriétaire validera au casque et dans les conditions normales du jeu.**

Base vérifiée : PR #17 fusionnée, dernier `main` `8cefef9b0f8a24bd7ee7b8deb661126a50854c80`. Nouvelle branche `mission/10-1-vraie-voix`. La branche contient aussi le commit de fusion des Missions 09/09.1 `447f891` et tous ses ancêtres ; aucun rattrapage ni réécriture nécessaire. AGENTS.md conservé. Aucune modification de géographie, navigation, animation visuelle, renderer graphique ou workflow de publication. PR distincte en brouillon ; aucune fusion ni aucun déploiement.

## Jalon A — Causes et corrections

L’audit sépare trois défauts :

1. **Grondement** : `air` possédait un gain plancher et un bruit synthétique filtré diffus, même au milieu d’un village sans eau proche. Le contexte réel du départ d’Angles est `built`, sans influence d’eau dans les 120 m recherchés : l’eau n’explique donc pas ce grondement-là. Le bois `woodland` utilisait une captation composite dont le moteur ne séparait pas les composantes : toute vocalisation de cette prise demeurait diffuse, hors du contrôle des appels localisés. Le propriétaire peut en vérifier le contenu perceptif dans la piste isolée. Le vieux ruisseau très faible avait aussi subi une forte normalisation. Les pistes isolées restent dans `before/`.
2. **Oiseaux** : trois vitesses d’une même prise, et risque de vocalisations supplémentaires dans la prise composite de bois. Positions nouvelles autour du joueur et gain de référence fixe. La couche composite est retirée, les vocalisations sont des prises indépendantes, et les perchoirs ont une adresse WGS84 stable, un habitat, une hauteur, un niveau et une histoire propres.
3. **Pas** : deux ressources réutilisées sur quatre familles ; bruit procédural pour herbe/terre, gravier filtré pour route. Une voie non renseignée devenait automatiquement asphalte et le hors-voie devenait herbe. Ces valeurs de repli sont supprimées. Un matériau inconnu reste inconnu et silencieux.

Aucune couche `air`, trafic ou océan de substitution ne reste active dans le pilote. Végétation seulement avec habitat pertinent et vent partagé suffisant ; eau seulement avec distance à une ligne d’eau cartographiée, extinction à 55 m ; pluie seulement quand la météo simulée le justifie. Le silence n’est pas remplacé par un autre tapis sonore.

Diagnostic dans `window.endlessDiagnostics.audio` avec `?perf=1` : couches, fichier/captation, gains natifs actuels et cibles, gain maître, justification, diffus/position, distance, échéance et état de fondu. Les sources ponctuelles et les derniers événements identifiés sont visibles. Les gains sont ceux du graphe ; ils ne constituent pas des mesures acoustiques en dB SPL chez le joueur.

## Jalon B — Bibliothèque et droits

**33 captations indépendantes**, et 82 fichiers préparés qui ne sont pas comptés comme 82 enregistrements : neuf oiseaux (merle, rougegorge, mésange charbonnière, pinson), dix-huit prises de pas (trois par famille), deux végétations, deux eaux et deux pluies. Les percussions ou textures faites avec une table, un portefeuille ou un sac ont été écartées. Plusieurs candidats avec manipulation, circulation marquée, droits incertains ou boucle d’eau de cinq secondes ont été exclus au lieu de compléter artificiellement le quota.

[Sources, auteurs, licences exactes, preuves datées et empreintes des fichiers reçus](../public/audio/sources.json). [Transformations et empreintes par extrait](../public/audio/manifest.json). [Crédits accessibles dans le jeu](../public/audio/credits.html). [Décisions de rejet](mission-10-1-evidence/selection-rejections.json).

Budget **0 €** : 31 CC0 et deux CC BY 4.0, sans ressource NC ou droits incertains. Les crédits CC BY sont conservés. **Limite du canal d’acquisition : les sources Freesound sont les aperçus HQ MP3 publics fournis par le site, pas les WAV originaux nécessitant un compte.** Leur débit réel et leur SHA sont conservés. Les trois sources Commons sont les fichiers originaux servis par Commons. Ne pas confondre FLAC final et restauration d’une source sans perte.

Préparation hors ligne : phrases/contacts réellement distincts, coupes exactes documentées, filtres conservateurs de rumble/DC, gain linéaire plafonné, fondus, mono 32 kHz PCM16 FLAC. Pas de compression dynamique ou normalisation de bruit de fond pour gonfler le niveau ; pas de variantes artificielles comptées comme prises. Le FLAC évite une nouvelle génération de codec perceptuel. Aucune IA payante, aucune IA en jeu. Les ressources Mission 10 restent archivées sous `public/audio/legacy`, inactives.

## Oiseaux et contacts au sol

Les perchoirs sont des **interprétations écologiques**, jamais des observations d’individus à Angles. Une grille WGS84 donne des emplacements fixes dans les bois, haies/scrub, jardins, vergers et certains secteurs bâtis. Les chants peuvent donc être invisibles et ne dépendent pas du seul arbre visible le plus proche. Altitude tirée du MNT partagé ; échantillons d’habitat et de hauteur mémorisés dans un cache borné, invalidé si le fournisseur change. Aucune nouvelle animation ou population visible.

Métadonnées par catégorie : habitats, région tempérée européenne, quatre saisons, horaires, pluie/vent admissibles, portée de 75–110 m, distance de référence de 3–4 m, niveaux variables, cooldowns de 55–70 s et taux probabilistes. Espacement global minimal de 12 s entre émissions, attente d’arrivée de huit secondes, longues périodes sans appel possibles. Les positions ne se déplacent pas autour du joueur. Les prises/phrases et leurs niveaux varient ; HRTF et distance native rendent les approches/éloignements audibles. Rien n’autorise à présenter ces espèces comme localement confirmées.

Six familles de contacts réels : pierre/pavés, terre sèche, terre humide, gravier, herbe, feuilles. Les surfaces OSM explicites sont prioritaires ; asphalte/béton utilisent un contact dur générique étiqueté ainsi, sans prétendre être des pavés. Terre humide seulement sur terre cartographiée + pluie simulée suffisante, ou boue explicitement renseignée. Feuilles seulement avec preuve de litière et saison compatible ; une canopée forestière ne prouve pas son sol. Herbe hors voie à partir d’un couvert herbacé est une interprétation déclarée. Les 79 voies sans `surface` dans l’extrait OSM ne sont pas transformées en matériau confirmé.

Cadence sur distance réellement parcourue, foulée adaptée à la vitesse, pas de son nouveau à l’arrêt, pas de rafale de rattrapage. Niveau plus faible et attaque authentique, sans synthèse de neige. Un matériau absent ou un premier chargement encore incomplet peut rester silencieux : aucun bruit artificiel ne le remplace.

## Jalon C — Démonstrations et validation

[Écoutes, pistes isolées et protocole](mission-10-1-evidence/README.md). Cinq démonstrations de 120–180 s : village immobile, rue au matériau renseigné, forêt matin, forêt fin de journée, approche d’eau. Les captures avant et les pistes isolées permettent de retrouver la contribution d’une couche. La trajectoire d’inspection acoustique vers l’eau n’est pas présentée comme une nouvelle route navigable dans la rivière.

La session réelle de quinze minutes, les résultats acoustiques, les comparaisons CPU/mémoire/voix/décodages/chargements et les non-régressions sont détaillés avec les preuves ci-jointes. Les analyses de signal ne remplacent pas l’écoute du propriétaire. Aucune promesse de fluidité GPU matériel ou Android physique : le navigateur cloud utilise SwiftShader.

## Budgets et limites

Plafonds conservés : 8/12 voix, 1/2/3 HRTF selon profil, 2/3 couches dominantes, contexte 2–4 Hz, cache décodé 24 Mio et 16 entrées, deux requêtes/décodages simultanés, mémoire locale/perchoirs bornés. Aucune bibliothèque audio téléchargée au démarrage ; préchargement limité aux prochaines vocalisations et contacts pertinents. Le manifeste complet de droits ne gonfle pas le bundle : catalogue d’exécution compact séparé.

Restent à valider : écoute humaine longue, adéquation perceptive des prises HQ MP3, niveaux sur haut-parleurs/casque, éventuels résidus de fond, Safari/Firefox, appareils physiques, et matériaux du sol manquants. La bibliothèque n’est pas mondiale ni une captation d’Angles. L’absence de matériau fiable n’est pas masquée ; améliorer les données de sol est une suite distincte. Les villes et ports restent des contrats/fixtures futurs, sans nouveau trafic permanent pour démontrer le moteur.


## Résultats mesurés

Session réelle **900,01 s**, 471 instantanés, 224 contacts pendant la marche automatique : zéro erreur navigateur et zéro chargement en échec. Maximum trois voix et **17,42 Mio** de cache décodé. Dix-neuf chargements et dix-neuf décodages. CPU maximal de préparation audio enregistré par le compteur continu : **20,3 ms** ; maximum vu par les sondes espacées : 2,8 ms. La fermeture rend voix, nœuds, requêtes et cache à zéro. La capture Opus dure 899,985 s (frontières MediaRecorder), distinctes du temps réellement écoulé de test. Remuxage sans réencodage pour permettre le déplacement dans le lecteur. Les empreintes du moteur sont conservées ; après cette capture, seule une espace de fin de ligne a été retirée du renderer audio.

Les quatorze extraits avant/après analysés ne contiennent aucun échantillon saturé. Au départ du village, l’ancien mix immobile est identique à la couche `air` isolée : RMS −47,96 dBFS, 45,96 % de l’énergie spectrale sous 200 Hz. Le nouveau rendu des seules couches du village est exactement nul. Le village complet atteint −74,69 dBFS RMS avec 116 secondes sur 120 sous −70 dBFS ; la rue atteint −58,60 dBFS. Les scènes forestières sont très discrètes (−93,29/−91,60 dBFS RMS, matin/soir) : **le niveau perceptif doit être évalué au casque**, sans prétendre que ces chiffres suffisent à valider le mix. Aucun bloc actif adjacent d’une seconde quasi identique détecté ; ce détecteur simple ne prouve pas l’absence de répétition à plus longue échéance. Les deltas entre échantillons sont conservés et bornés dans les preuves ; ils ne distinguent pas seuls un clic parasite d’un contact réel.

Comparaison : trois passages alternés, 72 fenêtres et 864 rendus synchronisés, mêmes stations/profils/adaptateur EarthLife. Tableau : médianes en ms, ancien → corrigé. Le rendu inclut `finish/readPixels` sur **SwiftShader** ; ces temps ne prédisent pas un téléphone physique. CPU = préparation de la frame, hors rendu ; son coupé/activé dans les deux versions.

| Scène / profil | Rendu coupé | Rendu activé | CPU coupé | CPU activé |
|---|---:|---:|---:|---:|
| village / balanced | 207.1 → 208.0 | 202.8 → 201.2 | 0.1 → 0.2 | 0.2 → 0.2 |
| village / eco | 188.3 → 191.9 | 185.9 → 186.5 | 0.1 → 0.1 | 0.2 → 0.3 |
| forest / balanced | 170.0 → 173.0 | 167.2 → 170.8 | 0.2 → 0.2 | 0.2 → 0.3 |
| forest / eco | 161.6 → 148.4 | 158.1 → 151.5 | 0.1 → 0.1 | 0.2 → 0.2 |
| river / balanced | 102.5 → 104.4 | 101.0 → 101.4 | 0.1 → 0.2 | 0.2 → 0.2 |
| river / eco | 88.1 → 87.4 | 89.1 → 88.2 | 0.1 → 0.1 | 0.2 → 0.2 |

Les médianes varient dans les deux sens. Cas défavorables conservés : forêt équilibré, rendu p95 195,3 → 212,2 ms ; village équilibré, rendu maximal 250,8 → 256,4 ms et CPU maximal 1,2 → 1,9 ms. Pas de conclusion de gain graphique général. CPU audio p95 corrigé 0,9–1,3 ms selon scène/profil. Le cache maximal des fenêtres actives passe de 13,80–19,15 Mio à 0,79–16,34 Mio ; forêt calme sans voix pendant ces fenêtres courtes, rivière deux voix, village une voix. Ce calme explique une partie de la baisse du cache, sans valoir test de saturation. Le test spatial force séparément les budgets de douze voix/deux HRTF, puis le profil économique.

CPU processus, heap, somme RSS, chargements, tailles de cache, p50/p95/max et tous les échantillons figurent dans [les mesures brutes](mission-10-1-evidence/performance-raw.json) et [la synthèse](mission-10-1-evidence/performance-summary.json). Les chargements comparatifs sont cumulatifs sur chaque passage, pas un débit ; la mémoire native décodée est comptée séparément du heap. La somme RSS recompte des pages partagées. Aucune preuve de gain universel de mémoire processus.

Identité et chargement de production vérifiés sur le commit propre `b011811` : quatre formats (1280×800, 390×844, 320×568, 844×390), monde chargé, titre Mission 10.1 lisible, aucune commande recouverte par le badge, aucune erreur navigateur ni requête de métadonnées Git. [Résultats et captures](mission-10-1-evidence/production/validation.json).

Vérifications terminées : **146 tests JavaScript**, les deux suites Python MNT (deux tests), TypeScript/Vite, cinq démonstrations longues et quatre pistes isolées, rotation/distance/obstruction et saturation spatiale, activation utilisateur/clavier, bascules concurrentes, masquage/reprise et douze cycles de destruction. Non-régressions navigateur : EarthLife, mémoire/LOD/matrices, 19 cas de données dégradées, caméra et cinq obstacles injectés pendant la marche automatique. Les sources graphiques, géographiques, de navigation et le workflow Pages restent identiques à la base.

Bibliothèque active : 11 204 378 octets FLAC. Bundle applicatif : 682,02 ko / gzip 190,84 ko, contre 667,18 / 187,73 ko pour Mission 10. L’avertissement Vite de chunk >500 ko reste présent. Aucun chargement audio avant activation volontaire dans les sondes navigateur.

## État des livrables et validation restante

Code, 33 captations avec droits, manifeste, crédits, audit, démonstrations avant/après, session longue et mesures techniques sont livrés. Aucun quota de captations manquant. Aucune observation locale d’espèce ou nouvelle donnée de sol n’est inventée. Les matériaux inconnus restent le principal manque de données ; les sons de trafic, ports et événements humains restent hors du pilote faute de justification.

**L’approbation artistique reste ouverte** : écouter les cinq cas, la session longue et les prises isolées, puis évaluer niveaux, fatigue, répétitions et résidus de fond sur le matériel habituel. La PR reste en brouillon, sans fusion ni publication. Une réussite perceptive définitive n’est pas annoncée.
