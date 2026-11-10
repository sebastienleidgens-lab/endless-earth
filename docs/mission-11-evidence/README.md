# Mission 11 — preuves du Jalon A

Ouvrir [la galerie](index.html) depuis le serveur Vite du dépôt (`/endless-earth/docs/mission-11-evidence/index.html`). Captures également consultables individuellement sur GitHub. Vidéo réelle, muette : [atmosphere-transition.mp4](atmosphere-transition.mp4).

- `before-*.jpg`, `after-*.jpg` : mêmes caméras et dates, référence 21 juin 2026 ; profils Équilibré. Les modes Nuageux/Orageux n’existaient pas avant (Couvert/Pluie utilisés explicitement).
- `before.json`, `after.json` : protocole, renderer, états effectifs, échantillons complets, trois profils, cycles de ressources.
- `metrics-summary.json` : médianes de rendu avec synchronisation/lecture RGBA. SwiftShader uniquement ; surcoût logiciel observé, aucune validation de FPS physiques.
- `controls.json`, `controls.txt` : tests de l’interface dans la boucle réelle, audio existant et navigation automatique.
- `mobile-controls.jpg`, `mobile-landscape.jpg` : interface ordinaire sans `perf=1`, avec référence temporelle fixe, capturée dans Chromium. Les mesures de dimensions sont aussi testées en mode diagnostic.
- `motion.json` : chronologie réelle des images et commandes, sans accélération ; la vidéo conserve ces durées.
- `build.txt`, `tests.txt`, `browser-smoke.txt` : validations techniques exécutées.
- `THREE-LICENSE.txt` : licence du modèle Sky réutilisé.

Base avant : `0f699fa50cb9d9b8158fc88776d27ec75594f575`, main contenant la Mission 10.1. Le badge après indique cette base et « modifié », car la capture précède le commit de livraison. Aucun enregistrement audio enrichi ; Jalon B non commencé. Aucune validation artistique humaine revendiquée.

Le Chrome partagé du bureau a WebGL désactivé (`chrome://gpu` observé). Il affiche la galerie/vidéo ; le moteur est testé par les scripts dans un Chromium distinct avec SwiftShader. Pour une promenade interactive, utiliser un navigateur avec WebGL et la méthode du rapport.

## Suite autorisée — Jalon B

Les preuves ci-dessus restent celles du Jalon A. Les comparaisons sonores et la capture temps réel de trois minutes du Jalon B se trouvent dans [la galerie d’écoute](audio/index.html) et son [protocole](audio/README.md). Évaluation acoustique du propriétaire attendue avant le Jalon C.
