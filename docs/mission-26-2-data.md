# Mission 26.2 — Sources et carte de vérité

Le corpus historique de 499 cellules fines est conservé. Il représente une couverture de données, pas 499 zones libres d'accès. La [galerie](mission-26-2-evidence/index.html) et son GeoJSON séparent permission explicite, projet de route, déplacement effectivement mesuré et blocage.

| Élément | Source ou contrat | Ce que la mission permet d'affirmer |
| --- | --- | --- |
| Limite et géographie départementales | Manifestes M26 existants, EPSG:2154, cellules 4 096 m | Corpus conservé ; aucune nouvelle exactitude terrain revendiquée |
| Contact fin | IGN LiDAR HD MNT numérique, dérivé 2 m, IGN69, Licence Ouverte 2.0 | 499 packs, 1 407 876 165 octets, erreur de quantification ≤0,005 m ; cette borne n'est pas l'erreur du relevé |
| Routes, bâti, eau, accès | Extraits OSM immuables historiques ; ODbL et attributions conservées | Nœuds et polygones sources inchangés ; complétude et accès réels non garantis |
| Navigation | Graphe dérivé du même corpus | Masques d'accès corrigés, pas de nouveaux connecteurs inventés ; routage distinct de voyage |
| Hauteur des constructions et largeur des voies | Tags lorsqu'ils existent, règles du compilateur sinon | Géométrie inférée ; ne justifie pas de déplacer un mur pour réussir un parcours |
| Végétation et habitat | Occupation du sol + simulation déterministe héritée | Arbres, espèces, poses et densités inférés ; pas un inventaire écologique |
| Rivières | Polygones/axes OSM, surface rendue et fond de jeu estimé | Ni bathymétrie mesurée ni garantie de sécurité ; 0 nouveau parcours de 1 km certifié |
| Trafic, oiseaux, météo | Simulation de jeu | Positions et rythmes ne sont pas des observations ou horaires réels |
| Fixture hors France | Données synthétiques, 47° N / 71° O, référentiel WGS84 ellipsoïdal déclaré | Vérification technique du contrat ; aucun site réel reconstitué |

## Dates, empreintes et provenance

Le contact fin distant reste épinglé à `acb0a73b396229bf90731b90a558a8d5d072a9ec`. Les dates et empreintes d'acquisition sont celles des reçus historiques ; cette mission ne leur substitue pas sa date d'exécution. La date géographique du relevé n'est pas extrapolée des métadonnées du pilote. Voir [M26.1 données](mission-26-1-data.md), le manifeste `public/planet/fr-86/contact-2m/manifest.json` et les licences originales dans le dépôt.

L'audit M26.2 relit les 499 cellules et les fichiers protégés contre le SHA de référence exact `d6a906cd7546a4cd8e85226efff64436e53ea200`. Il expose les modifications intentionnelles et les absences, sans confondre une dérivation de graphe avec une nouvelle source. Les reçus de builds et le manifeste d'artefacts fixent les versions exécutées et les octets des médias. Aucun corpus fin, monument ou asset historique n'a été remplacé pour faciliter un test.

## Politique d'accès et lacunes

Les permissions explicites `yes`, `permissive` ou `designated` autorisent les polygones correspondants sous réserve du support, de la pente et des obstacles. Le défaut reste inconnu. Les restrictions privées, rails actifs et autoroutes ne deviennent pas publiques. Les conditionnels présents et non résolus sont refusés ; l'extrait historique n'est pas certifié complet pour tous les conditionnels et barrières ponctuelles du département. Une validation cadastrale ou sur place reste hors de la preuve.

Sept courtes marches de huit mètres dans des zones explicitement ouvertes ne certifient pas toute la surface de leurs polygones. Le candidat de plage Vauchiron n'a pas produit de placement admis dans ce test. Les tentatives et leur motif sont conservés dans `access.json`. Le vert de la carte représente uniquement les traces parcourues ; l'ambre représente une permission candidate, sans mesure de surface entièrement praticable.

Les refus d'accès aux berges et les échecs de sélection de point sont distingués dans les traces. Une absence d'entrée trouvée ne démontre pas que toute une commune ou rivière est naturellement inaccessible. Aucune berge publique, profondeur ou structure franchissable n'a été inventée. La voie rasée de la vallée de Chauvigny est traitée comme un alignement historique, sans accorder de droit sur son emprise.

## Reproduction et coûts

[REPRODUCTION.md](mission-26-2-evidence/REPRODUCTION.md) donne les commandes avec `--dry-run` pour les acquisitions lourdes. La mission ne déclenche aucun achat ni abonnement et ne déploie pas de site. Les 1,4 Go de packs existants ne sont pas recopiés dans chaque build de preuve ; les builds conservent leurs bundles et renvoient aux mêmes manifestes de sources épinglées. Les vidéos nécessaires sont natives, avec originaux et indexation transparente sans réencodage des images.

Les sélections `foot-21km` et `car-40km` sont des préfixes de polylignes source plus longues. Leurs points de pilotage sont tronqués sur une arête existante ; certaines métadonnées de la route parente, notamment la liste de features, restent plus larges que le préfixe. Elles ne servent jamais à compter les voies ou communes parcourues. Les propriétaires et tuiles réellement rencontrés viennent uniquement de la télémétrie du contrôleur, pas de cette liste parente.
