/** Canonical Float64 simulation positions never move. Only presentation uses
 * this origin; maps, saves, collision and graph identifiers remain canonical. */
export const presentationOrigin={x:0,y:0,z:0,revision:0};
const listeners=new Set();
export function onOriginChange(listener){listeners.add(listener);return ()=>listeners.delete(listener);}
export function setPresentationOrigin(next){
 if(![next.x,next.y,next.z].every(Number.isFinite))throw Error('Invalid presentation origin');
 if(next.x===presentationOrigin.x&&next.y===presentationOrigin.y&&next.z===presentationOrigin.z)return false;
 const before={...presentationOrigin},done=[];Object.assign(presentationOrigin,next,{revision:before.revision+1});
 try{for(const listener of listeners){listener(presentationOrigin,before);done.push(listener);}}
 catch(e){Object.assign(presentationOrigin,before);for(const listener of done.reverse())listener(presentationOrigin,next);throw e;}
 return true;
}
export function localPresentation(p){return {x:p.x-presentationOrigin.x,y:p.y-presentationOrigin.y,z:p.z-presentationOrigin.z};}
