// @ts-ignore Shared existing CC0 library; no new audio acquisition.
import {AUDIO_GROUPS} from './catalog.mjs';
// @ts-ignore Shared pure data and deterministic helpers, tested directly in Node.
import {AUDIO_BUDGETS,layerMix,MATERIALS,diurnalBirdsAllowed} from './profiles.mjs';
// @ts-ignore Pure clock/memory module.
import {seededRandom} from './director.mjs';
// @ts-ignore Pure visibility guard for distant road recordings.
import {roadSourceHidden} from './geography.mjs';
import type {Vec3,SoundContext} from './types';
import {AudioResources,ASSETS} from './resources';
type Voice={source:AudioBufferSourceNode;nodes:AudioNode[];gain:GainNode;fadeGain:GainNode;asset:string;priority:number;panner:PannerNode|null;end:number;position?:Vec3;velocity?:Vec3;started:number;retiring:boolean;bedId?:string;reason?:string;refDistance?:number;maxDistance?:number;roadEvent?:boolean;movingId?:string;filterBase?:number;occlusion?:number};
type Bed={id:string;asset:string;assets:string[];previous:string|null;reason:string;gain:GainNode;filter:BiquadFilterNode;next:number;weight:number;priority:number;retiring:boolean;pan:StereoPannerNode|null;entryFade:number};
/** Same graph in realtime and OfflineAudioContext. Native audio-clock envelopes
 * run independently of Three.js frames. Diffuse beds never get HRTF nodes. */
export class AcousticRenderer{
 private reflection:DelayNode;private reflectionFilter:BiquadFilterNode;private reflectionGain:GainNode;
 readonly master:GainNode;readonly limiter:DynamicsCompressorNode;readonly resources:AudioResources;
 readonly voices=new Set<Voice>();readonly beds=new Map<string,Bed>();readonly random:()=>number;
 private obstacles:any=null;private obstructionCursor=0;private nextVehicle=0;private vehicleId='';private lastUp:Vec3={x:0,y:1,z:0};
 obstructionChecks=0;obstructionUpdates=0;
 profile='balanced';volume=.7;budget=AUDIO_BUDGETS.balanced;closed=false;peakVoices=0;dropped=0;steps=0;lastStepVariant=-1;lastStepSource='';lastStepAssets:string[]=[];lastListener:Vec3={x:0,y:0,z:0};lastForward:Vec3={x:0,y:0,z:-1};heardBirds=0;roadEvents=0;recentEvents:unknown[]=[];lastContext:SoundContext|null=null;
 constructor(readonly context:BaseAudioContext,base:string,seed=1){
 this.random=seededRandom(seed);this.master=context.createGain();this.master.gain.value=0;
 this.limiter=context.createDynamicsCompressor();this.limiter.threshold.value=-8;this.limiter.knee.value=8;this.limiter.ratio.value=8;this.limiter.attack.value=.006;this.limiter.release.value=.25;
 this.master.connect(this.limiter).connect(context.destination);
 // One quiet early reflection, no feedback and no cathedral tail.
 this.reflection=context.createDelay(.12);this.reflection.delayTime.value=.047;this.reflectionFilter=context.createBiquadFilter();this.reflectionFilter.type='lowpass';this.reflectionFilter.frequency.value=2300;this.reflectionGain=context.createGain();this.reflectionGain.gain.value=0;this.master.connect(this.reflection).connect(this.reflectionFilter).connect(this.reflectionGain).connect(this.limiter);this.resources=new AudioResources(context,base,()=>new Set([...this.voices].map(v=>v.asset)));
 }
 setVolume(volume:number,audible=true){this.volume=Number.isFinite(volume)?Math.max(0,Math.min(1,volume)):0;this.master.gain.setTargetAtTime(audible?this.volume*.55:0,this.context.currentTime,.12)}
 setProfile(name:string){const next=AUDIO_BUDGETS[name]??AUDIO_BUDGETS.balanced;this.profile=name;this.budget=next;
 // Fade optional work before the next scheduler turn. Retiring voices still count.
 const spatial=[...this.voices].filter(v=>v.panner);for(const v of spatial.slice(next.hrtf))this.retire(v,.15);
 const ordered=[...this.voices].sort((a,b)=>b.priority-a.priority);for(const v of ordered.slice(next.voices))this.retire(v,.15);
 }
 private retire(v:Voice,duration=.25){if(v.retiring)return;v.retiring=true;const t=this.context.currentTime;v.fadeGain.gain.cancelScheduledValues(t);v.fadeGain.gain.setTargetAtTime(0,t,duration/4);v.source.stop(t+duration);v.end=Math.min(v.end,t+duration)}
 private release(v:Voice){if(!this.voices.delete(v))return;v.source.disconnect();for(const n of v.nodes)n.disconnect();v.source.onended=null}
 private admit(priority:number){if(this.voices.size<this.budget.voices)return true;const low=[...this.voices].filter(v=>!v.retiring&&v.priority<priority).sort((a,b)=>a.priority-b.priority)[0];if(low)this.retire(low,.08);this.dropped++;return false}
 private play(asset:string,buffer:AudioBuffer,options:{gain:number;duration?:number;offset?:number;rate?:number;priority:number;position?:Vec3;velocity?:Vec3;filter?:number;bus?:AudioNode;fade?:number;entryFade?:number;refDistance?:number;maxDistance?:number;reason?:string;delay?:number}){
 if(this.closed||!this.admit(options.priority))return null;
 const c=this.context,duration=Math.min(options.duration??buffer.duration,(buffer.duration-(options.offset??0))/(options.rate??1));if(duration<=.01)return null;
 if(options.position&&[...this.voices].filter(v=>v.panner).length>=this.budget.hrtf){this.dropped++;return null;}
 const source=c.createBufferSource(),gain=c.createGain(),fadeGain=c.createGain(),filter=c.createBiquadFilter();source.buffer=buffer;source.playbackRate.value=options.rate??1;filter.type='lowpass';filter.Q.value=.5;filter.frequency.value=options.filter??6000;
 const panner=options.position&&[...this.voices].filter(v=>v.panner).length<this.budget.hrtf?c.createPanner():null;
 source.connect(filter).connect(gain).connect(fadeGain);if(panner){panner.panningModel='HRTF';panner.distanceModel='inverse';panner.refDistance=options.refDistance??4;panner.maxDistance=options.maxDistance??110;panner.rolloffFactor=1.2;panner.positionX.value=options.position!.x;panner.positionY.value=options.position!.y;panner.positionZ.value=options.position!.z;fadeGain.connect(panner).connect(options.bus??this.master)}else fadeGain.connect(options.bus??this.master);
 const fade=Math.min(options.fade??.025,duration*.35),curve=new Float32Array(64);for(let i=0;i<64;i++)curve[i]=Math.sin(i/63*Math.PI/2)*options.gain;
 // Schedule after graph construction: currentTime may advance during HRTF setup.
 gain.gain.value=0;const t=c.currentTime+(options.delay??.05);gain.gain.setValueCurveAtTime(curve,t,Math.min(options.entryFade??fade,fade));gain.gain.setValueCurveAtTime(Float32Array.from(curve).reverse(),t+duration-fade,fade);
 const voice:Voice={source,nodes:[filter,gain,fadeGain,...(panner?[panner]:[])],gain,fadeGain,asset,priority:options.priority,panner,end:t+duration,position:options.position?{...options.position}:undefined,velocity:options.velocity,started:t,retiring:false,filterBase:options.filter??6000,reason:options.reason,refDistance:options.refDistance??4,maxDistance:options.maxDistance??110};this.voices.add(voice);this.peakVoices=Math.max(this.peakVoices,this.voices.size);source.onended=()=>this.release(voice);source.start(t,options.offset??0);source.stop(t+duration);return voice;
 }
 environmentGuard(c:SoundContext){
  if(!diurnalBirdsAllowed(c))for(const v of this.voices)if(v.asset.startsWith('bird-'))this.retire(v,.45);
  if((c.weather?.snow??0)>.005){const bed=this.beds.get('rain');if(bed){bed.retiring=true;bed.weight=0;bed.gain.gain.setTargetAtTime(0,this.context.currentTime,.025)}for(const v of this.voices)if(v.bedId==='rain')this.retire(v,.10)}
 }
 updateContext(c:SoundContext){
  if(this.closed)return;
  this.lastContext=c;this.environmentGuard(c);
  const enclosure=this.obstacles?.enclosure(this.lastListener)??0;this.reflectionGain.gain.setTargetAtTime(enclosure*.035*(1-(c.influences.forest??0)*.7),this.context.currentTime,.7);
  const t=this.context.currentTime,manual=c.environment?.manual===true;
  const mix=layerMix(c).slice(0,this.budget.beds),selected=new Set(mix.map((l:any)=>l.id));
  for(const bed of this.beds.values())if(!selected.has(bed.id)&&!bed.retiring){
   bed.retiring=true;bed.weight=0;bed.gain.gain.setTargetAtTime(0,t,manual?.16:1.2);bed.next=t+6;
   for(const v of this.voices)if(v.bedId===bed.id)this.retire(v,manual?.65:4);
  }
  for(const layer of mix){
   let b=this.beds.get(layer.id);
   if(!b){
    const gain=this.context.createGain(),filter=this.context.createBiquadFilter();
    gain.gain.value=0;filter.type='lowpass';filter.Q.value=.5;filter.frequency.value=layer.filter;
    const pan=layer.diffuse?null:this.context.createStereoPanner();gain.connect(filter);
    if(pan)filter.connect(pan).connect(this.master);else filter.connect(this.master);
    b={pan,id:layer.id,asset:layer.asset,assets:layer.assets,previous:null,reason:layer.reason,gain,filter,next:t,weight:0,priority:layer.priority,retiring:false,entryFade:manual?.35:4};
    this.beds.set(layer.id,b);
   }
   if(b.retiring){b.next=t;b.previous=null;b.entryFade=manual?.35:4}
   b.retiring=false;b.assets=layer.assets;
   if(!b.assets.includes(b.asset))b.asset=layer.asset;
   // An old storm recording must leave even if the ordinary rain bed survives.
   if(b.previous&&!b.assets.includes(b.previous)){
    for(const v of this.voices)if(v.bedId===b.id&&!b.assets.includes(v.asset))this.retire(v,.65);
    b.previous=null;b.next=t;b.entryFade=manual?.35:4;
   }
   b.reason=layer.reason;b.weight=layer.weight;
   b.gain.gain.setTargetAtTime(layer.weight,t,manual?.32:['wind','foliage'].includes(layer.id)?.45:1.2);
   b.filter.frequency.setTargetAtTime(layer.filter*(1-.3*(c.weather?.rain??0))*(1-.22*(c.weather?.snowCover??0)),t,manual?.32:1);
   const source=layer.id==='roof-rain'?c.roof:c.water;
   if(b.pan&&source){
    const dx=source.point.x-this.lastListener.x,dz=source.point.z-this.lastListener.z,f=this.lastForward;
    b.pan.pan.setTargetAtTime(.7*(dx*-f.z+dz*f.x)/(Math.hypot(dx,dz)*Math.hypot(f.x,f.z)||1),t,.3);
   }
   void this.resources.request(layer.asset);
  }
  this.pump();
 }
 pump(){if(this.closed)return;const t=this.context.currentTime;
 // Offline rendering/tests can advance clocks without onended delivery yet.
 for(const v of this.voices)if(v.end<=t)this.release(v);
 for(const [id,b] of this.beds){
 const active=[...this.voices].some(v=>v.bedId===b.id);
 if(b.retiring){if(!active){b.gain.disconnect();b.filter.disconnect();b.pan?.disconnect();this.beds.delete(id)}continue}
 if(t<b.next)continue;const available=b.assets.filter(id=>this.resources.cache.has(id));if(available.length){const options=available.filter(id=>id!==b.previous);b.asset=(options.length?options:available)[Math.floor(this.random()*(options.length||available.length))]}const buffer=this.resources.get(b.asset);if(!buffer){const candidate=this.resources.failures.has(b.asset)?b.assets.find(id=>!this.resources.failures.has(id)):b.asset;if(candidate){b.asset=candidate;void this.resources.request(candidate)}continue}
 const duration=Math.min(buffer.duration,24+this.random()*12),fade=Math.min(4,duration*.2),offset=this.random()*Math.max(0,buffer.duration-duration-.1);
 const v=this.play(b.asset,buffer,{gain:.7,duration,offset,priority:b.priority,bus:b.gain,fade,entryFade:b.previous===null?b.entryFade:fade,reason:b.reason});if(v){v.bedId=b.id;b.previous=b.asset;const next=b.assets.find(id=>id!==b.asset);if(next)void this.resources.request(next);b.next=t+duration-fade}else b.next=t+.5;
 }
 for(const v of this.voices)if(v.panner&&v.position&&v.velocity){const age=t-v.started;v.panner.positionX.setTargetAtTime(v.position.x+v.velocity.x*age,t,.15);v.panner.positionY.setTargetAtTime(v.position.y+v.velocity.y*age,t,.15);v.panner.positionZ.setTargetAtTime(v.position.z+v.velocity.z*age,t,.15)}
 }
 event(event:{asset:string;rate?:number;position:Vec3;velocity?:Vec3;priority:number;gain:number;refDistance?:number;maxDistance?:number;reason?:string;emitterId?:string;roadEvent?:boolean;delay?:number}){const b=this.resources.get(event.asset);if(!b){void this.resources.request(event.asset);return false}if(Math.hypot(event.position.x-this.lastListener.x,event.position.z-this.lastListener.z)>(event.maxDistance??110))return false;const result=this.play(event.asset,b,{gain:event.gain,rate:event.rate,priority:event.priority,position:event.position,velocity:event.velocity,refDistance:event.refDistance,maxDistance:event.maxDistance,reason:event.reason,delay:event.delay});if(result){result.roadEvent=event.roadEvent;if(event.roadEvent)this.roadEvents++;if(event.asset.startsWith('bird-'))this.heardBirds++;this.recentEvents.push({asset:event.asset,emitterId:event.emitterId,position:event.position,reason:event.reason,time:this.context.currentTime});if(this.recentEvents.length>16)this.recentEvents.shift()}return !!result}
 preloadSteps(kind:string){const m=MATERIALS[kind];if(!m)return;const seen=new Set<string>();for(const id of m.assets){const source=ASSETS[id].source;if(seen.has(source))continue;seen.add(source);void this.resources.request(id);if(seen.size>=2)break}}
 footstep(kind:string,speed=1.35,contact?:{side?:number;run?:number;energy?:number;wetness?:number}){
 const m=MATERIALS[kind];if(!m)return false;const ready=m.assets.filter((id:string)=>this.resources.cache.has(id)),fresh=ready.filter((id:string)=>!this.lastStepAssets.includes(id)),different=(fresh.length?fresh:ready.filter((id:string)=>id!==this.lastStepAssets.at(-1))).filter((id:string)=>ASSETS[id].source!==this.lastStepSource),pool=different.length?different:fresh.length?fresh:ready.filter((id:string)=>id!==this.lastStepAssets.at(-1));
 if(!pool.length){this.preloadSteps(kind);const missing=m.assets.find((a:string)=>!this.resources.cache.has(a));if(missing)void this.resources.request(missing);return false}const id=pool[Math.floor(this.random()*pool.length)],b=this.resources.get(id)!,run=contact?.run??Math.max(0,Math.min(1,(speed-1.65)/1.25)),side=contact?.side??1;
 this.lastStepSource=ASSETS[id].source;this.lastStepAssets.push(id);if(this.lastStepAssets.length>3)this.lastStepAssets.shift();
 const next=m.assets.find((a:string)=>!this.resources.cache.has(a));if(next)void this.resources.request(next);
 const v=this.play(id,b,{gain:m.gain*(.88+this.random()*.18)*(.78+run*.4)*(side<0?.98:1.02),rate:1+run*.025+(this.random()-.5)*.018,filter:m.filter*(1-(contact?.wetness??0)*.2),duration:b.duration*(1-run*.13),fade:.005,delay:.002,priority:100,reason:`actual ${kind} ${side<0?'left':'right'} foot contact, ${speed.toFixed(2)} m/s, running ${run.toFixed(2)}`});if(v)this.steps++;return !!v;
 }
 listener(position:Vec3,forward:Vec3,up:Vec3){if(Math.hypot(position.x-this.lastListener.x,position.y-this.lastListener.y,position.z-this.lastListener.z)<1e-6&&Math.hypot(forward.x-this.lastForward.x,forward.y-this.lastForward.y,forward.z-this.lastForward.z)<1e-6&&Math.hypot(up.x-this.lastUp.x,up.y-this.lastUp.y,up.z-this.lastUp.z)<1e-6)return;this.lastUp={...up};this.lastListener={...position};this.lastForward={...forward};for(const v of this.voices)if(v.roadEvent&&v.position&&!roadSourceHidden(v.position,{position,forward}))this.retire(v,.3);const l=this.context.listener,t=this.context.currentTime;for(const [param,value] of [[l.positionX,position.x],[l.positionY,position.y],[l.positionZ,position.z],[l.forwardX,forward.x],[l.forwardY,forward.y],[l.forwardZ,forward.z],[l.upX,up.x],[l.upY,up.y],[l.upZ,up.z]] as const)param.setTargetAtTime(value,t,.045)}
 setObstacles(index:any){this.obstacles=index}
 updateObstructions(){
  if(!this.obstacles)return;const t=this.context.currentTime,spatial=[...this.voices].filter(v=>v.panner&&v.position&&!v.retiring);
  // At most two sources per context tick, each index query capped at 64 walls.
  for(let i=0;i<Math.min(2,spatial.length);i++){const v=spatial[this.obstructionCursor++%spatial.length],a=this.obstacles.between(this.lastListener,v.position);v.occlusion=a;this.obstructionChecks+=this.obstacles.checks;this.obstructionUpdates++;(v.nodes[0]as BiquadFilterNode).frequency.setTargetAtTime((v.filterBase??6000)*(1-a)+900*a,t,.4);v.fadeGain.gain.setTargetAtTime(1-a*.55,t,.4)}
  const water=this.beds.get('water'),point=this.lastContext?.water?.point;if(water&&point){const a=this.obstacles.between(this.lastListener,{...point,y:this.lastContext!.position.y});water.filter.frequency.setTargetAtTime(8500*(1-a)+1100*a,t,.6);water.gain.gain.setTargetAtTime(water.weight*(1-a*.6),t,.6)}
 }
 vehicle(v:{id:string;position:Vec3;speed:number;rain:number}|null){
  const t=this.context.currentTime;
  if(!v){for(const voice of this.voices)if(voice.movingId)this.retire(voice,.5);this.vehicleId='';return}
  const distance=Math.hypot(v.position.x-this.lastListener.x,v.position.z-this.lastListener.z),asset=AUDIO_GROUPS.traffic?.[0];if(!asset)return;if(distance>140){for(const voice of this.voices)if(voice.movingId===v.id)this.retire(voice,.7);return;}
  const b=this.resources.get(asset);if(!b){void this.resources.request(asset);return}
  if(this.vehicleId!==v.id){for(const voice of this.voices)if(voice.movingId)this.retire(voice,.5);this.vehicleId=v.id;this.nextVehicle=0}
  if(t>=this.nextVehicle){const rate=.83+Math.min(1,v.speed/7)*.25,duration=3.8,voice=this.play(asset,b,{gain:.14*(1+v.rain*.15),position:v.position,priority:68,refDistance:5,maxDistance:145,offset:Math.min(b.duration-5,9+this.random()*2),duration,rate,filter:4200*(1-v.rain*.2),fade:.7,reason:'interpreted moving vehicle, existing CC0 motor/rolling excerpt; no local recording'});if(voice){voice.movingId=v.id;this.nextVehicle=t+duration-.7}}
  for(const voice of this.voices)if(voice.movingId===v.id&&!voice.retiring){voice.position={...v.position};voice.panner!.positionX.setTargetAtTime(v.position.x,t,.08);voice.panner!.positionY.setTargetAtTime(v.position.y,t,.08);voice.panner!.positionZ.setTargetAtTime(v.position.z,t,.08);voice.source.playbackRate.setTargetAtTime(.83+Math.min(1,v.speed/7)*.25,t,.25)}
 }
 /** Approximate occlusion only for explicit obstruction information from a host. */
 occlude(amount:number){const t=this.context.currentTime,a=Math.max(0,Math.min(1,amount));for(const v of this.voices)if(v.panner){const filter=v.nodes[0] as BiquadFilterNode;filter.frequency.setTargetAtTime(6000*(1-a)+900*a,t,.35)}}
 silence(){for(const v of this.voices)this.retire(v,.18);for(const b of this.beds.values()){b.retiring=true;b.gain.gain.setTargetAtTime(0,this.context.currentTime,.05)}}
 stats(){const t=this.context.currentTime;return {layers:[...this.beds.values()].map(b=>({id:b.id,asset:b.asset,actualBusGain:b.gain.gain.value,targetGain:b.weight,masterGain:this.master.gain.value,reason:b.reason,diffuse:!b.pan,pan:b.pan?.pan.value??null,transition:b.retiring?'fading out':Math.abs(b.gain.gain.value-b.weight)>.001?'smoothing':'steady',nextWindowIn:b.next-t})),activeSources:[...this.voices].map(v=>({asset:v.asset,recording:ASSETS[v.asset]?.source,position:v.position??null,diffuse:v.bedId?!this.beds.get(v.bedId)?.pan:!v.panner,gain:v.gain.gain.value,retirementGain:v.fadeGain.gain.value,masterGain:this.master.gain.value,distance:v.position?Math.hypot(v.position.x-this.lastListener.x,v.position.z-this.lastListener.z):null,refDistance:v.refDistance,reason:v.reason,occlusion:v.occlusion??0,transition:v.retiring?'fading out':t<v.started?'scheduled':'playing'})),recentEvents:this.recentEvents,nodes:this.closed?0:5+[...this.beds.values()].reduce((n,b)=>n+2+Number(!!b.pan),0)+[...this.voices].reduce((n,v)=>n+1+v.nodes.length,0),voices:this.voices.size,peakVoices:this.peakVoices,hrtf:[...this.voices].filter(v=>v.panner).length,beds:this.beds.size,budget:this.budget,dropped:this.dropped,steps:this.steps,lastStepAssets:[...this.lastStepAssets],heardBirds:this.heardBirds,roadEvents:this.roadEvents,profile:this.profile,obstructionChecks:this.obstructionChecks,obstructionUpdates:this.obstructionUpdates,...this.resources.stats()}}
 dispose(){if(this.closed)return;this.closed=true;for(const v of this.voices){try{v.source.stop()}catch{/* Already ended. */}this.release(v)}for(const b of this.beds.values()){b.gain.disconnect();b.filter.disconnect();b.pan?.disconnect()}this.beds.clear();this.lastContext=null;this.recentEvents=[];this.resources.dispose();this.reflection.disconnect();this.reflectionFilter.disconnect();this.reflectionGain.disconnect();this.master.disconnect();this.limiter.disconnect()}
}
