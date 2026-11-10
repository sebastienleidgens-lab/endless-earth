# Mission 09 — Le monde vivant

Travail en cours sur la base fusionnée f11f165 (PR #15). Aucune fusion ni mise en production.

## Audit initial

Mission 08.6 possède déjà : feuillage proche en shader (deux sinusoïdes, phase par instance), lointain statique ; détails nature précalculés avec natureBend ; 2 500 arbres instanciés avec LOD/culling ; eau intégrée à la surface avec rides de couleur, sans courant vérifié ; 60 lobes de nuages mis à jour à 10 Hz, translation x avec rebouclage ; quatre oiseaux suivant un cycle identique de perchoir/vol ; soleil astronomique, météo interpolée sur 45 s, date et saison ; Soundscape synthétique unique avec vent, eau, pas et appels rares. Pas d'ombres de nuages. Deux réglages graphiques high/low. Les décorations progressives 08.6 ont des caches et une file bornés : ils sont conservés.

Les captures avant modification utilisent le worktree détaché f11f165, port 5176. Les shaders et effets ne modifient aucune donnée géographique.
