# Mission 07.3 — Des routes magnifiques, sans sacrifier la fluidité

## Audit préalable

PR #13 vérifiée ouverte, en brouillon et non fusionnée : poursuite sur `mission/07-2-routes-matieres`, sans réécriture d'historique ni nouvelle PR. Référence technique 07.1 : `cb73252`. Référence artistique 07.2 figée : `72006e0`. Les deux références sont servies dans des worktrees séparés ; `main` reste inchangé.

Le texte reçu s'interrompt au milieu de la section 11. Les objectifs explicitement reçus sont suivis ; rapport, identité de build et validation fonctionnelle conservent les conventions de Mission 07.2.

Le coût ne peut pas être déduit du nombre de triangles : un seul shader traite le terrain naturel et la chaussée. Le champ signé est lu sur tous les fragments du sol ; la normale de détail est recalculée sur toutes les routes, même lorsque la hauteur filtrée ne contribue plus. L'atlas utilise seulement R (ton) et G (hauteur), mais transfère RGBA. La seconde lecture d'atlas influence seulement la couleur. Le bruit naturel est encore lu sur les routes alors que sa contribution finale à leur couleur peut être remplacée. Ces constats motivent des expériences, pas encore des conclusions de performance.

## Protocole avant modification

Les images et temps 07.2 historiques ne sont pas réutilisés comme mesures fraîches. Reproduire les caméras, profils, midi du 21 juin, résolution et lectures synchronisées ; alterner les versions et répéter les passages. Conserver séparément temps CPU de soumission, durée synchronisée, mémoire et préparation. SwiftShader est le seul renderer actuellement observé ; aucune performance GPU matériel n'est revendiquée.

Ablations testées sur le module servi du worktree **07.2 figé**, sans toucher au produit : suppression de normale, de seconde lecture, de microdétail complet, du champ signé, remplacement de textureGrad par des dérivées implicites, anisotropie 1, champ seulement sur chaussée et suppression du mélange côté sol. Ces variantes volontairement incomplètes servent uniquement au diagnostic. Les effets de compilateur et interactions empêchent de sommer leurs gains comme des coûts indépendants.

Les mesures terrain seul masquent les autres objets après les mises à jour LOD. Deux mesures supplémentaires filtrent temporairement les indices d'origine pour ne dessiner que les pixels routiers ou naturels, sans déplacer les positions. Ces masques de test n'entrent pas dans le produit.

Résultats et décisions : à compléter après mesures et revue visuelle.
