# Mission 21 — Les saisons de la lumière

Livraison autonome pour revue artistique. Base **Mission 20 fusionnée**, `1251c734626171659383bf70495a44855c4dbd02`, PR #29 vérifiée fusionnée avant création de `mission/21-saisons-de-la-lumiere`. Aucun déploiement, aucune fusion automatique, aucune modification de Living Paintings / LP-01. Budget supplémentaire : **0 €**. Aucune API météo externe, dépendance ou asset payant.

[Galerie et films du moteur](mission-21-evidence/index.html) · [contrôles navigateur](mission-21-evidence/browser.json) · [build compilé](mission-21-evidence/compiled.json) · [performances](mission-21-evidence/performance.json) · [promenade native](mission-21-evidence/walk.json).

## 1. Audit du flash blanc

L’examen couvre `main.ts`, ciel Preetham, couches de nuages, rendu transparent, ombres du paysage/personnage, cibles hors écran, clear, profondeur et adaptation de résolution. Les rapports M11–M20 et leur ADN artistique et budgets ont fourni les contrats de conservation. La piste des effacements blancs de cartes d’ombre n’est pas présentée comme une cause démontrée et ces passes ne sont pas modifiées pour masquer le défaut.

Le banc initial en `onAfterRender` était insuffisant : il observait l’image **avant** la modification de résolution placée ensuite dans `frame()`. Le contrôle a été déplacé après le retour complet de la callback RAF. Sur la base M20, il relève **6 frames entièrement effacées parmi 96**, en 38,5 s. Les six images suspectes, leurs résolutions, positions, lumière, météo, cible courante, shaders, compteurs d’ombres et ressources sont conservés dans [la trace initiale](mission-21-evidence/baseline-resize-flash.json).

## 2. Cause identifiée et limite du diagnostic

`renderer.render(scene,camera)` précédait `setPixelRatio` / `setSize` de l’adaptation interne. Réassigner la taille du canevas invalide son drawing buffer : une image déjà dessinée pouvait être effacée avant présentation. Le défaut reproduit est une **frame de présentation non initialisée lors du redimensionnement**. Dans SwiftShader, les PNG capturés sont **noirs**, pas blancs. Le flash blanc décrit sur la machine du propriétaire n’a pas été reproduit comme tel. Il reste possible qu’un autre mécanisme existe ; aucune résolution définitive de tout flash blanc n’est revendiquée.

Le clear blanc des ombres reste cantonné à ses cibles. Le personnage conserve sa restauration `try/finally`. Les tests ne produisent ni écran noir de masquage, ni baisse générale artificielle de luminosité, ni suppression des ombres ou nuages.

## 3. Correction et observation du flash

Le redimensionnement adaptatif précède désormais le rendu final. Le commit de présentation `0a3963e` a été observé sur une copie figée : **906,6 s réelles**, **905,9 s natives**, **2866 frames**, **zéro frame effacée ou surexposée suspecte**, zéro erreur JS/WebGL et zéro perte de contexte. Six chapitres couvrent jour/nuit, trois profils, trois vues, caméra fixe et AutoWalk. [Résumé](mission-21-evidence/presentation-fixed-flash.json) · [trace locale compressée](mission-21-evidence/presentation-fixed-flash-trace.json.gz).

Le détecteur lit tout le drawing buffer après chaque callback native. Un candidat est conservé si plus de 70 % des pixels ont un alpha effacé, ou si moyenne de luminance > 0,88 avec > 70 % au-dessus de 0,94, ou si la hausse inter-frame dépasse 0,34 avec > 45 % de pixels très clairs. La luminance est un indicateur Rec.709 sur octets sRGB, pas une photométrie HDR calibrée. Les éclairs portent leurs identifiants, mais **aucun flash global n’est exempté simplement parce que le mode est Orageux**. Diagnostics exclusivement locaux.

## 4. Architecture climatique et unités

`naturalSky` conserve l’unique calendrier M11. `weather-model.mjs` contient des fonctions pures, sans horloge ou requête réseau. `climate` et `acousticClimate` demeurent le même propriétaire mutable. Le monde partage météo, vent, date, soleil, Lune, humidité des sols et couverture neigeuse.

| Variable `climate.metrics` | Unité / domaine | Sens |
| --- | --- | --- |
| `temperatureC` | °C, valeurs régionales simulées | Base mensuelle, variation synoptique déterministe et cycle solaire ; masse d’air froide volontaire en Neigeux. |
| `humidityPct` | 0–100 % | Approximation à partir des nuages, pluie, nuit et vent. |
| `cloudCover`, `cloudDensity` | 0–1 | Couverture et épaisseur artistique. |
| `rainIntensity`, `snowIntensity` | 0–1 | Intensités partagées, pas mm/h mesurés. |
| `windDirectionRad` | 0–2π rad, depuis le nord | Direction du vecteur existant. |
| `meanWindMps`, `gustWindMps` | m/s simulés | Conversion artistique ×15 du vent normalisé ; aucune mesure locale. |
| `fog` | 0–1 | Densité météo ; voiles de berge conditionnels supplémentaires. |
| `visibilityM` | ≥90 m | Indicateur atmosphérique simulé, pas une distance de streaming. |
| `stormRisk`, `electricalActivity` | 0–1 | Activité électrique admissible dans la météo commune. |
| `groundWetness`, `snowCover` | 0–1 | États déjà possédés par sols et neige. |
| `coldDegreeHours` | degrés-heures | Mémoire interprétée du froid. |
| `iceFraction` | 0–0,46 | Potentiel visuel filtré, pas proportion cartographiée de rivière gelée. |
| `sunshine` | 0–1 | Réponse au jour, nuages et pluie. |

## 5. Transitions et évolution naturelle

Les commandes météo utilisent une constante de 5,5 s ; le développement électrique et les phases d’orage prennent davantage de temps. La météo naturelle emploie 45 s, avec décisions espacées de 180 à 480 s environ. Beau temps, passages nuageux, averses, périodes sèches, brume froide et neige restent possibles selon des probabilités mensuelles. Une pluie peut se terminer sans orage. Ce modèle est une interprétation tempérée, pas une prévision régionale scientifique.

L’option **Évolution naturelle** est facultative et mémorisée. Choisir manuellement une météo la désactive immédiatement. La sélection d’heure ou de mois ne redémarre pas la phase météorologique. La transition pluie/neige termine la précipitation sortante avant la suivante. En mode Neigeux estival, le message d’exception volontaire reste présent.

## 6. Nuages et pluie forte

Le champ advecté M11 reste commun au ciel et aux ombres. Les bases orageuses sont assombries, les couches conservent leurs variations de densité, bords et lumière résiduelle ; aucun volume de ray marching général n’est ajouté. L’aspect reste stylisé, et la qualification « exceptionnellement menaçant » demande une revue artistique.

Les lignes GL deviennent une géométrie instanciée de traînées, deux profondeurs apparentes et une largeur métrique. Vitesse, longueur, inclinaison et opacité répondent au même vent/pluie. Budgets maximum : **260 / 520 / 900 traînées**, Éco / Équilibré / Qualité. Leur nombre croît avec l’intensité, sans multiplication par dix. Une seconde géométrie bornée produit **24 / 56 / 96 impacts maximum**.

L’inspection a découvert une erreur de winding des triangles de cette nouvelle pluie : des compteurs de draw valides et des tests de compilation ne prouvaient pas la présence des pixels. Les triangles sont corrigés. Le [contrôle de rasterisation](mission-21-evidence/rain-visibility.json) compare uniquement le draw de pluie actif/inactif, scène immobile, et exige des pixels effectivement différents dans les trois profils, jour et nuit. La première promenade de validation commencée avant cette correction est interrompue et **ne sert pas de preuve finale de trente minutes**. Les films et captures pluvieuses sont repris sur la correction.

Les protections proches sous toiture utilisent l’enveloppe OSM existante ; son actualisation ne se répète plus à chaque image à cause des fractions de coordonnées. Les impacts utilisent la vraie hauteur chargée et le toit conservateur. La pente fine des toits, l’interception de chaque feuille, le ruissellement des rebords, les flaques dédiées et les collisions exactes de chaque goutte restent incomplets.

## 7. Rafales et végétation

Les phases approche / intensification / activité / averses / éloignement modulent différemment pluie, vent et électricité. Le champ spatial de M17, ses deux bandes de réponse, la variation temporelle et les racines fixes sont conservés. Aucun déplacement des troncs rigides, nouvel obstacle ou ancrage n’est introduit. Ombres et feuilles gardent leur déformation commune. La Mission 21 n’est pas une nouvelle simulation physique des arbres.

## 8. Éclairs

`createStorm` consomme uniquement le temps écoulé de son propriétaire. Chaque événement possède id, timestamp natif, date commune, durée de 0,78 s, direction, distance de 900 à 6 100 m, intensité bornée et origine météo. Le prochain événement est irrégulier et espacé d’au moins douze secondes ; les espacements ordinaires sont souvent bien supérieurs.

La plupart sont une illumination localisée des nuages. Environ un quart peut afficher une branche géométrique lointaine et simple, testée en profondeur. Les récepteurs du paysage et l’eau reçoivent une faible contribution directionnelle. Aucun rectangle blanc, overlay, light dynamique ou post-traitement plein écran n’est utilisé. Intensité normalisée à la création maximum **0,32**, ou **0,10** avec **Éclairs atténués**, proposé aussi selon la préférence de mouvement réduit. Le réglage s’applique aux événements suivants ; un éclair déjà engagé termine sa brève enveloppe. Ces nombres bornent les uniformes ; ils ne constituent pas une certification de luminance physique ou d’accessibilité médicale.

[Frames d’événement et contrôles rares](mission-21-evidence/rare-events.json). Une géométrie éloignée n’est pas une reconstruction électrodynamique ou une localisation de foudre réelle.

## 9. Tonnerre

Trois prises indépendantes CC0 sont ajoutées : **bastipictures / 243782**, **Nimlos / 522025** et **vilmuhametshin / 577846**. Elles ne sont pas les changements de hauteur d’un seul fichier. Les extraits sont mono 32 kHz FLAC, issus de previews HQ MP3 honnêtement identifiés. Filtres, gain linéaire borné et fondus sont consignés, avec empreintes des pages, sources et sorties. Aucune synthèse de remplacement.

Chaque tonnerre admis se programme dans l’AudioContext à `timestamp éclair + distance / 343`, avec déduction de l’âge courant. Il utilise les panners, obstacles, budgets et limiteur de l’AcousticRenderer. Une ressource trop tardive ou un événement manqué pendant le silence n’est pas rejoué en rafale au retour. Le budget peut refuser une voix, ce qui est consigné ; tous les éclairs ne garantissent donc pas une voix audible dans toute situation de pression.

L’ancienne pluie contenant du tonnerre non synchronisé est exclue de **tous** les lits de pluie. La pluie ordinaire n’introduit plus un grondement électrique indépendant du modèle d’orage.

## 10. Immersion sonore et spatialisation

Une quatrième prise CC0, **xkeril / 669487**, décrit une pluie sur tuiles. Un index borné cherche une toiture proche ; ce lit prend une direction stéréo et un gain dépendant de sa distance et de la pluie commune. Une prairie sans bâtiment n’obtient pas ce lit. Les hauteurs acoustiques inconnues restent inférées, et les limites des footprints ne donnent pas une acoustique exacte des pièces ou portes.

La pluie devient plus présente avec son intensité ; feuillage, vent, rivière, pas mouillés, occlusion et retour du calme gardent leurs propriétaires. Les budgets audio restent **8 / 12 / 12 voix**, **1 / 2 / 3 HRTF**, **2 / 3 / 3 lits**, cache **24 MiB**, deux chargements au plus. Les captations sont extérieures au pilote : aucune prise locale ou occupation réelle n’est revendiquée.

## 11. Films acoustiques natifs

La galerie livre **10 séquences** : pluie ordinaire en progression, pluie forte, approche, éclair/tonnerre, vent forestier, tuiles, rivière pluvieuse, éloignement, nuit calme et nuit pluvieuse. Chaque film capture directement le canevas WebGL et la sortie après limiteur du vrai AudioContext via MediaStreamDestination. Aucun son n’est ajouté après capture.

Les stations sont explicitement posées et la météo est préparée avant les prises. Les événements synthétiques du pré-roll accéléré sont écartés avant l’enregistrement pour éviter une rafale audio artificielle ; les événements capturés ensuite viennent du scheduler natif. Ces inspections **ne sont pas présentées comme une promenade naturelle spontanée**. [Protocole et traces](mission-21-evidence/audio.json) · [contrôle des paquets et niveaux](mission-21-evidence/media.json). Les conteneurs WebM sont indexés par copie des codecs ; les données audio/vidéo et timestamps par flux sont comparés aux captures brutes.

Les niveaux numériques et l’absence d’écrêtage sont contrôlés. Ils ne remplacent pas l’écoute du propriétaire pour le naturel des sons, le confort ou la répétition.

## 12. Nuits et ciel

Le bleu nocturne profond et la lisibilité minimale sont conservés. L’ambiance diffuse reçoit une contribution lunaire modeste selon hauteur, fraction éclairée et occultation. Les étoiles ne traversent pas un couvert épais. Nuits claire, couverte, sans Lune, pleine Lune, pluie, neige, brume et orage utilisent le même modèle astronomique M19 et les mêmes conditions.

Les captures de village montrent les points chauds dans la pénombre. Elles ne prouvent pas à elles seules une qualité artistique exceptionnelle ni une lisibilité parfaite sur tous les écrans.

## 13. Fenêtres, extinction et présence humaine

Les graines source et les ouvertures préparées restent déterministes. La teinte varie légèrement entre fenêtres. Les horaires d’allumage et extinction sont dispersés ; la fin du soir s’éteint sur quelques minutes simulées. Une petite partie des fenêtres possède aussi une pause douce d’environ une minute dans une fenêtre de quinze minutes du temps d’ambiance M11, avec transitions de dix à douze secondes.

Cette pause dépend de graine et temps propriétaire, jamais de la direction du regard. L’inspection choisit une véritable fenêtre chargée dont la pause approche, puis capture **allumée → fondu → éteinte → retour**. Aucune connaissance des occupants n’est revendiquée. [Preuve](mission-21-evidence/rare-events.json).

## 14. Lanternes et projection locale

**Six** petits luminaires procéduraux au plus sont placés sur une sélection déterministe de portes décoratives existantes et espacées. La provenance artistique est explicite : aucun relevé de lampe locale n’est inventé. Les sources étudiées ne justifient pas une lanterne à chaque maison.

L’émission seule des fenêtres coûte le moins. Les rares lanternes ajoutent boîtier, vitrage et petit patch de seuil, avec test de profondeur et projection d’un seul côté de façade. Aucune vraie lumière dynamique n’est ajoutée. Ce patch est une approximation plane ; sa réception sur les seuils inclinés et une vraie diffusion dans le brouillard restent limitées. L’effet de reflet d’une fenêtre sur les pierres n’est pas une réflexion complète de la scène.

## 15. Reflets lunaires et rivière

Le shader d’eau reçoit la direction astronomique, visibilité et illumination de la Lune commune. Le reflet dépend de la vue et des normales d’ondulation, se fragmente avec le porteur de courant et s’atténue avec phase et nuages. Le profil Éco conserve une forme analytique plus simple. Aucun rendu de réflexion, caméra ou texture de scène supplémentaire n’est créé.

La rivière ne devient pas un ruban blanc uniforme. Les reflets des façades, arbres et berges ne sont toujours pas reconstruits ; cette limite M20 demeure. Les champs de turbulence et direction existants ne deviennent pas des débits ou bathymétries mesurés.

## 16. Brouillard nocturne et matinal

Le voilage local de berge peut apparaître pendant une nuit calme, selon humidité, température, heure, vent, occasion déterministe, altitude relative et proximité des contours chargés. L’aube et le réchauffement diminuent sa présence. La teinte suit l’horizon nocturne commun et les deux voiles restent testés en profondeur. Ils ne masquent pas un changement de distance de streaming et ne constituent pas un volume général.

## 17. Glace et fonte

Le modèle reconstruit six jours d’historique de température déterministe lors d’un saut de date. La météo manuelle n’invente pas cet historique : sélectionner Neigeux ne gèle pas immédiatement l’Anglin. Une accumulation de froid significative reste nécessaire. Le potentiel d’ice est plafonné puis filtré sur 90 s pour la formation et 30 s pour le réchauffement.

Le shader limite les plaques aux abords favorables via la distance de berge et réduit leur présence dans le champ turbulent. Grain, transparence, teinte froide et reprise progressive de l’eau donnent un effet visuel. La galerie utilise une **période froide simulée du 6 janvier 2025**, pas une affirmation sur le temps réel à cette date. La comparaison supplémentaire actif/inactif conserve exactement date et caméra et révèle l’effet local. La fonte suit un changement de date chaude annoncé.

**Aucune collision d’eau n’est modifiée et le personnage ne peut pas marcher sur la glace.** Le masque ne prétend pas connaître profondeur ou vitesse réelle du courant. Les plaques restent une approximation visuelle subtile ; cet objectif est partiel.

## 18. Lever, coucher et calendrier

**Lever du soleil** et **Coucher du soleil** sont ajoutés aux cinq choix conservés. Ils utilisent la même recherche astronomique `momentDate`, le jour civil du site et Europe/Paris, changements d’heure légale compris. Janvier et juillet produisent des horaires différents. Changer le mois pendant ces deux choix recalcule l’événement solaire. Les régions polaires gardent le repli explicite, sans inventer un lever ou coucher absent.

Les tests du jeu compilé manipulent les vrais sélecteurs, attendent la stabilisation astronomique et vérifient que le joueur ne bouge pas. Une attente fixe de trois secondes était insuffisante dans un rendu logiciel très chargé ; le test attend l’état final au lieu de confondre une transition encore en cours avec un calcul faux. La courte démonstration temporelle ×72 préexistante reste diagnostique ; aucun nouveau calendrier ou changement de vitesse physique n’est ajouté. Le seuil ancien qui éteint les cartes solaires locales près de l’horizon est conservé : le choix astronomique du lever/coucher ne garantit pas une ombre fine jusqu’au dernier rayon.

## 19. Lumière et saisons

Soleil rasant, ombres, chaleur des façades, teintes de l’horizon, saisons des sols et arbres restent alimentés par la même date. Les modifications évitent un filtre bleu hivernal ou jaune estival plaqué sur l’image. La galerie contient janvier, avril, juillet et octobre, avec les autres variations couvertes par les tests existants du calendrier.

La température est une interprétation mensuelle et synoptique, sans climatologie régionale calibrée. La beauté de chaque heure et saison reste un jugement humain ; aucune réussite de test ne vaut validation artistique.

## 20. Cohérence et conservation

Les packs de décor, positions d’arbres, ouvertures, portes, emprises, terrains, IGN / ASP / OSM et champs de rivière restent identiques. Les seules empreintes de génération renouvelées désignent explicitement des transformations d’apparence. Le script de conservation vérifie les octets de tous les packs avant cette mise à jour. Les sources physiques de collision/navigation et les graphes restent identiques.

Le test navigateur compare **2898 points de collision** et **20 mouvements** avant/après à résultat égal. La météo et les mois ne déplacent pas le joueur. Les épisodes de pluie, faune, trafic rare, pas, neige et saison utilisent l’état partagé. [Preuves](mission-21-evidence/preservation.json).

## 21. Performance et budgets

Aucune passe plein écran, simulation volumétrique générale, lumière par fenêtre, réflexion complète de la Lune, texture rechargée à chaque météo ou pluie CPU massive n’est ajoutée. La pluie réserve ses graines et impacts, la foudre un petit buffer réutilisé ; le coût audio respecte son cache existant. L’adaptation de résolution M20 et ses planchers sont conservés.

| Station | Profil | M20 médiane ms | M21 médiane ms | Écart | M21 P95 / pic ms | Appels M20 / M21 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| rue | eco | 347.9 | 360.4 | +3.6 % | 387.6 / 387.6 | 93 / 93 |
| rue | balanced | 398.8 | 435.1 | +9.1 % | 498.0 / 498.0 | 97 / 97 |
| rue | quality | 443.7 | 448.0 | +1.0 % | 514.4 / 514.4 | 101 / 101 |
| foret | eco | 220.8 | 234.1 | +6.0 % | 260.2 / 260.2 | 41 / 41 |
| foret | balanced | 296.2 | 309.6 | +4.5 % | 333.6 / 333.6 | 46 / 46 |
| foret | quality | 298.9 | 304.3 | +1.8 % | 345.4 / 345.4 | 48 / 48 |
| riviere | eco | 379.0 | 387.8 | +2.3 % | 438.3 / 438.3 | 159 / 159 |
| riviere | balanced | 442.8 | 472.5 | +6.7 % | 500.4 / 500.4 | 165 / 165 |
| riviere | quality | 482.0 | 500.9 | +3.9 % | 553.4 / 553.4 | 165 / 165 |

| Composant inspecté | Actif médiane ms | Désactivé médiane ms | Actif P95 / pic ms |
| --- | ---: | ---: | ---: |
| rain | 459.8 | 459.2 | 497.2 / 497.2 |
| impacts | 464.3 | 492.0 | 552.7 / 552.7 |
| clouds | 448.1 | 464.0 | 522.2 / 522.2 |
| lightning | 465.2 | 465.6 | 593.8 / 593.8 |
| wind | 288.5 | 300.7 | 318.9 / 318.9 |
| windows | 318.3 | 329.7 | 348.0 / 348.0 |
| lanterns | 262.1 | 253.3 | 303.9 / 303.9 |
| moon | 352.5 | 353.0 | 382.9 / 382.9 |
| fog | 418.7 | 415.3 | 464.8 / 464.8 |
| ice | 393.6 | 386.6 | 483.6 / 483.6 |

Coût CPU isolé des métriques climatiques : médiane 0.000255 ms/appel, P95 0.000460 ms/appel, vingt séries de 20 000 appels.

Chromium SwiftShader software at 480×320 DPR1, synchronized gl.finish+readPixels render times; 14 hot samples per condition, alternating before/after or on/off order. Same camera/date/profile in main pairs. Component switches only for cost inspection, never production fallbacks. Campaign run alone without native walk or capture recording. Software scheduling remains noisy; no physical GPU/Android FPS claim. Fog toggle isolates the two local mist meshes; lantern measurement uses a close-up at an actual installed fixture, with active fixture counts recorded. Wind toggle only isolates shader mean, not the complete forest response-bank update. Discharge toggle measures receiver shading, not an entire rare bolt frame.

La bascule de brouillard isole les deux voiles locaux, sans simulation volumétrique générale. Le gros plan de lanternes compte deux appareils visibles et six draws : cette mesure ne représente pas six appareils visibles simultanément. L’inspection de vent par uniforme ne mesure pas seule la banque de réponse et toutes ses ombres. Les calculs de glace, reflets lunaires et illumination électrique sont écartés lorsque leur contribution est nulle ; les comparaisons candidates précédentes sont conservées dans `performance-initial.json.gz`, sans prétendre à un gain uniforme malgré la variabilité logicielle. Les 28 échantillons de transition solaire sont séparés du rendu chaud. Les coûts du tonnerre figurent dans les traces AudioContext des prises, sans nouvelle passe graphique. Les transitions solaires qui reconstruisent une ombre sont distinctes du rendu fixe chaud. Ces limites empêchent de présenter le tableau comme une décomposition matérielle exhaustive.

## 22. Fluidité et stabilité

Le build TypeScript/Vite passe ; l’avertissement préexistant de bundle >500 kB reste visible. La suite complète compte **308 tests Node réussis** sur les sources corrigées ; le nouveau contrôle de rasterisation complète ce qui manquait. Les tests navigateur parcourent 21 combinaisons profil/météo, transitions, priorité manuelle, atténuation, calendrier, collisions et menu mobile. Le build compilé est vérifié sans interception `main.ts` ou helper de source.

Les vues smartphone 390×844 sont une émulation, pas un téléphone physique. Les mesures SwiftShader ne prouvent pas des FPS Android ou un GPU réel. Aucun confort universel n’est certifié.

## 23. Promenade prolongée finale

Source figée **`083d2b92b6d3ee89207a3bc992d69fc044b668fd`**. **1 808,9 s réelles**, **1 807,7 s entre première et dernière frame**, **4986 frames natives** et **1 553,1 m**. 6 frames de course et 4860 de marche. 0 frame suspecte, 0 erreur JavaScript, 0 erreur WebGL et 0 perte de contexte. Écart maximal au support : 0.000000 m ; déplacement maximal entre frames : 0.798 m. 0 frame non praticable. Les empreintes sources/public sont inchangées : 0 modification. Intervalles natifs : médiane 306.5 ms, P95 783.5 ms, pic 2067.3 ms. Habitats traversés : {'scrub': 673, 'built': 3076, 'wood': 1100, 'unknown': 69, 'open': 68} ; 0 frames à moins de 40 m d’une berge, distance minimale 55.5 m.

La session utilise la boucle native, un départ de production, des touches réelles de marche/course, AutoWalk, rotation de caméra et trois vues. Les choix de profils, mois, jour et météos sont déclarés ; aucun événement rare n’est présenté comme spontané alors qu’il serait provoqué. Les quinze premières minutes restent en météo claire. Les arrivées et reprises depuis la même position sont consignées ; aucune téléportation réparatrice, accélération, altération de collision ou substitution sonore.

Les sondes, l’enregistrement et les prises concurrentes éventuelles ajoutent du travail. Les intervalles de cette marche ne constituent pas un benchmark matériel. Les géométries, textures, buffers, heap après GC et étapes de streaming sont relevés ; ils ne couvrent pas toute la mémoire du pilote. La fermeture du vrai AudioContext et ses compteurs sont vérifiés. [Résumé](mission-21-evidence/walk.json) · [trace complète compressée](mission-21-evidence/walk-trace.json.gz).

## 24. Galerie et comparaisons avant/après

**39 scènes** : dix météos/phases, treize heures et nuits, quatre saisons, six scènes de rivière et six de bâtiments. Six comparaisons M20/M21 utilisent la même date, caméra et profil. La capture initiale du ciel obstruée par un relief n’a pas été retenue : le poste de berge montre réellement l’horizon et le paysage. Les images sont issues du moteur, sans illustration générée, retouche ou remplacement d’assets pour la preuve.

La galerie propose filtre, comparaisons et lecteurs de films natifs. Sur Vite : `/endless-earth/docs/mission-21-evidence/index.html`. Les cadres sont des stations de test contrôlées et non des points de vue topographiques relevés.

## 25. Licences et coût

Les quatre nouveaux enregistrements sont **CC0-1.0**, avec auteur, page, lien de licence, empreinte de page, empreinte du preview fournisseur, transformations et empreinte du FLAC. [Sources ajoutées](mission-21-evidence/audio-licenses.json) · [bibliothèque complète et droits](../public/audio/sources.json) · [manifestes](../public/audio/manifest.json) · [crédits](../public/audio/credits.html).

Les captations précédentes sont conservées et leurs checksums testés. Les lanternes et géométries météo sont des créations procédurales originales. Aucun asset ou service payant, aucune clé API et aucune télémétrie externe. Budget supplémentaire : **0 €**. Les inspirations d’ambiance n’apportent aucun asset, musique ou texture de Baldur’s Gate, Diablo ou The Last of Us.

## 26. Limites restantes et recommandations

Le flash blanc précis du propriétaire reste à corroborer sur sa configuration avec la sonde locale. Le défaut démontré de frame effacée est corrigé. Le ciel reste analytique, la glace un masque local, les projections lumineuses approximatives, et l’acoustique limitée par des hauteurs inférées et des prises extérieures au lieu. L’eau n’a pas de réflexion complète de scène. Les détails de pluie sur chaque feuille, ruissellement, égouttement et flaques spécifiques ne sont pas achevés.

La validation artistique et l’écoute finale restent au propriétaire. Une campagne sur GPU physique et Android est recommandée pour les frametimes, la lisibilité nocturne et le confort des éclairs. Aucun succès technique n’est utilisé pour qualifier automatiquement l’expérience d’exceptionnelle.

## 27. Reproduction et tableau final

```sh
npm ci --cache work/npm-cache
npm test
npm run build
npm run dev -- --port 5343
node scripts/browser-mission-21.mjs
node scripts/verify-mission-21-rain.mjs
node scripts/capture-mission-21.mjs
node scripts/record-mission-21.mjs
node scripts/inspect-mission-21-events.mjs
node scripts/benchmark-mission-21.mjs
node scripts/soak-mission-21.mjs
python scripts/audit-mission-21-media.py
python scripts/report-mission-21.py
python scripts/write-mission-21-report.py
```

La base M20 détachée doit être servie sur 5341 pour les comparaisons ; le build compilé sur 5344 pour `compiled-mission-21.mjs`. Le test de présentation isolé utilise le worktree `0a3963e` sur 5342. Exécuter les benchmarks graphiques séparément des captures. Conserver les sources/public inchangés pendant la marche native de 1 808 s. Les essais raccourcis s’écrivent dans `work/` et ne prouvent pas trente minutes.

| Critère demandé | État | Résultat et limite |
| --- | --- | --- |
| 1. Flash blanc / présentation | **Partiellement atteint** | Frame effacée par redimensionnement corrigée et contrôlée ; flash blanc précis non reproduit. |
| 2. Météo cohérente | **Atteint** | État central partagé, unités et températures simulées. |
| 3. Transitions | **Atteint** | Constantes 5,5 / 45 s, priorité manuelle. |
| 4. Ciel orageux menaçant | **Partiellement atteint** | Masses et bases assombries ; couches analytiques stylisées. |
| 5. Pluie orageuse plus intense | **Atteint** | Traînées GPU, profondeur, vitesse, inclinaison, rasterisation vérifiée. |
| 6. Vent et rafales | **Atteint** | Champ hiérarchique existant et phases distinctes. |
| 7. Réaction des arbres | **Atteint** | Même banque de vent et mêmes ancrages ; non-régressions. |
| 8. Éclairs crédibles | **Partiellement atteint** | Diffusion localisée et rares branches simples, limites géométriques. |
| 9. Tonnerre spatialisé et varié | **Atteint** | Trois prises CC0 indépendantes, distance/343. |
| 10. Immersion acoustique | **Partiellement atteint** | Dix films natifs ; qualité perceptive à écouter. |
| 11. Retour au calme | **Atteint** | Fondus météo et audio, fin naturelle des voix. |
| 12. Nuits améliorées | **Partiellement atteint** | Galerie et modulation lunaire ; jugement artistique ouvert. |
| 13. Lune et ciel cohérents | **Atteint** | Modèle M19 conservé, étoiles occultées. |
| 14. Reflets lunaires | **Atteint** | Direction, phase, vue, vague et couverture communes. |
| 15. Fenêtres et lanternes | **Partiellement atteint** | Six lanternes interprétées, émission et patches locaux simples. |
| 16. Extinctions occasionnelles | **Atteint** | Événement à temps propriétaire, comparaison réelle. |
| 17. Brouillard nocturne | **Atteint** | Humidité, calme, heure, topographie et berge. |
| 18. Glace rare et partielle | **Partiellement atteint** | Historique de froid, masque de berge ; proxy visuel sans bathymétrie. |
| 19. Fonte progressive | **Atteint** | Convergence après réchauffement, collisions inchangées. |
| 20. Lever sélectionnable | **Atteint** | Instant astronomique selon date et site. |
| 21. Coucher sélectionnable | **Atteint** | Même fonction astronomique. |
| 22. Soleil saisonnier | **Atteint** | Calendrier M11, fuseau Europe/Paris et DST. |
| 23. Lune saisonnière | **Atteint** | Même date et modèle topocentrique M19. |
| 24. Lumière magnifique | **Partiellement atteint** | Captures contrôlées, validation du propriétaire. |
| 25. Variations saisonnières crédibles | **Partiellement atteint** | Interprétation régionale, aucune mesure météo revendiquée. |
| 26. Cohérence de tous les détails | **Partiellement atteint** | État commun ; impacts fins du feuillage, égouttement et flaques dédiées incomplets. |
| 27. Systèmes existants préservés | **Atteint** | Packs et physique inchangés, collisions et contrôles compilés. |
| 28. Performances satisfaisantes | **Partiellement atteint** | Coûts et régressions publiés ; aucun matériel physique certifié. |
| 29. Absence de rupture majeure | **Partiellement atteint** | Scénarios et longue session contrôlés ; limites explicites. |
| 30. Expérience plus belle et immersive | **Partiellement atteint** | Livraison pour revue artistique et acoustique finale. |
