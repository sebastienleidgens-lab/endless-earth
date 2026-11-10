import {EVENTS,eventAffinity} from './profiles.mjs';
export function seededRandom(seed=1){let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}}
export function hash(text){let h=2166136261;for(const c of String(text))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
/** Session/visit clock (monotonic seconds) is distinct from audio scheduling and
 * simulated UTC. Memory LRU is bounded. Global cooldowns survive cell changes. */
export class SoundDirector{
 constructor({seed=1,maxCells=128,events=EVENTS}={}){this.seed=seed;this.random=seededRandom(seed);this.maxCells=maxCells;this.events=events;this.memory=new Map();this.last=new Map();this.sequence=0;this.lastTick=null;this.lastVariant=new Map()}
 visit(key,now){let m=this.memory.get(key);if(!m)m={visits:0,lastSeen:now,variants:{},seed:(hash(key)^this.seed)>>>0};if(this.currentKey!==key){m.visits++;this.currentKey=key}m.lastSeen=now;this.memory.delete(key);this.memory.set(key,m);while(this.memory.size>this.maxCells)this.memory.delete(this.memory.keys().next().value);return m}
 variant(id,assets,key,now){const m=this.visit(key,now),previous=this.lastVariant.get(id);let index=Math.floor(((this.random()+m.seed/4294967296)%1)*assets.length);if(assets.length>1&&index===previous)index=(index+1)%assets.length;this.lastVariant.set(id,index);m.variants[id]=index;return assets[index]}
 tick(c,now){const m=this.visit(c.key,now),previous=this.lastTick;this.lastTick=now;if(previous===null||now-previous>2||now<previous)return [];
 const dt=Math.max(0,Math.min(.75,now-previous)),out=[];
 for(const e of this.events){if(now-(this.last.get(e.id)??-Infinity)<e.cooldown)continue;
 const affinity=eventAffinity(e,c),chance=1-Math.exp(-e.perMinute*affinity*dt/60);
 if(this.random()<chance){this.last.set(e.id,now);const asset=this.variant(e.id,e.assets,c.key,now),angle=this.random()*Math.PI*2,radius=12+this.random()*45,known=c.sources.find(s=>s.kind===e.sourceKind),position=known?{...known.position}:{x:c.position.x+Math.sin(angle)*radius,y:(c.position.y??0)+3,z:c.position.z+Math.cos(angle)*radius};out.push({...e,asset,position,velocity:known?.velocity??null,interpreted:!known,sequence:++this.sequence,visit:m.visits});}
 }return out}
 resetClock(){this.lastTick=null}
 clear(){this.memory.clear();this.last.clear();this.lastVariant.clear();this.currentKey=null;this.resetClock()}
}
