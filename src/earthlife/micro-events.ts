import * as THREE from 'three';
// @ts-ignore Shared spatial wind.
import {windAtWorld} from './wind.mjs';
// @ts-ignore Counter-based events and geographic/season gating.
import {eventAt,eligibleLeaves} from './events.mjs';
// @ts-ignore Global shared allowance.
import {WorldLifeBudget} from './budget.mjs';
export function createMicroEvents(scene:THREE.Scene,budget:InstanceType<typeof WorldLifeBudget>){
 const geometry=new THREE.BufferGeometry();const values=new Float32Array(16*3);geometry.setAttribute('position',new THREE.BufferAttribute(values,3));
 const material=new THREE.PointsMaterial({size:.065,color:0xb49b58,transparent:true,opacity:0,depthWrite:false});
 const points=new THREE.Points(geometry,material);points.name='earthlife-leaves';points.frustumCulled=false;points.visible=false;scene.add(points);
 const wind={x:0,z:0,speed:0,gust:0};const eventState:any={},result={active:0,calm:0},spreadX=Float64Array.from({length:16},(_,i)=>Math.sin(i*7)*5),spreadZ=Float64Array.from({length:16},(_,i)=>Math.cos(i*5)*5);let cell='',id='',active=false,ownerX=NaN,ownerZ=NaN,revision=-1,key='';const anchor=new THREE.Vector3();
 return {update(t:number,p:THREE.Vector3,c:any){
  if(budget.profile.events<=0){budget.release(cell);active=false;points.visible=false;result.active=result.calm=0;return result;}
  const cx=Math.floor(p.x/128),cz=Math.floor(p.z/128);if(ownerX!==cx||ownerZ!==cz||revision!==budget.revision){ownerX=cx;ownerZ=cz;revision=budget.revision;key=`event:${cx}:${cz}:${revision}`}const event=eventAt(t,cx*917+cz*31,9,eventState);
  const eligible=event.kind==='calm'||eligibleLeaves(c.month,c.latitude,c.habitat);
  if(cell!==key||id!==event.id||!event.active||!eligible||p.distanceTo(anchor)>45){budget.release(cell);active=false;cell=key;id=event.id;}
  if(event.active&&eligible&&!active&&event.age<2&&budget.claim(cell,'events')){active=true;anchor.copy(p);if(event.kind==='leaves')budget.claim(cell,'particles',budget.profile.particles)}
  points.visible=active&&event.kind==='leaves'&&budget.profile.particles>0;
  if(points.visible){windAtWorld(anchor.x,anchor.z,t,c.wind,9,wind);const n=budget.profile.particles;geometry.setDrawRange(0,n);for(let i=0;i<n;i++){const age=(event.age+i*.73)%8;values[i*3]=anchor.x+spreadX[i]+age*wind.x;values[i*3+1]=anchor.y+4-age*.38+Math.sin(age+i)*.1;values[i*3+2]=anchor.z+spreadZ[i]-age*-wind.z;}geometry.attributes.position.needsUpdate=true;material.opacity=event.envelope*.65;}
  result.active=Number(active);result.calm=active&&event.kind==='calm'?event.envelope:0;return result;
 },dispose(){budget.release(cell);scene.remove(points);geometry.dispose();material.dispose()}};
}
