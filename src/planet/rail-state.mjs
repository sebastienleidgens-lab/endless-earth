/** OSM lifecycle is geographic evidence. A razed/dismantled alignment is not
 * a physical track. This grants no land access; the normal access owner still
 * has to admit the point, and explicit restrictions remain authoritative. */
export function removedRail(tags={}){return ['razed','dismantled'].includes(tags.railway);}
