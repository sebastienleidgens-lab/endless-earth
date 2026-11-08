# ENDLESS EARTH — Instructions for coding agents

## Mission
Build a beautiful, geographically grounded, browser-based walking simulation of France. Pilot: Angles-sur-l'Anglin (Vienne). Prioritize joy of exploration, realism, repeatability, and Android performance.

## Non-negotiables
- Distinguish verified geographic data, inferred reconstruction, and decorative procedural content. Never label demo geometry as real geography.
- Use modular TypeScript and Three.js; preserve geographic coordinates separately from local rendering coordinates.
- Build deterministic, versioned world tiles; no uncontrolled randomness for persistent world objects.
- No direct production deployment or unreviewed merge. Use branches and PRs.
- Test compilation, loading, visual regressions, collisions, and mobile performance. Never claim tests ran unless they did.
- Keep source licenses and attribution; review IGN and OSM requirements for each dataset.
- No secret tokens or API keys in repository.

## Next milestones
1. Import real roads and building footprints for a small pilot area using documented licensed sources.
2. Integrate authoritative terrain elevations and water geometry.
3. Replace placeholder houses and trees with reusable regional assets.
4. Add mobile joystick and reliable terrain-aware collisions.
5. Create visual snapshots and automated browser tests.
