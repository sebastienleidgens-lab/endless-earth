# Nature — Mission 12C

Création procédurale originale Endless Earth, sans photographie, modèle externe,
ressource payante ou licence tierce supplémentaire. Le catalogue voisin décrit
l'auteur, les empreintes, les transformations et les familles végétales. Le PNG
montre la texture produite par `src/nature/leaf-texture.mjs` ; le même générateur
construit une seule texture de zone dans le jeu, sans requête réseau additionnelle.

La bibliothèque distingue des formes génériques : feuillu étalé, jeune arbre,
arbre de milieu humide, conifère, touffe herbacée, fougère, petit buisson et
herbe de milieu humide. Les individus, détails et comportements saisonniers sont
interprétés. Une classe OSM/IGN de forêt n'est pas un inventaire botanique ; un
feuillage en aiguilles ne constitue pas une identification d'espèce. Le maintien
du feuillage de la famille conifère est une interprétation tempérée par défaut.

Les 2 500 ancrages, tailles et classifications précédents sont conservés. Les
détails restent limités aux habitats documentés, hors eau, bâtiments et marges
des routes ; les secteurs inconnus ou trop pentus ne reçoivent pas de forêt.
Le calendrier et le vent proviennent du moteur Mission 11. Aucune neige, faune,
source sonore ou observation climatique nouvelle n'est ajoutée.

Reconstruction : `npm run geo:nature-art`. Les attributions IGN/ASP/OSM restent
dans `public/data/LICENSE.md`, distinctes de cet art original.
