import {ART_DNA} from '../art/dna.mjs';
// Generic temperate families: interpretations of mapped cover, never species IDs.
export const NATURE_ART_VERSION='temperate-nature-v1';
export const NATURE_LOD=ART_DNA.vegetation.lod;
const family=(id,type,form,heightM,habitat,leaf,moisture,exposure,variants)=>Object.freeze({id,type,form,heightM,habitat,climate:['temperate'],leaf,seasonal:leaf==='deciduous'?'staggered flush, autumn and winter leaf loss':leaf==='evergreen'?'retained foliage':'seasonal growth and drying',maxSlope:.58,exposure,moisture,visualVariants:variants,lod:{near:'shared geometry and stable instance traits',far:'shared coarse silhouette; no leaf sampling'},confidence:'regional interpretation, not botanical inventory'});
export const VEGETATION_LIBRARY=Object.freeze([
 family('broadleaf','tree','irregular spreading crown',[6,18],['wood','orchard'],'deciduous','mesic',['sun','partial shade'],['rounded','spreading','asymmetric']),
 family('riparian','tree','slender irregular crown',[6,20],['wood near mapped water'],'deciduous','moist',['sun','partial shade'],['slender','open']),
 family('young','tree','small open crown',[2,7],['wood','scrub','orchard'],'deciduous','mesic',['sun','partial shade'],['young rounded','young slender']),
 family('needle','tree','layered conical crown',[4,22],['mapped needle-leaved or mixed wood'],'evergreen','mesic',['sun','partial shade'],['uneven tiers','slender tiers']),
 family('grass','herb','uneven tuft',[.15,.7],['meadow','scrub','orchard'],'herbaceous','mesic',['sun'],['short','dry','tall']),
 family('fern','herb','two crossing arching fronds',[.2,.65],['wood'],'herbaceous','mesic to moist',['shade','partial shade'],['open','folded']),
 family('shrub','shrub','low open branching clump',[.3,.85],['wood','scrub','orchard'],'deciduous','mesic',['partial shade','sun'],['sparse','bushy']),
 family('reed','herb','sparse upright leaves',[.45,1.0],['mapped vegetated habitat near mapped water'],'herbaceous','moist',['sun','partial shade'],['upright','bent']),
]);
const hash=p=>{let h=2166136261;for(const c of `${p.x.toFixed(6)}:${p.z.toFixed(6)}`){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
export function treeIdentity(p){const n=hash(p),evergreen=p.leaf==='needle'&&p.kind!=='riparian';return {family:evergreen?'needle':p.kind,variant:n%3,phase:(n>>>4)%1024/1024,openness:.78+(n>>>15)%1024/1024*.22,evergreen,provenance:p.mapped?'mapped anchor, interpreted form':'inferred individual within mapped habitat'};}
// Reads the existing environment calendar; no clock, weather or snow model.
const phenology=[
 [0,0,0,.25],[0,0,0,.22],[.30,.8,0,.15],[.78,1,0,.05],
 [1,.65,0,.02],[1,.12,0,.08],[1,0,0,.30],[1,0,.08,.45],
 [.94,0,.35,.42],[.56,0,1,.45],[.13,0,.75,.55],[0,0,.18,.4],
];
export function foliageSeason(date,latitude=46){const d=new Date(date);if(!Number.isFinite(+d))return [1,0,0,.1];const m=(d.getUTCMonth()+(latitude<0?6:0))%12,t=(d.getUTCDate()-1)/new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate(),a=phenology[m],b=phenology[(m+1)%12];return a.map((v,i)=>v+(b[i]-v)*t);}
