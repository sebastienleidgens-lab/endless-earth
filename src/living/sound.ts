import { nature,water,surfaceAt } from './geography';
// @ts-ignore Shared pure module.
import { surfaceKind } from './walk.mjs';
// Original procedural synthesis: no external recordings or asset licenses.
export class Soundscape {
 context:AudioContext|null=null; master:GainNode|null=null;wind:GainNode|null=null;river:GainNode|null=null;
 enabled=false;distance=0;nextBird=0;stepBuffer:AudioBuffer|null=null;
 private transition:Promise<boolean>=Promise.resolve(false);
 toggle(){
  // Serialize resume/suspend even when several clicks arrive before a promise settles.
  const next=this.transition.then(()=>this.applyToggle(),()=>this.applyToggle());
  this.transition=next;return next;
 }
 private async applyToggle(){
  if(!this.context){
   this.context=new AudioContext();const c=this.context;
   this.master=c.createGain();this.master.gain.value=0;this.master.connect(c.destination);
   const buffer=c.createBuffer(1,c.sampleRate*3,c.sampleRate),data=buffer.getChannelData(0);
   for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.35;
   this.stepBuffer=buffer;
   for(const [frequency,kind] of [[480,'wind'],[950,'river']] as const){
    const source=c.createBufferSource();source.buffer=buffer;source.loop=true;
    const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=frequency;
    const gain=c.createGain();gain.gain.value=0;source.connect(filter).connect(gain).connect(this.master);source.start();this[kind]=gain;
   }
  }
  const enable=!this.enabled;
  if(enable)await this.context.resume();
  this.master!.gain.cancelScheduledValues(this.context.currentTime);
  this.master!.gain.setTargetAtTime(enable?.28:0,this.context.currentTime,.08);
  if(!enable)await this.context.suspend();
  this.enabled=enable;
  return this.enabled;
 }
 tone(frequency:number,duration:number,volume:number,pan=0,noise=false){
  const c=this.context!;if(!this.enabled)return;
  const source=c.createOscillator(),gain=c.createGain(),panner=c.createStereoPanner();
  source.type=noise?'triangle':'sine';source.frequency.setValueAtTime(frequency,c.currentTime);
  source.frequency.exponentialRampToValueAtTime(frequency*(noise?.45:1.4),c.currentTime+duration);
  gain.gain.setValueAtTime(volume,c.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);
  panner.pan.value=Math.max(-1,Math.min(1,pan));source.connect(gain).connect(panner).connect(this.master!);source.start();source.stop(c.currentTime+duration);
  source.onended=()=>{source.disconnect();gain.disconnect();panner.disconnect();};
 }
 footstep(kind:string){
  const c=this.context!,source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
  source.buffer=this.stepBuffer;filter.type='lowpass';
  filter.frequency.value=({herbe:450,terre:700,gravier:2400,route:1100} as Record<string,number>)[kind];
  const t=c.currentTime,duration=kind==='gravier'?.16:.11;
  gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.2+Math.random()*.06,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  source.connect(filter).connect(gain).connect(this.master!);source.start(t,Math.random()*2,duration);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
 }
 update(p:{x:number;z:number},travel:number,wind:number,yaw:number){
  if(!this.enabled||!this.context)return;
  const c=this.context;this.wind!.gain.setTargetAtTime(wind*.22,c.currentTime,.5);
  const nearest=water.reduce((v,q)=>Math.min(v,Math.hypot(q.x-p.x,q.z-p.z)),Infinity);
  this.river!.gain.setTargetAtTime(Math.max(0,1-nearest/65)*.12,c.currentTime,.5);
  this.distance+=travel;
  if(this.distance>.8){this.distance%=.8;const kind=surfaceKind(surfaceAt(p));this.footstep(kind);}
  if(c.currentTime>this.nextBird){
   this.nextBird=c.currentTime+10+Math.random()*22;
   const q=nature[Math.floor(Math.random()*nature.length)];
   if(q){const dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);if(d<110)this.tone(1500+Math.random()*1700,.12+Math.random()*.18,.07/(1+d/15),(dx*Math.cos(yaw)-dz*Math.sin(yaw))/Math.max(1,d));}
  }
 }
}
