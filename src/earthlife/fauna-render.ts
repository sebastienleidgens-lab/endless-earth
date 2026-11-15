import * as THREE from 'three';
// @ts-ignore Shared render clock, including frames between fauna updates.
import {lifeUniforms} from './state.mjs';
// @ts-ignore Shared deterministic trajectories, not real observations.
import {flockAt,birdPosition,perchedBirdAt} from './fauna.mjs';
// @ts-ignore Global world allowance.
import {WorldLifeBudget} from './budget.mjs';

/** Original body, wings, tail and optional goose neck; one instanced draw. */
function birdGeometry(){
 const positions:number[]=[],wings:number[]=[],parts:number[]=[];
 function tri(a:number[],b:number[],c:number[],wing=[0,0,0],part=0){for(const [i,p]of [a,b,c].entries()){positions.push(...p);wings.push(wing[i]);parts.push(part)}}
 const body=new THREE.SphereGeometry(.13,8,5);body.scale(.7,.8,1.8);const b=body.toNonIndexed(),p=b.attributes.position;
 for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));wings.push(0);parts.push(0)}body.dispose();b.dispose();
 for(const s of [-1,1]){tri([s*.06,.02,.08],[s*.62,.01,-.11],[s*.23,.02,-.21],[0,1,.3]);tri([s*.06,.02,.08],[s*.45,.01,.09],[s*.62,.01,-.11],[0,.75,1]);}
 tri([-.065,0,-.15],[.065,0,-.15],[0,.01,-.37]);tri([-.055,0,.14],[.055,0,.14],[0,.13,.63],[0,0,0],2);
 function ellipsoid(x:number,y:number,z:number,sx:number,sy:number,sz:number,part:number){const g=new THREE.SphereGeometry(1,8,5);g.scale(sx,sy,sz);g.translate(x,y,z);const a=g.toNonIndexed().attributes.position;for(let i=0;i<a.count;i++){positions.push(a.getX(i),a.getY(i),a.getZ(i));wings.push(0);parts.push(part)}g.dispose();}
 ellipsoid(0,.09,.18,.075,.075,.09,1);
 tri([-.023,.078,.25],[.023,.078,.25],[0,.063,.34],[0,0,0],3);
 for(const side of [-1,1]){ellipsoid(side*.061,.107,.215,.013,.013,.013,4);tri([side*.025,-.08,0],[side*.025,-.15,.03],[side*.025+.03,-.15,.055],[0,0,0],5);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('wing',new THREE.Float32BufferAttribute(wings,1));g.setAttribute('birdPart',new THREE.Float32BufferAttribute(parts,1));g.computeVertexNormals();return g;
}
export function createFauna(scene:THREE.Scene,budget:InstanceType<typeof WorldLifeBudget>,height:(x:number,z:number)=>number|null){
 const geometry=birdGeometry(),params=new THREE.InstancedBufferAttribute(new Float32Array(9*3),3);geometry.setAttribute('birdParams',params);
 const time=lifeUniforms.lifeTime,motion=new THREE.InstancedBufferAttribute(new Float32Array(9*4),4);geometry.setAttribute('birdMotion',motion);const material=new THREE.MeshStandardMaterial({color:0x4b5146,roughness:.9,side:THREE.DoubleSide});
 material.onBeforeCompile=shader=>{shader.uniforms.birdTime=time;shader.vertexShader='attribute float wing;attribute float birdPart;attribute vec3 birdParams;attribute vec4 birdMotion;uniform float birdTime;varying float birdFamily;varying float birdRegion;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 float family=birdParams.x;birdFamily=family;birdRegion=birdPart;
 float goose=1.-step(.1,abs(family-2.));float broad=1.-step(.1,abs(family-1.));
 transformed.x*=1.+broad*.65+goose*.6;transformed.z*=1.+goose*.65;
 if(birdPart>1.5&&birdPart<2.5){transformed*=goose;}
 float flap=sin(birdTime*mix(10.,5.,goose)+birdParams.y);transformed.y+=wing*flap*.22*birdParams.z;transformed.x*=1.-wing*abs(flap)*.16*birdParams.z;
 transformed+=birdMotion.xyz*clamp(birdTime-birdMotion.w,0.,.3);
`);shader.fragmentShader='varying float birdFamily;varying float birdRegion;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec3 feather=vec3(.21,.19,.15);if(abs(birdFamily-1.)<.1)feather=vec3(.48,.50,.47);if(abs(birdFamily-2.)<.1)feather=birdRegion>1.5?vec3(.10,.11,.10):vec3(.43,.38,.30);if(abs(birdFamily-3.)<.1)feather=birdRegion<.5?vec3(.56,.24,.12):vec3(.31,.28,.21);if(abs(birdFamily-4.)<.1)feather=birdRegion<.5?vec3(.58,.52,.24):vec3(.12,.15,.16);if(birdRegion>2.5&&birdRegion<3.5)feather=vec3(.65,.44,.15);if(birdRegion>3.5&&birdRegion<4.5)feather=vec3(.012);diffuseColor.rgb=feather;`);};
 const mesh=new THREE.InstancedMesh(geometry,material,9);mesh.name='living-birds';mesh.frustumCulled=false;mesh.count=0;scene.add(mesh);
 const previous=scene.userData.lifeSoundSources,sources:any[]=[],pool=Array.from({length:9},()=>({id:'',kind:'bird',habitat:'wood',position:new THREE.Vector3(),velocity:new THREE.Vector3(),family:'passerine',updatedAt:0}));scene.userData.lifeSoundSources=sources;
 const previousBirds=new Map<string,any>();const dummy=new THREE.Object3D(),flockState:any={},localState:any={},anchor={x:0,z:0},point={x:0,y:0,z:0};
 const metrics={individuals:0,drawCalls:0,triangles:0,perches:0,families:[]as string[],sources:[]as any[]};scene.userData.birdMetrics=metrics;
 let cell='',ownerX=NaN,ownerZ=NaN,ceiling=0,perches:any[]=[],nextPerches=0;
 function discover(p:THREE.Vector3){
  const old=new Map(perches.map(p=>[p.id,p]));perches=[];scene.traverse(o=>{if(!o.userData.forest)return;for(const t of o.userData.forest.items){
   if(Math.hypot(t.anchor[0]-p.x,t.anchor[1]-p.z)>135)continue;
   const branch=t.model.tree.branches.find((b:any)=>b.order===1);if(!branch)continue;
   const q=branch.points.at(-1).clone().applyMatrix4(t.worldMatrix);
   const id=`tree-bird:${t.id}`;perches.push({id,position:q,number:Math.abs(t.anchor[0]*37+t.anchor[1]*13),habitat:'wood',flightStart:old.get(id)?.flightStart??null,destination:old.get(id)?.destination??null});
  }});perches.sort((a,b)=>a.position.distanceToSquared(p)-b.position.distanceToSquared(p));perches.length=Math.min(24,perches.length);metrics.perches=perches.length;
 }
 return {metrics,update(t:number,p:THREE.Vector3,c:any){
  sources.length=0;budget.release(cell);cell='birds:shared';const max=Math.min(9,budget.profile.birds);let count=0;
  if(!max){mesh.count=0;metrics.individuals=0;metrics.drawCalls=0;return 0;}
  if(t>=nextPerches){discover(p);nextPerches=t+8;}
  const families=new Set<string>();
  const draw=(q:any,heading:number,family:number,flap:number,id:string,habitat:string,scale=1)=>{
   if(count>=max)return;dummy.position.set(q.x,q.y,q.z);dummy.rotation.set(0,heading,0);dummy.scale.setScalar(scale);dummy.updateMatrix();mesh.setMatrixAt(count,dummy.matrix);params.setXYZ(count,family,count*2.31,flap);const old=previousBirds.get(id),dt=old?t-old.t:0,v=old&&dt>0&&dt<1?new THREE.Vector3(q.x-old.x,q.y-old.y,q.z-old.z).divideScalar(dt):new THREE.Vector3();const localV=v.clone().applyQuaternion(dummy.quaternion.clone().invert()).divideScalar(Math.max(.001,scale));motion.setXYZW(count,localV.x,localV.y,localV.z,t);previousBirds.set(id,{x:q.x,y:q.y,z:q.z,t});
   const source=pool[count];source.id=id;source.position.copy(dummy.position);source.velocity.copy(v);source.updatedAt=t;source.habitat=habitat;source.family=family===2?'geese':family===1?'long-wing':family===3?'robin':family===4?'tit':'blackbird';families.add(source.family);if(family!==1&&family!==2)sources.push(source);count++;
  };
  for(const perch of perches){if(count>=Math.min(2,max))break;const distance=perch.position.distanceTo(p),state=perchedBirdAt(t,perch.number,c,distance,localState);if(!state.visible){perch.flightStart=null;continue;}
   point.x=perch.position.x;point.y=perch.position.y;point.z=perch.position.z;
   if((distance<7||state.flying)&&perch.flightStart===null){perch.flightStart=t;perch.destination=perches.find(a=>a.id!==perch.id&&a.position.distanceTo(perch.position)>9&&a.position.distanceTo(perch.position)<70)?.position??perch.position;}
   let flying=false;if(perch.flightStart!==null){const f=Math.min(1,(t-perch.flightStart)/12),u=f*f*(3-2*f),destination=perch.destination??perch.position;point.x+=(destination.x-perch.position.x)*u;point.z+=(destination.z-perch.position.z)*u;point.y+=(destination.y-perch.position.y)*u+Math.sin(f*Math.PI)*3.8;flying=f<1;}

   draw(point,perch.flightStart!==null?Math.atan2((perch.destination?.x??point.x)-perch.position.x,(perch.destination?.z??point.z)-perch.position.z):perch.number,[0,3,4][Math.floor(perch.number)%3],flying?1:0,perch.id,perch.habitat,.65*state.fade);
  }
  if(!Number.isFinite(ownerX)||Math.hypot(p.x-anchor.x,p.z-anchor.z)>360){ownerX=Math.floor(p.x/256);ownerZ=Math.floor(p.z/256);anchor.x=(ownerX+.5)*256;anchor.z=(ownerZ+.5)*256;ceiling=scene.userData.lifeCeiling??Infinity;if(!Number.isFinite(ceiling))ceiling=(height(anchor.x,anchor.z)??0)+85;}
  const flock=flockAt(t,ownerX*73856093+ownerZ*19349663,c,9,flockState);
  if(flock.active){const migration=['water','riparian','meadow'].includes(c.habitat)&&[3,10,11].includes(c.month),family=migration?2:1,wanted=Math.min(max-count,migration?6:flock.count);
   for(let i=0;i<wanted;i++){birdPosition(flock,i,anchor,ceiling,point);if(migration){point.x+=(i%2===0?1:-1)*Math.ceil(i/2)*4;point.z-=Math.ceil(i/2)*5;}draw(point,-flock.angle+Math.PI/2,family,flock.gliding?.15:1,'flock:'+flock.id+':'+i,c.habitat,flock.fade*(migration?1.5:.9));}
  }
  if(count&&!budget.claim(cell,'birds',count))count=0;mesh.count=count;mesh.visible=count>0;mesh.instanceMatrix.needsUpdate=true;params.needsUpdate=true;motion.needsUpdate=true;if(previousBirds.size>128)for(const [id,s]of previousBirds)if(t-s.t>10)previousBirds.delete(id);
  metrics.individuals=count;metrics.drawCalls=Number(count>0);metrics.triangles=count*geometry.attributes.position.count/3;metrics.families=[...families];metrics.sources=sources.map(s=>({id:s.id,position:s.position.toArray(),family:s.family}));return count;
 },dispose(){if(scene.userData.lifeSoundSources===sources)scene.userData.lifeSoundSources=previous;delete scene.userData.birdMetrics;budget.release(cell);scene.remove(mesh);geometry.dispose();material.dispose();mesh.dispose();sources.length=0;perches.length=0;}};
}
