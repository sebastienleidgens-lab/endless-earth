// All environments use this one set of declarative contribution rules.
// Weights are artistic mix affinities, never measured activity/decibels.
export const AUDIO_BUDGETS=Object.freeze({eco:{voices:8,hrtf:1,beds:2,hz:2},balanced:{voices:12,hrtf:2,beds:3,hz:2},quality:{voices:12,hrtf:3,beds:3,hz:4}});
export const LAYERS=Object.freeze([
 {id:'air',asset:'air',base:.025,axes:{wind:.16,exposure:.03},gain:1.5,priority:30,filter:1800},
 {id:'foliage',asset:'woodland',axes:{vegetation:.22},multiply:'wind',gain:3,priority:45,filter:3600,daylight:true},
 {id:'water',asset:'water',axes:{water:.25,coast:.25},gain:1.6,priority:55,filter:3200},
 {id:'rain',asset:'rain',axes:{rain:.35},gain:1.8,priority:60,filter:3400},
 {id:'human',asset:'human-placeholder',axes:{settlement:.12,urban:.23,port:.08},gain:2.5,priority:40,filter:1600,provisional:true,fixtureOnly:true},
 {id:'traffic',asset:'traffic-placeholder',axes:{road:.16,urban:.13},gain:1.8,priority:42,filter:1100,provisional:true,fixtureOnly:true}
]);
export const EVENTS=Object.freeze([
 {id:'bird',assets:['bird-a','bird-b','bird-c'],affinity:'forest',perMinute:.65,cooldown:22,priority:60,gain:.35,daylight:true,maxRain:.2,maxWind:.75,regions:['temperate-europe'],sourceKind:'bird'},
 {id:'rustle',assets:['rustle-a','rustle-b'],affinity:'vegetation',perMinute:.13,cooldown:75,priority:45,gain:.045},
 {id:'rare-gust',assets:['gust'],affinity:'exposure',perMinute:.015,cooldown:600,priority:35,gain:.05,rare:true},
 {id:'rare-human',assets:['human-event-placeholder'],affinity:'settlement',perMinute:.01,cooldown:900,priority:35,gain:.035,rare:true,provisional:true,fixtureOnly:true}
]);
export const MATERIALS=Object.freeze({herbe:{assets:['step-soft-a','step-soft-b','step-soft-c'],gain:.13,filter:950},terre:{assets:['step-soft-a','step-soft-b','step-soft-c'],gain:.16,filter:1600},gravier:{assets:['step-gravel-a','step-gravel-b','step-gravel-c'],gain:.17,filter:5000},route:{assets:['step-gravel-a','step-gravel-b','step-gravel-c'],gain:.10,filter:2300}});
export function layerMix(c){
 const axes={...c.influences,wind:c.weather?.wind??0,rain:c.weather?.rain??0};
 return LAYERS.filter(l=>!l.fixtureOnly||c.fixture).map(l=>{let weight=l.base??0;for(const [k,v] of Object.entries(l.axes))weight+=(axes[k]??0)*v;if(l.multiply)weight*=.25+.75*(axes[l.multiply]??0);if(l.daylight&&c.solarAltitude!==null&&c.solarAltitude<=0)weight*=.08;return {...l,weight:Math.min(.8,Math.min(.4,weight)*l.gain)}}).filter(l=>l.weight>.0005).sort((a,b)=>b.weight-a.weight);
}
export function eventAffinity(e,c){
 if(e.fixtureOnly&&!c.fixture)return 0;
 if(e.daylight&&(c.solarAltitude===null||c.solarAltitude<=0))return 0;
 if(e.regions&&!e.regions.includes(c.provenance.region))return 0;
 if((e.maxRain!==undefined&&(c.weather?.rain??1)>e.maxRain)||(e.maxWind!==undefined&&(c.weather?.wind??1)>e.maxWind))return 0;
 const seasonal=e.id==='bird'?(c.season==='winter'?.28:c.season==='spring'?1:.6):1;
 return (c.influences[e.affinity]??0)*seasonal;
}
