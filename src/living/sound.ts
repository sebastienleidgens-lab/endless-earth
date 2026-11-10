import {waterLines,paths,navigationReady} from './geography';
import {ANGLES} from '../world/geo';
import {AcousticRenderer} from '../audio/renderer';
import type {SoundContext,Vec3} from '../audio/types';
// @ts-ignore Shared pure geographic/context helpers.
import {acousticContext,proximityIndex,habitatInfluences} from '../audio/context.mjs';
// @ts-ignore Pure bounded stochastic director.
import {SoundDirector} from '../audio/director.mjs';
// @ts-ignore Existing extensible material mapping.
import {surfaceKind} from './walk.mjs';
/** Host adapter. No ecology, weather model, or per-frame proximity scan here. */
export class Soundscape {
 context:AudioContext|null=null;renderer:AcousticRenderer|null=null;enabled=false;volume=.7;distance=0;
 private transition:Promise<boolean>=Promise.resolve(false);private disposed=false;private hidden=false;
 private timer:ReturnType<typeof setInterval>|null=null;private director=new SoundDirector({seed:crypto.getRandomValues(new Uint32Array(1))[0]});
 private nextContext=0;private waterIndex:ReturnType<typeof proximityIndex>|null=null;private roadsIndex:ReturnType<typeof proximityIndex>|null=null;
 private lastStep=-Infinity;private roadSurface='ground';private frameContext:SoundContext|null=null;
 contextUpdates=0;cpuMs=0;maxCpuMs=0;nearbyChecks=0;
 get master(){return this.renderer?.master??null}
 setVolume(value:number){this.volume=Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;this.renderer?.setVolume(this.volume,this.enabled&&!this.hidden)}
 toggle(){const p=this.transition.then(()=>this.applyToggle(),()=>this.applyToggle());this.transition=p;return p}
 private async applyToggle(){
 if(this.disposed)return false;
 if(!this.context){const c=new AudioContext({sampleRate:24000,latencyHint:'playback'});this.context=c;this.renderer=new AcousticRenderer(c,`${import.meta.env.BASE_URL}audio/`);this.timer=setInterval(()=>{if(this.enabled&&!this.hidden&&c.state==='running')this.renderer?.pump()},100)}
 const on=!this.enabled;
 if(on){await this.context.resume();if(this.disposed)return false;this.enabled=true;this.nextContext=0;this.distance=0;this.director.resetClock();this.renderer!.setVolume(this.volume,!this.hidden);if(this.hidden)await this.context.suspend()}
 else{this.enabled=false;this.renderer!.setVolume(this.volume,false);this.renderer!.silence();await new Promise(r=>setTimeout(r,220));if(!this.disposed)await this.context.suspend();this.distance=0;this.director.resetClock()}
 return this.enabled;
 }
 setHidden(hidden:boolean){this.hidden=hidden;const p=this.transition.then(async()=>{if(this.disposed||!this.context)return this.enabled;this.renderer?.setVolume(this.volume,this.enabled&&!this.hidden);if(this.hidden){await this.context.suspend();this.distance=0;this.director.resetClock()}else if(this.enabled){await this.context.resume();this.nextContext=0;this.director.resetClock()}return this.enabled});this.transition=p;return p}
 update(p:Vec3,travel:number,_wind:number,_yaw:number,climate:any,life?:any,habitatAt?:((x:number,z:number)=>string),profile='balanced',altitudeM:number|null|((x:number,z:number)=>number|null)=null,sources:SoundContext['sources']=[]){
 if(!this.enabled||this.hidden||!this.context||this.context.state!=='running'||!this.renderer)return;
 const start=performance.now(),now=start/1000;
 if(profile!==this.renderer.profile)this.renderer.setProfile(profile);
 if(now>=this.nextContext){
 this.nextContext=now+1/this.renderer.budget.hz;
 if(!this.waterIndex&&navigationReady()){this.waterIndex=proximityIndex(waterLines);this.roadsIndex=proximityIndex(paths.map(path=>Object.assign([...path.points],{surface:path.surface})))}
 const near=this.waterIndex?.query(p,120),road=this.roadsIndex?.query(p,40);this.nearbyChecks=(near?.checked??0)+(road?.checked??0);this.roadSurface=road?.distance<3?(road.surface||'asphalt'):'grass';
 const influences=habitatInfluences(p,habitatAt);if(near?.point)influences.water=Math.max(influences.water??0,Math.exp(-near.distance/26));
 // Roads are mapped access routes; their mere presence never implies traffic.
 const geo={lat:ANGLES.lat-p.z/111320,lon:ANGLES.lon+p.x/(111320*Math.cos(ANGLES.lat*Math.PI/180))};
 this.frameContext=acousticContext({geo,timeZone:ANGLES.timeZone,worldTimeMs:climate?.worldTimeMs??(climate?.date?Date.parse(climate.date):null),position:{...p},altitudeM:typeof altitudeM==='function'?altitudeM(p.x,p.z):altitudeM,habitat:life?.habitat??'unknown',solarAltitude:climate?.solar.altitude,weather:climate?.weather?{...climate.weather,wind:life?.wind.speed??climate.weather.wind}:null,influences,sources,provenance:{geography:'IGN/ASP/OSM classifications; mix inferred',weather:'EarthLife simulated',region:'temperate-europe'}}) as SoundContext;
 this.renderer.updateContext(this.frameContext);for(const event of this.director.tick(this.frameContext,now))this.renderer.event(event);this.contextUpdates++;
 }
 if(travel>0&&travel<3){this.distance+=travel;if(this.distance>=.8&&now-this.lastStep>=.21){this.distance%=.8;this.lastStep=now;this.renderer.footstep(surfaceKind(this.roadSurface))}}
 else if(travel===0)this.distance=0;
 this.cpuMs=performance.now()-start;this.maxCpuMs=Math.max(this.maxCpuMs,this.cpuMs);
 }
 listener(position:Vec3,forward:Vec3,up:Vec3){if(this.enabled&&!this.hidden)this.renderer?.listener(position,forward,up)}
 stats(){return {...this.renderer?.stats(),contextUpdates:this.contextUpdates,cpuMs:this.cpuMs,maxCpuMs:this.maxCpuMs,nearbyChecks:this.nearbyChecks,memoryCells:this.director.memory.size,context:this.frameContext}}
 async dispose(){if(this.disposed)return;this.disposed=true;this.enabled=false;if(this.timer)clearInterval(this.timer);this.timer=null;this.renderer?.dispose();this.director.clear();this.waterIndex=this.roadsIndex=null;this.frameContext=null;if(this.context&&this.context.state!=='closed')await this.context.close()}
}
