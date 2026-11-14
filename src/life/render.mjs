import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {lightingReceiver} from '../lighting/state.mjs';
import {snowReceiver} from '../nature/snow-state.mjs';
import {SIGNS_VERSION,QuietLife,flightAt,chimneyCaps,hash} from './model.mjs';
import {heatingAnchors,hearthStrength} from './heating.mjs';
import {createPlumes} from './plume.mjs';
const smooth=(a,b,t)=>{const q=Math.max(0,Math.min(1,(t-a)/(b-a)));return q*q*(3-2*q)};
function painted(g,hex){const c=new THREE.Color(hex),a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3)a.set([c.r,c.g,c.b],i);g.setAttribute('color',new THREE.BufferAttribute(a,3));return g}
function joined(parts){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());return g}
function aircraftGeometry(){return joined([
 painted(new THREE.CylinderGeometry(.35,.10,6,8).rotateX(Math.PI/2),0xc1c3ba),
 painted(new THREE.SphereGeometry(.35,8,6).translate(0,0,3),0xaeb5ad),
 painted(new THREE.SphereGeometry(1,8,6).scale(.42,.29,.65).translate(0,.31,.8),0x4c626a),
 painted(new THREE.BoxGeometry(10.1,.12,1.15).translate(0,.48,.6),0xbac2bb),
 painted(new THREE.BoxGeometry(3.0,.09,.65).translate(0,.18,-2.25),0xbac2bb),
 painted(new THREE.BoxGeometry(.10,.85,.7).translate(0,.52,-2.45),0xa1aaa1)
 ])}
function chimneyGeometry(){return joined([
 painted(new THREE.BoxGeometry(.62,.09,.62).translate(0,.045,0),0xaaa08d),
 painted(new THREE.CylinderGeometry(.105,.12,.32,8,1,true).translate(0,.25,0),0x99775d),
 painted(new THREE.RingGeometry(.085,.105,8).rotateX(-Math.PI/2).translate(0,.411,0),0x9c806a),
 painted(new THREE.CircleGeometry(.085,8).rotateX(-Math.PI/2).translate(0,.401,0),0x393b36)
 ])}
/** Roof-only props and ephemeral life share the existing climate and world budget. */
export function createSignsOfLife(scene,camera,renderer,{seed,diagnostic=false}={}){
 const params=new URLSearchParams(location.search);seed??=params.get('lifeSeed')?.slice(0,128)??Array.from(crypto.getRandomValues(new Uint32Array(2))).join('-');
 const model=new QuietLife(seed),root=new THREE.Group();root.name='simulated-signs-of-life';scene.add(root);let ready=false,disposed=false,anchors=[],heating=[],modern=false,budget=null,revision=-1,managedFlight='',flightOwned=false,lodAge=Infinity;
 const claimed=new Set(),hearthOwners=new Map(),matrix=new THREE.Matrix4(),orientation=new THREE.Quaternion(),axis=new THREE.Vector3(0,1,0),scale=new THREE.Vector3(),at=new THREE.Vector3(),color=new THREE.Color();
 const roofMaterial=new THREE.MeshLambertMaterial({vertexColors:true});lightingReceiver(roofMaterial);snowReceiver(roofMaterial);
 const roofGeometry=chimneyGeometry(),roofs=new THREE.InstancedMesh(roofGeometry,roofMaterial,72);roofs.name='interpreted-chimney-copings';roofs.frustumCulled=false;roofs.count=0;root.add(roofs);
 const planeGeometry=aircraftGeometry(),planeMaterial=new THREE.MeshLambertMaterial({vertexColors:true,transparent:true,depthWrite:false}),plane=new THREE.Mesh(planeGeometry,planeMaterial);plane.name='simulated-light-aircraft';plane.visible=false;root.add(plane);
 const plumes=createPlumes(16),smokeGeometry=plumes.geometry,smokeMaterial=plumes.material,smoke=plumes.mesh;smoke.name='simulated-hearth-smoke';smoke.visible=false;root.add(smoke);
 const frustum=new THREE.Frustum(),clip=new THREE.Matrix4(),sphere=new THREE.Sphere();
 const puffs=Array.from({length:16},(_,i)=>({cell:'signs:puff:'+i,alive:false,x:0,y:0,z:0,age:0,life:0,seed:i})),position={x:0,y:0,z:0,alpha:0,audioWindow:false},audio={id:'',position:{x:0,y:0,z:0},velocity:{x:0,y:0,z:0},eligible:false};
 const metrics={version:SIGNS_VERSION,seed,ready:false,provenance:'Artistic aircraft/heating, no real traffic or occupancy observation. Existing procedural chimney positions; roof caps and clay pots interpreted.',chimneys:0,roofDetails:0,flightScheduled:0,flightVisible:false,smokeSources:0,puffs:0,visiblePuffs:0,time:0,omitted:0,cpuMs:0,maxCpuMs:0,wind:{x:0,z:0},diagnostic:false,trianglesPerAircraft:planeGeometry.index.count/3,trianglesPerChimney:roofGeometry.index.count/3};scene.userData.signsOfLife=metrics;
 const claim=(id,kind,n=1)=>{if(!budget?.claim(id,kind,n))return false;claimed.add(id);return true},release=id=>{budget?.release(id);claimed.delete(id)},clear=()=>{for(const id of claimed)budget?.release(id);claimed.clear();puffs.forEach(p=>p.alive=false);hearthOwners.clear();managedFlight='';flightOwned=false};
 const lifecycle=new AbortController();
 if(diagnostic)addEventListener('life-test-inspect',e=>{if(!ready)return;const d=e.detail;if(d?.kind==='flight'){if(model.flight)return;const f=model.startFlight(model.time,d.position??camera.position,scene.userData.lifeCeiling??100);if(Number.isFinite(d.phase))f.start-=f.duration*Math.max(0,Math.min(1,d.phase));metrics.diagnostic=true}else if(d?.kind==='hearth'){const anchor=anchors.find(a=>a.id===d.id)??anchors[0];if(!anchor)return;model.hearths=[{id:'inspection-hearth',anchor,start:model.time,end:model.time+180,nextPuff:model.time}];metrics.diagnostic=true}},{signal:lifecycle.signal});
 return {model,metrics,root,anchors:()=>anchors,get audioFlight(){return audio.eligible?audio:null},
  install(world,buildings){if(disposed)return;world.updateMatrixWorld(true);anchors=[];world.traverse(o=>{if(o.isMesh&&o.visible&&o.name==='architecture-roof')for(const a of chimneyCaps(o.geometry)){at.set(a.x,a.y,a.z).applyMatrix4(o.matrixWorld);anchors.push({...a,x:at.x,y:at.y,z:at.z})}});anchors.sort((a,b)=>a.x-b.x||a.z-b.z||a.y-b.y);modern=Array.isArray(buildings);heating=modern?heatingAnchors(anchors,buildings):[];metrics.eligibleHouses=heating.length;metrics.inferredResidential=heating.filter(a=>a.residential.startsWith('inferred')).length;ready=true;metrics.ready=true;metrics.chimneys=anchors.length;lodAge=Infinity;return anchors.length},
  update(wallDt,climate,player,isReady){if(disposed||!ready||!isReady){root.visible=false;audio.eligible=false;return}root.visible=true;const began=performance.now(),dt=Math.max(0,Math.min(1,wallDt)),nextBudget=scene.userData.lifeBudget;if(!nextBudget)return;if(budget!==nextBudget||revision!==nextBudget.revision){clear();budget=nextBudget;revision=budget.revision;lodAge=Infinity}
   model.update(dt,climate,player,modern?[]:anchors,scene.userData.lifeCeiling??100);const t=model.time,wind=climate?.wind??{x:0,z:0};metrics.time=t;metrics.wind.x=wind.x;metrics.wind.z=wind.z;audio.eligible=false;
   lodAge+=dt;if(lodAge>=.5){lodAge=0;const max=budget.profile.particles<=4?24:budget.profile.particles<=8?48:72,candidates=anchors.map(a=>({a,d:Math.hypot(camera.position.x-a.x,camera.position.z-a.z)})).filter(r=>r.d<170).sort((a,b)=>a.d-b.d).slice(0,max);let n=0;for(const {a,d}of candidates){const h=hash(a.id),factor=1-smooth(125,170,d);at.set(a.x,a.y,a.z);orientation.setFromAxisAngle(axis,(h%4)*Math.PI/2);scale.set(factor,(.85+(h%7)*.05)*factor,factor);matrix.compose(at,orientation,scale);roofs.setMatrixAt(n,matrix);color.setHex([0xffffff,0xe2ded5,0xe7d6c2][h%3]);roofs.setColorAt(n++,color)}roofs.count=n;roofs.instanceMatrix.needsUpdate=true;if(roofs.instanceColor)roofs.instanceColor.needsUpdate=true;metrics.roofDetails=n}
   const flight=model.flight;if(flight){if(flight.id!==managedFlight){release('signs:aircraft');managedFlight=flight.id;flightOwned=claim('signs:aircraft','events');if(!flightOwned)metrics.omitted++}flightAt(flight,t,position);plane.position.set(position.x,position.y,position.z);plane.rotation.y=flight.heading;const distance=plane.position.distanceTo(camera.position);planeMaterial.opacity=position.alpha*(1-smooth(1050,1450,distance));plane.visible=flightOwned&&planeMaterial.opacity>.002;if(flightOwned){audio.id=flight.id;Object.assign(audio.position,position);Object.assign(audio.velocity,flight.velocity);audio.eligible=position.audioWindow&&distance<1200}}else{if(managedFlight)release('signs:aircraft');managedFlight='';flightOwned=false;plane.visible=false}
   if(modern&&lodAge===0){
    camera.updateMatrixWorld();frustum.setFromProjectionMatrix(clip.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));const range=budget.profile.particles<=4?150:budget.profile.particles<=8?260:320;
    const active=heating.map(a=>({a,strength:hearthStrength(a,climate),distance:Math.hypot(a.x-camera.position.x,a.z-camera.position.z)}));metrics.activeHouses=active.filter(a=>a.strength>.05).length;
    const visible=active.filter(r=>{sphere.center.set(r.a.x,r.a.y+2,r.a.z);sphere.radius=4;return r.strength>.035&&r.distance<range&&frustum.intersectsSphere(sphere)}).sort((a,b)=>a.distance-b.distance||a.a.id.localeCompare(b.a.id)).slice(0,Math.max(0,budget.profile.particles-2));
    const wanted=new Set(visible.map(v=>v.a.id));for(const p of puffs)if(p.alive&&!wanted.has(p.source?.id)){p.alive=false;release(p.cell);}
    for(const r of visible){if(puffs.some(p=>p.alive&&p.source?.id===r.a.id))continue;const p=puffs.find(p=>!p.alive);if(p&&claim(p.cell,'particles'))Object.assign(p,{alive:true,source:r.a,age:0,fade:0});}
   }
   if(!modern){for(const [id]of hearthOwners)if(!model.hearths.some(e=>e.id===id)){release('signs:'+id);hearthOwners.delete(id)}
   for(const e of model.hearths){if(!hearthOwners.has(e.id)){const admitted=budget.profile.particles>0&&claim('signs:'+e.id,'events');hearthOwners.set(e.id,admitted);if(!admitted)metrics.omitted++}if(t>=e.nextPuff){e.nextPuff=t+1.35+(hash(e.id+Math.floor(t))%100)*.009;if(!hearthOwners.get(e.id))continue;const p=puffs.find(p=>!p.alive);if(p&&claim(p.cell,'particles')){const h=hash(e.anchor.id);Object.assign(p,{alive:true,x:e.anchor.x,y:e.anchor.y+.411*(.85+(h%7)*.05)+.04,z:e.anchor.z,age:0,life:7.5+(h%4)*.5})}}}
   }
   let count=0,visible=0;const tips=[];for(const p of puffs){if(!p.alive)continue;
    if(modern){const a=p.source,distance=Math.hypot(a.x-camera.position.x,a.z-camera.position.z),range=budget.profile.particles<=4?150:budget.profile.particles<=8?260:320,h=hash(a.id),tipY=a.y+.411*(.85+(h%7)*.05)*(1-smooth(125,170,distance))+.018;p.fade+=(1-p.fade)*(1-Math.exp(-dt*3));const opacity=hearthStrength(a,climate)*.42*p.fade*(1-smooth(range*.5,range,distance)),origin={x:a.x,y:tipY,z:a.z};plumes.set(count,origin,2.8+a.phase*1.8,(.8+a.phase*.6)*(1+Math.hypot(wind.x,wind.z)*.6),opacity,a.phase);tips.push({id:a.id,buildingId:a.buildingId,origin,residential:a.residential});if(opacity>.002)visible++;count++;continue;}
    p.age+=dt;if(p.age>=p.life){p.alive=false;release(p.cell);continue}p.x+=(wind.x*1.3+Math.sin(t*.7+p.seed)*.035)*dt;p.z+=(wind.z*1.3+Math.cos(t*.6+p.seed)*.035)*dt;p.y+=(.32+.05*Math.sin(t+p.seed))*dt;const distance=Math.hypot(p.x-camera.position.x,p.z-camera.position.z),fade=1-smooth(100,175,distance),opacity=Math.sin(Math.PI*p.age/p.life)*.13*fade;plumes.set(count,p,.8+p.age*.15,.38+p.age*.21,opacity,p.seed);if(opacity>.001)visible++;count++;
   }
   plumes.update(count,climate?.elapsedSeconds??t,wind,smooth(-.15,.6,climate?.solar?.altitude??1));metrics.outlets=tips;
   metrics.budget=budget.allocated;metrics.limits=budget.profile;metrics.flight=flight?{id:flight.id,position:{x:position.x,y:position.y,z:position.z},velocity:flight.velocity,heading:flight.heading,age:t-flight.start,duration:flight.duration}:null;
   Object.assign(metrics,{flightScheduled:model.flights,flightVisible:plane.visible,smokeSources:modern?visible:[...hearthOwners.values()].filter(Boolean).length,puffs:count,visiblePuffs:visible,cpuMs:performance.now()-began});metrics.maxCpuMs=Math.max(metrics.maxCpuMs,metrics.cpuMs);
  },dispose(){if(disposed)return;disposed=true;clear();lifecycle.abort();scene.remove(root);if(scene.userData.signsOfLife===metrics)delete scene.userData.signsOfLife;roofGeometry.dispose();roofMaterial.dispose();planeGeometry.dispose();planeMaterial.dispose();smokeGeometry.dispose();smokeMaterial.dispose()}
 };
}
