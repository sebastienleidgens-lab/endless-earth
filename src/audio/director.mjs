import {EVENTS,BIRD_PROFILES,eventAffinity,birdActivity} from './profiles.mjs';
export function seededRandom(seed=1){let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}}
export function hash(text){let h=2166136261;for(const c of String(text))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
export class SoundDirector{
 constructor({seed=1,maxCells=128,events=EVENTS}={}){this.seed=seed;this.random=seededRandom(seed);this.maxCells=Math.max(1,Math.min(256,maxCells));this.events=events;this.memory=new Map();this.last=new Map();this.perches=new Map();this.sequence=0;this.lastTick=null;this.lastVariant=new Map();this.lastCategory=-Infinity}
 visit(key,now){let m=this.memory.get(key);if(!m)m={visits:0,lastSeen:now,variants:{},seed:(hash(key)^this.seed)>>>0};if(this.currentKey!==key){m.visits++;this.currentKey=key}m.lastSeen=now;this.memory.delete(key);this.memory.set(key,m);while(this.memory.size>this.maxCells)this.memory.delete(this.memory.keys().next().value);return m}
 variant(id,assets,key,now){const m=this.visit(key,now),previous=this.lastVariant.get(id);let i=Math.floor(((this.random()+m.seed/4294967296)%1)*assets.length);if(assets.length>1&&i===previous)i=(i+1)%assets.length;this.lastVariant.set(id,i);m.variants[id]=i;return assets[i]}
 residents(c,now){
 const out=[];
 for(const emitter of c.emitters??[]){
 const choices=BIRD_PROFILES.filter(b=>b.habitats.includes(emitter.habitat)&&b.assets.length);if(!choices.length)continue;
 const h=hash(emitter.id);if(h%100>42)continue; // Sparse, stable distribution, not a player-centred chorus.
 let memory=this.perches.get(emitter.id);if(!memory){const bird=choices[h%choices.length];memory={bird:bird.id,last:-Infinity,assetIndex:0,heard:[],firstSeen:now};}
 const bird=BIRD_PROFILES.find(b=>b.id===memory.bird);if(!bird)continue;
 this.perches.delete(emitter.id);this.perches.set(emitter.id,memory);
 const distance=Math.hypot(emitter.position.x-c.position.x,emitter.position.z-c.position.z);
 if(distance<bird.range&&birdActivity(bird,c,emitter.habitat)>0)out.push({emitter,bird,memory,distance});
 }
 while(this.perches.size>128)this.perches.delete(this.perches.keys().next().value);
 return out;
 }
 preload(c,now){return this.residents(c,now).sort((a,b)=>a.distance-b.distance).slice(0,2).map(({bird,memory})=>bird.assets[memory.assetIndex%bird.assets.length])}
 tick(c,now){this.visit(c.key,now);const previous=this.lastTick;this.lastTick=now;if(previous===null||now-previous>2||now<previous)return [];
 const dt=Math.max(0,Math.min(.75,now-previous)),out=[];
 if(now-this.lastCategory>12){for(const {emitter,bird,memory,distance} of this.residents(c,now)){
 if(now-memory.firstSeen<8||now-memory.last<bird.cooldown)continue;
 const rate=bird.perMinute*birdActivity(bird,c,emitter.habitat);
 if(this.random()<1-Math.exp(-rate*dt/60)){
 const asset=bird.assets[memory.assetIndex%bird.assets.length];memory.assetIndex=(memory.assetIndex+1+Math.floor(this.random()*Math.max(1,bird.assets.length-1)))%bird.assets.length;memory.last=now;memory.heard.push(asset);if(memory.heard.length>3)memory.heard.shift();this.lastCategory=now;
 out.push({id:bird.id,asset,position:{...emitter.position},emitterId:emitter.id,interpreted:true,priority:60,gain:bird.gain*(.65+this.random()*.65),refDistance:bird.refDistance,maxDistance:bird.range,distance,sequence:++this.sequence,reason:`plausible ${bird.id}, ${emitter.habitat}, ${c.season}, local ${c.localHour.toFixed(1)}h; fixed WGS84 perch`});break;
 }
 }}
 for(const e of this.events){if(now-(this.last.get(e.id)??-Infinity)<e.cooldown)continue;const affinity=eventAffinity(e,c);if(this.random()<1-Math.exp(-e.perMinute*affinity*dt/60)){this.last.set(e.id,now);out.push({...e,asset:this.variant(e.id,e.assets,c.key,now),position:{...c.position},interpreted:true,sequence:++this.sequence})}}
 return out;
 }
 resetClock(){this.lastTick=null}
 clear(){this.memory.clear();this.perches.clear();this.last.clear();this.lastVariant.clear();this.currentKey=null;this.lastCategory=-Infinity;this.resetClock()}
}
