import {hash} from '../life/village-identity.mjs';
export class VillageSoundMemory{
 constructor(){this.actors=new Map();this.lastHuman=-Infinity;}
 choose(kind,id,assets,time){
  if(!assets?.length||!Number.isFinite(time))return null;
  const key=kind+':'+id,old=this.actors.get(key),gap=kind==='step'?.24:kind==='dog'?35:kind==='cycle'?10:28;
  if(old&&time-old.time<gap||!['step','cycle'].includes(kind)&&time-this.lastHuman<3)return null;
  const fresh=assets.filter(a=>a!==old?.asset),pool=fresh.length?fresh:assets,index=(hash(id)+(old?.sequence??0))%pool.length,asset=pool[index];
  this.actors.delete(key);this.actors.set(key,{time,asset,sequence:(old?.sequence??0)+1});while(this.actors.size>128)this.actors.delete(this.actors.keys().next().value);
  if(!['step','cycle'].includes(kind))this.lastHuman=time;
  return {asset,rate:.97+(hash(id)%7)*.01};
 }
 clear(){this.actors.clear();this.lastHuman=-Infinity;}
}
