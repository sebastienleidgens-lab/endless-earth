import {AUDIO_GROUPS} from './catalog.mjs';
export const AUDIO_BUDGETS=Object.freeze({eco:{voices:8,hrtf:1,beds:2,hz:2},balanced:{voices:12,hrtf:2,beds:3,hz:2},quality:{voices:12,hrtf:3,beds:3,hz:4}});
const smooth=(a,b,x)=>{const v=Math.max(0,Math.min(1,(x-a)/(b-a)));return v*v*(3-2*v)};
export const LAYERS=Object.freeze([
 {id:'foliage',assets:[...(AUDIO_GROUPS.foliage??[]),...(AUDIO_GROUPS['foliage-dry']??[])],priority:35,filter:8500},
 {id:'water',assets:AUDIO_GROUPS.water??[],priority:55,filter:8500},
 {id:'rain',assets:AUDIO_GROUPS.rain??[],priority:50,filter:9000}
]);
// There is deliberately no air/filler bed and no composite birdsong bed.
export function layerMix(c){
 const v=c.influences.vegetation??0,wind=c.weather?.wind??0,rain=c.weather?.rain??0;
 const weights={foliage:v*.16*smooth(.30,.72,wind),water:c.water&&Number.isFinite(c.water.distanceM)?.22*(1-smooth(4,55,c.water.distanceM)):0,rain:.24*smooth(.05,.55,rain)};
 const reasons={foliage:`mapped vegetation ${v.toFixed(2)} × simulated wind ${wind.toFixed(2)}; no sound below wind threshold`,water:c.water?`${c.water.provenance}; nearest mapped waterway ${c.water.distanceM.toFixed(1)} m`:'no nearby water evidence',rain:`EarthLife simulated rain ${rain.toFixed(2)}`};
 return LAYERS.map(l=>{const assets=l.id==='foliage'&&!['autumn','winter'].includes(c.season)?(AUDIO_GROUPS.foliage??[]):l.assets;return {...l,assets,asset:assets[0],weight:weights[l.id],reason:reasons[l.id],diffuse:true}}).filter(l=>l.asset&&l.weight>.0001).sort((a,b)=>b.weight-a.weight);
}
// Generic European interpretations, never confirmed sightings in Angles.
export const BIRD_PROFILES=Object.freeze([
 {id:'blackbird',assets:AUDIO_GROUPS['bird-blackbird']??[],habitats:['wood','forest','garden','orchard','built','riparian'],perMinute:.32,cooldown:55,range:110,refDistance:4,gain:.30,activity:[4,22],season:{spring:1,summer:.65,autumn:.2,winter:.08}},
 {id:'robin',assets:AUDIO_GROUPS['bird-robin']??[],habitats:['wood','forest','scrub','garden','riparian'],perMinute:.27,cooldown:65,range:85,refDistance:3,gain:.23,activity:[4,22],season:{spring:1,summer:.5,autumn:.55,winter:.35}},
 {id:'tit',assets:AUDIO_GROUPS['bird-tit']??[],habitats:['wood','forest','garden','orchard','built'],perMinute:.30,cooldown:60,range:75,refDistance:3,gain:.19,activity:[6,20],season:{spring:1,summer:.6,autumn:.25,winter:.4}},
 {id:'chaffinch',assets:AUDIO_GROUPS['bird-chaffinch']??[],habitats:['wood','forest','orchard','meadow','scrub'],perMinute:.24,cooldown:70,range:100,refDistance:4,gain:.25,activity:[5,20],season:{spring:1,summer:.6,autumn:.15,winter:.05}}
]);
export const EVENTS=Object.freeze([]); // Extension point for documented rare local events.
export const MATERIALS=Object.freeze(Object.fromEntries(['stone','hard','dry-earth','wet-earth','gravel','grass','leaves'].map(kind=>[kind,{assets:AUDIO_GROUPS['step-'+(kind==='hard'?'stone':kind)]??[],gain:kind==='grass'?.105:kind==='leaves'?.10:kind==='gravel'?.13:.145,filter:9500}])));
export function eventAffinity(e,c){
 if(e.fixtureOnly&&!c.fixture)return 0;
 if(e.daylight&&(c.solarAltitude===null||c.solarAltitude<=0))return 0;
 if(e.regions&&!e.regions.includes(c.provenance.region))return 0;
 return c.influences[e.affinity]??0;
}
export function birdActivity(b,c,habitat){
 if(c.provenance.region!=='temperate-europe'||!b.habitats.includes(habitat)||c.solarAltitude===null||c.solarAltitude<=0||c.localHour===null||!c.weather||c.weather.rain>.2||c.weather.wind>.8)return 0;
 if(c.localHour<b.activity[0]||c.localHour>b.activity[1])return 0;
 const dawn=c.localHour<10?1:c.localHour>16?.65:.35;
 return (b.season[c.season]??0)*dawn*(habitat==='built'?.35:1);
}
