import {hash} from './director.mjs';
// Stable WGS84-addressed perches. These are ecological/artist interpretations,
// not surveys of individual birds. No placement relative to the listener RNG.
const STEP=1/2048;
export function emitterCandidates(c,habitatAt,heightAt=null,cache=null){
 if(!c.geo||!habitatAt)return [];
 const row=Math.floor(c.geo.lat/STEP),col=Math.floor(c.geo.lon/STEP),out=[];
 if(cache&&(cache.habitatOwner!==habitatAt||cache.heightOwner!==heightAt)){cache.clear();cache.habitatOwner=habitatAt;cache.heightOwner=heightAt}
 for(let z=-2;z<=2;z++)for(let x=-2;x<=2;x++){
 const key=`perch-v1:${row+z}:${col+x}`,seed=hash(key),lat=(row+z+.15+((seed>>>8)%700)/1000)*STEP,lon=(col+x+.15+(seed%700)/1000)*STEP;
 const position={x:c.position.x+(lon-c.geo.lon)*111320*Math.cos(c.geo.lat*Math.PI/180),y:c.position.y+3+(seed%5),z:c.position.z-(lat-c.geo.lat)*111320};
 let sample=cache?.get(key);if(!sample){sample={height:heightAt?.(position.x,position.z)??null,habitat:habitatAt(position.x,position.z)??'unknown'};if(cache){cache.set(key,sample);while(cache.size>128)cache.delete(cache.keys().next().value)}}
 if(heightAt&&Number.isFinite(c.altitudeM)){if(sample.height===null)continue;position.y=c.position.y+sample.height-c.altitudeM+3+(seed%5)}
 const habitat=sample.habitat;
 if(['wood','forest','scrub','garden','orchard','built','meadow','riparian'].includes(habitat))out.push({id:key,geo:{lat,lon},position,habitat,interpreted:true});
 }return out;
}
