# Matières architecturales — Mission 12B

L'atlas est une création procédurale originale pour Endless Earth. Il ne contient
aucune photographie, texture tierce, police ou ressource payante. Le code source
est `src/architecture/texture.mjs` ; le catalogue voisin contient l'auteur, les
dimensions, les transformations, le budget nul et les empreintes SHA-256.

Ces matières et couleurs proposent une interprétation régionale. Elles ne
constituent pas une observation des maisons d'Angles-sur-l'Anglin. Les 921
bâtiments du jeu de données courant n'ont pas de matériau de façade ou de toit
renseigné. Les tags OSM présents dans un autre extrait sont prioritaires sur les
choix régionaux, y compris leurs familles et teintes de matériau.

Six familles partagent une image RGBA8 de 864 × 576 pixels : pierre calcaire,
enduit, tuile, ardoise, bois peint et matière secondaire générique. Les canaux
portent la tonalité, le relief d'éclairage et la chaleur ; aucune géométrie n'est
déplacée. Des marges périodiques limitent les raccords du filtrage. En cas de
ressource invalide, une variante originale compacte de 60 × 40 pixels demeure.

Reconstruction : `node scripts/prepare-architecture-atlas.mjs`. Les droits et
attributions des données géographiques dérivées restent documentés dans
`public/data/LICENSE.md`, indépendamment de cette création graphique.
