# Mesures de la révision graphique

Chromium Linux local ; mobile émulé, pas de téléphone physique testé.

| Mesure | Valeur |
|---|---:|
| Fichiers nécessaires à l'ouverture du premier tableau | 3.77 Mio |
| Build autonome complet | 8.06 Mio |
| Cache décodé estimé, 3 tableaux et atlas | 58.75 Mio |
| Heap JS en fin de promenade | 27.79 Mio |
| Prêt, ouverture locale fraîche du contrôle graphique | 264.7 ms |
| Promenade réelle aller-retour | 572.24 m |
| Fin détectée par interrogation toutes les 10 s | 422.5 s |
| Intervalles de frames, médiane / p95 | 16.70 / 16.70 ms |
| Quatre transitions préchargées | 0.90 / 1.00 / 0.80 / 1.20 ms |
| Atlas : cellules non vides | 80 / 80 |
| Appui tactile émulé de 2 s | 2.32 m |

Le poids est une somme de fichiers sans compression HTTP, pas un test de réseau mobile. Le cache estimé additionne les trois images RGBA, les cartes 16 bits de profondeur, les masques d'eau d'un octet et l'atlas RGBA ; il exclut les buffers du navigateur et les pointes de décodage. Ne pas additionner naïvement cette valeur à la heap JS. Les textures photographiques de travail ne sont pas copiées dans le build.

L'aller-retour n'utilise aucune téléportation ni accélération du temps. Les captures de la promenade précèdent les dernières petites finitions de lierre/pierres d'angle et de couleur de l'atlas ; les vues détaillées, le voyageur et le contrôle tactile montrent l'état final. La géométrie de navigation reste identique. Les frames sont échantillonnées dans des fenêtres de 600 images toutes les 10 secondes, sur l'environnement partagé.

Les chiffres de chargement et de fluidité ne prédisent pas un GPU de téléphone ou un débit distant. Voir [metrics.json](metrics.json), [desktop.json](desktop.json), [art-validation.json](art-validation.json), [touch.json](touch.json) et [walk-progress.json](walk-progress.json).
