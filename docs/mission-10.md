# Mission 10 — Le monde a une voix

> Document historique Mission 10. La correction 10.1 et sa bibliothèque distincte sont décrites dans [mission-10-1.md](mission-10-1.md). Les ressources originales ci-dessous sont archivées sous `public/audio/legacy`, inactives.

## Résultat et statut

Moteur sonore commun implémenté et intégré au pilote d’Angles-sur-l’Anglin. Enregistrements autorisés de bois venteux, eau et pas ; mixage progressif, pas liés à la distance, spatialisation sélective, mémoire locale et événements probabilistes. Les régions urbaines/côtières/montagneuses sont des **fixtures synthétiques de contexte**, pas de nouveaux lieux rendus dans le jeu. Les sons humains/routiers sont provisoires et réservés à ces fixtures.

**Qualité artistique définitive non validée.** Les extraits sont réellement rendus par Web Audio et mesurés, mais aucune écoute humaine au casque/haut-parleurs ni validation d’une longue promenade relaxante n’est revendiquée. Une base technique mondiale extensible ne constitue pas une bibliothèque mondiale achevée.

## Base Git et sécurité

Vérification au démarrage : GitHub indiquait la PR #16 déjà fusionnée, contrairement au texte préparatoire. Branche créée depuis `447f891b4754bf30650af816ba63f88c6a4e9eb3`, fusion de 09.1 ; `27dcdc3cb02ec43b0057ab2cef06592b6acc21d4` est ancêtre et son arbre est strictement identique à cette fusion. Les Missions 09 et 09.1 sont intégralement présentes. La précision ultérieure du propriétaire confirme cette base et réserve le timeout Pages `syncing_files` à une autre mission.

Branche dédiée `mission/10-le-monde-a-une-voix`, PR distincte en brouillon vers `main`. Aucune modification de la PR #16, aucun workflow GitHub Pages modifié, aucune fusion et aucun déploiement effectués ici. AGENTS.md conservé. Données, décorations précalculées, collisions, graphe routier et rendu géographique conservés.

## Architecture et contrat

Inspection du bootstrap, navigation et contrôles, `living/sound.ts`, `nature/sky.ts`, `nature/climate.mjs`, modules EarthLife (habitat, vent, faune, événements, budgets/profils, matériaux et eau), manifestes et harnais de la 09.1. L’ancien audio créait un bruit unique de 17 s pour vent/eau, des tons pour les oiseaux et parcourait tous les segments d’eau à chaque image active.

- `src/audio/context.mjs` / `types.ts` : contexte v1, identifiant WGS84, saison calendaire, heure, index métrique et mélange des habitats existants.
- `profiles.mjs` : règles de contribution par axes, matériaux, événements et budgets. Aucun moteur propre à une ville ou une forêt.
- `director.mjs` : PRNG injecté, mémoire LRU de 128 cellules, visites, variantes sans répétition immédiate, probabilités par temps écoulé et délais globaux intercellules.
- `resources.ts` : chargement/décodage progressifs, cache borné, annulation et erreurs documentées.
- `renderer.ts` : graphe Web Audio partagé entre temps réel et OfflineAudioContext ; fenêtres longues recouvrantes, fondus natifs, filtres, HRTF et nettoyage.
- `living/sound.ts` : adaptateur du pilote, activation explicite, visibilité et cadence. `main.ts` transmet les données et l’orientation réelle de la caméra.

| Champ | Définition et absence |
| --- | --- |
| `geo`, `key` | WGS84 degrés, longitude normalisée ; clé versionnée à 1/512° ; inconnue si coordonnées absentes. Ce n’est pas un identifiant local d’Angles. |
| `worldTimeMs` | UTC simulé du ciel existant, `null` si absent. Distinct de `AudioContext.currentTime` et du temps monotone de visite. |
| `localHour`, `timeBasis` | Fuseau explicite fourni par le lieu, sinon estimation solaire moyenne étiquetée ; aucune dépendance générale à Paris. |
| `season` | Quatre saisons calendaires, inversées au sud ; inconnue sans latitude/date. N’infère pas de saison humide/sèche tropicale. |
| `altitudeM` | Élévation absolue du MNT existant, `null` hors couverture ; jamais la hauteur locale de rendu. |
| `habitat`, `influences` | Classification EarthLife et contributions artistiques normalisées ; classe inconnue conservée. Pas d’activité humaine/traffic supposée à partir d’une simple route. |
| `solarAltitude`, `weather` | Soleil et météo simulée du même ciel ; vent local partagé d’EarthLife. Inconnus si absents ; aucune seconde simulation. |
| `position`, `sources` | Positions métriques dans le même repère que l’écoute ; oiseaux visibles existants avec positions/vitesses, ou événements interprétés explicitement. |
| `provenance`, `fixture` | Origine des données, région admissible pour ressources d’oiseaux, distinction fixture/monde réel. |

L’adaptateur convertit le repère tangent actuel vers WGS84. Un futur rebasage doit transformer ensemble écoute, émetteurs et index, puis fournir la même position WGS84 ; le noyau n’a pas à changer. La résolution de clé varie physiquement avec la latitude et la clé ne remplace pas une tuile de streaming. Les contributions de forêt/village/eau/route/coast/port/urban/exposition se mélangent ; changer de clé ne redémarre ni les couches ni la programmation globale.

Les cinq échantillons d’habitat réutilisent le fournisseur EarthLife. Index des segments d’eau et des voies créé une seule fois après navigation, requête locale bornée à 120/40 m à 2–4 Hz ; pas de `slice/reduce` exhaustif par image. L’altitude n’est échantillonnée qu’à cette cadence. Le ciel partage sa météo vivante, son timestamp numérique et son soleil ; aucune conversion ISO ajoutée par image. La faune publie neuf objets réutilisés au maximum, sans reconstruire ses trajectoires.

## Mixage et spatialisation

Vent, feuillage, eau et pluie sont diffus. Les sons humains/routiers utilisent le même système, avec ressources provisoires **fixtureOnly**. Il n’y a pas de circulation supposée sur les chemins du pilote. Le bois venteux réel constitue la référence forestière, l’enregistrement d’eau enrichit les berges connues. Le courant, débit et identité d’une rivière ne sont pas inventés par l’enregistrement.

Fenêtres de 24–36 s prélevées à offsets variables dans des buffers de 37–58 s, recouvrement d’environ 4 s, enveloppes sinus et gains de profil lissés sur l’horloge audio. Les couches changent sur plusieurs secondes ; le budget peut abandonner progressivement une couche moins dominante. Le timer de maintenance à 10 Hz assure les relais sans dépendre du FPS Three.js. Une longue interruption ne tente pas de rejouer le passé.

HRTF/PannerNode uniquement sur événements ponctuels ; distance inverse, position/vitesse, orientation et hauteur réelles de caméra, +Y vertical. Une source localisée est abandonnée si le budget HRTF est plein, sans la transformer en événement centré trop fort. Filtrage/volume lissés. API d’occlusion simplifiée alimentable par un hôte, vérifiée avec une obstruction fournie ; **aucun lancer de rayons acoustique ni occlusion géométrique générale dans le pilote**.

Pas espacés de 0,8 m réellement parcouru, intervalle minimal 210 ms ; aucune rafale de rattrapage ni pas nouveau à l’arrêt. Trois dérivés par famille, variation légère de vitesse/niveau, matériaux herbe/terre/gravier/route extensibles. Le début d’un matériau peut rester silencieux pendant son premier chargement ; une ressource manquante est omise, sans tonalité de remplacement agressive.

## Mémoire et événements

PRNG déterministe injectable pour tests, graine de session variable en jeu. Identité locale par contexte/habitat et graine géographique ; mémoire de visites et variantes bornée à 128 cellules. Délais globaux conservés lors d’un franchissement de cellule. Pas de promesse de persistance entre rechargements de page.

Appels d’oiseau admis selon habitat, soleil, saison, vent, pluie et région ; espèce non identifiée, jamais présentée comme observation locale. Des émetteurs visibles sont utilisés lorsqu’ils existent ; sinon position artistique de proximité. Froissement ponctuel, rafale rare et événement humain de fixture configurables. Les probabilités utilisent `1-exp(-taux*dt)` ; une opportunité rare peut ne jamais se produire pendant une session. Cooldowns de 22 à 900 s selon type ; reprise d’onglet/réinitialisation horloge sans rafale.

## Ressources et droits

19 fichiers Ogg Vorbis, environ 1,92 Mo compressés au total, 24 kHz. [Manifestes et empreintes](../public/audio/legacy/manifest.json), [preuves de source](../public/audio/legacy/sources.json), [attributions visibles](../public/audio/legacy/credits.html). Les originaux ne sont pas embarqués ; leur URL et SHA-256 permettent la reproduction via `python scripts/prepare-audio.py --download` (FFmpeg requis). Le script vérifie les empreintes avant transformation. Sans `--download`, il réutilise les originaux dans `work/mission-10/`.

| Original | Auteur / droit | Adaptation |
| --- | --- | --- |
| Bourne woods windy 2020-05-05 0757 | Robert EA Harvey, CC BY-SA 4.0, Commons/Geograph | Extrait 2–54 s, filtres, normalisation -23 LUFS / crête cible -6 dBTP, fondus, stéréo 24 kHz Vorbis ; adaptation sous même licence. |
| Soft stream flowing water, Freesound 433589 / Commons | jackthemurray, CC0 | Extrait 3–61 s, filtrage, normalisation, fondus, mono 24 kHz. |
| bird chirp 2 | Gravity Sound, CC BY 4.0, Commons | Trois dérivés de la même prise, vitesse ±4 %, filtres, normalisation -30 LUFS / crête cible -9 dBTP, fondus. |
| Footstep on Gravel | Gravity Sound, CC BY 4.0, Commons | Trois dérivés par durée, filtres, limitation de crête, fondus, mono 24 kHz. |
| Air/pluie/pas doux/froissements/rafale/textures humaines-routières | Créations procédurales originales, CC0 1.0 | Génération **hors ligne**, filtres, normalisation et encodage ; marquées provisoires. Aucune IA ni synthèse lourde pendant le jeu. |

Ce sont quatre prises d’origine et non dix-neuf captations indépendantes. Le bois provient d’Angleterre ; aucune prise d’Angles ni correspondance d’espèce n’est revendiquée. Les oiseaux inclus dans le bois ne peuvent pas être séparés proprement selon saison ; réduction nocturne et appels ponctuels contextuels n’équivalent pas à une bibliothèque écologique exhaustive. Les vents désertiques, vagues marines et activités portuaires authentiques restent à acquérir. Les sons d’eau servent ici aussi de **substitut technique** au littoral des fixtures, sans prétendre reproduire une mer.

## Budgets et cycle de vie

| Profil | Voix actives max | HRTF max | Lits diffus dominants | Contexte |
| --- | ---: | ---: | ---: | ---: |
| Éco | 8 | 1 | 2 | 2 Hz |
| Équilibré / Personnalisé | 12 | 2 | 3 | 2 Hz |
| Qualité | 12 | 3 | 3 | 4 Hz |

Les voix en fondu comptent dans le plafond global ; réduction de profil avec retrait en 150 ms, sans nouvelles admissions au-delà du nouveau plafond pendant ce retrait. Priorité des pas > appels > ambiance faible. Deux chargements/décodages simultanés au plus, 6 Mio compressés max par fichier, 16 entrées et **24 Mio décodés max** ; buffers des voix actives épinglés. AudioContext demandé à 24 kHz ; comptage sur la taille réellement décodée si un navigateur utilise un autre taux. Cache refusé plutôt que dépassement ; pas de retry infini après erreur. Le budget ne mesure pas les allocations internes du navigateur/HRTF.

Volume, sourdine, bouton clavier accessible existants conservés ; aucun contexte avant action explicite. Une file sérialise les bascules et changements de visibilité. Pause d’onglet sans catch-up ; reprise respectant le choix de l’utilisateur. Destruction : arrêt/déconnexion des sources, gains/filtres/panners/compresseur, timer annulé, fetch annulés, cache/mémoire vidés, contexte fermé. Le HMR et la sortie de page utilisent ce nettoyage.

## Validations, mesures et extraits

Les résultats chiffrés et leur protocole sont conservés dans [mission-10-evidence](mission-10-evidence/README.md). [Lecteur d’extraits](mission-10-evidence/ecoute.html).

Les premiers essais ont révélé des conflits d’automation lors des bascules et de l’avancement de l’horloge pendant la construction d’un graphe. Corrections : gain de retrait séparé, programmation après construction et marge de démarrage de 50 ms, réactivation des lits sans conserver une ancienne échéance. Le premier benchmark en échec reste conservé. La première calibration était trop faible ; une calibration ultérieure eau/ville dépassait un garde-fou de différence d’échantillons sans clipping. Ces données restent visibles, sans les mélanger à la comparaison finale.

## Comparaison de performance finale

Trois passages alternés, 72 fenêtres, **864 rendus synchronisés**, 36 échantillons par combinaison version/station/profil/son. Référence 09.1 `447f891` et Mission 10 ; mêmes caméras et requêtes de déplacement de 8 cm, Équilibré/Éco, ordres son coupé/activé alternés. Il s’agit de stations instrumentées, pas d’une promenade continue. Chromium/ANGLE/SwiftShader logiciel ; pas de GPU matériel ni Android physique. Le rendu inclut `finish/readPixels`, le CPU de préparation les exclut.

| Station / profil | 09.1 rendu médian off / on (ms) | 10 rendu médian off / on (ms) | 10 max off / on (ms) | 09.1 CPU on p50 / p95 / max | 10 CPU on p50 / p95 / max |
| --- | ---: | ---: | ---: | ---: | ---: |
| forest / balanced | 172.3 / 169.4 | 174.1 / 182.0 | 215.5 / 209.8 | 0.2 / 0.8 / 2.9 | 0.3 / 1.5 / 1.6 |
| forest / eco | 159.8 / 167.8 | 166.5 / 159.0 | 210.7 / 197.0 | 0.1 / 0.3 / 0.5 | 0.2 / 1.0 / 1.6 |
| river / balanced | 103.7 / 100.8 | 101.4 / 102.5 | 136.7 / 122.9 | 0.2 / 0.4 / 0.5 | 0.2 / 1.1 / 2.4 |
| river / eco | 94.2 / 92.5 | 92.6 / 94.9 | 150.0 / 110.5 | 0.2 / 0.4 / 0.5 | 0.2 / 1.1 / 1.5 |
| village / balanced | 215.3 / 206.6 | 205.3 / 214.4 | 241.0 / 256.0 | 0.2 / 0.6 / 1.0 | 0.3 / 1.4 / 2.1 |
| village / eco | 197.7 / 193.3 | 187.7 / 193.5 | 208.5 / 235.5 | 0.2 / 0.5 / 0.7 | 0.2 / 1.5 / 1.7 |

Résultats mixtes : son activé, forêt Équilibré **169,4 → 182,0 ms (+7,4 %)**, village Équilibré **206,6 → 214,4 ms (+3,8 %)** ; forêt Éco **167,8 → 159,0 ms (−5,2 %)**. Les pics ne s’améliorent pas tous : rivière Éco son coupé **124 → 150 ms**, village Éco son activé **231,4 → 235,5 ms**. Aucune non-régression générale de performance, aucun gain causal du rendu ou objectif FPS matériel n’est établi. Les durées JavaScript supplémentaires restent petites en valeur absolue, avec un maximum de préparation activée de 2,4 ms dans ce protocole, mais des p95 plus hauts que 09.1. Le coût audio natif et l’ordonnancement du logiciel GPU ne sont pas séparés causalement.

Mesures supplémentaires conservées pour chaque fenêtre : CPU cumulé des processus Chromium (inclut les utilitaires audio et SwiftShader), durée des tâches CDP, heap, somme RSS, chargements/décodages et cache. Le champ de télémétrie `audioCpu` contient la dernière durée interne connue ; lorsqu’on coupe le son, cette valeur peut être ancienne. Il n’est pas utilisé pour les conclusions : la colonne CPU ci-dessus vient du span courant réellement chronométré. La somme RSS recompte des pages partagées ; les buffers natifs ne sont pas inclus dans le heap.

Cache décodé maximal observé : **20,082,380 octets** (19.15 Mio), limite 24 Mio. Les fenêtres finales retiennent au plus 3 voix ; les stress tests séparés montent jusqu’au plafond de 12 et vérifient sa réduction Éco. Les buffers restent en cache lors de la sourdine pour éviter des rechargements ; ce n’est pas une fuite.

base091 activé : heap observé min/max des résumés 81.4 / 109.6 Mo ; somme RSS max 910.8 Mio ; CPU processus médian par fenêtre entre 398.9 et 401.8 % d’un cœur. Ce sont des observations de session, pas la mémoire propre du moteur audio.

mission10 activé : heap observé min/max des résumés 81.5 / 115.8 Mo ; somme RSS max 934.5 Mio ; CPU processus médian par fenêtre entre 397.4 et 401.3 % d’un cœur. Ce sont des observations de session, pas la mémoire propre du moteur audio.

### Chargement à froid

Deux stations sur pages fraîches, puis huit sondes de contexte par station à 250 ms. Ancien AudioContext **44,1 kHz**, buffer partagé **2 998 800 octets** ; nouveau contexte **24 kHz**, cache fin de protocole **20 016 332 octets**. Activation murale observée **103 → 57 ms** (dispatch clic/setup/reprise inclus) ; ce test unique ne prouve pas un gain reproductible. Nouveau premier calcul de contexte/index : **4,5 ms max** ; référence 0,2 ms max dans ces sondes. 8 fichiers Ogg demandés (14 entrées incluant modules et manifeste) au serveur local, durées et tailles conservées dans `loading.json`. Pas de mesure réseau mobile/CDN.

### Rendus d’écoute

Cinq rendus OfflineAudioContext stéréo de 42 s à 24 kHz, dont une répétition du même scénario ; quatre extraits Ogg fournis. Mesures sur les PCM avant encodage :

| Scénario | Crête absolue | RMS | Différence adjacente max |
| --- | ---: | ---: | ---: |
| forest-village | 0.0465 | 0.00596 | 0.0447 |
| city-port | 0.2149 | 0.02040 | 0.1348 |
| mountain-valley | 0.0431 | 0.00511 | 0.0227 |
| forest-rotation | 0.0497 | 0.00572 | 0.0473 |

Zéro échantillon clippé dans ces rendus ; ce n’est pas une preuve de douceur perceptive ou d’absence de clic sur tout appareil/scénario. Reproduction : différence maximale **1 unité PCM 16 bits**, 8 échantillons différents sur 2 016 000, tolérance 2 ; pas une promesse de PCM identiques entre moteurs natifs/navigateurs. Les profils/transitions ont une variation mesurée ; aucun avis d’écoute humaine n’est fabriqué. `spatial.json` confirme inversion stéréo, atténuation 12/100 m et filtrage d’une obstruction fournie.

### Promenades appariées et non-régressions

Six promenades réelles du même préfixe OSM de 12 m, route disponible de 450 m, Éco ; ordre off/on puis on/off puis off/on. Chaque paire conserve sa vue (troisième/première/aérienne). Pas de téléportation pendant une mesure.

| Passage / vue | Son | Distance (m) | Durée (s) | Span préparation+soum. médian / max (ms) | Intervalle médian / max (ms) |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 / third | coupé | 12.084 | 9.09 | 4.3 / 459.9 | 162.7 / 746.7 |
| 1 / third | activé | 12.001 | 8.90 | 3.7 / 24.6 | 164.3 / 353.2 |
| 2 / first | activé | 12.047 | 9.07 | 2.4 / 171.8 | 158.6 / 474.1 |
| 2 / first | coupé | 12.037 | 9.23 | 2.2 / 21.6 | 159.8 / 460.0 |
| 3 / aerial | coupé | 12.197 | 9.21 | 2.5 / 21.0 | 174.1 / 543.1 |
| 3 / aerial | activé | 12.050 | 8.58 | 2.9 / 6.2 | 174.0 / 233.2 |

Le pic de 459,9 ms au premier passage coupé est conservé ; sa cause n’est pas isolée. Ces paires courtes vérifient marche/caméras/audio et exposent les pics ; elles ne démontrent pas une accélération causale. La promenade complète de 450 m de 09.1 n’a pas été répétée ici.

- **140 tests JavaScript réussis** (132 de référence + huit tests acoustiques couvrant les saisons/hémisphères/fuseaux, inconnus, frontières/index, mélanges, variantes/mémoire, rareté et droits/empreintes).
- **TypeScript/Vite réussis**, avertissement de bundle >500 Ko conservé. Deux tests Python MNT réussis avec environnement local rasterio/pyproj/numpy.
- **Navigateur audio** : aucun contexte avant geste, activation clavier, bascules réellement concurrentes attendues jusqu’à complétion, volume, pause/reprise, profils, mouvement/rotation/perspectives, HTTP/décodage invalides, douze créations/destructions avec contextes fermés et caches/voix vidés.
- **Non-régressions 09.1** : profils, préférences, silhouettes solo/couple/groupe, plafond terrain/bâtiments, shaders GL réels et modes eau/vent coupés, matrices LOD inchangées, trois cycles de profils sans croissance mémoire graphique, douze cycles atmosphère, 19 cas de données dégradées, caméra et cinq obstacles injectés pendant la marche. Toutes les assertions finales passent. Le test historique de sourdine attend maintenant la fin de chaque transition UI asynchrone ; l’assertion finale de suspension est conservée. Le test Mission 10 distinct vérifie aussi six bascules concurrentes. Le premier journal d’adaptation est conservé.

Les preuves de ces vérifications sont dans `runtime.json`, `spatial.json`, `walk.json` et `regression/`. Les anciennes preuves ne sont pas écrasées. Le build de production propre `d822e27` et son identité ont été vérifiés sur 1280×800, 390×844, 320×568 et 844×390 avant ouverture de la PR ; nom/commit visibles, en-tête sans interception ni chevauchement avec les contrôles, données géographiques chargées, aucune requête de métadonnées distante. [Captures et validation](mission-10-evidence/production/validation.json). Les commits de preuves suivants ne changent pas le moteur.

## Limites et suites

P0 technique livré et référence sonore fonctionnelle ; validation artistique humaine et validation de performance matérielle restent ouvertes. P1 partiel : HRTF, mémoire, variantes, événements rares, contextes mondiaux synthétiques et extraits sont présents ; la bibliothèque de qualité mondiale reste incomplète. P2 reporté : propagation physique, occlusion de scène, IA temps réel, nouvelle interface.

Priorités : écouter longtemps à plusieurs volumes sur casque et haut-parleurs, remplacer les ressources provisoires par prises locales autorisées, augmenter les prises indépendantes, différencier ruisseau/rivière/mer, séparer les oiseaux du vent pour saisons fiables, tester Safari/Firefox et appareils Android réels. Le streaming géographique national et le rebasage complet du renderer restent des travaux du monde existant, pas des fonctionnalités prétendument achevées par l’audio.
