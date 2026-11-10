/** Material evidence only. An untagged mapped road is not asphalt and a forest
 * canopy is not a measured leaf-litter floor. Unknown contact stays silent. */
const STONE=new Set(['sett','cobblestone','unhewn_cobblestone','paving_stones','stone']);
const HARD=new Set(['asphalt','concrete','concrete:plates','concrete:lanes']);
const EARTH=new Set(['dirt','earth','ground','clay']);
export function footContact({surface=null,onRoad=false,habitat='unknown',season=null,rain=null,leafLitter=false}={}){
 const base={surface:surface||null,material:'unknown',basis:'no reliable ground material',confidence:'unknown'};
 if(STONE.has(surface))return {...base,material:'stone',basis:'explicit OSM surface',confidence:'mapped'};
 if(HARD.has(surface))return {...base,material:'hard',basis:'explicit OSM hard surface; generic hard-contact recording',confidence:'mapped'};
 if(['gravel','fine_gravel','pebblestone'].includes(surface))return {...base,material:'gravel',basis:'explicit OSM surface',confidence:'mapped'};
 if(EARTH.has(surface))return {...base,material:rain!==null&&rain>.25?'wet-earth':'dry-earth',basis:rain>.25?'mapped earth + simulated rain, wetness interpreted':'mapped earth, dry contact interpretation',confidence:'interpreted'};
 if(surface==='mud')return {...base,material:'wet-earth',basis:'explicit muddy ground',confidence:'mapped'};
 if(surface==='grass')return {...base,material:'grass',basis:'explicit grass surface',confidence:'mapped'};
 if((surface==='leaves'||leafLitter)&&['autumn','winter'].includes(season))return {...base,material:'leaves',basis:'leaf-litter evidence and calendar season',confidence:'interpreted'};
 if(!onRoad&&['meadow','grass'].includes(habitat))return {...base,material:'grass',basis:'mapped grassy land cover, contact interpretation',confidence:'interpreted'};
 return base;
}
export function stepStride(speed){return Math.max(.55,Math.min(1.05,.55+Math.max(0,speed)*.10))}
