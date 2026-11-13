export const WEATHER=Object.freeze({clear:{cloud:.16,mist:0,wind:.24,rain:0,snow:0},cloudy:{cloud:.49,mist:.06,wind:.43,rain:0,snow:0},overcast:{cloud:.9,mist:.22,wind:.52,rain:0,snow:0},mist:{cloud:.65,mist:1,wind:.12,rain:0,snow:0},rain:{cloud:.96,mist:.44,wind:.64,rain:.6,snow:0},storm:{cloud:1,mist:.56,wind:.95,rain:1,snow:0},snow:{cloud:.96,mist:.30,wind:.38,rain:0,snow:.72}});
export const MOMENTS=Object.freeze({morning:'Matin',afternoon:'Après-midi',evening:'Soir',night:'Nuit',real:'Temps réel'});
export const MONTHS=Object.freeze(['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']);
/** Site civil time, never the browser's timezone. Shared by the existing clock. */
export function civilParts(reference,timeZone='UTC'){
 const d=new Date(reference);if(!Number.isFinite(+d))throw new RangeError('Invalid calendar date');
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).formatToParts(d);
 return Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
}
/** The 15th in the simulation year, preserving the exact LOCAL clock time.
 * Iteration resolves the site's UTC offset on the destination date (DST too).
 * This is a command to Mission 11's clock, not another running calendar. */
export function representativeMonth(reference,month,site){
 if(!Number.isInteger(month)||month<1||month>12)throw new RangeError('Invalid month');
 const zone=site.timeZone??'UTC',p=civilParts(reference,zone),wanted=Date.UTC(p.year,month-1,15,p.hour,p.minute,p.second),ms=new Date(reference).getUTCMilliseconds();
 let instant=wanted;
 for(let i=0;i<4;i++){const q=civilParts(instant,zone),observed=Date.UTC(q.year,q.month-1,q.day,q.hour,q.minute,q.second),delta=wanted-observed;instant+=delta;if(delta===0)break}
 return new Date(instant+ms);
}
export function solar(date,lat,lon){const d=new Date(date),day=(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())-Date.UTC(d.getUTCFullYear(),0,0))/86400000,g=2*Math.PI/365*(day-1),decl=.006918-.399912*Math.cos(g)+.070257*Math.sin(g)-.006758*Math.cos(2*g)+.000907*Math.sin(2*g),eq=229.18*(.000075+.001868*Math.cos(g)-.032077*Math.sin(g)-.014615*Math.cos(2*g)-.040849*Math.sin(2*g)),hour=(d.getUTCHours()*60+d.getUTCMinutes()+d.getUTCSeconds()/60+eq+4*lon)/4-180,r=Math.PI/180,L=lat*r,H=hour*r;return {altitude:Math.asin(Math.sin(L)*Math.sin(decl)+Math.cos(L)*Math.cos(decl)*Math.cos(H)),azimuth:Math.atan2(Math.sin(H),Math.cos(H)*Math.sin(L)-Math.tan(decl)*Math.cos(L))+Math.PI,month:d.getUTCMonth()+1};}
const WEATHER_KEYS=['cloud','mist','wind'];
// Natural evolution keeps the historical 45 s time constant. A player command
// uses 0.65 s: 98% of the change in 2.55 s, with no discontinuity.
export function weatherStep(current,target,dt,out={},seconds=45){
 const a=1-Math.exp(-Math.max(0,Math.min(dt,1))/Math.max(.01,seconds)),rain=current.rain??0,snow=current.snow??0;
 for(const k of WEATHER_KEYS)out[k]=current[k]+(target[k]-current[k])*a;
 // Finish the outgoing precipitation before starting the other phase. No
 // simultaneous pure-rain and pure-snow particles or rain bed under snowfall.
 out.rain=rain+(((target.rain??0)>0&&snow>.005?0:target.rain??0)-rain)*a;
 out.snow=snow+(((target.snow??0)>0&&rain>.005?0:target.snow??0)-snow)*a;
 if(out.rain<.005&&!(target.rain>0))out.rain=0;if(out.snow<.005&&!(target.snow>0))out.snow=0;
 return out;
}

/** Solar-relative instants on the calendar date AT THE SITE. Only called when
 * selecting a moment, never per frame. No browser-local clock assumptions. */
export function momentDate(moment,reference,site){
 const ref=new Date(reference);if(!Object.hasOwn(MOMENTS,moment))throw new RangeError('Unknown moment');
 if(moment==='real')return {date:ref,polar:null};
 let parts;try{parts=new Intl.DateTimeFormat('en-CA',{timeZone:site.timeZone??'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(ref)}catch{parts=new Intl.DateTimeFormat('en-CA',{timeZone:'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(ref)}
 const get=k=>Number(parts.find(p=>p.type===k).value),mid=Date.UTC(get('year'),get('month')-1,get('day'),12)-site.lon*240000;
 const altitude=t=>solar(t,site.lat,site.lon).altitude;
 // Find true solar noon (equation of time included) with a bounded search.
 let lo=mid-3600000,hi=mid+3600000;
 for(let i=0;i<28;i++){const a=lo+(hi-lo)/3,b=hi-(hi-lo)/3;if(altitude(a)<altitude(b))lo=a;else hi=b}
 const noon=(lo+hi)/2,midnight=noon+43200000,threshold=-.01454;
 let rise=null,set=null;
 for(let t=noon-43200000;t<noon+43200000;t+=600000){const a=altitude(t)-threshold,b=altitude(t+600000)-threshold;if(a*b>0)continue;let l=t,h=t+600000;for(let j=0;j<24;j++){const m=(l+h)/2;if((altitude(l)-threshold)*(altitude(m)-threshold)<=0)h=m;else l=m}if(a<b)rise=(l+h)/2;else set=(l+h)/2}
 const polar=rise===null||set===null?(altitude(noon)>threshold?'polar-day':'polar-night'):null;
 // At polar latitudes the requested names designate phases of the solar arc;
 // no invented sunrise/sunset or promise of darkness during midnight sun.
 const times=polar?{morning:noon-21600000,afternoon:noon,evening:noon+21600000,night:midnight}:{morning:rise+Math.min(5400000,(set-rise)*.16),afternoon:noon+Math.min(7200000,(set-rise)*.15),evening:set-Math.min(1500000,(set-rise)*.06),night:set+(86400000-(set-rise))*.4};
 return {date:new Date(Math.round(times[moment])),polar,sunrise:rise,sunset:set,solarNoon:noon};
}
// Generic local passerine silhouette: a regional interpretation, not a sighting.
export const BIRD_SPECIES=Object.freeze({id:'small-passerine',perchSeconds:9,flightSeconds:20,windowSeconds:480});
export function birdState(seconds,id){const clock=seconds+id*73,slot=Math.floor(clock/BIRD_SPECIES.windowSeconds),phase=clock-slot*BIRD_SPECIES.windowSeconds,v=Math.sin(slot*71.3+id*17.1)*43758.5453,start=(v-Math.floor(v))*260,age=phase-start;return {visible:age>=0&&age<29,perched:age>=0&&age<9,progress:Math.max(0,Math.min(1,(age-9)/20))};}

// Civil seasons are a broad regional acoustic interpretation, not phenology.
export function seasonAt(month,latitude){
 const north=['winter','winter','spring','spring','spring','summer','summer','summer','autumn','autumn','autumn','winter'][month-1];
 return !Number.isFinite(latitude)?null:latitude<0?({winter:'summer',summer:'winter',spring:'autumn',autumn:'spring'})[north]:north;
}
