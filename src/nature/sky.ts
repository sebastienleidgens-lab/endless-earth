// @ts-ignore Shader specialization changes only when the structural profile changes.
import {setLifeCapabilities} from '../earthlife/capabilities.mjs';
import * as THREE from 'three';
import {windUniform,seasonUniform} from '../living/atmosphere';
import {createCloudLayer} from '../earthlife/cloud-layer';
import {createFauna} from '../earthlife/fauna-render';
import {createMicroEvents} from '../earthlife/micro-events';
import {createAtmosphere} from './atmosphere';
import {createPrecipitation} from './precipitation';
// @ts-ignore Shared shader module.
import {lifeUniforms,updateLifeTime} from '../earthlife/state.mjs';
import {lifeSettings} from '../earthlife/preferences';
// @ts-ignore World budget shared across all loaded cells.
import {WorldLifeBudget} from '../earthlife/budget.mjs';
// @ts-ignore Pure shared solar and weather model.
import {solar,weatherStep,WEATHER,MOMENTS,momentDate} from './climate.mjs';
// @ts-ignore Shared civil season, also consumed by the acoustic context.
import {seasonAt} from './climate.mjs';
import {environmentalTime,environmentalWind} from './surfaces';

export function naturalSky(scene:THREE.Scene,sun:THREE.DirectionalLight,height:(x:number,z:number)=>number|null,site:{lat:number;lon:number;timeZone?:string},hemisphere:THREE.HemisphereLight,player:THREE.Object3D,camera:THREE.Object3D=player){
 const params=new URLSearchParams(location.search),lifecycle=new AbortController(),storageKey=`endless-earth-atmosphere-v1:${site.lat}:${site.lon}`;
 let saved:any=null;try{saved=JSON.parse(localStorage.getItem(storageKey)??'null')}catch{/* Private storage: session choices still work. */}
 let fixed=params.get('date')?new Date(params.get('date')!):null;if(fixed&&!Number.isFinite(+fixed))fixed=null;
 let moment=Object.hasOwn(MOMENTS,params.get('moment')??'')?params.get('moment')!:Object.hasOwn(MOMENTS,saved?.moment??'')?saved.moment:'real';
 let weatherKey=Object.hasOwn(WEATHER,params.get('weather')??'')?params.get('weather')!:Object.hasOwn(WEATHER,saved?.weather??'')?saved.weather:'clear';
 let selected=momentDate(moment,fixed??new Date(),site),selectedTime=+selected.date;
 if(!fixed&&!params.has('moment')&&moment!=='real'&&Number.isFinite(saved?.dateMs))selectedTime=saved.dateMs;
 let effectiveTime=selectedTime,fromTime=selectedTime,timeBlend=1,demo=params.get('time')==='demo';
 let elapsed=0,state={...WEATHER[weatherKey]},target=WEATHER[weatherKey],weatherTau=45,commandAge=Infinity,commandRevision=0;
 const persist=()=>{try{localStorage.setItem(storageKey,JSON.stringify({moment,weather:weatherKey,dateMs:selectedTime}))}catch{/* Session state is authoritative when storage is denied. */}};
 const command=()=>{commandAge=0;commandRevision++};
 const chooseMoment=(name:string)=>{command();moment=name;demo=false;selected=momentDate(moment,fixed??new Date(),site);selectedTime=+selected.date;fromTime=effectiveTime;timeBlend=0;persist()};
 if(params.has('perf'))addEventListener('nature-test-date',((event:CustomEvent)=>{const date=event.detail===null?null:new Date(event.detail);if(date===null||Number.isFinite(+date)){fixed=date;const reference=date??new Date();selected=momentDate(moment,reference,site);selectedTime=+selected.date;effectiveTime=selectedTime;timeBlend=1}}) as EventListener,{signal:lifecycle.signal});
 const controls=document.createElement('details');controls.className='nature-controls';
 controls.innerHTML=`<summary>Heure et météo</summary><label>Moment de la journée<select aria-label="Moment de la journée">${Object.entries(MOMENTS).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select></label><label>Météo simulée<select aria-label="Météo simulée"><option value="clear">Ensoleillé</option><option value="cloudy">Nuageux</option><option value="overcast">Couvert</option><option value="mist">Brumeux</option><option value="rain">Pluvieux</option><option value="storm">Orageux</option></select></label><small>Une atmosphère choisie, sans prévision météo.</small>`;
 const status=document.createElement('output');status.className='nature-status';status.setAttribute('aria-live','polite');controls.append(status);document.querySelector('#app')!.append(controls);
 const selects=controls.querySelectorAll('select');selects[0].value=moment;selects[0].onchange=()=>chooseMoment(selects[0].value);selects[1].value=weatherKey;selects[1].onchange=()=>{command();weatherKey=selects[1].value;target=WEATHER[weatherKey];weatherTau=.65;persist()};
 if(params.has('perf')){const secondary=document.createElement('button');secondary.type='button';secondary.textContent='Diagnostic : horloge ×72';secondary.onclick=()=>{demo=!demo;fromTime=effectiveTime;secondary.setAttribute('aria-pressed',String(demo))};controls.append(secondary)}
 const atmosphere=createAtmosphere(scene),cloudLayer=createCloudLayer(scene),rain=createPrecipitation(scene),budget=new WorldLifeBudget(lifeSettings.profile),fauna=createFauna(scene,budget,height),events=createMicroEvents(scene,budget);
 let lifeRevision=-1,cpuElapsed=Infinity,calm=0,stamp=-1;const localWind={x:0,z:0,speed:0,gust:0},rainWind=new THREE.Vector2(),sunDirection=new THREE.Vector3();
 const hourFormat=new Intl.DateTimeFormat('en-GB',{timeZone:site.timeZone??'UTC',hourCycle:'h23',hour:'2-digit',minute:'2-digit',second:'2-digit'});
 const dateFormat=new Intl.DateTimeFormat('fr-FR',{timeZone:site.timeZone??'UTC',hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'}),horizon=new THREE.Color(),zenith=new THREE.Color();
 const palette={dayHorizon:new THREE.Color(0xc2d0d4),warm:new THREE.Color(0xd4b19b),cloudHorizon:new THREE.Color(0x89979f),dayZenith:new THREE.Color(0x719bb9),cloudZenith:new THREE.Color(0x75848e),sunWarm:new THREE.Color(0xffd3a3),white:new THREE.Color(0xffffff)};
 const previousAcousticClimate=scene.userData.acousticClimate,environment:any={worldTimeMs:0,solar:{altitude:0},weather:state,acousticWeather:{...state,gust:0},wind:localWind,transition:{revision:0,commandRevision:0,manual:false},simulation:true};
 scene.userData.acousticClimate=environment;
 const conditions={habitat:'unknown',day:0,rain:0,wind:.35,meanWind:.35,month:1,latitude:site.lat,longitude:site.lon,altitude:0};
 const provenance={habitat:'mapped classification, unknown preserved',wind:'simulated',weather:'simulated, not forecast',sky:'Three.js Preetham with artistic night and two cloud altitudes',birds:'generic artistic silhouettes',current:'unverified artistic direction'},resources={cpuObjects:11,extraDrawCallsMax:12,extraTextures:0,cloudMaterials:1,birdMaterials:1,particleMaterials:1,rainMaterials:1};
 let habitatX=NaN,habitatZ=NaN,habitatSource:any=null,cachedHabitat='unknown';
 const previousClimate=scene.userData.climate;scene.userData.climate=environment;
 const update=(dt:number,_eco:boolean,wallDt=dt)=>{
  // Main's movement timestep is capped for collisions. User commands use wall
  // time so a slow frame cannot stretch a two-second atmospheric transition.
  const transitionDt=Math.max(0,Math.min(wallDt,1));
  commandAge+=transitionDt;elapsed+=dt;environmentalTime.value+=dt;state=weatherStep(state,target,weatherTau<45?transitionDt:dt,state,weatherTau);windUniform.value=elapsed;updateLifeTime(elapsed,state.wind*(1-calm*.45),player.position.x,player.position.z,localWind);environmentalWind.value=localWind.speed;
  if(demo)effectiveTime+=dt*72000;
  else{timeBlend=Math.min(1,timeBlend+transitionDt/2.4);const blend=timeBlend*timeBlend*(3-2*timeBlend),to=moment==='real'?+(fixed??new Date()):selectedTime;effectiveTime=timeBlend===1?to:fromTime+(to-fromTime)*blend;}
  const date=new Date(effectiveTime),s=solar(date,site.lat,site.lon),day=THREE.MathUtils.smoothstep(s.altitude,-.18,.12),lightDay=THREE.MathUtils.smoothstep(s.altitude,-.11,.28),warm=Math.max(0,1-Math.abs(s.altitude-.035)/.24)*day;
  seasonUniform.value=s.month>=9&&s.month<=11?.7:s.month<=2?.4:0;
  horizon.set(0x101a2b).lerp(palette.dayHorizon,day).lerp(palette.warm,warm*.36*(1-state.cloud*.6)).lerp(palette.cloudHorizon,state.cloud*.48*day).multiplyScalar(1-state.rain*.24);
  zenith.set(0x030915).lerp(palette.dayZenith,day).lerp(palette.cloudZenith,state.cloud*.68*day).multiplyScalar(1-state.rain*.34);
  (scene.background as THREE.Color).copy(horizon);const fog=scene.fog as THREE.Fog;fog.color.copy(horizon);fog.near=320-state.mist*290;fog.far=1450-state.mist*1120;
  sun.intensity=Math.max(0,Math.sin(s.altitude))*2.5*(1-state.cloud*.83)*(1-state.rain*.32);sun.color.set(0xfff4e4).lerp(palette.sunWarm,warm*.75);
  hemisphere.intensity=(.055+lightDay*1.5)*(1-state.cloud*.34)*(1-state.rain*.20);hemisphere.color.copy(zenith).lerp(palette.white,.65);hemisphere.groundColor.set(0x65705d).multiplyScalar(.4+lightDay*.6);
  sunDirection.set(Math.sin(s.azimuth)*Math.cos(s.altitude),Math.sin(s.altitude),-Math.cos(s.azimuth)*Math.cos(s.altitude));sun.position.copy(player.position).addScaledVector(sunDirection,150);sun.target.position.copy(player.position);sun.target.updateMatrixWorld();
  atmosphere.update(camera.position,sunDirection,day,state.cloud,state.mist,horizon,zenith);
  if(lifeRevision!==lifeSettings.revision){lifeRevision=lifeSettings.revision;budget.setProfile(lifeSettings.profile);setLifeCapabilities(lifeSettings.profile)}
  const profile=lifeSettings.profile;
  lifeUniforms.lifeVegetation.value=profile.vegetation;lifeUniforms.lifeFine.value=profile.fine;lifeUniforms.lifeWater.value=profile.water;lifeUniforms.lifeCloudCover.value=state.cloud;lifeUniforms.lifeShadow.value=profile.shadows*profile.clouds;
  lifeUniforms.lifeSun.value.copy(sunDirection);
  cloudLayer.update(camera.position,day,profile.clouds,lifeSettings.name==='eco',warm,state.rain);
  rainWind.set(localWind.x,localWind.z);
  rain.update(camera.position,height(player.position.x,player.position.z)??player.position.y,elapsed,state.rain,rainWind,day,lifeSettings.name);
  cpuElapsed+=dt;if(cpuElapsed>=1/Math.max(1,profile.cpuHz)){
   cpuElapsed=0;const started=performance.now();if(player.position.x!==habitatX||player.position.z!==habitatZ||habitatSource!==scene.userData.lifeHabitat){habitatX=player.position.x;habitatZ=player.position.z;habitatSource=scene.userData.lifeHabitat;cachedHabitat=habitatSource?.(habitatX,habitatZ)??'unknown'}
   conditions.habitat=cachedHabitat;conditions.day=day;conditions.rain=state.rain;conditions.wind=localWind.speed;conditions.meanWind=lifeUniforms.lifeMeanWind.value;conditions.month=s.month;conditions.altitude=player.position.y;
   const activeBirds=fauna.update(elapsed,player.position,conditions),micro=events.update(elapsed,player.position,conditions);calm=micro.calm;
   const diagnostic=scene.userData.earthLife??={time:0,profile:'balanced',budget:{birds:0,particles:0,events:0},limits:profile,activeBirds:0,activeEvents:0,habitat:'unknown',wind:{x:0,z:0,speed:0,gust:0},cpuMs:0,maxCpuMs:0,provenance,resources};
   diagnostic.time=elapsed;diagnostic.profile=lifeSettings.name;Object.assign(diagnostic.budget,budget.allocated);diagnostic.limits=profile;diagnostic.activeBirds=activeBirds;diagnostic.activeEvents=micro.active;diagnostic.habitat=cachedHabitat;Object.assign(diagnostic.wind,localWind);diagnostic.resources.cpuObjects=10+Number(profile.particles>0);diagnostic.cpuMs=performance.now()-started;diagnostic.maxCpuMs=Math.max(diagnostic.maxCpuMs,diagnostic.cpuMs);
  }
  // Both consumers retain this one environment; only geographic queries are throttled.
  const hour=hourFormat.format(date);
  Object.assign(environment,{worldTimeMs:+date,moment,mode:demo?'demo':moment,date:date.toISOString(),localTime:dateFormat.format(date),localHour:Number(hour.slice(0,2))+Number(hour.slice(3,5))/60+Number(hour.slice(6,8))/3600,season:seasonAt(s.month,site.lat),timeZone:site.timeZone??'UTC',polar:selected.polar,targetWeather:weatherKey,weatherTau,solar:s,effectiveMeanWind:lifeUniforms.lifeMeanWind.value,starVisibility:atmosphere.starVisibility,rainDrops:state.rain>.005?(lifeSettings.name==='eco'?260:lifeSettings.name==='quality'?900:520):0});
  Object.assign(environment.acousticWeather,state,{wind:localWind.speed,gust:localWind.gust});
  environment.transition.revision++;environment.transition.commandRevision=commandRevision;environment.transition.manual=commandAge<3.5;
  if(Math.floor(elapsed*2)!==stamp){stamp=Math.floor(elapsed*2);status.textContent=`${MOMENTS[moment]} · ${dateFormat.format(date)} (${site.timeZone??'UTC'})${selected.polar==='polar-day'?' · soleil de minuit':selected.polar==='polar-night'?' · nuit polaire':''}`;}
 };
 return Object.assign(update,{dispose(){if(scene.userData.acousticClimate===environment)scene.userData.acousticClimate=previousAcousticClimate;scene.userData.climate=previousClimate;lifecycle.abort();atmosphere.dispose();cloudLayer.dispose();rain.dispose();fauna.dispose();events.dispose();budget.clear();controls.remove()}});
}
