# Preuves Mission 09

Base immuable : `f11f165`, Mission 08.6 après fusion PR #15. Le worktree de référence n'a qu'une modification d'outillage : son cache Vite est séparé de celui de Mission 09, sans changement du jeu.

- `before.json`, `after.json` : caméras, dates, conditions, temps simulés, budgets, mesures CPU locales des échantillons, rendu et mémoire par station ; erreurs navigateur.
- `before-*.png`, `after-*.png` : dernier rendu de chaque séquence.
- `before-*.webp`, `after-*.webp` : huit images effectivement rendues, animation de quatre secondes ; ciel/ombres/aérien en lecture ×8. Pas une vidéo de FPS temps réel.
- `comparaison.html` : galerie autonome avant/après, avec choix animation ou image fixe.
- `benchmark.json` : trois passages alternés isolés, mesures brutes de rendu synchronisé, CPU atmosphère, intervalles RAF mobiles Éco, ressources et mémoire. Le passage exploratoire interrompu avant retouche de l'eau n'est pas conservé comme comparaison finale.
- `walk-before/`, `walk-after/` : promenades complètes de 450 m, trace de toutes les images, captures et sondage de navigation.
- `summary.json` : synthèse reproductible de ces traces, vérification des caméras et instants identiques.
- `runtime-validation.json` : profils, faune/feuilles observées, LOD, volume/contexte audio, cycles de démontage.
- `data-validation.json` : dix-neuf scénarios de données dégradées.
- `preparation.json` : génération hors navigateur ; blocs et recettes identiques à 08.6.
- `npm-audit.json` : audit des dépendances.

Chromium utilise explicitement ANGLE/SwiftShader. Le viewport mobile n'est pas un véritable appareil. Les temps de `finish/readPixels` ne sont pas du temps GPU matériel. Les buffers géométriques et les textures comptées ne représentent pas toute la mémoire GPU du processus.

Les scènes artistiques utilisent des caméras d'inspection fixes ; elles ne modifient pas le fonctionnement de la marche réelle. Les scripts sont les sources du protocole. Le rapport `../mission-09.md` décrit les hypothèses et les limites.
