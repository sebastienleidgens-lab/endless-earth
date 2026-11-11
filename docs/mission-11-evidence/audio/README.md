# Mission 11 — écoute du Jalon B

Ouvrir [la galerie audio](index.html) sur le serveur Vite : `/endless-earth/docs/mission-11-evidence/audio/index.html`. Extraits sans normalisation ; conserver le même volume d’écoute. Aucune validation artistique humaine revendiquée.

- `after-*-excerpt.ogg` : trois accès courts aux véritables sorties du moteur, dont un événement routier naturellement programmé à 382.5 s d’une visite de onze minutes.
- `realtime-forest.webm` : trois minutes du véritable AudioContext post-limiteur, via MediaRecorder ; le jeu et le vent continuent, seule la soumission WebGL est suspendue dans le harnais SwiftShader. Remux du conteneur sans réencodage pour indexer sa durée.
- `before-*.ogg`, `after-*.ogg` : quatorze scénarios réels de contexte géographique du pilote, rejoués avec AcousticRenderer/SoundDirector dans OfflineAudioContext, cache préparé et graines identiques. Volume maître .7, pas de normalisation, Opus 96 kbit/s. Les silences sont conservés.
- `walk-route.json` : AutoWalk validé par le moteur, plus 25.8 m d’approche libre validée par relief/collisions ; pas une revendication de chemin public réel. Approche, arrêt puis éloignement en 386 s de replay audio.
- `before.json`, `after.json`, `levels.json`, `levels.csv` : états, événements, gains, distances et niveaux numériques. Les moyennes incluent les silences ; les compteurs signifient des voix démarrées, pas une écoute humaine certifiée.
- `river-gain.csv`, `river-gain-and-walk.svg` : loi de gain nouvelle selon proximité physique, puis niveaux du mix complet sur le même aller-retour. Les oiseaux/feuillages/rares passages participent au graphe du mix complet.
- `runtime.json`, `spatial.json`, `performance.json` : tests du moteur Web Audio, trois profils, CPU de contexte son coupé/activé, saturation, HRTF, gains, arrêts/reprises, destruction et ressource indisponible remplacée par une autre captation réelle.
- `preservation.json` : les 82 ressources / 33 sources 10.1 sont inchangées ; sept sources CC0 et onze extraits sont ajoutés. Les crédits existants sont conservés et étendus.

Base avant : commit A `dbafd13`, qui conserve l’audio 10.1. Aucun enregistrement ajouté n’est prétendu capté à Angles. Les deux polygones de rivière et deux seuils proviennent du GeoJSON OSM existant, avec la prudence requise pour ses contours cadastraux de 2010. Largeur, débit et trafic mesurés restent inconnus.

Arrêt au Jalon B, en attente de l’évaluation acoustique du propriétaire. Aucun Jalon C/D, merge, déploiement ou changement de Living Paintings.
