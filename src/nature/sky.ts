// @ts-ignore Shader specialization changes only when the structural profile changes.
import {setLifeCapabilities} from '../earthlife/capabilities.mjs';
import * as THREE from 'three';
import {windUniform,seasonUniform} from '../living/atmosphere';
import {createCloudLayer} from '../earthlife/cloud-layer';
import {createFauna} from '../earthlife/fauna-render';
import {createMicroEvents} from '../earthlife/micro-events';
// @ts-ignore Shared shader module.
import {lifeUniforms,updateLifeTime} from '../earthlife/state.mjs';
import {lifeSettings} from '../earthlife/preferences';
// @ts-ignore World budget shared across all loaded cells.
import {WorldLifeBudget} from '../earthlife/budget.mjs';
// @ts-ignore Continuous shared wind.
import {windAtWorld} from '../earthlife/wind.mjs';
// @ts-ignore Pure shared solar and weather model.
import {solar,weatherStep,WEATHER} from './climate.mjs';
import {environmentalTime,environmentalWind} from './surfaces';
export function naturalSky(scene:THREE.Scene,sun:THREE.DirectionalLight,height:(x:number,z:number)=>number|null,site:{lat:number;lon:number},hemisphere:THREE.HemisphereLight,player:THREE.Object3D){
 const params=new URLSearchParams(location.search),mode=params.get('time')==='demo'?'demo':'real';
 let fixed=params.get('date')?new Date(params.get('date')!):null;if(fixed&&!Number.isFinite(+fixed))fixed=null;
 const lifecycle=new AbortController();
 if(params.has('perf'))addEventListener('nature-test-date',((event:CustomEvent)=>{const date=new Date(event.detail);if(Number.isFinite(+date))fixed=date}) as EventListener,{signal:lifecycle.signal});
 let elapsed=0,state={...WEATHER.clear},target=WEATHER[params.get('weather') as keyof typeof WEATHER]??WEATHER.clear;
 const status=document.createElement('small');status.className='nature-status';status.style.cssText='display:block;color:#e6eddf;background:#283c34bb;border-radius:5px;padding:4px 8px;font:11px system-ui;pointer-events:none';document.querySelector('#app')!.append(status);
 const controls=document.createElement('details');controls.className='nature-controls';controls.style.cssText='position:fixed;right:14px;top:224px;background:#283c34df;color:#eef0e6;padding:8px;border-radius:6px;font:12px system-ui;z-index:20';controls.innerHTML='<summary>Temps et atmosphère</summary><label>Horloge <select aria-label="Horloge"><option value="real">Heure réelle du lieu</option><option value="demo">Démonstration · ×72</option></select></label><br><label>Météo simulée <select aria-label="Météo simulée"><option value="clear">Clair</option><option value="overcast">Couvert</option><option value="mist">Brume</option><option value="rain">Pluie · ambiance couverte</option></select></label>';document.querySelector('#app')!.append(controls);controls.append(status);let clockMode=mode;const selects=controls.querySelectorAll('select');selects[0].value=mode;selects[0].onchange=()=>{clockMode=selects[0].value as typeof mode};selects[1].value=params.get('weather')??'clear';selects[1].onchange=()=>{target=WEATHER[selects[1].value as keyof typeof WEATHER]};
 const skyGeo=new THREE.SphereGeometry(1400,24,12),skyMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{zenith:{value:new THREE.Color()},horizon:{value:new THREE.Color()}},vertexShader:'varying float elevation; void main(){elevation=normalize(position).y; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position.z=gl_Position.w;}',fragmentShader:'uniform vec3 zenith; uniform vec3 horizon; varying float elevation; void main(){gl_FragColor=vec4(mix(horizon,zenith,smoothstep(-.08,.75,elevation)),1.0);\n#include <colorspace_fragment>\n}'});
 const dome=new THREE.Mesh(skyGeo,skyMaterial);dome.frustumCulled=false;dome.renderOrder=10;scene.add(dome);
 const cloudLayer=createCloudLayer(scene),budget=new WorldLifeBudget(lifeSettings.profile),fauna=createFauna(scene,budget,height),events=createMicroEvents(scene,budget);
 let lifeRevision=-1,cpuElapsed=Infinity,calm=0;const localWind={x:0,z:0,speed:0,gust:0};
 let stamp=-1;const base=Date.now();const dateFormat=new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'});const horizon=new THREE.Color(),zenith=new THREE.Color();
 const palette={ccbd7d6:new THREE.Color(0xcbd7d6),ce4bd93:new THREE.Color(0xe4bd93),c99a9b0:new THREE.Color(0x99a9b0),c7cabc7:new THREE.Color(0x7cabc7),c9faeb7:new THREE.Color(0x9faeb7),cf1b17d:new THREE.Color(0xf1b17d),cffffff:new THREE.Color(0xffffff),ce9ebe3:new THREE.Color(0xe9ebe3)};
 const conditions={habitat:'unknown',day:0,rain:0,wind:.35,month:1,latitude:site.lat,longitude:site.lon,altitude:0};
 const provenance={habitat:'mapped classification, unknown preserved',wind:'simulated',weather:'simulated',birds:'generic artistic silhouettes',current:'unverified artistic direction'},resources={cpuObjects:10,extraDrawCallsMax:11,extraTextures:0,cloudMaterials:1,birdMaterials:1,particleMaterials:1};
 let habitatX=NaN,habitatZ=NaN,habitatSource:any=null,cachedHabitat='unknown';
 const update=(dt:number,_eco:boolean)=>{elapsed+=dt;environmentalTime.value+=dt;state=weatherStep(state,target,dt,state);environmentalWind.value=state.wind;windUniform.value=elapsed;updateLifeTime(elapsed,state.wind*(1-calm*.45));
  const date=fixed??new Date(clockMode==='demo'?base+elapsed*72000:Date.now()),s=solar(date,site.lat,site.lon),day=THREE.MathUtils.smoothstep(s.altitude,-.13,.35),warm=Math.max(0,1-Math.abs(s.altitude-.05)/.32)*day;
  seasonUniform.value=s.month>=9&&s.month<=11?.7:s.month<=2?.4:0;
  horizon.set(0x1b293e).lerp(palette.ccbd7d6,day).lerp(palette.ce4bd93,warm*.55).lerp(palette.c99a9b0,state.cloud*.35);zenith.set(0x101b30).lerp(palette.c7cabc7,day).lerp(palette.c9faeb7,state.cloud*.55);
  skyMaterial.uniforms.zenith.value.copy(zenith);skyMaterial.uniforms.horizon.value.copy(horizon);dome.position.copy(player.position);(scene.background as THREE.Color).copy(horizon);const fog=scene.fog as THREE.Fog;fog.color.copy(horizon);fog.near=320-state.mist*160-warm*25;fog.far=1450-state.mist*550-warm*80;
  sun.intensity=Math.max(0,Math.sin(s.altitude))*2.0*(1-state.cloud*.65);sun.color.set(0xfff3dc).lerp(palette.cf1b17d,warm*.65);hemisphere.intensity=.18+day*1.45;hemisphere.color.copy(zenith).lerp(palette.cffffff,.65);hemisphere.groundColor.set(0x707961);
  sun.position.set(player.position.x+Math.sin(s.azimuth)*Math.cos(s.altitude)*150,player.position.y+Math.sin(s.altitude)*150,player.position.z-Math.cos(s.azimuth)*Math.cos(s.altitude)*150);sun.target.position.copy(player.position);sun.target.updateMatrixWorld();
  if(lifeRevision!==lifeSettings.revision){lifeRevision=lifeSettings.revision;budget.setProfile(lifeSettings.profile);setLifeCapabilities(lifeSettings.profile)}
  const profile=lifeSettings.profile;
  lifeUniforms.lifeVegetation.value=profile.vegetation;lifeUniforms.lifeFine.value=profile.fine;lifeUniforms.lifeWater.value=profile.water;lifeUniforms.lifeCloudCover.value=state.cloud;lifeUniforms.lifeShadow.value=profile.shadows*profile.clouds;
  lifeUniforms.lifeSun.value.copy(sun.position).sub(player.position).normalize();
  cloudLayer.update(player.position,day,profile.clouds,lifeSettings.name==='eco');
  cpuElapsed+=dt;if(cpuElapsed>=1/Math.max(1,profile.cpuHz)){
   cpuElapsed=0;const started=performance.now();if(player.position.x!==habitatX||player.position.z!==habitatZ||habitatSource!==scene.userData.lifeHabitat){habitatX=player.position.x;habitatZ=player.position.z;habitatSource=scene.userData.lifeHabitat;cachedHabitat=habitatSource?.(habitatX,habitatZ)??'unknown'}
   conditions.habitat=cachedHabitat;conditions.day=day;conditions.rain=state.rain;conditions.wind=state.wind;conditions.month=s.month;conditions.altitude=player.position.y;
   const activeBirds=fauna.update(elapsed,player.position,conditions),micro=events.update(elapsed,player.position,conditions);calm=micro.calm;
   windAtWorld(player.position.x,player.position.z,elapsed,lifeUniforms.lifeMeanWind.value,9,localWind);
   const diagnostic=scene.userData.earthLife??={time:0,profile:'balanced',budget:{birds:0,particles:0,events:0},limits:profile,activeBirds:0,activeEvents:0,habitat:'unknown',wind:{x:0,z:0,speed:0,gust:0},cpuMs:0,maxCpuMs:0,provenance,resources};
   diagnostic.time=elapsed;diagnostic.profile=lifeSettings.name;Object.assign(diagnostic.budget,budget.allocated);diagnostic.limits=profile;diagnostic.activeBirds=activeBirds;diagnostic.activeEvents=micro.active;diagnostic.habitat=cachedHabitat;Object.assign(diagnostic.wind,localWind);diagnostic.resources.cpuObjects=9+Number(profile.particles>0);diagnostic.cpuMs=performance.now()-started;diagnostic.maxCpuMs=Math.max(diagnostic.maxCpuMs,diagnostic.cpuMs);
  }
  if(Math.floor(elapsed)!==stamp){stamp=Math.floor(elapsed);status.textContent=`${fixed?'Date de référence':clockMode==='real'?'Heure locale':'Démo ×72'} · ${dateFormat.format(date)} · météo simulée`;scene.userData.climate={mode:clockMode,date:date.toISOString(),solar:s,weather:{...state,wind:lifeUniforms.lifeMeanWind.value},simulation:true}}
 };
 return Object.assign(update,{dispose(){lifecycle.abort();cloudLayer.dispose();fauna.dispose();events.dispose();budget.clear();controls.remove();scene.remove(dome);skyGeo.dispose();skyMaterial.dispose()}});
}

