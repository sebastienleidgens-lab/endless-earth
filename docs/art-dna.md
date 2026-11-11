# ADN artistique d’Endless Earth — version 1

L’ADN commun est défini dans `src/art/dna.mjs`, exporté dans
`public/art/dna.json` et consommé par les sols, l’architecture, la végétation et
l’eau. Il règle leur langage visuel, leurs distances de détail et leurs limites.
Le ciel, la lumière, le calendrier, le vent et les budgets de vie restent ceux
de Mission 11.

La direction recherchée est un paysage calme, tactile et modérément stylisé.
Les masses et silhouettes doivent rester lisibles avant le grain. La pierre
photographique est adoucie pour appartenir au même monde que les maisons et
arbres procéduraux. Le détail reste attaché aux mètres du monde ; il s’efface
progressivement avec la distance, sans déplacer les sommets.

| Domaine | Règle commune |
| --- | --- |
| Palette | Minéraux chauds et gris sourds, verts tempérés, bois et peintures sobres ; variations régionales explicites. |
| Contraste | Joints et reliefs fins modérés ; silhouettes plus importantes que chaque feuille ou fissure. |
| Matières | Échelles métriques et atlas partagés, avec textures filtrées ; pas de pavage ou strate géologique inventés. |
| Distance | Grain du sol atténué entre 18 et 100 m ; façade entre 24 et 110 m ; teinte moyenne stable au loin. |
| Lumière | Réponse diffuse commune, ciel et nuit Mission 11 ; aucune fenêtre rendue lumineuse sans donnée. |
| Végétation | Familles génériques et habitats documentés ; couronnes proches ajourées, masses simples au loin/Éco. |
| Animation | Même vent continu, racines fixes, phases indépendantes et périodes calmes ; aucun second climat. |
| Eau | Ciel analytique et éclats contenus ; aucune bathymétrie ou direction de débit mesurée revendiquée. |
| Densité | Budget de 2 500 arbres et 3 200 candidats de détails par cellule ; caches invisibles 4 nature / 12 architecture. |
| Rendu | Aucune passe de post-traitement supplémentaire ; ne charger que les ressources du contexte actif. |

Trois niveaux restent séparés. Le **moteur universel** conserve mètres,
navigation, streaming, lumière, déterminisme et budgets. La **configuration
régionale** choisit matériaux par défaut, palettes, pentes de toiture,
familles végétales, densité interprétée et nuances minérales. Les **données
locales** déterminent emprises, routes, accès, eau, relief, occupation et
monuments. Un changement de style ne modifie jamais un MNT local.

Les tags observés restent prioritaires. Une toiture documentée en ardoise
reste en ardoise dans un style dont le défaut est la tuile. Une classe inconnue
reste inconnue ; une hypothèse artistique n’acquiert pas le statut de relevé.
Le même principe vaut pour le son : un contact non documenté n’est pas
transformé en pas sur herbe parce qu’un sol paraît vert.

`src/art/regions.mjs` fournit trois configurations complètes : référence
Poitou, validation Atlantique pierre/ardoise, et validation méditerranéenne
calcaire/couvert ouvert. Cette bibliothèque alternative est importée par la
page de validation, pas par le jeu principal. Les deux jeux de données locaux
de `src/fixtures/landscapes.mjs` sont **synthétiques**. Le sélecteur de style
les réutilise sans modifier le code principal ou leurs hauteurs.

Ouvrir sur Vite : `/endless-earth/fixtures/regions.html`. Comparer un même
terrain sous plusieurs styles, puis les deux terrains. Examiner matériaux,
toitures, silhouettes, repère humain de 1,65 m et route de 5,5 m. Les tests
vérifient le déterminisme, les exclusions écologiques, l’indépendance du relief
et la libération des ressources entre changements.

Ces fixtures vérifient une séparation technique et révèlent des dépendances
locales. Elles ne prouvent ni la génération de toute la France, ni la validité
artistique de chaque région. L’ingestion du vrai jeu reste adaptée au pilote
d’Angles ; les deux fixtures ne sont pas deux nouveaux villages reproduits.

La revue finale porte sur la marche : répétition, scintillement, transitions,
accord des matières, densité et retenue du mouvement. Les captures et vidéos
réelles sont dans [la galerie finale](mission-12-evidence/final/index.html).
La décision artistique appartient au propriétaire.
