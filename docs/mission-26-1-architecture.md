# Mission 26.1 — Architecture des propriétaires continus

Le point géographique WGS84 et la hauteur IGN69 restent distincts du repère de rendu. Le pilote garde son adaptateur historique X est/Z sud ; les fournisseurs de données utilisent EPSG:2154. La simulation conserve ses nombres Float64 et les sauvegardes des coordonnées géographiques. Cet adaptateur historique présente une distorsion métrique régionale ; il ne constitue pas un repère géocentrique mondial achevé.

## Rendu et audio

L’origine de présentation avance par multiples de 256 m après 2 km. Pendant le rendu, scène et caméra passent dans ce repère, puis retrouvent leur état canonique. Les géométries sont relatives à une cellule, les instances à leur ancre. Les shaders d’apparence retrouvent explicitement les coordonnées canoniques ; les opérations internes Three.js gardent les coordonnées de rendu. Les panners et le listener audio changent d’origine dans la même transaction, en conservant leur valeur interpolée et leur cible d’automation. La physique et la carte ne changent pas de coordonnées lors de cette opération.

## Relief et propriété

Les packs RGE historiques restent inchangés. Un dérivé IGN effectif à 2 m, quantifié au centimètre, est chargé à la demande. Son parent est échantillonné dans le même raster. Les cellules proches utilisent le pas fin ; les cellules éloignées conservent les sommets requis par leurs voisines fines. Aucun skirt ni plancher invisible n’est ajouté. Rendu et contact interrogent les mêmes triangles, y compris les rubans routiers. Le déplacement attend si le contact fin n’est pas encore préparé.

Le rectangle protégé du pilote est soustrait des nouveaux triangles. Chaque intersection des triangles historiques avec sa frontière est conservée ; les sommets sont rattachés à leur vrai propriétaire. Un raccord continu n’implique pas qu’une pente ou un accès inconnu devient franchissable.

## Streaming et préparation

Un worker vérifie les empreintes, décompresse et décode ; les messages de features sont accusés réception par petits lots, le raster typé est transféré sans copie. Une file de générateurs prépare index, graphes, géométries et retrait avec un budget cible de 3 ms. Le budget ne préempte pas une étape atomique coûteuse : ses maxima sont mesurés, non garantis par la seule présence d’une file.

La résidence est admise après installation complète. Les demandes périmées sont annulées et retirées. Les objets linéaires et surfaciques sont découpés aux cellules chargées ; un point lointain ne masque plus toute sa rivière ou route. Les index locaux ref-comptent chaque propriétaire chargé. Le plafond comptable de 96 MiB additionne les octets JSON décodés déclarés et les rasters U16 résidents ; il ne mesure pas les allocations réelles des objets JS issus du JSON. Les index/graphes, le tas global, le worker de route, le GPU et l’audio sont distincts et ne sont pas tous bornés par ce compteur.

## Données distribuées

Les 499 packs fins restent versionnés dans le commit de données `acb0a73b396229bf90731b90a558a8d5d072a9ec`. La région déclare leur URL HTTPS immuable. Le build copie les manifestes mais omet ces packs de l’artefact du site ; les anciens assets restent copiés. Le navigateur vérifie taille et SHA avant tout contact. Le cache 3D est borné et aucune précharge départementale n’a lieu. Cette séparation permet un autre hébergeur de données sans changer la physique ; la disponibilité et la capacité du service gratuit ne sont pas une garantie mondiale.

## Réseaux, carte, transport et sauvegarde

Le graphe départemental de route garde les nœuds OSM et les directions d’origine dans un index binaire compact. Il est indépendant du fond de carte simplifié. Les ouvrages, traversées et accès inconnus restent refusés. La route prépare une courte avance, pas tout son parcours. Les gares proviennent du jeu officiel SNCF Réseau ; les arrêts synthétiques projetés sur un rail admis ne constituent pas un service réel ou un quai vérifié.

Les sauvegardes v2 contiennent position canonique, véhicule garé/occupé, activité, camp, bateau, profil, climat, carte et route. La migration v1 conserve le document original et son repère de véhicule déclaré. Les propriétaires nécessaires sont préparés avant restitution ; un accès devenu invalide produit un refus explicite. L’exhaustivité de la restauration dépend des scénarios effectivement réussis.
