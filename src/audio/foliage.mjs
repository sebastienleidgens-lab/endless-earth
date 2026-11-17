import {windAtWorld} from '../earthlife/wind.mjs';
/** Actual loaded branch anchors; selection is listener-relative, ownership is not. */
export class FoliageSources{
 constructor(points=[]){this.cells=new Map();for(const p of points){const k=Math.floor(p.x/32)+','+Math.floor(p.z/32);if(!this.cells.has(k))this.cells.set(k,[]);this.cells.get(k).push(p);}}
 near(listener,time,mean){const out=[],cx=Math.floor(listener.x/32),cz=Math.floor(listener.z/32);for(let z=cz-1;z<=cz+1;z++)for(let x=cx-1;x<=cx+1;x++)for(const p of this.cells.get(x+','+z)??[]){const distance=Math.hypot(p.x-listener.x,p.z-listener.z);if(distance<28){const w=windAtWorld(p.x,p.z,time,mean);out.push({id:p.id,position:p,distance,wind:w.speed,gust:w.gust});}}return out.sort((a,b)=>a.distance-b.distance).slice(0,2);}
}
