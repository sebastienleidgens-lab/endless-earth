# Mission 02 — plaisir de promenade

## Base auditée

`main` récupéré le 8 novembre 2026 : `76f96b7`, fusion de la PR #5
`mission/01-premiere-promenade` (`6c99831`). La copie initiale était encore à
`4ff1653` : la branche de travail a donc été créée depuis le vrai `main`, sans
modifier celui-ci. Avant modification : 17 tests réussis et compilation réussie.

## Navigation géographique réutilisable

`src/world/navigation.mjs` reçoit des objets locaux en mètres, indépendamment de
Three.js et du village. Une grille de 20 m limite les recherches. L'adaptateur
GeoJSON reste dans `collisions.ts` et conserve la conversion géographique
existante. Routes, chemins, escaliers, barrières, cours d'eau et polygones d'eau
partagent cette couche. Les enveloppes extérieures des MultiPolygon sont aussi
prises en compte pour les bâtiments et l'eau ; les trous restent bloqués par
prudence.

- Eau infranchissable avec marge corporelle de 30 cm. Cours d'eau linéaires :
  largeur OSM si numérique, sinon corridor prudent de 6 m, également utilisé par
  le rendu existant. Cette largeur est une approximation, pas un relevé de berge.
- `foot` prime sur `access` ; `no`, `private`, `use_sidepath` bloquent. Restrictions
  conditionnelles non évaluées : blocage prudent. Autoroutes, voies en projet ou
  chantier et tunnels sans géométrie souterraine bloquent.
- Barrières linéaires et ponctuelles bloquées, sauf entrées, portes, barrières
  levantes et bornes compatibles avec le passage piéton. Une restriction explicite
  reste bloquante. L'ouverture physique des portes n'est pas simulée.
- Un pont cartographié ne devient praticable que si chaque segment dispose
  d'altitudes de tablier vérifiées, exprimées dans le repère vertical du terrain.
  Le noyau interpole ces altitudes et ne permet l'appui qu'à l'intérieur de la
  largeur utile. `setBuildingFootprints` accepte un résolveur optionnel à cet
  effet ; l'import OSM actuel n'en fournit aucun. `layer=1` n'est jamais converti
  en hauteur et le Z GeoJSON sans provenance verticale n'est pas utilisé.
- Le pont réel `647696691` reste donc bloqué : aucune altitude de tablier fiable
  dans les données disponibles. Aucun passage fictif n'a été ajouté. Le rendu
  historique de sa ligne suit encore le DEM : ne pas l'interpréter comme un
  tablier physique validé. Le futur import de tabliers doit partager le même
  profil vérifié entre rendu et navigation.
- Les escaliers OSM autorisent une pente de 1,2 maximum au centre du corridor,
  contre 0,7 ailleurs. La marche continue suit le DEM, sans fabriquer de marches.
  Les sous-pas de 10 cm, les limites et le refus des altitudes inconnues sont
  conservés. Le DEM de 10 m ne permet pas de restituer chaque marche réelle.

## Confort

Accélération et freinage exponentiels (constantes de temps 280/180 ms), intégrés
analytiquement pour conserver la distance aux différentes fréquences d'image.
La vitesse résiduelle est annulée sous 1 mm/s. Retour au repos des membres
conservé. Hauteur des yeux amortie, retard vertical borné à 15 cm et stabilisation
exacte au repos. Pas de balancement ni de secousse ajoutée.

Transitions de position et d'orientation sur 800 ms avec courbe progressive ;
chaque position interpolée des vues à pied est contrôlée contre murs et relief.
Le bras de troisième personne se rétracte immédiatement et se redéploie avec
amortissement. Les obstacles piétons, notamment l'eau et les droits d'accès,
n'empêchent plus la caméra de survoler le paysage : tests caméra séparés des
règles de navigation, collisions bâtiments et relief conservées.

Le relief, les matériaux, l'éclairage et la végétation n'ont pas été retouchés.
L'ambiance estivale et le vent de Mission 01 sont conservés. La priorité a été
donnée au déplacement ; aucune nouvelle couche de terrain ni ressource sonore.

## Validation et limites

23 tests automatisés passent : les 17 tests existants, plus eau/berges/pont,
hauteur absente et accès, escaliers et terrain inconnu, obstacles, indépendance
fréquentielle/arrêt et transitions caméra. Compilation TypeScript/Vite réussie.
Bundle ~564 ko, ~150 ko gzip ; avertissement Vite >500 ko toujours présent.

Le test Chromium a été étendu pour attendre les transitions et vérifier la
stabilité après relâchement. Résultats navigateur et mesures finales ci-dessous.

Limites : collisions 2,5D conservatrices, pas de capsule physique complète ;
glissement par axes inchangé aux coins ; caméra contrôlée par son axe, pas par
le frustum entier. Restrictions limitées aux géométries importées : aucun droit
d'accès cadastral n'est déduit. Intersections de corridors interdits et publics
peuvent être trop restrictives. La zone, la source de données et les réglages
d'ambiance restent sélectionnés dans le chargeur pilote ; l'extension France
n'est pas réalisée. Aucun parcours continu de 15 minutes n'est validé.

Prochaines priorités : profils de tabliers avec provenance et rendu commun,
relief plus fin pour les escaliers, validation d'un trajet réellement connecté,
glissement tangent aux murs, tests de frustum caméra puis mesure sur GPU et
Android physiques. La fluidité artistique ne peut être certifiée par ces seuls
tests unitaires ni par SwiftShader.
