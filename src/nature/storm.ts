import * as THREE from 'three';
// @ts-ignore Shared appearance uniforms, no new climate owner or render pass.
import {lifeUniforms} from '../earthlife/state.mjs';
// @ts-ignore Pure deterministic event envelope.
import {noise,lightningEnvelope} from './weather-model.mjs';
/** Local cloud illumination and rare interpreted discharge geometry. Every event
 * carries a bounded intensity, id, direction, distance and native timestamp.
 * This adapter consumes the ONE owner's elapsed time; it never runs a timer. */
export function createStorm(scene:THREE.Scene){
 const positions=new Float32Array(96*6),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const m=new THREE.LineBasicMaterial({color:0x9bacce,transparent:true,opacity:0,depthWrite:false}),bolt=new THREE.LineSegments(g,m);bolt.name='weather-distant-discharge';bolt.frustumCulled=false;bolt.renderOrder=1;scene.add(bolt);
 const events:any[]=[],direction=new THREE.Vector3();let next=Infinity,counter=0,current:any=null;
 return {events,update(time:number,climate:any,observer:THREE.Vector3,reduced:boolean){
  const activity=climate.metrics.electricalActivity,allowed=climate.targetWeather==='storm'&&activity>.10;
  if(!allowed)next=Infinity;else if(!Number.isFinite(next))next=time+16+noise(counter+Math.floor(climate.worldTimeMs/86400000))*30;
  if(allowed&&time>=next){
   const seed=counter++ +Math.floor(climate.worldTimeMs/86400000)*13,angle=noise(seed+7)*Math.PI*2,distanceM=900+noise(seed+91)*5200;
   direction.set(Math.sin(angle),.14+noise(seed+33)*.20,-Math.cos(angle)).normalize();
   current={id:'storm:'+Math.floor(climate.worldTimeMs/86400000)+':'+counter,timestampMs:performance.now(),worldTimeMs:climate.worldTimeMs,startSeconds:time,durationSeconds:.78,intensity:(reduced?.10:.32)*(.65+noise(seed+3)*.35),direction:direction.toArray(),distanceM,thunderDelaySeconds:distanceM/343,position:observer.clone().addScaledVector(direction,distanceM).toArray(),source:'shared simulated storm',kind:noise(seed+5)>.74?'branched':'in-cloud',audio:'pending'};
   events.push(current);if(events.length>16)events.shift();
   // Geometry is confined to one small distant region. No screen overlay.
   let n=0;const anchor=observer.clone().addScaledVector(direction,650),right=new THREE.Vector3(Math.cos(angle),0,Math.sin(angle));let a=anchor.clone();
   for(let i=0;i<14;i++){const b=anchor.clone().addScaledVector(right,(noise(seed+i*7)-.5)*14).add(new THREE.Vector3(0,-i*4,0));positions.set(a.toArray(),n);positions.set(b.toArray(),n+3);n+=6;if(i===6||i===9){positions.set(b.toArray(),n);positions.set(b.clone().addScaledVector(right,12*(i===6?1:-1)).add(new THREE.Vector3(0,-9,0)).toArray(),n+3);n+=6}a=b;}g.setDrawRange(0,n/3);g.attributes.position.needsUpdate=true;
   next=time+Math.max(12,22+noise(seed+19)*85)/(Math.max(.35,activity));
  }
  const power=current?lightningEnvelope(time-current.startSeconds,current.durationSeconds)*current.intensity:0;
  lifeUniforms.lifeLightning.value=power;if(current)lifeUniforms.lifeLightningDirection.value.fromArray(current.direction);
  bolt.visible=power>.001&&current?.kind==='branched';m.opacity=power*1.8;
  climate.lightning={active:power>.001,id:power>.001?current?.id:null,intensity:power,maxIntensity:reduced?.10:.32,events,nextSeconds:Number.isFinite(next)?next:null};
 },dispose(){scene.remove(bolt);g.dispose();m.dispose();events.length=0;lifeUniforms.lifeLightning.value=0}};
}
