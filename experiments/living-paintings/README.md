# Endless Earth · Living Paintings · LP-01

Prototype indépendant de la version 3D. Trois peintures précalculées à partir de géométrie simplifiée, parcourues dans une perspective fixe. Pas de backend, pas d'audio, pas de requête de données géographiques en ligne.

**Tester sans installation : [ouvrir la prévisualisation privée](https://endless-earth-living-paintings-lp01.spicy-zebra-0777.chatgpt.site)**, puis cliquer « Commencer la promenade ». Utiliser le même compte ChatGPT si une connexion est demandée. Cet hébergement est séparé du site public et du dépôt GitHub de production.

Depuis la racine du dépôt, **sur `prototype/living-paintings`** :

```sh
cd experiments/living-paintings
npm ci
npm run dev
```

Ouvrir **http://localhost:5181/**. Le serveur utilise un port distinct, refuse de changer de port et ne touche pas au site public. Les peintures sont déjà incluses ; Chromium n'est pas requis pour jouer ni compiler.

Cliquer **Commencer la promenade** lance un aller-retour à 1,38 m/s. Flèches, WASD ou ZQSD pour prendre la main ; cliquer/toucher une route pour s'y rendre. Les anneaux aux extrémités changent de tableau, dans les deux sens. Les branches des rues sont explorables dans le périmètre de l'étude. Deux passages secondaires, « Le quai » et « La rive sud », permettent aussi de changer de tableau sur des rues OSM existantes, en gardant exactement la même position. Le bouton Pause arrête la promenade et les animations ; les animations peuvent aussi être désactivées séparément. Sur mobile, le cadrage suit horizontalement le personnage, sans rotation de perspective.

Build autonome et test sans serveur de développement :

```sh
npm run build
npm run preview
```

Le résultat est exclusivement `experiments/living-paintings/dist/`, avec des URLs relatives. Aucun fichier du build 3D ni workflow GitHub Pages n'est utilisé ou modifié. Pour le tester sur un téléphone du même réseau, utiliser l'IP LAN de l'ordinateur et le port 5181. Aucun test sur téléphone physique n'est revendiqué.

Vérifications et reconstruction artistique :

```sh
npm test
npm run test:browser           # serveur sur 5181 déjà lancé ; environ 8 minutes
npm run art:prepare            # nécessite /usr/bin/chromium et les données du dépôt
```

`art:prepare` lit les trois fichiers géographiques de production sans les modifier, puis reconstruit de façon déterministe `public/world.json`, les WebP, les masques PNG et les points de feuillage. Un lieu nouveau nécessite une sélection de parcours, un contrôle des données, puis une revue artistique. Le générateur ne garantit pas une belle peinture pour une région arbitraire.

Voir [le rapport LP-01](../../docs/living-paintings-lp01.md) et [les licences](LICENSES.md). La conformité technique ne vaut pas validation artistique par le propriétaire.
