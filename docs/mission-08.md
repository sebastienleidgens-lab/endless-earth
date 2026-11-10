# Mission 08 — Le paysage authentique

Travail sur `mission/08-paysage-authentique`, depuis `origin/main` **aace0c7005d4a2bf42cb2418a5549dcb5d9da695**. La PR #13 est fusionnée le 10 novembre 2026 à 06:31 UTC (vérifié par Git et métadonnées GitHub). Une seule PR en brouillon ; aucune fusion ou publication.

## Audit initial et références

Rapports Missions 05, 06, 07, 07.1, 07.2 et 07.3 examinés. Le terrain est une grille IGN/RGE ALTI de 201 × 201 points espacés de **10 m**, 2 × 2 km, altitudes 63,93–126,37 m. Il s'agit d'échantillons API du 8 novembre 2026 ; la date d'acquisition et la résolution native ne sont pas connues. Repère métrique local historique, X est / Z sud ; pas une nouvelle projection cadastrale. Le datum est libellé « IGN normal elevations » par la source existante, sans contrôle indépendant IGN69. Les collisions et les surfaces partagent la même interpolation triangulaire.

L'extrait OSM du 8 novembre 2026 contient 921 bâtiments rendus, les axes routiers, cinq polygones d'eau, un axe de rivière, deux seuils, un pont et une enceinte de château. **Les deux forêts portent explicitement une provenance CORINE 2006** ; une extraction OSM de 2026 ne rajeunit pas cette information. Un massif est feuillu, l'autre mixte ; aucune essence n'est attestée. Pas de prairies, cultures, jardins, vergers, haies ou zones humides cartographiés dans cet extrait. Les secteurs non renseignés restent inconnus.

Les maisons sont des reconstructions procédurales sur empreintes réelles ; 920 hauteurs sur 921 sont inférées. Les ruines ont un plan OSM et une élévation illustrative. Le pont n'a pas de relevé architectural. Les routes sont la partition commune terrain/chaussée de 07.1, avec atlas RG et matières de 07.3. Leur largeur est généralement estimée. Les systèmes de lumière, météo, vent, oiseaux et audio sont conservés.

Défauts observés sur les captures initiales : rivière principalement cachée sous le DEM parce que chaque grand polygone était aplati au minimum d'une rive ; les seuils `waterway=weir` étaient en revanche dessinés comme des rubans d'eau de 6 m. Les couronnes ont une forme répétitive. Le sol reste très uniforme et les sous-bois peu lisibles. Les coûts existants incluent une génération architecturale synchrone, 25 tuiles terrain, instances végétales et petits lots de détail progressifs avec caches bornés.

[Captures initiales et paramètres](mission-08-captures/before.json) ; le protocole fige le 21 juin 2026 à midi UTC, la caméra, le viewport et les LOD. SwiftShader est un moteur **logiciel**.

## Accès aux données

[Requêtes réseau réelles](mission-08-captures/source-probes.json) : refus CONNECT HTTP 403 pour Géoplateforme WFS et téléchargements, Géoservices IGN, miroir public data.cquest.org, Sandre, Copernicus, data.gouv et Wikimedia. Un seul essai par voie, pas de contournement. La documentation publique peut être étudiée via recherche Web et le dépôt officiel IGNF ; cela ne signifie pas que ses fichiers géographiques ont été téléchargés. Aucun nouveau MNT réel n'est intégré, aucune précision géographique supplémentaire n'est revendiquée.

Rapport de livraison, sources détaillées, limites, comparaisons et mesures : en cours de rédaction sur cette branche.
