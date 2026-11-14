from pathlib import Path
import json,gzip,html,subprocess,statistics
ROOT=Path(__file__).resolve().parents[1]; D=ROOT/'docs/mission-20-evidence'
def read(name):
 p=D/name
 return json.loads(p.read_text()) if p.exists() else None
def num(x): return f'{x:.1f}' if isinstance(x,(int,float)) else 'non mesuré'
p=read('performance.json'); s=read('soak.json'); a=read('audio-native.json'); t=read('traffic-native.json'); inspection=read('inspection.json'); preservation=read('preservation.json')
if not all([p,s,a,t,inspection,preservation]): raise SystemExit('Complete native evidence is required before writing the final report')
trace=json.loads(gzip.decompress((D/'soak-trace.json.gz').read_bytes())); frames=trace['frames']; rows=trace['rows']
peak=lambda fn:max((fn(f) or 0 for f in frames),default=0)
metrics={
 'forestSelectionMs':peak(lambda f:f['forest']['cpuMs']),
 'forestWindMs':peak(lambda f:f['forest']['windCacheCpuMs']),
 'walkerShadowMs':peak(lambda f:f['actorShadow']['lastCpuMs']),
 'installationMs':peak(lambda f:f['stream']['installCpuMs']),
 'preparationSliceMs':peak(lambda f:f['stream'].get('maxPrepareSliceMs',0)),
 'trafficMs':peak(lambda f:f['sensory']['traffic']['cpuMs']),
 'trafficAuditMs':peak(lambda f:f['sensory']['traffic']['maxAuditSliceMs']),
 'sensoryMs':peak(lambda f:f['sensory']['world']['cpuMs']),
 'rainShelterMs':peak(lambda f:f['sensory']['rainShelter']['maxCpuMs']),
 'audioMs':max(r.get('audio',{}).get('cpuMs',0) for r in rows),
 'voices':max(r.get('audio',{}).get('voices',0) for r in rows),
 'cacheBytes':max(r.get('audio',{}).get('cacheBytes',0) for r in rows),
 'scaleMin':min(f['sensory']['adaptive'].get('scale',1) for f in frames),
 'scaleMax':max(f['sensory']['adaptive'].get('scale',1) for f in frames),
 'insectFrames':sum(f['sensory']['world']['insects']>0 for f in frames),
 'vehicleFrames':sum(f['sensory']['traffic']['active']>0 for f in frames),
 'maxInstallsPerFrame':peak(lambda f:f['stream']['installsThisFrame']),
 'glContextLost':sum('context-lost' in r.get('events',[]) for r in rows),
 'geometries':[min(f['gpu']['geometries'] for f in frames),max(f['gpu']['geometries'] for f in frames)],
 'textures':[min(f['gpu']['textures'] for f in frames),max(f['gpu']['textures'] for f in frames)]}
(D/'soak-analysis.json').write_text(json.dumps(metrics,indent=2)+'\n')
bench='| Scène | Profil | M19 médiane ms | M20 médiane ms | Écart | M20 P95 / pic ms | M20 échelle 0,72 ms |\n| --- | --- | ---: | ---: | ---: | ---: | ---: |\n'
for r in p['rows']:
 b,c,e=r['before'],r['after'],r['adaptive72']
 bench+=f"| {r['view'][0]} | {r['profile']} | {b['medianMs']:.1f} | {c['medianMs']:.1f} | {(c['medianMs']/b['medianMs']-1)*100:+.1f} % | {c['p95Ms']:.1f} / {c['peakMs']:.1f} | {e['medianMs']:.1f} |\n"
road=t['initial']['route']; accepted=[r for r in t['state']['traffic']['report'] if r['accepted']]
report=f'''# Mission 20 — Le monde sensible et vivant

**Livraison pour revue artistique dans la [PR brouillon #29](https://github.com/sebastienleidgens-lab/endless-earth/pull/29). Plusieurs objectifs restent partiels, notamment la qualité sur matériel physique, certains reflets et la faune.** Base : Mission 19 fusionnée, `8073e46` / PR #28. Code de la promenade finale : `d611636`. Aucune fusion, aucun déploiement, aucune modification de Living Paintings / LP-01. Dépense supplémentaire : **0 €**.

[Galerie comparative et films natifs](mission-20-evidence/index.html) · [mesures](mission-20-evidence/performance.json) · [promenade](mission-20-evidence/soak.json) · [inspection automobile](mission-20-evidence/traffic-native.json).

## 1. Audit initial

Les consignes, l’ADN artistique, les rapports des missions précédentes, les budgets et les propriétaires de lumière, forêt, météo, audio, navigation et décor ont été examinés. La base distante et l’ascendance de M19 ont été vérifiées avant création de `mission/20-monde-sensible-vivant`. La première mesure reproduit les coûts logiciels élevés : ce ne sont pas des mesures Android. Les ombres synchronisées de M19 sont conservées ; réintroduire une cadence lente aurait risqué de rétablir son décalage de pose.

## 2. Optimisations

La préparation des triangles de détail, l’orientation des façades et les identités des vitrages deviennent des générateurs coopératifs. Une cellule n’est ajoutée à la scène qu’après préparation complète ; les replis et l’annulation des demandes restent actifs. Une petite tranche demeure indivisible : le budget demandé n’est pas une garantie de temps mural maximal. Les allocations/transferts GL et compilations initiales ne deviennent pas préemptibles pour autant.

Les batches forestiers dont l’ordre et les membres n’ont pas changé conservent leurs attributs ; les plages d’envoi sont bornées aux instances utilisées. L’échantillonnage du même vent demi-précision évite une fermeture par individu. Le calcul de l’ombre du personnage réutilise ses tableaux et matrices, en conservant vraie pose, squelette partagé, résolution et exclusion de l’auto-réception. L’audio évite de reprogrammer un auditeur immobile et réduit les gardes redondantes.

L’adaptation change uniquement la résolution interne : estimation lissée sur trois secondes, déclenchement conservateur, intervalle minimal de huit secondes, baisse de 0,06 et récupération de 0,03 après 24 secondes favorables. Planchers : 0,60 Éco, 0,66 Équilibré, 0,72 Qualité. Elle conserve profil, FOV, distances, individus et vitesses. Le basculement automatique unique de profil après six secondes est retiré.

## 3. Avant / après

Les rendus fixes sont appariés par caméra, position, date et météo, avec douze échantillons chauds synchronisés et ordre alterné. Les trois cellules Équilibré gagnent dans cette campagne. Des régressions restent présentes, surtout Qualité en vallée. Les P95 de groupes de douze échantillons coïncident ici avec leurs pics ; ce n’est pas une distribution matérielle exhaustive.

{bench}
La dernière colonne modifie explicitement la résolution interne. Elle ne démontre pas que le même rendu serait plus rapide à définition identique. SwiftShader varie aussi entre campagnes : les deux candidats précédents sont conservés dans `performance-initial.json.gz` et `performance-fragment-candidate.json.gz`. Une brume ajoutée à tous les matériaux régressait même hors brume ; elle a été remplacée par deux voiles locaux et aucun changement des shaders forestiers. La campagne finale conserve ce chemin de rendu ; les corrections ultérieures portent sur un identifiant du voile rare, la forme des insectes et des gardes sans effet sur les cellules fixes sans événement.

## 4. Brume géographique

Humidité artistique, heure civile, mois, vent, état de séchage, altitude relative à la berge et distance aux polygones de l’Anglin proviennent du calendrier et des données existants. Une occasion déterministe par jour permet des matins sans brume. La densité converge et se dissipe progressivement. Deux voiles doux, bornés près de la berge et testés en profondeur, remplacent le candidat global coûteux. C’est une approximation locale, pas un volume météorologique ni une prévision.

L’inspection choisit le 1er octobre 2026 à 06 h 30 UTC, une brise simulée faible et un poste bas. La densité obtenue vient du modèle ; elle n’est pas forcée. Les trois profils sont rendus et vérifiés. Le premier matin de la galerie reste sans brume nouvelle : la rareté n’est pas supprimée pour la démonstration.

## 5. Profondeur atmosphérique

La perspective et les distances existantes sont préservées. Les voiles partagent la couleur d’horizon du ciel et s’effacent sur leurs bords ; ils ne servent pas à cacher la limite du pilote. La perspective des objets lointains repose toujours principalement sur le brouillard de M11. Une nouvelle diffusion volumétrique complète n’est pas livrée.

## 6. Lumière rasante

La réponse de l’éclairage direct près de l’horizon et sa chaleur sont ajustées, sans filtre orange appliqué à l’image. Soleil astronomique, ombres, matériaux et transition nocturne conservent leurs propriétaires. Les paires coucher / nuit sont issues du moteur, à cadrage et date communs. L’appréciation de la lumière appartient au propriétaire.

## 7. Rivière et reflets

Le reflet analytique échantillonne maintenant le même champ mobile de nuages que le ciel et les ombres. Ondulations, courant aval OSM, turbulence des seuils documentés et zones calmes sont conservés. Aucune cible de réflexion ni nouveau rendu de scène n’est ajouté. Les reflets des arbres, berges et bâtiments ne sont pas reconstruits : cet objectif reste partiel.

## 8. Berges

**89 touffes interprétées**, limitées à 96, enrichissent certains abords des contours d’eau avec contrôle du support, des obstacles et de l’habitat existant. Ce ne sont pas 89 observations botaniques. Herbes et formes génériques de roseaux partagent saison et vent ; leur couverture et leurs triangles sont sélectionnés à courte distance. Éco les retire. Après un coût sensible en gros plan, le vent simplifié et la réception solaire grossière existants sont retenus pour ces petits détails seuls, sans changer leur géométrie, calendrier ou propriétaire de vent : 126,9 → 120,7 ms sur le contrôle apparié logiciel. Galets, racines et mousse géométrique de berge ne font pas l’objet d’un nouveau système complet.

## 9. Occlusion acoustique

Les empreintes OSM alimentent un index de cellules de 40 m. Chaque contexte traite au plus deux voix spatiales puis la rivière ; une requête est bornée à 64 obstacles. Un filtre et une atténuation progressifs remplacent les changements secs. Les hauteurs inconnues restent des enveloppes inférées ; l’index ne prétend pas connaître portes ouvertes, matériaux acoustiques exacts ou diffraction. Aucun raycast sur chaque source à chaque image.

## 10. Acoustique des environnements

Une réflexion précoce courte et très discrète, sans retour en boucle, varie avec l’enclosure des bâtiments proches et l’absorption forestière. Trois nœuds audio s’ajoutent au bus ; aucun fond sonore permanent n’est créé. Les lieux ouverts, sous-bois et rues gardent les mélanges antérieurs. Une acoustique complète sous ouvrage, des réponses impulsionnelles locales et une simulation de réverbération ne sont pas livrées.

## 11. Voix des feuillages

Les captations et familles antérieures, leurs saisons, silences et variations avec le vent sont préservés. Aucune nouvelle captation CC0 spécialisée de conifères ou de roseaux n’a été acquise ; ces familles ne sont pas prétendues acoustiquement identifiées. Ce volet reste partiel.

## 12. Petite faune

Les silhouettes d’oiseaux reçoivent des battements individuels irréguliers et des phases de plané, sur les trajectoires géographiques antérieures. Un pool d’un insecte propose ailes arrondies, corps et antennes de papillon générique, ou ailes plus fines d’insecte humide. Calendrier, habitat, pluie, vent, rareté et budget global conditionnent l’événement ; il n’est pas créé par la rotation de caméra. L’inspection de papillon est déclarée et utilise un poste admissible. Aucun poste public humide admissible n’a été trouvé dans cet échantillon pour la libellule : sa galerie locale reste non atteinte. Repos des oiseaux, modèles détaillés et comportement zoologique complet restent ouverts.

## 13. Réactions à la pluie

Les matériaux poreux et toitures gardent l’humidité du propriétaire commun après l’averse. Des projections réutilisent au plus 16 segments en Équilibré, 28 en Qualité, aucun en Éco. Un champ local 32 × 32, à un mètre par texel, masque la pluie sous une enveloppe conservative des toits cartographiés. Les hauteurs inférées et la résolution limitent ce masque ; il ne garantit pas chaque avant-toit. Les gouttes d’égout et un système de ruissellement ne sont pas livrés.

## 14. Rosée et séchage

Le matin calme et humide module discrètement teintes des sols et matières, sans gouttes macroscopiques. La pluie conserve humidification rapide et séchage partagé. La rosée est une réponse artistique à la simulation ; aucune mesure météorologique réelle n’est revendiquée.

## 15. Murs et ruines

Des variations minérales et une patine localisée très légère utilisent les coordonnées métriques des matières et l’humidité commune. Les volumes patrimoniaux, ouvertures et photographies sources ne sont pas réinterprétés en nouvelles données. Il n’y a pas de végétation grimpante universelle ; la mousse géométrique et les plantes d’interstices précisément confrontées aux photos restent partielles.

## 16. Micro-mouvements

Herbes, roseaux et feuilles utilisent toujours le vent M11. Les feuilles d’événement ne rebouclent plus en hauteur après huit secondes ; elles atteignent le support disponible. Les phases spatiales restent distinctes. Aucun second moteur climatique ou armature CPU par arbre n’est ajouté.

## 17. Caméra

Le menu propose **Caméra à mouvement réduit**, mémorisée localement, qui retire le retard vertical supplémentaire. Aucun head bob n’est imposé. Les balayages de collision et la rétraction du suivi restent conservés. La mission ne prétend pas avoir entièrement refondu le suivi troisième personne ; le naturel perceptif reste à évaluer.

## 18. Contemplation

L’arrivée à une destination documentée laisse six secondes de pause au lieu de trois, puis réutilise le choix varié de M19. Le contrôle manuel interrompt toujours immédiatement la promenade. Aucun belvédère ou accès public supplémentaire n’est inventé ; aucune rotation spectaculaire n’est imposée.

## 19. Nuit

La Lune astronomique, l’occultation par les nuages, les étoiles et fenêtres existantes sont conservées. Humidité, eau et feux des voitures prolongent la cohérence nocturne, sans nouvel éclairage dynamique coûteux. Aucun nouveau catalogue nocturne ni relighting complet du village n’est livré. Les phares automobiles sont émissifs, sans portée projetée au sol : limite explicite.

## 20. Événements rares

Un événement d’insecte occupe une courte fenêtre admissible d’une époque de 210 s, avec tirage déterministe de session et silences. Les voitures suivent leur propre attente rare mais le même calendrier et la même météo ; leur admission évite les contraintes fortes et les autres événements actifs. Les observations ordinaires et les inspections provoquées restent séparées. La séance ordinaire a rendu {metrics['insectFrames']} images avec insecte et {metrics['vehicleFrames']} avec véhicule ; ces nombres ne garantissent aucune rencontre future.

## 21. Circulation automobile

Sur **138 voies OSM examinées**, un seul trajet dirigé est admis : **rue Blancoise, OSM 647696734, {road['length']:.1f} m**, côté droit français. La largeur de 5,5 m est l’estimation de la politique routière existante, pas une mesure de terrain. Les autres voies sont refusées par accès, largeur, longueur continue, support, pente, virage ou obstacle. Ponts et raccords incompatibles restent exclus ; aucune route ni collision géographique n’est corrigée pour obtenir une démonstration.

L’enveloppe du véhicule est contrôlée le long de toute la voie à intervalles d’au plus un mètre, y compris largeur, avant/arrière, support commun, pente ≤ 14 % et rayon de virage ≥ environ 9 m. Les sens uniques documentés sont respectés ; les directions conditionnelles/réversibles restent exclues. Les restrictions de largeur, hauteur, poids et accès sont conservatrices. Les intersections entre voies ne deviennent pas des raccords de trafic.

Un pool d’une citadine générique, géométries et matières partagées, propose roues animées, suivi altimétrique et deux détails de silhouette. Vitesse modeste, accélération, freinage, pluie et arrêt sous forte neige sont bornés. Une enveloppe légère empêche le personnage d’entrer dans le véhicule ; il n’est ni poussé ni heurté. Le véhicule ralentit et attend lorsqu’un piéton occupe sa trajectoire.

Le planificateur choisit ses occasions sans dépendre de la direction regardée. Il annule l’entrée si les deux extrémités ne sont pas assez loin et hors champ ; il ne crée pas une voiture proche après une rotation. Un véhicule visible n’est pas téléporté : en fin de trajet, il attend si la sortie n’est pas masquée. Quelques passages par heure simulée constituent une interprétation, pas une statistique locale. Aucun nouveau départ en Éco ; une voiture déjà présente termine sans disparition artificielle.

La captation native dure **{t['elapsedSeconds']:.1f} s** : trajet complet, arrêt, attente d’au moins six secondes et reprise. Le véhicule n’est jamais relocalisé pendant le film. L’observateur est volontairement placé sur puis hors de la voie pour inspecter la sécurité : ce n’est pas une rencontre spontanée. Le seul son vient du moteur audio, avec un extrait CC0 existant, position mobile, régime modéré et atténuation. Pas de klaxon systématique, marque commerciale ou simulation complète de pneus. Les silhouettes restent stylisées et les transitions de détail approximatives.

## 22. Licences et provenance

Aucun asset acheté, API payante ou service permanent. IGN / ASP : Licence Ouverte 2.0 ; OSM : ODbL ; Three.js : MIT. Modèles d’insectes, voiture, voiles et détails créés dans le projet. Les captations audio et crédits antérieurs restent inchangés ; la voiture réutilise `traffic-fs-873189-m11-1` (Anya_Media, Freesound 873189, CC0) avec extraits, fondus et variation de lecture. [Crédits des sons](../public/audio/credits.html) et [matières](../public/materials/authentic/credits.html) conservés. Aucune espèce présente, occupation d’une maison ou mesure de trafic n’est affirmée.

## 23. Benchmarks et budgets

[Échantillons complets](mission-20-evidence/performance.json) : médiane, P95, pics, appels, triangles, géométries, textures, heap, installation et pose. Les coûts avec/sans effets sont des ablations déclarées lorsqu’elles sont disponibles ; ils se recouvrent et ne s’additionnent pas. Les mesures GL synchronisées incluent attentes logicielles : ce ne sont pas des temps CPU purs. Aucun GPU physique ni Android n’a été mesuré.

| Traitement pendant la nouvelle séance | Pic mural observé ms |
| --- | ---: |
| Sélection forestière | {metrics['forestSelectionMs']:.1f} |
| Cache de vent | {metrics['forestWindMs']:.1f} |
| Ombre du personnage | {metrics['walkerShadowMs']:.1f} |
| Installation de décor | {metrics['installationMs']:.1f} |
| Tranche de préparation | {metrics['preparationSliceMs']:.1f} |
| Audit automobile, tranche | {metrics['trafficAuditMs']:.1f} |
| Mise à jour automobile | {metrics['trafficMs']:.1f} |
| Ensemble local brume/faune/berges/projections | {metrics['sensoryMs']:.1f} |
| Champ de protection contre la pluie | {metrics['rainShelterMs']:.1f} |
| Mise à jour audio, échantillons de contrôle | {metrics['audioMs']:.1f} |

Les anciens pics de M19 étaient 26,1 / 19,9 / 442,2 / 256,1 / 25,1 ms pour forêt / vent / ombre / installation / audio. Les deux séances prolongées ne sont pas des campagnes appariées : parcours, ressources résidentes, enregistrement et résolution effective varient. Une diminution ne prouve donc pas un gain équivalent sur matériel. Les bornes algorithmiques, les traces et les régressions fixes priment sur une moyenne favorable.

## 24. Promenade continue de trente minutes

**{s['wallSeconds']:.1f} secondes réelles**, **{s['nativeSeconds']:.1f} secondes entre première et dernière image**, **{s['metres']:.1f} m**, **{s['frames']} images natives**. Clavier réel course puis marche, arrêt et reprise AutoWalk, rotation complète, premières/troisièmes personnes et aérien, trois profils, quatre mois, pluie/neige, jour/nuit et streaming. Aucun événement rare forcé, déplacement réparateur, accélération d’horloge ou reconstruction d’images. Les seules reprises depuis la même position sont consignées : {s['stalls']}.

Intervalles logiciels : médiane **{s['frameMs']['median']:.1f} ms**, P95 **{s['frameMs']['p95']:.1f} ms**, pic **{s['frameMs']['peak']:.1f} ms**. L’échelle interne varie de {metrics['scaleMin']:.2f} à {metrics['scaleMax']:.2f} ; la résolution CSS de référence est 480 × 320. Ces valeurs ne valident pas une fluidité Android. Écart maximal au support : **{s['maxGroundErrorM']:.6f} m** ; déplacement maximal entre images : **{s['maxStepM']:.3f} m**. Les erreurs de pieds sont des repères du rig, pas chaque sommet de chaussure.

Voix simultanées observées : **{metrics['voices']}** ; cache audio maximal observé : **{metrics['cacheBytes']/1048576:.2f} Mio**, budget 24 Mio. Géométries : {metrics['geometries'][0]}–{metrics['geometries'][1]} ; textures : {metrics['textures'][0]}–{metrics['textures'][1]}, en changeant lieux et profils. Les snapshots après GC et allocations logiques sont dans les preuves, sans assimilation à toute la VRAM. Le contexte audio est fermé à la fin et laisse zéro nœud. Source et données suivies sont inchangées pendant la séance.

![Chronologie native, résolution et distance](mission-20-evidence/soak-timeline.svg)

## 25. Tests techniques et preuves sonores

299 tests Node, TypeScript/Vite, égalité des graphes et contrôles du navigateur. La première tentative prolongée a détecté `INVALID_OPERATION` : le voile rarement activé utilisait le mot réservé GLSL `patch`. Il a été renommé, le serveur figé redémarré et les trois profils explicitement rendus avant la nouvelle séance. Un autre essai a été interrompu pour reprendre les ailes trop schématiques après inspection. Ces essais ne sont pas comptés comme trente minutes réussies.

Huit films natifs séparés couvrent prairie, forêt, rivière, rue, mur, feuillages, pluie et nuit ; le film automobile couvre approche, passage et éloignement. La voix derrière un bâtiment est une inspection déclarée. Aucun habillage musical ni bande-son externe. Les tests de lecture et de format n’équivalent pas à l’appréciation acoustique du propriétaire.

La correction finale de typage est effacée du JavaScript. Le placement permanent des berges est aussi indépendant de la graine des événements ; avec la graine 20 de la séance, sa géométrie reste identique. Une garde réattribue le quota d’un insecte actif lors des changements de profil ; elle est contrôlée par un test de cycle, et aucun insecte n’était actif pendant la séance ordinaire. La politique de shading des touffes de berge a ensuite été simplifiée et mesurée séparément, sans changement géographique. [Portée de compatibilité](mission-20-evidence/runtime-equivalence.json).

## 26. Non-régressions

Les graphes historiques **919 / 896** et de découverte **1 104 / 1 109** restent identiques octet pour octet. Les **2 898 points de collision et vingt déplacements** comparés donnent les mêmes réponses hors nouvel obstacle automobile. Les données IGN/OSM, surfaces, pont, forêts et 3 889 ancrages, Lune, bibliothèques audio et matières historiques ne changent pas. Seules quatre métadonnées publiques de générateurs sont renouvelées après ces contrôles ; aucun pack géographique ou audio n’est remplacé. [Preuve](mission-20-evidence/preservation.json).

## 27. Limites restantes

La fluidité matérielle, le jugement artistique et l’absence de tout scintillement perceptif ne sont pas certifiés. Transferts GL, shaders à froid et reconstruction de cartes locales peuvent encore provoquer des pointes. La brume reste un voile local, les reflets sont analytiques, les abris de pluie approximatifs et le patrimoine stylisé. Faune détaillée, libellule locale démontrée, perchoirs, enregistrements de végétation spécialisés, égouttement des toits et éclairage projeté des phares restent ouverts. Une seule route dirigée est admise ; les autres sont intentionnellement absentes du trafic. Le coût isolé exact de chaque sous-effet n’est pas déduit des compteurs globaux.

## 28. Reproduction et recommandations

Priorité suivante : une campagne sur GPU physique et Android, aux mêmes stations et commandes, puis examen des derniers pics GL ; ne pas rétablir une ombre désynchronisée pour gagner du temps. La revue artistique peut ensuite arbitrer la densité de brume, la silhouette automobile et la discrétion des insectes. Pour étendre le trafic, documenter d’abord largeur, accès et support ; ne pas assouplir les exclusions pour multiplier les voitures.

    npm ci --cache work/npm-cache
    npm test
    npm run build
    npm run dev -- --port 5340
    # Base M19 8073e46 sur 5319, copie figée de cette mission sur 5341.
    node scripts/prepare-mission-20.mjs
    node scripts/benchmark-mission-20.mjs
    MISSION20_PORT=5341 node scripts/gallery-mission-20.mjs
    MISSION20_PORT=5341 node scripts/inspect-mission-20.mjs
    MISSION20_PORT=5341 node scripts/record-mission-20-traffic.mjs
    MISSION20_PORT=5341 node scripts/audio-mission-20.mjs
    MISSION20_SOAK_PORT=5341 node scripts/soak-mission-20.mjs
    python scripts/report-mission-20.py

La galerie se consulte sur le serveur local à `/endless-earth/docs/mission-20-evidence/index.html`. La publication de cette PR ne déploie pas le jeu. **Aucun test automatisé n’est présenté comme une approbation artistique du propriétaire.**

## État des objectifs d’acceptation

| # | Objectif | État | Portée / réserve |
| --- | --- | --- | --- |
| 1 | Promenade plus fluide et régulière | Partiellement atteint | Gains Équilibré et résolution progressive ; logiciel seulement, pics restants. |
| 2 | Moins de pics de chargement | Partiellement atteint | Préparation répartie ; transferts et compilations non préemptibles. |
| 3 | Ombres plus stables | Partiellement atteint | Synchronisation M19 conservée, allocations réduites ; coût GL et appréciation perceptive ouverts. |
| 4 | Atmosphère plus profonde | Partiellement atteint | Accord du voile et du ciel ; perspective lointaine principalement antérieure. |
| 5 | Brume naturelle de vallée | Atteint | Modèle conditionnel et inspection de trois profils ; voile local approximatif. |
| 6 | Lumière rasante | Atteint | Réponse directe révisée, paires natives ; appréciation artistique ouverte. |
| 7 | Meilleurs reflets | Partiellement atteint | Ciel et nuages communs ; pas de reflet des bâtiments/arbres reconstruits. |
| 8 | Berges plus riches | Partiellement atteint | 89 touffes interprétées ; racines, galets et mousse détaillés incomplets. |
| 9 | Sons derrière les obstacles | Atteint | Index de murs, filtres et transitions ; diffraction et portes non simulées. |
| 10 | Différences acoustiques des lieux | Partiellement atteint | Enclosure/reflet précoce et mélange d’habitats ; sous-ouvrages non complets. |
| 11 | Feuillages acoustiquement variés | Non atteint | Aucune nouvelle différenciation par famille ; bibliothèque et vent M19 conservés. |
| 12 | Petite faune plus naturelle | Partiellement atteint | Ailes/plané et papillon ; libellule locale et perchoirs non démontrés. |
| 13 | Pluie sur les objets | Partiellement atteint | Humidité, projections, enveloppes de toit ; pas de ruissellement complet. |
| 14 | Rosée et humidité | Atteint | État subtil partagé, pas de météo observée revendiquée. |
| 15 | Détails près des murs | Partiellement atteint | Patine de matière ; nouvelles plantes d’interstices non complètes. |
| 16 | Micro-mouvements | Atteint | Vent partagé, feuilles atteignant le support, périodes calmes. |
| 17 | Caméra agréable | Partiellement atteint | Option de confort et collisions conservées ; suivi non entièrement refondu. |
| 18 | Pauses contemplatives | Atteint | Six secondes, interruption manuelle, destinations documentées. |
| 19 | Nuits nuancées | Partiellement atteint | Lune et étoiles préservées ; pas de refonte nocturne complète. |
| 20 | Événements rares cohérents | Atteint | Garde saison/habitat/météo, session déterministe, silences. |
| 21 | Voitures occasionnelles admissibles | Atteint | Un trajet, un modèle, arrêt/reprise/son natif ; style et phares limités. |
| 22 | Monde vivant à l’arrêt | Atteint | Vent, ciel, eau, météo et événements continuent. |
| 23 | Propriétaires partagés | Atteint | Même calendrier, météo, vent et support géographique. |
| 24 | Ressources stables | Partiellement atteint | Budgets/pools et trace bornés ; durée/matériel limités à cette campagne. |
| 25 | Immersion sans régression majeure | Partiellement atteint | Gains et réserves publiés ; jugement artistique et matériel ouverts. |
'''
(ROOT/'docs/mission-20.md').write_text(report)
# A standard standalone scientific figure; no capture is retouched.
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
start=frames[0]['t']; minutes=[(f['t']-start)/60000 for f in frames]; ms=[f['ms'] for f in frames]; distance=[];d=0
for f in frames:d+=f['step'];distance.append(d)
fig,axes=plt.subplots(3,1,figsize=(12,6),sharex=True,constrained_layout=True)
axes[0].plot(minutes,ms,lw=.45,color='#32685a');axes[0].axhline(s['frameMs']['p95'],lw=.7,color='#ac7047',label='P95');axes[0].set_ylabel('Intervalle (ms)');axes[0].legend(loc='upper right')
axes[1].plot(minutes,distance,color='#32685a',lw=1);axes[1].set_ylabel('Distance (m)')
axes[2].plot(minutes,[f['sensory']['adaptive'].get('scale',1) for f in frames],color='#ac7047',lw=1);axes[2].set_ylabel('Échelle interne');axes[2].set_xlabel('Minutes réelles depuis la première image')
for ax in axes:
 ax.grid(alpha=.2)
 for c in s['chapters'][1:]:ax.axvline(c['seconds']/60,color='#81928b',lw=.6,ls=':')
fig.suptitle('Mission 20 — promenade native continue, Chromium / SwiftShader logiciel')
fig.savefig(D/'soak-timeline.svg');plt.close(fig)
print('Wrote final report and native timeline')

def pair(before,after,title,note='',ratio='800/500',category='atmosphere'):
 esc=html.escape
 return f'''<article class="card" data-category="{category}"><h3>{esc(title)}</h3><div class="compare" style="--ratio:{ratio};--split:50%"><img src="{before}" alt="Mission 19 : {esc(title)}" loading="lazy"><img class="after" src="{after}" alt="Mission 20 : {esc(title)}" loading="lazy"><span class="before-label">MISSION 19</span><span class="after-label">MISSION 20</span><i aria-hidden="true"></i></div><label class="slider-label">Comparer les deux versions<input type="range" min="0" max="100" value="50" aria-label="Comparer {esc(title)}" oninput="this.closest('article').querySelector('.compare').style.setProperty('--split',this.value+'%')"></label><p>{esc(note)}</p><div class="links"><a href="{before}">Image M19</a><a href="{after}">Image M20</a></div></article>'''

titles={'matin-vallee':('Un matin dans la vallée','Même caméra et date ; ce matin reste sans voile nouveau.'),'berge':('L’Anglin et ses berges','Reflets analytiques du champ de nuages commun ; pas de réflexion de scène.'),'coucher':('La lumière rasante','La réponse du soleil change, les matières conservent leurs identités.'),'nuit':('Sous la Lune','Position astronomique et météo conservées.'),'pluie':('Pendant l’averse','Humidité, projections et masque conservateur des toitures.'),'apres-pluie':('Après la pluie','Le séchage conserve une mémoire de l’averse.'),'hiver':('Au repos hivernal','Même forêt et calendrier, sans supprimer les individus.')}
gallery=''.join(pair(f'gallery/{key}-before.jpg',f'gallery/{key}-after.jpg',title,note) for key,(title,note) in titles.items())
gallery+=pair('inspection/brume-before.jpg','inspection/brume-balanced.jpg','Un matin favorable à la brume','Inspection déclarée : date, faible vent et poste bas choisis ; densité issue du modèle.')
profile_cards=''.join(pair(f'comparison/{r["view"][0]}-{r["profile"]}-before.jpg',f'comparison/{r["view"][0]}-{r["profile"]}-after.jpg',f'{r["view"][0]} · {r["profile"]}','Station fixe de la matrice, même caméra, date et météo.',ratio='640/420',category='profiles') for r in p['rows'])
video=lambda file,title,note:f'<article class="movie"><h3>{html.escape(title)}</h3><video controls preload="metadata" playsinline src="{file}"></video><p>{html.escape(note)}</p><a href="{file}" download>Télécharger le film natif</a></article>'
movies=video('traffic-native.webm','Une voiture, puis le calme','Inspection déclarée : trajet complet, observateur placé sur puis hors de la voie, son natif du jeu.')
for name,title in [('opening','Marche, course et arrêt'),('winter','Une pause dans la promenade'),('closing','Continuer à découvrir')]:
 movies+=video('soak-'+name+'.webm',title,'Extrait natif de la séance continue. Aucun événement rare forcé, aucune bande-son ajoutée.')
audio_cards=''.join(video('audio/'+r['name']+'.webm',r['name'].capitalize(),'Station sonore distincte. Inspection de source derrière un mur explicitement déclarée.' if r['name']=='mur' else 'Son réel de l’AudioContext du moteur, sans habillage externe.') for r in a['rows'])
metrics_html=f'''<div class="numbers"><div><b>{s['wallSeconds']/60:.1f} min</b><span>séance réelle continue</span></div><div><b>{s['metres']:.0f} m</b><span>distance native cumulée</span></div><div><b>{s['frames']:,}</b><span>images du moteur</span></div><div><b>{metrics['voices']} voix</b><span>maximum audio observé</span></div></div>'''
perf_rows=''.join(f'<tr><td>{r["view"][0]}</td><td>{r["profile"]}</td><td>{r["before"]["medianMs"]:.1f}</td><td>{r["after"]["medianMs"]:.1f}</td><td>{(r["after"]["medianMs"]/r["before"]["medianMs"]-1)*100:+.1f} %</td></tr>' for r in p['rows'])
page=f'''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Endless Earth — Mission 20, revue du moteur</title><style>
:root{{color-scheme:light;--ink:#203d34;--muted:#52645b;--paper:#f3f1e9;--line:#d5dace;--accent:#a36d45}}*{{box-sizing:border-box}}body{{margin:0;background:var(--paper);color:var(--ink);font:16px/1.65 system-ui,sans-serif}}main,header,nav,footer{{max-width:1180px;margin:auto;padding:24px}}header{{padding-top:70px;padding-bottom:28px}}.eyebrow{{font:12px/1.4 system-ui;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}}h1{{font:clamp(38px,6vw,70px)/1.08 Georgia,serif;max-width:850px;margin:16px 0 24px}}h2{{font:34px/1.2 Georgia,serif;margin:10px 0 20px}}h3{{font:21px/1.3 Georgia,serif;margin:0 0 14px}}p{{max-width:850px}}a{{color:#2c6354;text-underline-offset:3px}}nav{{display:flex;gap:24px;flex-wrap:wrap;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding-top:16px;padding-bottom:16px}}section{{padding:34px 0;border-bottom:1px solid var(--line)}}.grid{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px}}.card,.movie{{min-width:0;background:#fffdf8;padding:18px;border:1px solid var(--line);border-radius:8px}}.compare{{position:relative;aspect-ratio:var(--ratio);overflow:hidden;background:#d3d9cf}}.compare img{{position:absolute;width:100%;height:100%;object-fit:contain}}.compare .after{{clip-path:inset(0 0 0 var(--split))}}.compare i{{position:absolute;top:0;bottom:0;left:var(--split);border-left:1px solid #fff}}.before-label,.after-label{{position:absolute;top:10px;font-size:10px;letter-spacing:.09em;padding:4px 8px;background:#19382dd9;color:white;border-radius:3px}}.before-label{{left:10px}}.after-label{{right:10px}}.slider-label{{display:block;font-size:12px;color:var(--muted);margin-top:14px}}input[type=range]{{display:block;width:100%;accent-color:#416d59}}.links{{display:flex;gap:22px;font-size:13px}}.card p,.movie p{{font-size:14px;color:var(--muted)}}video{{width:100%;background:#142c23;aspect-ratio:640/420}}.numbers{{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:30px 0}}.numbers b{{display:block;font:32px Georgia,serif}}.numbers span{{display:block;font-size:12px;color:var(--muted)}}.notice{{border-left:3px solid var(--accent);padding:12px 20px;background:#ebe8dc}}.table-wrap{{overflow:auto}}table{{width:100%;border-collapse:collapse;font-size:14px;white-space:nowrap}}th,td{{text-align:left;padding:10px;border-bottom:1px solid var(--line)}}th{{background:#e6e9df}}details{{padding:16px 0}}summary{{cursor:pointer;font-weight:600}}.timeline{{width:100%;background:white}}.macro{{max-width:650px;width:100%}}footer{{font-size:13px;color:var(--muted);padding-bottom:60px}}@media(max-width:700px){{header{{padding-top:38px}}main,header,nav,footer{{padding-left:16px;padding-right:16px}}.grid{{grid-template-columns:1fr;gap:18px}}.numbers{{grid-template-columns:repeat(2,1fr)}}.card,.movie{{padding:12px}}nav{{gap:14px;font-size:14px}}}}
</style><header><div class="eyebrow">Endless Earth · Angles-sur-l’Anglin · Mission 20</div><h1>Le monde sensible et vivant.</h1><p>Une revue des images, des sons et des compromis de la version candidate. Toutes les captures et vidéos proviennent du véritable moteur.</p><p><a href="https://github.com/sebastienleidgens-lab/endless-earth/pull/29">PR #29 en brouillon</a> · <a href="../mission-20.md">Rapport détaillé et état des objectifs</a></p></header><nav><a href="#comparer">Comparer</a><a href="#ecouter">Voir et écouter</a><a href="#mesurer">Mesures</a><a href="#limites">Limites</a></nav><main>
<section id="comparer"><div class="eyebrow">Même caméra, date et météo</div><h2>Des nuances à regarder.</h2><p>Déplacez le curseur pour comparer. Les fichiers d’origine restent accessibles sous chaque paire. Les lieux sont des stations de revue du moteur, pas de nouveaux belvédères revendiqués.</p><div class="grid">{gallery}</div><details><summary>Les trois profils et les scènes de mesure</summary><div class="grid">{profile_cards}</div></details><details><summary>Inspection du papillon</summary><p>Événement volontairement observé par avance du temps de simulation sur un poste admissible. Ce n’est pas une rencontre spontanée. Les formes sont génériques, sans espèce locale identifiée.</p><img class="macro" loading="lazy" src="inspection/butterfly.jpg" alt="Papillon générique observé dans le véritable moteur"><p>Aucun poste public humide admissible n’a été trouvé pour la libellule dans cet échantillon. Cette preuve n’est pas inventée.</p></details></section>
<section id="ecouter"><div class="eyebrow">Images et son natifs</div><h2>Une promenade qui laisse du calme.</h2><p>Le film automobile est une inspection explicite. Les trois autres extraits viennent de la séance ordinaire continue de trente minutes. Le son est capturé après le limiteur du jeu ; aucun habillage externe n’est ajouté.</p><div class="grid">{movies}</div><details><summary>Huit stations acoustiques</summary><div class="grid">{audio_cards}</div></details></section>
<section id="mesurer"><div class="eyebrow">Preuves et performance</div><h2>Les gains et leurs limites.</h2>{metrics_html}<p class="notice"><strong>Chromium / SwiftShader logiciel.</strong> Les résultats ne sont pas des FPS Android ou GPU physique. La résolution interne s’adapte pendant la promenade ; les valeurs fixes ci-dessous utilisent la même définition.</p><div class="table-wrap"><table><thead><tr><th>Scène</th><th>Profil</th><th>M19 médiane ms</th><th>M20 médiane ms</th><th>Écart</th></tr></thead><tbody>{perf_rows}</tbody></table></div><p>Douze rendus chauds synchronisés par cellule. Des régressions restent visibles ; les candidats écartés et les données brutes ne sont pas masqués.</p><img class="timeline" loading="lazy" src="soak-timeline.svg" alt="Chronologie réelle des temps d’image, de la distance et de la résolution interne"><p><a href="performance.json">Matrice et échantillons</a> · <a href="soak.json">Promenade native</a> · <a href="soak-analysis.json">Coûts et ressources</a> · <a href="preservation.json">Non-régressions</a> · <a href="inspection.json">Conditions des inspections</a> · <a href="traffic-native.json">Trajet automobile</a> · <a href="audio-native.json">Audio natif</a></p></section>
<section id="limites"><div class="eyebrow">À apprécier et à poursuivre</div><h2>Une livraison à examiner.</h2><p>La brume est un voile local, les reflets restent analytiques et les toits sont des enveloppes de protection approximatives. Les modèles d’animaux et de voiture restent stylisés. Une seule direction de la rue Blancoise est admise ; les voies incompatibles ne reçoivent aucune voiture. Les phares sont émissifs et ne projettent pas de lumière au sol.</p><p>Des optimisations et plusieurs détails demandés restent partiels. Le rapport énumère chaque objectif et sa réserve. La fluidité sur téléphone physique et l’appréciation artistique et acoustique du propriétaire restent ouvertes. Un test automatisé n’est pas une approbation artistique.</p><p>Aucune fusion, aucun déploiement et aucune modification de Living Paintings / LP-01. Aucun coût supplémentaire ni nouvelle ressource payante.</p></section></main><footer>Sources géographiques IGN / ASP et contributeurs OpenStreetMap. Interprétations naturalistes et circulation simulée, sans observation d’espèces ou mesure de trafic locale revendiquée. <a href="../../audio/credits.html">Crédits des sons</a> · <a href="../../materials/authentic/credits.html">Crédits des matières</a></footer></html>'''
(D/'index.html').write_text(page)
print('Wrote comparative evidence gallery')
