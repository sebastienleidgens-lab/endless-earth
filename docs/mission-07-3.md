# Mission 07.3 — Optimisation des matières routières

## Audit préalable

PR #13 vérifiée ouverte, en brouillon et non fusionnée : poursuite sur `mission/07-2-routes-matieres`, sans réécriture d'historique ni nouvelle PR. Référence technique 07.1 : `cb73252`. Référence artistique 07.2 figée : `72006e0`. Les deux références sont servies dans des worktrees séparés ; `main` reste inchangé.

Le complément reçu dans le fil confirme les comparaisons à trois versions, séquences en mouvement, promenade intégrale, non-régression et mise à jour de la PR #13. L’identité du build suit le titre explicite demandé ci-dessus.

Le coût ne peut pas être déduit du nombre de triangles : un seul shader traite le terrain naturel et la chaussée. Le champ signé est lu sur tous les fragments du sol ; la normale de détail est recalculée sur toutes les routes, même lorsque la hauteur filtrée ne contribue plus. L'atlas utilise seulement R (ton) et G (hauteur), mais transfère RGBA. La seconde lecture d'atlas influence seulement la couleur. Le produit de couleur du terrain est calculé avant d’être substitué par celui des routes ; le compilateur peut déjà éliminer ce calcul, tandis que les deux lectures de bruit restent utiles à la variation de grande échelle. Ces constats motivent des expériences, pas encore des conclusions de performance.

## Protocole avant modification

Les images et temps 07.2 historiques ne sont pas réutilisés comme mesures fraîches. Reproduire les caméras, profils, midi du 21 juin, résolution et lectures synchronisées ; alterner les versions et répéter les passages. Conserver séparément temps CPU de soumission, durée synchronisée, mémoire et préparation. SwiftShader est le seul renderer actuellement observé ; aucune performance GPU matériel n'est revendiquée.

Ablations testées sur le module servi du worktree **07.2 figé**, sans toucher au produit : suppression de normale, de seconde lecture, de microdétail complet, du champ signé, remplacement de textureGrad par des dérivées implicites, anisotropie 1, champ seulement sur chaussée et suppression du mélange côté sol. Ces variantes volontairement incomplètes servent uniquement au diagnostic. Les effets de compilateur et interactions empêchent de sommer leurs gains comme des coûts indépendants.

Les mesures terrain seul masquent les autres objets après les mises à jour LOD. Deux mesures supplémentaires filtrent temporairement les indices d'origine pour ne dessiner que les pixels routiers ou naturels, sans déplacer les positions. Ces masques de test n'entrent pas dans le produit.

Résultats et décisions : à compléter après mesures et revue visuelle.

## Optimisations retenues

- **Atlas RG8 576²** : seuls le ton et la hauteur sont utiles. Les deux octets conservés sont comparés à chacun des texels R/G de l'ancien RGBA8, sans rééchantillonnage, changement de module ou de géométrie des pierres. Les marges périodiques et les UV métriques restent identiques. Mémoire estimée avec mipmaps : 1,77 → 0,885 Mo.
- **Une seule lecture de matière** près du joueur. La variation indépendante du motif principal réutilise les canaux R des deux lectures de bruit mondial déjà nécessaires au terrain. Elle ne fait pas appel à une nouvelle texture ni à un hash trigonométrique par fragment. Sa faible amplitude conserve la palette, le grain et les joints, tout en évitant la seconde lecture anisotrope d'atlas. Les variations ne répètent pas au même pas que le motif minéral.
- **Normales limitées au détail actif** : le microrelief conserve sa hauteur et son enveloppe progressive 12–75 m. Lorsque cette enveloppe est déjà nulle, la reconstruction de normale par dérivées n'est plus appelée. Aucun palier visible ni nouveau changement de couleur au LOD.
- **Filtrage du grain plafonné à 4**, sans dépasser la capacité du device ; celui du champ d'accotement reste plafonné à 8 comme en 07.2. Le gros plan pavé et la vue rasante ont conservé un relief et des joints lisibles. Les deux profils gardent la même matière, avec leurs résolutions et enveloppes de détail existantes ; Éco ne devient pas une matière plate.

Aucun matériau, texture, draw call, sommet ou triangle ajouté au produit. Les six fichiers de source, géométrie et accotement (`angles-osm`, `angles-terrain`, manifeste/pack `angles-surface`, manifeste/pack `angles-road-edge`) sont identiques à `72006e0`. La chaussée reste dans la partition unique ; collisions, largeurs, positions, classes OSM et altitudes ne sont pas modifiées.

## Alternatives testées et rejetées

Les 9 ablations initiales utilisent trois passages dans des ordres différents. Leur tableau brut est dans [profile-summary.json](mission-07-3-captures/profile-summary.json), avec les JSON par vue et essai. Retirer tous les détails ou toutes les normales économise du temps, mais ne constitue pas une optimisation acceptable des matières. Les gains d'ablation ne sont pas des contributions GPU additives : l'élimination de code par le compilateur change aussi le shader.

- **Champ 1024 et 1536** : vraies cartes signées régénérées depuis les mêmes emprises, puis rendues avec le même shader. La réduction de mémoire ne s'accompagne pas d'un gain logiciel général ; le 1024 élargit et simplifie certains raccords étroits. Le champ 2048 d'origine est retenu intégralement, avec ses transitions et son filtrage connus. Les images `edge-1024-*` / `edge-1536-*` et les matrices `candidate-*` restent consultables.
- **Support compact par sommet** : prototype d'un octet normalisé, construit hors ligne par requête conservatrice sur le champ signé, avec une marge de 4 m. Toutes les faces proches reçoivent trois sommets actifs, dans les deux LOD, sans interpoler une fausse distance ni modifier les indices. Il a été testé sur les vrais maillages et sur des triangles dont les seuls sommets manqueraient la bande. Coût : 81 495 octets géométriques ; mémoire de finition à 4,03 Mo avec le champ 1536. Son branchement et son varying n'apportent pas de gain global fiable dans SwiftShader ; il est **retiré du produit**, ainsi que son attribut et ses métadonnées. Le générateur expérimental, les tests de couverture et le pack `prototype-support-1536` sont conservés pour reproduire l'étude.
- **Dérivées implicites à la place de textureGrad** : mesures parfois plus rapides, mais elles font dépendre le calcul des mipmaps du `fract` et des raccords de quadrant. Les dérivées explicites des UV non repliés sont conservées, ainsi que les marges qui avaient corrigé les traits d'atlas.
- **Anisotropie 1 ou 2** : le profilage montre un coût réel du filtrage, mais diminuer davantage ne fournit pas un meilleur compromis sur toutes les vues. Le plafond 4 est retenu après examen des pavés et de la rue rasante ; le champ signé garde 8. Aucune revendication de gain matériel ne découle de ces variantes.
- **Suppression du mélange côté sol ou du champ sur le terrain naturel** : économies faibles et perte de la fonction d'intégration recherchée en 07.2. Ces variantes restent des contrôles de coût, pas des options cachées du jeu.

Les variantes 073 du masque et du champ réduit ont été mesurées sur le prototype intermédiaire `996e32c` et ses ajustements de test ; elles ne sont pas confondues avec le produit final. Le script `prepare-road-finish-prototype.mjs` permet de régénérer le support expérimental. La commande normale `geo:road-materials` garde le champ original 2048.
