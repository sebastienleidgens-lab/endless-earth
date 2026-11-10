// @ts-ignore Shared pure data and deterministic helpers, tested directly in Node.
import {AUDIO_BUDGETS,layerMix,MATERIALS,EVENTS,eventAffinity} from './profiles.mjs';
// @ts-ignore Pure clock/memory module.
import {seededRandom} from './director.mjs';
import type {Vec3,SoundContext} from './types';
import {AudioResources} from './resources';
type Voice={source:AudioBufferSourceNode;nodes:AudioNode[];gain:GainNode;fadeGain:GainNode;asset:string;priority:number;panner:PannerNode|null;end:number;position?:Vec3;velocity?:Vec3;started:number;retiring:boolean;bedId?:string};
type Bed={id:string;asset:string;gain:GainNode;filter:BiquadFilterNode;next:number;weight:number;priority:number;retiring:boolean};
/** Same graph in realtime and OfflineAudioContext. Native audio-clock envelopes
 * run independently of Three.js frames. Diffuse beds never get HRTF nodes. */
export class AcousticRenderer{
 readonly master:GainNode;readonly limiter:DynamicsCompressorNode;readonly resources:AudioResources;
 readonly voices=new Set<Voice>();readonly beds=new Map<string,Bed>();readonly random:()=>number;
 profile='balanced';volume=.7;budget=AUDIO_BUDGETS.balanced;closed=false;peakVoices=0;dropped=0;steps=0;lastStepVariant=-1;lastContext:SoundContext|null=null;
 constructor(readonly context:BaseAudioContext,base:string,seed=1){
 this.random=seededRandom(seed);this.master=context.createGain();this.master.gain.value=0;
 this.limiter=context.createDynamicsCompressor();this.limiter.threshold.value=-8;this.limiter.knee.value=8;this.limiter.ratio.value=8;this.limiter.attack.value=.006;this.limiter.release.value=.25;
 this.master.connect(this.limiter).connect(context.destination);this.resources=new AudioResources(context,base,()=>new Set([...this.voices].map(v=>v.asset)));
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
 private play(asset:string,buffer:AudioBuffer,options:{gain:number;duration?:number;offset?:number;rate?:number;priority:number;position?:Vec3;velocity?:Vec3;filter?:number;bus?:AudioNode;fade?:number}){
 if(this.closed||!this.admit(options.priority))return null;
 const c=this.context,duration=Math.min(options.duration??buffer.duration,(buffer.duration-(options.offset??0))/(options.rate??1));if(duration<=.01)return null;
 if(options.position&&[...this.voices].filter(v=>v.panner).length>=this.budget.hrtf){this.dropped++;return null;}
 const source=c.createBufferSource(),gain=c.createGain(),fadeGain=c.createGain(),filter=c.createBiquadFilter();source.buffer=buffer;source.playbackRate.value=options.rate??1;filter.type='lowpass';filter.frequency.value=options.filter??6000;
 const panner=options.position&&[...this.voices].filter(v=>v.panner).length<this.budget.hrtf?c.createPanner():null;
 source.connect(filter).connect(gain).connect(fadeGain);if(panner){panner.panningModel='HRTF';panner.distanceModel='inverse';panner.refDistance=12;panner.maxDistance=180;panner.rolloffFactor=1.2;panner.positionX.value=options.position!.x;panner.positionY.value=options.position!.y;panner.positionZ.value=options.position!.z;fadeGain.connect(panner).connect(options.bus??this.master)}else fadeGain.connect(options.bus??this.master);
 const fade=Math.min(options.fade??.025,duration*.35),curve=new Float32Array(64);for(let i=0;i<64;i++)curve[i]=Math.sin(i/63*Math.PI/2)*options.gain;
 // Schedule after graph construction: currentTime may advance during HRTF setup.
 gain.gain.value=0;const t=c.currentTime+.05;gain.gain.setValueCurveAtTime(curve,t,fade);gain.gain.setValueCurveAtTime(Float32Array.from(curve).reverse(),t+duration-fade,fade);
 const voice:Voice={source,nodes:[filter,gain,fadeGain,...(panner?[panner]:[])],gain,fadeGain,asset,priority:options.priority,panner,end:t+duration,position:options.position?{...options.position}:undefined,velocity:options.velocity,started:t,retiring:false};this.voices.add(voice);this.peakVoices=Math.max(this.peakVoices,this.voices.size);source.onended=()=>this.release(voice);source.start(t,options.offset??0);source.stop(t+duration);return voice;
 }
 updateContext(c:SoundContext){if(this.closed)return;this.lastContext=c;const t=this.context.currentTime,mix=layerMix(c).slice(0,this.budget.beds),selected=new Set(mix.map((l:any)=>l.id));
 for(const bed of this.beds.values())if(!selected.has(bed.id)&&!bed.retiring){bed.retiring=true;bed.weight=0;bed.gain.gain.setTargetAtTime(0,t,1.2);bed.next=t+6;for(const v of this.voices)if(v.bedId===bed.id)this.retire(v,4)}
 for(const layer of mix){let b=this.beds.get(layer.id);if(!b){const gain=this.context.createGain(),filter=this.context.createBiquadFilter();gain.gain.value=0;filter.type='lowpass';filter.frequency.value=layer.filter;gain.connect(filter).connect(this.master);b={id:layer.id,asset:layer.asset,gain,filter,next:t,weight:0,priority:layer.priority,retiring:false};this.beds.set(layer.id,b)}if(b.retiring)b.next=t;b.retiring=false;b.weight=layer.weight;b.gain.gain.setTargetAtTime(layer.weight,t,1.2);b.filter.frequency.setTargetAtTime(layer.filter*(1-.3*(c.weather?.rain??0)),t,1);void this.resources.request(layer.asset)}
 for(const event of EVENTS)if(eventAffinity(event,c)>0){for(const asset of event.assets)void this.resources.request(asset)}
 this.pump();
 }
 pump(){if(this.closed)return;const t=this.context.currentTime;
 // Offline rendering/tests can advance clocks without onended delivery yet.
 for(const v of this.voices)if(v.end<=t)this.release(v);
 for(const [id,b] of this.beds){
 const active=[...this.voices].some(v=>v.bedId===b.id);
 if(b.retiring){if(!active){b.gain.disconnect();b.filter.disconnect();this.beds.delete(id)}continue}
 if(t<b.next)continue;const buffer=this.resources.get(b.asset);if(!buffer){void this.resources.request(b.asset);continue}
 const duration=Math.min(buffer.duration,24+this.random()*12),fade=Math.min(4,duration*.2),offset=this.random()*Math.max(0,buffer.duration-duration-.1);
 const v=this.play(b.asset,buffer,{gain:.7,duration,offset,priority:b.priority,bus:b.gain,fade});if(v){v.bedId=b.id;b.next=t+duration-fade}else b.next=t+.5;
 }
 for(const v of this.voices)if(v.panner&&v.position&&v.velocity){const age=t-v.started;v.panner.positionX.setTargetAtTime(v.position.x+v.velocity.x*age,t,.15);v.panner.positionY.setTargetAtTime(v.position.y+v.velocity.y*age,t,.15);v.panner.positionZ.setTargetAtTime(v.position.z+v.velocity.z*age,t,.15)}
 }
 event(event:{asset:string;position:Vec3;velocity?:Vec3;priority:number;gain:number}){const b=this.resources.get(event.asset);if(!b){void this.resources.request(event.asset);return false}return !!this.play(event.asset,b,{gain:event.gain,priority:event.priority,position:event.position,velocity:event.velocity})}
 footstep(kind:string){const m=MATERIALS[kind]??MATERIALS.terre;let i=Math.floor(this.random()*m.assets.length);if(i===this.lastStepVariant)i=(i+1)%m.assets.length;this.lastStepVariant=i;const id=m.assets[i],b=this.resources.get(id);if(!b){void this.resources.request(id);return false}const v=this.play(id,b,{gain:m.gain*(.86+this.random()*.2),rate:.96+this.random()*.08,filter:m.filter,priority:100});if(v)this.steps++;return !!v}
 listener(position:Vec3,forward:Vec3,up:Vec3){const l=this.context.listener,t=this.context.currentTime;for(const [param,value] of [[l.positionX,position.x],[l.positionY,position.y],[l.positionZ,position.z],[l.forwardX,forward.x],[l.forwardY,forward.y],[l.forwardZ,forward.z],[l.upX,up.x],[l.upY,up.y],[l.upZ,up.z]] as const)param.setTargetAtTime(value,t,.045)}
 /** Approximate occlusion only for explicit obstruction information from a host. */
 occlude(amount:number){const t=this.context.currentTime,a=Math.max(0,Math.min(1,amount));for(const v of this.voices)if(v.panner){const filter=v.nodes[0] as BiquadFilterNode;filter.frequency.setTargetAtTime(6000*(1-a)+900*a,t,.35)}}
 silence(){for(const v of this.voices)this.retire(v,.18);for(const b of this.beds.values()){b.retiring=true;b.gain.gain.setTargetAtTime(0,this.context.currentTime,.05)}}
 stats(){return {nodes:this.closed?0:2+this.beds.size*2+[...this.voices].reduce((n,v)=>n+1+v.nodes.length,0),voices:this.voices.size,peakVoices:this.peakVoices,hrtf:[...this.voices].filter(v=>v.panner).length,beds:this.beds.size,budget:this.budget,dropped:this.dropped,steps:this.steps,profile:this.profile,...this.resources.stats()}}
 dispose(){if(this.closed)return;this.closed=true;for(const v of this.voices){try{v.source.stop()}catch{/* Already ended. */}this.release(v)}for(const b of this.beds.values()){b.gain.disconnect();b.filter.disconnect()}this.beds.clear();this.lastContext=null;this.resources.dispose();this.master.disconnect();this.limiter.disconnect()}
}
