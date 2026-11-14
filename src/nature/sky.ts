import {createStorm} from './storm';
// @ts-ignore Pure regional interpretation; the existing owner supplies all time.
import {weatherMetrics,regionalTemperature,coldHistory,icePotential,stormEnvelope,naturalChoice,noise} from './weather-model.mjs';
// @ts-ignore Artistic responses to this owner’s one calendar/weather state.
import {sensitiveConditions} from '../earthlife/sensitive-model.mjs';
// @ts-ignore Shared material uniforms, no extra render pass.
import {sensitiveUniforms} from '../earthlife/sensitive-state.mjs';
// @ts-ignore Same geographic bank index as the acoustic owner.
import {proximityIndex} from '../audio/context.mjs';
import {riverAreas,riverLines} from '../living/geography';
// @ts-ignore Shader specialization changes only when the structural profile changes.
import {setLifeCapabilities} from '../earthlife/capabilities.mjs';
import * as THREE from 'three';
import {windUniform,seasonUniform} from '../living/atmosphere';
import {createCloudLayer} from '../earthlife/cloud-layer';
import {createFauna} from '../earthlife/fauna-render';
import {createMicroEvents} from '../earthlife/micro-events';
import {createAtmosphere} from './atmosphere';
import {createPrecipitation} from './precipitation';
import {createSnowWeather} from './snow-weather';
// @ts-ignore Shared shader module.
import {lifeUniforms,updateLifeTime} from '../earthlife/state.mjs';
import {lifeSettings} from '../earthlife/preferences';
// @ts-ignore World budget shared across all loaded cells.
import {WorldLifeBudget} from '../earthlife/budget.mjs';
// @ts-ignore Pure shared solar and weather model.
import {solar,weatherStep,WEATHER,MOMENTS,MONTHS,momentDate,civilParts,representativeMonth} from './climate.mjs';
// @ts-ignore Shared civil season, also consumed by the acoustic context.
import {seasonAt} from './climate.mjs';
import {environmentalTime,environmentalWind,groundAppearance,updateGroundAppearance} from './surfaces';
// @ts-ignore Approximate topocentric orbit, driven by this one calendar.
import {lunar,lunarVisibility} from './moon.mjs';
// @ts-ignore Pure, testable diffuse night adaptation.
import {nightLight} from './night-light.mjs';

export function naturalSky(scene:THREE.Scene,sun:THREE.DirectionalLight,height:(x:number,z:number)=>number|null,site:{lat:number;lon:number;timeZone?:string},hemisphere:THREE.HemisphereLight,player:THREE.Object3D,camera:THREE.Object3D=player){
 const params=new URLSearchParams(location.search),lifecycle=new AbortController(),storageKey=`endless-earth-atmosphere-v1:${site.lat}:${site.lon}`;
 let saved:any=null;try{saved=JSON.parse(localStorage.getItem(storageKey)??'null')}catch{/* Private storage: session choices still work. */}
 let fixed=params.get('date')?new Date(params.get('date')!):null;if(fixed&&!Number.isFinite(+fixed))fixed=null;
 let moment=Object.hasOwn(MOMENTS,params.get('moment')??'')?params.get('moment')!:Object.hasOwn(MOMENTS,saved?.moment??'')?saved.moment:'real';
 let weatherKey=Object.hasOwn(WEATHER,params.get('weather')??'')?params.get('weather')!:Object.hasOwn(WEATHER,saved?.weather??'')?saved.weather:'clear';
 const requestedSnow=Number(params.get('snowfall')),weatherTarget=(key:string)=>key==='snow'&&params.has('perf')&&params.has('snowfall')&&Number.isFinite(requestedSnow)?{...WEATHER.snow,snow:THREE.MathUtils.clamp(requestedSnow,0,1)}:WEATHER[key];
 let selected=momentDate(moment,fixed??new Date(),site),selectedTime=+selected.date;
 if(!fixed&&!params.has('moment')&&moment!=='real'&&Number.isFinite(saved?.dateMs))selectedTime=saved.dateMs;
 const storedMonth=params.has('month')?Number(params.get('month')):!fixed?saved?.month:null;
 let manualMonth:number|null=Number.isInteger(storedMonth)&&storedMonth>=1&&storedMonth<=12?storedMonth:null;
 if(manualMonth!==null){const ref=!fixed&&Number.isFinite(saved?.dateMs)?saved.dateMs:selectedTime;selectedTime=+representativeMonth(ref,manualMonth,site);}
 if(manualMonth!==null&&['sunrise','sunset'].includes(moment))selectedTime=+momentDate(moment,selectedTime,site).date;
 let daylight=momentDate('afternoon',selectedTime,site),realAnchor=Date.now();
 let effectiveTime=selectedTime,fromTime=selectedTime,timeBlend=1,demo=params.get('time')==='demo';
 let elapsed=0,state={...weatherTarget(weatherKey)},target=weatherTarget(weatherKey),weatherTau=45,commandAge=120,weatherAge=120,commandRevision=0;
 let evolution=!!saved?.evolution,nextEvolution=180,evolutionSlot=0,cold=coldHistory(selectedTime,site.lat),ice=0,previousClimateTime=selectedTime;
 let reduceLightning=saved?.reduceLightning??matchMedia('(prefers-reduced-motion: reduce)').matches;
 const persist=()=>{try{localStorage.setItem(storageKey,JSON.stringify({moment,weather:weatherKey,dateMs:selectedTime,month:manualMonth,evolution,reduceLightning}))}catch{/* Session state is authoritative when storage is denied. */}};
 const command=()=>{commandAge=0;commandRevision++};
 const chooseMoment=(name:string)=>{command();moment=name;demo=false;let reference=manualMonth===null?fixed??new Date():new Date(selectedTime);if(name==='real'&&manualMonth!==null)reference=representativeMonth(fixed??new Date(),manualMonth,site);selected=momentDate(moment,reference,site);selectedTime=+selected.date;daylight=momentDate('afternoon',selectedTime,site);realAnchor=Date.now();fromTime=effectiveTime;timeBlend=0;persist()};
 const chooseMonth=(month:number)=>{if(!Number.isInteger(month)||month<1||month>12)return;command();manualMonth=month;demo=false;selectedTime=+representativeMonth(timeBlend<1?selectedTime:effectiveTime,month,site);effectiveTime=selectedTime;fromTime=selectedTime;timeBlend=1;realAnchor=Date.now();if(['sunrise','sunset'].includes(moment)){selectedTime=+momentDate(moment,selectedTime,site).date;effectiveTime=fromTime=selectedTime;}daylight=momentDate('afternoon',selectedTime,site);persist()};
 if(params.has('perf'))addEventListener('nature-test-date',((event:CustomEvent)=>{const date=event.detail===null?null:new Date(event.detail);if(date===null||Number.isFinite(+date)){fixed=date;manualMonth=null;const reference=date??new Date();selected=momentDate(moment,reference,site);selectedTime=+selected.date;effectiveTime=selectedTime;timeBlend=1;daylight=momentDate('afternoon',selectedTime,site);realAnchor=Date.now()}}) as EventListener,{signal:lifecycle.signal});
 // Diagnostic command to the existing weather owner, with its normal transition.
 // It creates no clock or production control and is removed with this owner.
 if(params.has('perf'))addEventListener('nature-test-wind',((event:CustomEvent)=>{const mean=event.detail;if(mean!==null&&!Number.isFinite(mean))return;command();target=mean===null?weatherTarget(weatherKey):{...weatherTarget(weatherKey),wind:THREE.MathUtils.clamp(mean,0,1)};weatherTau=.65;}) as EventListener,{signal:lifecycle.signal});
 const controls=document.createElement('details');controls.className='nature-controls';
 controls.innerHTML=`<summary>Calendrier, heure et météo</summary><label>Mois de l'année<select aria-label="Mois de l'année" aria-describedby="calendar-note">${MONTHS.map((label:string,i:number)=>`<option value="${i+1}">${label}</option>`).join('')}</select></label><small id="calendar-note">Le 15 du mois, à heure locale conservée.</small><label>Moment de la journée<select aria-label="Moment de la journée">${Object.entries(MOMENTS).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select></label><label>Météo simulée<select aria-label="Météo simulée" aria-describedby="weather-note"><option value="clear">Ensoleillé</option><option value="cloudy">Nuageux</option><option value="overcast">Couvert</option><option value="mist">Brumeux</option><option value="rain">Pluvieux</option><option value="storm">Orageux</option><option value="snow">Neigeux</option></select></label><small id="weather-note">Une atmosphère choisie, sans prévision météo.</small>`;
 const status=document.createElement('output');status.className='nature-status';status.setAttribute('aria-live','polite');controls.append(status);document.querySelector('#app')!.append(controls);
 const monthSelect=controls.querySelector<HTMLSelectElement>('select')!;
 const momentSelect=controls.querySelector<HTMLSelectElement>('select[aria-label="Moment de la journée"]')!,weatherSelect=controls.querySelector<HTMLSelectElement>('select[aria-label="Météo simulée"]')!;
 monthSelect.value=String(manualMonth??civilParts(selectedTime,site.timeZone).month);monthSelect.onchange=()=>chooseMonth(Number(monthSelect.value));momentSelect.value=moment;momentSelect.onchange=()=>chooseMoment(momentSelect.value);weatherSelect.value=weatherKey;weatherSelect.onchange=()=>{command();weatherAge=0;weatherKey=weatherSelect.value;target=weatherTarget(weatherKey);weatherTau=5.5;evolution=false;evolutionToggle.checked=false;persist()};
 const evolutionToggle=document.createElement('input');evolutionToggle.type='checkbox';evolutionToggle.checked=evolution;evolutionToggle.setAttribute('aria-label','Évolution naturelle');evolutionToggle.onchange=()=>{evolution=evolutionToggle.checked;nextEvolution=elapsed+120;persist()};const evolutionLabel=document.createElement('label');evolutionLabel.append(evolutionToggle,'Évolution naturelle');controls.append(evolutionLabel);
 const comfort=document.createElement('input');comfort.type='checkbox';comfort.checked=reduceLightning;comfort.setAttribute('aria-label','Éclairs atténués');comfort.onchange=()=>{reduceLightning=comfort.checked;persist()};const comfortLabel=document.createElement('label');comfortLabel.append(comfort,'Éclairs atténués');controls.append(comfortLabel);
 if(params.has('perf')){const secondary=document.createElement('button');secondary.type='button';secondary.textContent='Diagnostic : horloge ×72';secondary.onclick=()=>{demo=!demo;fromTime=effectiveTime;secondary.setAttribute('aria-pressed',String(demo))};controls.append(secondary)}
 const stormEffects=createStorm(scene),atmosphere=createAtmosphere(scene),cloudLayer=createCloudLayer(scene),rain=createPrecipitation(scene),snow=createSnowWeather(scene,site.lat),budget=new WorldLifeBudget(lifeSettings.profile),fauna=createFauna(scene,budget,height),events=createMicroEvents(scene,budget,height);
 const previousLifeBudget=scene.userData.lifeBudget;scene.userData.lifeBudget=budget;
 let lifeRevision=-1,cpuElapsed=Infinity,calm=0,stamp=-1;const localWind={x:0,z:0,speed:0,gust:0},rainWind=new THREE.Vector2(),sunDirection=new THREE.Vector3();
 const hourFormat=new Intl.DateTimeFormat('en-GB',{timeZone:site.timeZone??'UTC',hourCycle:'h23',hour:'2-digit',minute:'2-digit',second:'2-digit'});
 const dateFormat=new Intl.DateTimeFormat('fr-FR',{timeZone:site.timeZone??'UTC',hour:'2-digit',minute:'2-digit',day:'numeric',month:'short',year:'numeric'}),horizon=new THREE.Color(),zenith=new THREE.Color();
 let solarSecond=NaN,solarState=solar(effectiveTime,site.lat,site.lon),moonState=lunar(effectiveTime,site.lat,site.lon),localTime='',localHour=0;
 const nightSky=new THREE.Color(0xc4cfdf),nightGround=new THREE.Color(0xa7b4c6);
 const palette={dayHorizon:new THREE.Color(0xc2d0d4),warm:new THREE.Color(0xd4b19b),cloudHorizon:new THREE.Color(0x89979f),dayZenith:new THREE.Color(0x719bb9),cloudZenith:new THREE.Color(0x75848e),sunWarm:new THREE.Color(0xffd3a3),white:new THREE.Color(0xffffff)};
 const previousAcousticClimate=scene.userData.acousticClimate,environment:any={worldTimeMs:0,solar:{altitude:0},weather:state,acousticWeather:{...state,gust:0},wind:localWind,transition:{revision:0,commandRevision:0,manual:false},simulation:true};
 scene.userData.acousticClimate=environment;
 const conditions={habitat:'unknown',day:0,rain:0,wind:.35,meanWind:.35,month:1,latitude:site.lat,longitude:site.lon,altitude:0};
 const provenance={habitat:'mapped classification, unknown preserved',wind:'simulated',weather:'simulated, not forecast',sky:'Three.js Preetham with artistic night and two cloud altitudes',birds:'generic artistic silhouettes',current:'illustrative surface ripples; hydrological flow unknown'},resources={cpuObjects:11,extraDrawCallsMax:12,extraTextures:0,cloudMaterials:1,birdMaterials:1,particleMaterials:1,rainMaterials:1,snowMaterials:1,snowSeedBytes:26400};
 let banks:any=null,bankCount=0,bankQuery:any=null,bankX=Infinity,bankZ=Infinity;
 let habitatX=NaN,habitatZ=NaN,habitatSource:any=null,cachedHabitat='unknown';
 const previousClimate=scene.userData.climate;scene.userData.climate=environment;
 const update=(dt:number,_eco:boolean,wallDt=dt)=>{
  // Main's movement timestep is capped for collisions. User commands use wall
  // time so a slow frame cannot stretch a two-second atmospheric transition.
  const transitionDt=Math.max(0,Math.min(wallDt,1));
  commandAge+=transitionDt;weatherAge+=transitionDt;elapsed+=transitionDt;environmentalTime.value+=transitionDt;if(evolution&&elapsed>=nextEvolution){evolutionSlot++;weatherKey=naturalChoice(civilParts(effectiveTime,site.timeZone).month,Math.floor(effectiveTime/86400000)+evolutionSlot,weatherKey);target=weatherTarget(weatherKey);weatherTau=45;weatherAge=0;weatherSelect.value=weatherKey;nextEvolution=elapsed+180+noise(evolutionSlot+17)*300;}
  const storm=stormEnvelope(weatherAge,Math.floor(effectiveTime/86400000));
  const evolvingTarget=weatherKey==='storm'?{...target,rain:target.rain*(.24+.76*storm.rain),wind:target.wind*(.55+.45*storm.wind),electric:storm.electric}:{...target,electric:0};
  state=weatherStep(state,evolvingTarget,transitionDt,state,weatherTau);windUniform.value=elapsed;updateLifeTime(elapsed,state.wind*(1-calm*.45),player.position.x,player.position.z,localWind);environmentalWind.value=localWind.speed;
  if(demo)effectiveTime+=dt*72000;
  else{timeBlend=Math.min(1,timeBlend+transitionDt/2.4);const blend=timeBlend*timeBlend*(3-2*timeBlend),to=moment==='real'?(manualMonth===null?+(fixed??new Date()):selectedTime+(fixed?0:Date.now()-realAnchor)):selectedTime;effectiveTime=timeBlend===1?to:fromTime+(to-fromTime)*blend;}
  const date=new Date(effectiveTime),second=Math.floor(effectiveTime/1000);
  updateGroundAppearance(date,site.lat,state.rain,transitionDt);
  if(second!==solarSecond){solarSecond=second;solarState=solar(date,site.lat,site.lon);moonState=lunar(date,site.lat,site.lon);localTime=dateFormat.format(date);const hour=hourFormat.format(date);localHour=Number(hour.slice(0,2))+Number(hour.slice(3,5))/60+Number(hour.slice(6,8))/3600}
  const s=solarState,day=THREE.MathUtils.smoothstep(s.altitude,-.18,.12),lightDay=THREE.MathUtils.smoothstep(s.altitude,-.11,.28),warm=Math.max(0,1-Math.abs(s.altitude-.035)/.24)*day;
  const calendarDelta=(effectiveTime-previousClimateTime)/3600000;
  if(Math.abs(calendarDelta)>6)cold=coldHistory(effectiveTime,site.lat);
  else if(calendarDelta>0)cold=Math.max(0,cold+(-regionalTemperature(effectiveTime,day,state.snow,site.lat)-.5)*calendarDelta);
  previousClimateTime=effectiveTime;
  const temperature=regionalTemperature(effectiveTime,day,state.snow,site.lat);
  ice+=(icePotential(cold,temperature,day)-ice)*(1-Math.exp(-transitionDt/(temperature>1?30:90)));
  state.temperatureC=temperature;
  environment.metrics=weatherMetrics({time:effectiveTime,day,state,wind:localWind,wetness:groundAppearance.earthWetness.value,cold,ice,latitude:site.lat});
  environment.stormPhase=weatherKey==='storm'?storm.phase:'calm';environment.naturalEvolution=evolution;environment.reduceLightning=reduceLightning;
  seasonUniform.value=s.month>=9&&s.month<=11?.7:s.month<=2?.4:0;
  horizon.set(0x101a2b).lerp(palette.dayHorizon,day).lerp(palette.warm,warm*.36*(1-state.cloud*.6)).lerp(palette.cloudHorizon,state.cloud*.48*day).multiplyScalar(1-state.rain*.38);
  zenith.set(0x030915).lerp(palette.dayZenith,day).lerp(palette.cloudZenith,state.cloud*.68*day).multiplyScalar(1-state.rain*.46);
  (scene.background as THREE.Color).copy(horizon);const fog=scene.fog as THREE.Fog;fog.color.copy(horizon);fog.near=320-state.mist*290;fog.far=1450-state.mist*1120;
  const count=riverAreas.length+riverLines.length;if(count!==bankCount){bankCount=count;banks=proximityIndex(riverAreas.length?riverAreas.flatMap(a=>a.rings.map(r=>[...r,r[0]])):riverLines)}
  if(banks&&(!bankQuery||Math.hypot(player.position.x-bankX,player.position.z-bankZ)>3)){bankX=player.position.x;bankZ=player.position.z;bankQuery=banks.query(player.position,180)}
  const bank=bankQuery?.point,bankHeight=bank?height(bank.x,bank.z):null;
  const sensitive=sensitiveConditions({day,hour:localHour,month:s.month,rain:state.rain,cloud:state.cloud,wind:localWind.speed,temperature:environment.metrics.temperatureC,humidity:environment.metrics.humidityPct/100,altitude:bankHeight===null?100:player.position.y-bankHeight,bankDistance:bankQuery?.distance??1000,dayKey:Math.floor(effectiveTime/86400000),wetness:groundAppearance.earthWetness.value});
  sensitiveUniforms.worldDew.value=sensitive.dew;sensitiveUniforms.worldWet.value=groundAppearance.earthWetness.value;sensitiveUniforms.valleyTint.value.copy(horizon);
  const mist=sensitiveUniforms.valleyMist.value;mist.w+=(sensitive.mist-mist.w)*(1-Math.exp(-transitionDt/9));if(bank)mist.set(bank.x,bank.z,bankHeight??0,mist.w);environment.sensitive={...sensitive,mist:mist.w,bankDistance:bankQuery?.distance??null};
  sun.intensity=Math.pow(Math.max(0,Math.sin(s.altitude)),.72)*2.5*(1-state.cloud*.83)*(1-state.rain*.32);sun.color.set(0xfff4e4).lerp(palette.sunWarm,warm*.82);
  const moonlight=lunarVisibility(moonState,state,day)*moonState.illumination*Math.max(0,Math.sin(moonState.altitude));
  const diffuseNight=nightLight({lightDay,moonlight,cloud:state.cloud,rain:state.rain});
  hemisphere.intensity=diffuseNight.intensity;
  hemisphere.color.copy(zenith).lerp(palette.white,.65).lerp(nightSky,diffuseNight.nightWeight);
  hemisphere.groundColor.set(0x65705d).lerp(nightGround,diffuseNight.nightWeight);
  environment.diffuseNight=diffuseNight;
  sunDirection.set(Math.sin(s.azimuth)*Math.cos(s.altitude),Math.sin(s.altitude),-Math.cos(s.azimuth)*Math.cos(s.altitude));sun.position.copy(player.position).addScaledVector(sunDirection,150);sun.target.position.copy(player.position);sun.target.updateMatrixWorld();
  atmosphere.update(camera.position,sunDirection,day,state.cloud,state.mist,horizon,zenith);
  const moonVisibility=lunarVisibility(moonState,state,day);atmosphere.moon(moonState,moonVisibility,sunDirection);environment.moon={...moonState,visibility:moonVisibility,model:'Schlyter approximate topocentric orbit; shared M11 date'};
  if(lifeRevision!==lifeSettings.revision){lifeRevision=lifeSettings.revision;budget.setProfile(lifeSettings.profile);setLifeCapabilities(lifeSettings.profile)}
  const profile=lifeSettings.profile;
  lifeUniforms.lifeVegetation.value=profile.vegetation;lifeUniforms.lifeFine.value=profile.fine;lifeUniforms.lifeWater.value=profile.water;lifeUniforms.lifeCloudCover.value=state.cloud;lifeUniforms.lifeShadow.value=profile.shadows*profile.clouds;
  lifeUniforms.lifeSun.value.copy(sunDirection);lifeUniforms.lifeHour.value=localHour;
  // The river receives the same simulated sky/weather/light as the scene.
  lifeUniforms.lifeRain.value=state.rain;lifeUniforms.lifeDay.value=day;lifeUniforms.lifeMoon.value.fromArray(moonState.direction);lifeUniforms.lifeMoonlight.value=moonlight;lifeUniforms.lifeIce.value=ice;
  lifeUniforms.lifeHorizon.value.copy(horizon);lifeUniforms.lifeZenith.value.copy(zenith);
  lifeUniforms.lifeSunColor.value.copy(sun.color);lifeUniforms.lifeSunIntensity.value=sun.intensity;
  environment.elapsedSeconds=elapsed;environment.worldTimeMs=effectiveTime;environment.targetWeather=weatherKey;stormEffects.update(elapsed,environment,player.position,reduceLightning);
  cloudLayer.update(camera.position,day,profile.clouds,lifeSettings.name==='eco',warm,state.rain);
  rainWind.set(localWind.x,localWind.z);
  rain.update(camera.position,height(player.position.x,player.position.z)??player.position.y,elapsed,state.rain,rainWind,day,lifeSettings.name,height);
  const snowState=snow.update(camera.position,player.position,dt,transitionDt,elapsed,date,state,rainWind,day,lifeSettings.name);
  if(snowState.cover>0)hemisphere.groundColor.lerp(palette.white,snowState.cover*.35*lightDay);
  cpuElapsed+=dt;if(cpuElapsed>=1/Math.max(1,profile.cpuHz)){
   cpuElapsed=0;const started=performance.now();if(player.position.x!==habitatX||player.position.z!==habitatZ||habitatSource!==scene.userData.lifeHabitat){habitatX=player.position.x;habitatZ=player.position.z;habitatSource=scene.userData.lifeHabitat;cachedHabitat=habitatSource?.(habitatX,habitatZ)??'unknown'}
   conditions.habitat=cachedHabitat;conditions.day=day;conditions.rain=state.rain;conditions.wind=localWind.speed;conditions.meanWind=lifeUniforms.lifeMeanWind.value;conditions.month=s.month;conditions.altitude=player.position.y;
   const activeBirds=fauna.update(elapsed,player.position,conditions),micro=events.update(elapsed,player.position,conditions);calm=micro.calm;
   const diagnostic=scene.userData.earthLife??={time:0,profile:'balanced',budget:{birds:0,particles:0,events:0},limits:profile,activeBirds:0,activeEvents:0,habitat:'unknown',wind:{x:0,z:0,speed:0,gust:0},cpuMs:0,maxCpuMs:0,provenance,resources};
   diagnostic.time=elapsed;diagnostic.profile=lifeSettings.name;Object.assign(diagnostic.budget,budget.allocated);diagnostic.limits=profile;diagnostic.activeBirds=activeBirds;diagnostic.activeEvents=micro.active;diagnostic.habitat=cachedHabitat;Object.assign(diagnostic.wind,localWind);diagnostic.resources.cpuObjects=11+Number(profile.particles>0);diagnostic.cpuMs=performance.now()-started;diagnostic.maxCpuMs=Math.max(diagnostic.maxCpuMs,diagnostic.cpuMs);
  }
  // Both consumers retain this one environment; only geographic queries are throttled.
  Object.assign(environment,{worldTimeMs:+date,moment,mode:demo?'demo':moment,date:date.toISOString(),localTime,localHour,season:seasonAt(s.month,site.lat),timeZone:site.timeZone??'UTC',polar:daylight.polar,calendar:{manual:manualMonth!==null,month:s.month,representativeDay:manualMonth===null?null:15,sunrise:daylight.sunrise,sunset:daylight.sunset,solarNoon:daylight.solarNoon},targetWeather:weatherKey,weatherTau,solar:s,effectiveMeanWind:lifeUniforms.lifeMeanWind.value,starVisibility:atmosphere.starVisibility,rainDrops:state.rain>.005?rain.count:0});
  Object.assign(environment.acousticWeather,state,{wind:localWind.speed,gust:localWind.gust});
  environment.metrics.snowCover=snowState.cover;environment.groundWetness=groundAppearance.earthWetness.value;environment.snow={...snowState};environment.groundSnowAt=snow.sample;environment.acousticWeather.snowCover=snowState.cover;
  environment.cloudMotion={drift:lifeUniforms.lifeCloudDrift.value.toArray(),morph:lifeUniforms.lifeCloudMorph.value.toArray(),baseHeight:230,upperHeight:540};
  environment.transition.revision++;environment.transition.commandRevision=commandRevision;environment.transition.manual=commandAge<25;
  if(Math.floor(elapsed*2)!==stamp||commandAge<.6){stamp=Math.floor(elapsed*2);monthSelect.value=String(s.month);const summerSnow=weatherKey==='snow'&&seasonAt(s.month,site.lat)==='summer';controls.querySelector('#weather-note')!.textContent=summerSnow?'Neige en été : simulation volontaire, hors climat habituel.':'Une atmosphère choisie, sans prévision météo.';status.textContent=`${MOMENTS[moment]} · ${localTime} (${site.timeZone??'UTC'})${daylight.polar==='polar-day'?' · soleil de minuit':daylight.polar==='polar-night'?' · nuit polaire':''}${weatherKey==='snow'&&['fallback','unavailable'].includes(scene.userData.snow?.exposure)?' · neige visuelle indisponible':''}`;}
 };
 return Object.assign(update,{dispose(){if(scene.userData.lifeBudget===budget)scene.userData.lifeBudget=previousLifeBudget;if(scene.userData.acousticClimate===environment)scene.userData.acousticClimate=previousAcousticClimate;scene.userData.climate=previousClimate;lifecycle.abort();stormEffects.dispose();atmosphere.dispose();cloudLayer.dispose();rain.dispose();snow.dispose();fauna.dispose();events.dispose();budget.clear();controls.remove()}});
}
