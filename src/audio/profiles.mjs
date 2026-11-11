import {AUDIO_GROUPS} from './catalog.mjs';
export const AUDIO_BUDGETS=Object.freeze({eco:{voices:8,hrtf:1,beds:2,hz:2},balanced:{voices:12,hrtf:2,beds:3,hz:2},quality:{voices:12,hrtf:3,beds:3,hz:4}});
const smooth=(a,b,x)=>{const v=Math.max(0,Math.min(1,(x-a)/(b-a)));return v*v*(3-2*v)};
export const LAYERS=Object.freeze([
 {id:'water',assets:AUDIO_GROUPS['river-moderate']??AUDIO_GROUPS.water??[],priority:60,filter:8500},
 {id:'water-detail',assets:AUDIO_GROUPS['water-turbulence']??[],priority:42,filter:8000},
 {id:'foliage',assets:[...(AUDIO_GROUPS.foliage??[]),...(AUDIO_GROUPS['foliage-dry']??[])],priority:40,filter:9000},
 {id:'wind',assets:AUDIO_GROUPS['wind-open']??[],priority:30,filter:7000},
 {id:'rain',assets:AUDIO_GROUPS.rain??[],priority:55,filter:9000}
]);
// Calibrated by family. Calm/unknown places have no permanent air/filler bed.
export function riverGain(distance){const d=Math.max(0,distance);return .56/(1+Math.pow(d/18,1.5))*(1-smooth(95,150,d))}
export function layerMix(c){
 const v=c.influences.vegetation??0,wind=c.weather?.wind??0,rain=c.weather?.rain??0,gust=c.weather?.gust??0;
 const exposure=Math.max(c.influences.exposure??0,({rock:1,water:1,meadow:.9,farmland:1,built:.24,garden:.35,orchard:.35,scrub:.65,riparian:.5,wood:.25,forest:.25})[c.habitat]??0)*(1-(c.influences.forest??0)*.65);
 const water=c.water&&Number.isFinite(c.water.distanceM)?(c.water.kind==='stream'?.22*(1-smooth(4,55,c.water.distanceM)):riverGain(c.water.distanceM)):0;
 const turbulence=c.water&&Number.isFinite(c.water.weirDistanceM)?.20*(1-smooth(6,38,c.water.weirDistanceM))*water/.56:0;
 const weights={foliage:v*.28*smooth(.08,.55,wind)*(.8+.2*gust),water,'water-detail':turbulence,wind:exposure*.36*smooth(.20,.70,wind),rain:.24*smooth(.05,.55,rain)};
 const reasons={foliage:`mapped vegetation ${v.toFixed(2)} × shared wind ${wind.toFixed(2)}, gust ${gust.toFixed(2)}`,water:c.water?`${c.water.provenance}; physical proximity ${c.water.distanceM.toFixed(1)} m`:'no mapped river evidence','water-detail':c.water?`mapped weir proximity ${c.water.weirDistanceM?.toFixed(1)??'unknown'} m; turbulence is an artistic interpretation, discharge unknown`:'no mapped weir',wind:`mapped exposure ${exposure.toFixed(2)} × shared wind ${wind.toFixed(2)}; silent in calm`,rain:`EarthLife simulated rain ${rain.toFixed(2)}`};
 // Source fs-501243 explicitly contains distant thunder. Admit it only in
 // storm-strength rain; ordinary showers use the verified thunder-free source.
 return LAYERS.map(l=>{const assets=l.id==='water'&&c.water?.kind==='stream'?(AUDIO_GROUPS.water??[]):l.id==='foliage'&&!['autumn','winter'].includes(c.season)?(AUDIO_GROUPS.foliage??[]):l.id==='rain'&&rain<=.8?l.assets.filter(id=>id!=='rain-fs-501243-1'):l.assets;return {...l,assets,asset:assets[0],weight:weights[l.id],reason:reasons[l.id],diffuse:!l.id.startsWith('water')}}).filter(l=>l.asset&&l.weight>.001).sort((a,b)=>b.weight*b.priority-a.weight*a.priority);
}
// Species are plausible regional interpretations, never confirmed sightings.
export const BIRD_PROFILES=Object.freeze([
 {id:'blackbird',assets:AUDIO_GROUPS['bird-blackbird']??[],habitats:['wood','forest','garden','orchard','built','riparian'],perMinute:.70,cooldown:55,range:120,refDistance:12,gain:.48,activity:[4,22],season:{spring:1,summer:.7,autumn:.32,winter:.16}},
 {id:'robin',assets:AUDIO_GROUPS['bird-robin']??[],habitats:['wood','forest','scrub','garden','riparian'],perMinute:.60,cooldown:60,range:90,refDistance:8,gain:.40,activity:[4,22],season:{spring:1,summer:.6,autumn:.7,winter:.5}},
 {id:'tit',assets:AUDIO_GROUPS['bird-tit']??[],habitats:['wood','forest','garden','orchard','built'],perMinute:.55,cooldown:55,range:85,refDistance:8,gain:.34,activity:[5,21],season:{spring:1,summer:.65,autumn:.4,winter:.5}},
 {id:'chaffinch',assets:AUDIO_GROUPS['bird-chaffinch']??[],habitats:['wood','forest','orchard','meadow','scrub'],perMinute:.65,cooldown:65,range:110,refDistance:10,gain:.42,activity:[5,21],season:{spring:1,summer:.7,autumn:.28,winter:.12}}
]);
export const TRAFFIC=Object.freeze({assets:AUDIO_GROUPS.traffic??[],cooldown:150,perMinute:.22,range:210,refDistance:20,gain:.38});
export function trafficActivity(c){if(!c.traffic?.length||c.localHour===null||!c.weather||c.weather.rain>.8)return 0;return c.localHour>=7&&c.localHour<21?1:c.localHour>=5&&c.localHour<23?.25:.06}
export const EVENTS=Object.freeze([]); // Other human/rare sounds require evidence.
export function diurnalBirdsAllowed(c){return Number.isFinite(c.solarAltitude)&&c.solarAltitude>0&&!!c.weather&&c.weather.rain<=.2&&c.weather.wind<=.8}
export const MATERIALS=Object.freeze(Object.fromEntries(['stone','hard','dry-earth','wet-earth','gravel','grass','leaves'].map(kind=>[kind,{assets:AUDIO_GROUPS['step-'+(kind==='hard'?'stone':kind)]??[],gain:kind==='grass'?.105:kind==='leaves'?.10:kind==='gravel'?.13:.145,filter:9500}])));
export function eventAffinity(e,c){
 if(e.fixtureOnly&&!c.fixture)return 0;
 if(e.daylight&&(c.solarAltitude===null||c.solarAltitude<=0))return 0;
 if(e.regions&&!e.regions.includes(c.provenance.region))return 0;
 return c.influences[e.affinity]??0;
}
export function birdActivity(b,c,habitat){
 if(c.provenance.region!=='temperate-europe'||!b.habitats.includes(habitat)||!diurnalBirdsAllowed(c)||c.localHour===null)return 0;
 if(c.localHour<b.activity[0]||c.localHour>b.activity[1])return 0;
 const dawn=c.solarAltitude<.45?1:c.localHour<11?.8:.5;
 return (b.season[c.season]??0)*dawn*(habitat==='built'?.35:1);
}
