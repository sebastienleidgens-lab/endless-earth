# Provenance et licences des preuves M26.2

Les PNG et WebM proviennent du rendu du jeu et de son mixage stéréo original, avec les assets et attributions existants. Aucune musique, photo de référence ou nouvelle banque sonore externe n'a été ajoutée. Ces captures ne prétendent pas modifier les licences des composants incorporés. Les empreintes SHA-256 des fichiers livrés et des originaux figurent dans `artifact-manifest.json` ; chaque capture native garde son SHA de programme dans `reference-native.json` ou `candidate-native.json`.

Les attributions et licences détaillées des sources audio sont conservées dans [public/audio/sources.json](licenses/audio-sources.json) et [public/audio/legacy/sources.json](licenses/audio-legacy-sources.json). Les matériaux conservent leurs manifestes dans `public/materials` et leurs licences CC0 lorsqu'ainsi déclarées. Ne pas déduire une licence globale nouvelle pour l'ensemble des films.

Les cartes/GeoJSON distinguent données géographiques source et simulation. Attributions : © contributeurs OpenStreetMap, ODbL 1.0 ; IGN, Licence Ouverte 2.0 pour les données concernées. Les manifestes et [licences départementales](licenses/planet-LICENSE.md) restent la référence. Les objets simulés, largeurs et arbres inférés ne sont pas des relevés de terrain.

`raw/*.webm` est l'enregistrement original de MediaRecorder. Le fichier portant le même nom à la racine est indexé par copie de codecs pour faciliter la lecture et le déplacement dans le film. Les vérifications de paquets vidéo et audio exposent les PTS et empreintes comparés, sans réencoder ou interpoler les images ni ajouter de bande sonore. Une analyse numérique du signal n'est pas une écoute humaine.
