import * as THREE from 'three';
// @ts-ignore Pure analytic flight model.
import {flockAt,birdPosition} from './fauna.mjs';
// @ts-ignore Global budget.
import {WorldLifeBudget} from './budget.mjs';
export function createFauna(scene:THREE.Scene,budget:InstanceType<typeof WorldLifeBudget>,height:(x:number,z:number)=>number|null){
 const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.65,0,0),new THREE.Vector3(0,-.10,.12),new THREE.Vector3(.65,0,0)]),material=new THREE.LineBasicMaterial({color:0x3b4541,transparent:true});
 const root=new THREE.Group();root.name='earthlife-fauna';const birds=Array.from({length:9},()=>new THREE.Line(geometry,material));birds.forEach(b=>{b.visible=false;root.add(b)});scene.add(root);
 const previousSoundSources=scene.userData.lifeSoundSources,soundSources:{id:string;kind:string;position:THREE.Vector3;velocity:THREE.Vector3}[]=[],soundPool=birds.map((bird,i)=>({id:`bird:${i}`,kind:'bird',position:bird.position,velocity:new THREE.Vector3()}));scene.userData.lifeSoundSources=soundSources;
 const flockState:any={};let id='',ceiling=0,cell='',count=0,ownerX=NaN,ownerZ=NaN;const anchor={x:0,z:0},position={x:0,y:0,z:0};
 return {update(t:number,p:THREE.Vector3,conditions:any){
  soundSources.length=0;
  if(budget.profile.birds<=0){if(root.visible){budget.release(cell);count=0;birds.forEach(b=>b.visible=false);root.visible=false}return 0;}
  if(!Number.isFinite(ownerX)||Math.hypot(p.x-anchor.x,p.z-anchor.z)>360){ownerX=Math.floor(p.x/256);ownerZ=Math.floor(p.z/256)}
  const cx=ownerX,cz=ownerZ,next=`birds:${cx}:${cz}:${budget.revision}`;
  const flock=flockAt(t,cx*73856093+cz*19349663,conditions,9,flockState);
  if(next!==cell||flock.id!==id){budget.release(cell);cell=next;id=flock.id;count=0;anchor.x=(cx+.5)*256;anchor.z=(cz+.5)*256;
   // All trajectories stay above the loaded terrain AND building envelope supplied by geodata.
   ceiling=scene.userData.lifeCeiling??Infinity;
   if(!Number.isFinite(ceiling)){ceiling=-Infinity;for(let z=-300;z<=300;z+=100)for(let x=-300;x<=300;x+=100)ceiling=Math.max(ceiling,height(anchor.x+x,anchor.z+z)??0);ceiling+=85;}
  }
  if(flock.active&&count===0){const winter=conditions.latitude>=0?(conditions.month<=2||conditions.month===12):(conditions.month>=6&&conditions.month<=8);const wanted=Math.min(budget.profile.birds,winter?2:flock.count);if(budget.claim(cell,'birds',wanted))count=wanted;}
  if(!flock.active&&count){budget.release(cell);count=0;}
  material.opacity=flock.fade*(1-THREE.MathUtils.smoothstep(Math.hypot(p.x-anchor.x,p.z-anchor.z),240,350));
  const visible=flock.active&&count>0&&material.opacity>.001;if(!visible){if(root.visible)birds.forEach(b=>b.visible=false);root.visible=false;return count;}root.visible=true;
  for(let i=0;i<birds.length;i++){const bird=birds[i];bird.visible=flock.active&&i<count;if(!bird.visible)continue;birdPosition(flock,i,anchor,ceiling,position);const sound=soundPool[i],delta=t-(bird.userData.soundTime??t);if(delta>0&&delta<1)sound.velocity.set((position.x-bird.position.x)/delta,(position.y-bird.position.y)/delta,(position.z-bird.position.z)/delta);else sound.velocity.set(0,0,0);bird.userData.soundTime=t;bird.position.set(position.x,position.y,position.z);soundSources.push(sound);bird.rotation.set(0,-flock.angle,flock.gliding?Math.sin(t*.7+i)*.05:Math.sin(t*(flock.fast?8:5)+i)*.22);bird.scale.setScalar(1.25);}
  return count;
 },dispose(){if(scene.userData.lifeSoundSources===soundSources)scene.userData.lifeSoundSources=previousSoundSources;soundSources.length=0;budget.release(cell);scene.remove(root);geometry.dispose();material.dispose()}};
}
