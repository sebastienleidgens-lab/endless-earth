// @ts-ignore Bounded polygon index, using the mapped building footprints.
import {acousticObstacles} from '../audio/occlusion.mjs';
import {navigationReady,riverAreas,riverLines,mappedWeirs,acousticRoads,acousticBuildings} from './geography';
import {ANGLES} from '../world/geo';
import {AcousticRenderer} from '../audio/renderer';
import type {SoundContext,Vec3} from '../audio/types';
// @ts-ignore Shared pure geographic/context helpers.
import {acousticContext,proximityIndex,habitatInfluences,syncEnvironment} from '../audio/context.mjs';
// @ts-ignore Pure bounded stochastic director.
import {SoundDirector} from '../audio/director.mjs';
// @ts-ignore Existing extensible material mapping.
import {footContact,stepStride} from '../audio/materials.mjs';
// @ts-ignore Source-compatible metric widths, without changing rendered roads.
import {roadWidth} from '../world/road-style.mjs';
// @ts-ignore Stable acoustic perches, not another visible ecology.
import {emitterCandidates} from '../audio/emitters.mjs';
// @ts-ignore Indexed bank geometry and conservative offscreen road eligibility.
import {riverAcousticIndex,trafficRoadIndex,trafficCandidates,footRoadIndex} from '../audio/geography.mjs';
/** Host adapter. No ecology, weather model, or per-frame proximity scan here. */
export class Soundscape {
 context:AudioContext|null=null;renderer:AcousticRenderer|null=null;enabled=false;volume=.7;distance=0;
 private transition:Promise<boolean>=Promise.resolve(false);private disposed=false;private hidden=false;
 private timer:ReturnType<typeof setInterval>|null=null;private director=new SoundDirector({seed:crypto.getRandomValues(new Uint32Array(1))[0]});
 private emitterCache=new Map();private nextContext=0;private waterIndex:ReturnType<typeof riverAcousticIndex>|null=null;private roadsIndex:ReturnType<typeof proximityIndex>|null=null;private trafficIndex:ReturnType<typeof trafficRoadIndex>|null=null;
 private heardFlight='';private flightAttempt=-Infinity;private aircraftEvents=0;
 private commandRevision=-1;private lastStep=-Infinity;private lastMove=0;private contact:ReturnType<typeof footContact>=footContact();private frameContext:SoundContext|null=null;
 private obstacles:ReturnType<typeof acousticObstacles>|null=null;
 contextUpdates=0;cpuMs=0;maxCpuMs=0;nearbyChecks=0;
 get master(){return this.renderer?.master??null}
 setVolume(value:number){this.volume=Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;this.renderer?.setVolume(this.volume,this.enabled&&!this.hidden)}
 toggle(){const p=this.transition.then(()=>this.applyToggle(),()=>this.applyToggle());this.transition=p;return p}
 private async applyToggle(){
 if(this.disposed)return false;
 if(!this.context){const c=new AudioContext({sampleRate:32000,latencyHint:'interactive'});this.context=c;this.renderer=new AcousticRenderer(c,`${import.meta.env.BASE_URL}audio/`);this.timer=setInterval(()=>{if(this.enabled&&!this.hidden&&c.state==='running')this.renderer?.pump()},100)}
 const on=!this.enabled;
 if(on){await this.context.resume();if(this.disposed)return false;this.enabled=true;this.nextContext=0;this.distance=0;this.director.resetClock();this.renderer!.setVolume(this.volume,!this.hidden);if(this.hidden)await this.context.suspend()}
 else{this.enabled=false;this.renderer!.setVolume(this.volume,false);this.renderer!.silence();await new Promise(r=>setTimeout(r,220));if(!this.disposed)await this.context.suspend();this.distance=0;this.director.resetClock()}
 return this.enabled;
 }
 setHidden(hidden:boolean){this.hidden=hidden;const p=this.transition.then(async()=>{if(this.disposed||!this.context)return this.enabled;this.renderer?.setVolume(this.volume,this.enabled&&!this.hidden);if(this.hidden){await this.context.suspend();this.distance=0;this.director.resetClock()}else if(this.enabled){await this.context.resume();this.nextContext=0;this.director.resetClock()}return this.enabled});this.transition=p;return p}
 update(p:Vec3,travel:number,_wind:number,_yaw:number,climate:any,life?:any,habitatAt?:((x:number,z:number)=>string),profile='balanced',altitudeM:number|null|((x:number,z:number)=>number|null)=null,sources:SoundContext['sources']=[],locomotion?:{contacts:number;speed:number;footContacts?:Array<{position:Vec3;side:number;run:number;energy:number}>},flight?:{id:string;position:Vec3;velocity:Vec3;eligible:boolean}|null,absoluteSupportAltitude:number|null=null){
 if(!this.enabled||this.hidden||!this.context||this.context.state!=='running'||!this.renderer){this.cpuMs=0;return;}
 const start=performance.now(),now=start/1000;
 if(profile!==this.renderer.profile)this.renderer.setProfile(profile);
 const commandRevision=climate?.transition?.commandRevision??-1,commandChanged=commandRevision!==this.commandRevision;
 syncEnvironment(this.frameContext,climate);if(this.frameContext&&(commandChanged||now>=this.nextContext))this.renderer.environmentGuard(this.frameContext);
 if(now>=this.nextContext||commandChanged){
 this.commandRevision=commandRevision;
 this.nextContext=now+1/this.renderer.budget.hz;
 if(!this.waterIndex&&navigationReady()){this.waterIndex=riverAcousticIndex(riverAreas,riverLines,mappedWeirs);this.trafficIndex=trafficRoadIndex(acousticRoads);this.roadsIndex=footRoadIndex(acousticRoads)}
 const altitude=Number.isFinite(absoluteSupportAltitude)?absoluteSupportAltitude:typeof altitudeM==='function'?altitudeM(p.x,p.z):altitudeM,listener={position:{...this.renderer.lastListener},forward:{...this.renderer.lastForward}};
 const ear={...listener.position,altitudeM:Number.isFinite(altitude)?altitude!+listener.position.y-p.y:null};
 const near=this.waterIndex?.query(ear,typeof altitudeM==='function'?altitudeM:null,160),road=this.roadsIndex?.query(p,40);this.nearbyChecks=(near?.checked??0)+(road?.checked??0);
 const influences=habitatInfluences(p,habitatAt);
 // Roads are mapped access routes; their mere presence never implies traffic.
 const geo={lat:ANGLES.lat-p.z/111320,lon:ANGLES.lon+p.x/(111320*Math.cos(ANGLES.lat*Math.PI/180))};
 this.frameContext=acousticContext({temporal:climate?.transition?{localHour:climate.localHour,season:climate.season,timeBasis:'civil'}:undefined,geo,timeZone:ANGLES.timeZone,worldTimeMs:climate?.worldTimeMs??(climate?.date?Date.parse(climate.date):null),position:{...p},water:near?.water??null,altitudeM:altitude,habitat:life?.habitat??'unknown',solarAltitude:climate?.solar.altitude,weather:climate?.weather?{...climate.weather,wind:climate.wind?.speed??life?.wind.speed??climate.weather.wind,gust:climate.wind?.gust??life?.wind.gust??0}:null,influences,sources,provenance:{geography:'IGN/ASP/OSM classifications; mix inferred',weather:'EarthLife simulated',region:'temperate-europe'}}) as SoundContext;
 syncEnvironment(this.frameContext,climate);this.frameContext!.mixRevision=climate?.transition?.revision;
 this.frameContext!.listener=listener;
 const renderHeight=typeof altitudeM==='function'&&Number.isFinite(altitude)?(x:number,z:number)=>{const y=altitudeM(x,z);return y===null?null:p.y+y-altitude!}:null;
 this.frameContext!.traffic=[]; // Traffic is now owned by the visible, audited road vehicles.
 if(!this.obstacles&&acousticBuildings.length){this.obstacles=acousticObstacles(acousticBuildings.map(b=>{const y=renderHeight?.(b.ring[0].x,b.ring[0].z)??0;return {ring:b.ring,base:y,top:y+b.height}}));this.renderer.setObstacles(this.obstacles);}
 this.frameContext!.emitters=emitterCandidates(this.frameContext,habitatAt,typeof altitudeM==='function'?altitudeM:null,this.emitterCache);this.renderer.updateContext(this.frameContext);for(const id of this.director.preload(this.frameContext,now))void this.renderer.resources.request(id);for(const event of this.director.tick(this.frameContext,now))this.renderer.event(event);this.renderer.updateObstructions();this.contextUpdates++;
 }
 if(travel>0&&travel<3){
  const dt=this.lastMove?Math.max(.01,Math.min(.5,now-this.lastMove)):.1,speed=locomotion?.speed??Math.min(6,travel/dt);this.lastMove=now;this.distance+=travel;
  const stride=stepStride(speed),fallback=!locomotion&&this.distance>=stride,contacts=locomotion?.footContacts??(locomotion?.contacts||fallback?[{position:p,side:1,run:Math.max(0,Math.min(1,(speed-1.65)/1.25)),energy:1}]:[]);
  // Preload at the current sole even before the first strike, then query EACH
  // admitted contact, including the two different surfaces at a boundary.
  for(const c of contacts.length?contacts:[{position:p,side:1,run:0,energy:1}]){const q=c.position,road=this.roadsIndex?.query(q,8),onRoad=!!road?.point&&road.distance<=(road.width??5.5)/2;
   this.contact=footContact({surface:onRoad?road.surface:null,onRoad,habitat:habitatAt?.(q.x,q.z)??'unknown',season:this.frameContext?.season,rain:climate?.weather?.rain??null,wetness:climate?.groundWetness??climate?.weather?.rain??0,snow:climate?.groundSnowAt?.(q)});
   if(this.frameContext)this.frameContext.ground=this.contact;this.renderer.preloadSteps(this.contact.material);
   if(contacts.length&&now-this.lastStep>=.11){this.lastStep=now;this.distance=0;this.renderer.footstep(this.contact.material,speed,{...c,wetness:this.contact.wetness})}
  }
 }else if(travel===0){this.distance=0;this.lastMove=0}
 if(flight?.eligible&&flight.id!==this.heardFlight&&now-this.flightAttempt>1){this.flightAttempt=now;const asset='aircraft-fs-820324-m15';void this.renderer.resources.request(asset);if(this.renderer.event({asset,position:flight.position,velocity:flight.velocity,priority:20,gain:.12,refDistance:90,maxDistance:1400,reason:'Simulated light aircraft, matched CC0 propeller flyover; no real traffic data'})){this.heardFlight=flight.id;this.aircraftEvents++}}
 this.cpuMs=performance.now()-start;this.maxCpuMs=Math.max(this.maxCpuMs,this.cpuMs);
 }
 listener(position:Vec3,forward:Vec3,up:Vec3){if(this.enabled&&!this.hidden)this.renderer?.listener(position,forward,up)}
 stats(){return {...this.renderer?.stats(),aircraftEvents:this.aircraftEvents,contextUpdates:this.contextUpdates,cpuMs:this.cpuMs,maxCpuMs:this.maxCpuMs,nearbyChecks:this.nearbyChecks,memoryCells:this.director.memory.size,perches:this.director.perches.size,contact:this.contact,context:this.frameContext}}
 vehicle(v:any){if(this.enabled&&!this.hidden&&this.context?.state==='running')this.renderer?.vehicle(v);else this.renderer?.vehicle(null)}
 async dispose(){if(this.disposed)return;this.disposed=true;this.enabled=false;if(this.timer)clearInterval(this.timer);this.timer=null;this.renderer?.dispose();this.director.clear();this.emitterCache.clear();this.waterIndex=this.roadsIndex=this.trafficIndex=null;this.frameContext=null;this.obstacles=null;if(this.context&&this.context.state!=='closed')await this.context.close()}
}
