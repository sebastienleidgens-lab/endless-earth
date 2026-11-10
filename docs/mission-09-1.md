# Mission 09.1 — La vie sans ralentissement

Suite de Mission 09 sur la PR #16 ouverte et en brouillon, vérifiée avant modification. Référence immuable : `c3f4b7c`. Aucune fusion ni mise en production.

## Diagnostic initial

Le harnais `profile-earthlife-091.mjs` reproduit les six caméras du rapport 09, puis isole neuf postes par ablations de diagnostic : feuillages d'arbres, herbes/fougères, branches, eau, nuages, ombres, oiseaux, événements et mise à jour CPU. Ces ablations ne sont pas des profils livrés. La scène automnale supplémentaire contient effectivement six oiseaux et un événement, vérifiés par assertion. Deux références complètes encadrent les variantes ; les coûts ne sont pas additionnés. Les mesures sont conservées dans `mission-09-1-captures/isolation.json`.

La dispersion reste importante : certaines suppressions sont plus lentes que le système complet. Aucun gain causal n'est attribué à ces cas. Le CPU d'atmosphère est généralement quantifié à 0,1 ms, face à des centaines de millisecondes de rendu logiciel. Les expériences ciblent donc d'abord les calculs répétés dans les shaders, sans réduire la géographie ou les fonctionnalités.

## Optimisations en cours de validation

- Termes temporels du vent et de l'eau calculés une fois et partagés en uniforme ; front spatial, rafales et turbulence conservés. La puissance douze du front est écrite comme produit de carrés.
- Repères de vent et ancrages d'instances calculés au chargement, depuis les mêmes matrices. Les géométries de couronnes, troncs et LOD partagent leurs attributs d'origine ; seuls six nombres statiques par instance sont ajoutés. Aucune boucle d'animation CPU par arbre.
- Spécialisation structurelle des shaders : ombres présentes/absentes, vent arrêté/simple/complet, eau arrêtée/simple/complète. Les valeurs continues restent des uniformes. Au plus six combinaisons par type de matériau, sans nouveau matériau par arbre.
- États de faune, événements, conditions et diagnostic réutilisés ; paramètres des calendriers mis en cache par époque ; effets désactivés court-circuités ; habitat recalculé quand la position ou la source change.
- Préférences graphiques conservées dans un stockage local facultatif. Les presets restent indépendants des interrupteurs personnalisés ; les choix personnalisés sont retrouvés en y revenant.

Les neuf MNT, les 878 polygones, les 2 500 recettes d'arbres, leurs matrices et les blocs précalculés restent inchangés. Les nouvelles métadonnées ne modifient aucune position, couleur, couronne ou densité. Les données hydrologiques ne sont pas enrichies ; le courant demeure une interprétation artistique non vérifiée.

## Validation, mesures et limites

Les résultats finaux, comparaisons, marche de 450 m et vérifications de production seront ajoutés après les passages. Aucun chiffre SwiftShader ne constitue une preuve de performance sur GPU matériel ou sur un véritable téléphone Android. Les fonctions de Mission 09 sont conservées ; les limites artistiques et géographiques documentées restent applicables.
