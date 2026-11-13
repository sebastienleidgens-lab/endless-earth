// @ts-ignore Shared bank, sky tint and humidity from the sole climate owner.
import {sensitiveUniforms} from './sensitive-state.mjs';
import * as THREE from 'three';
// @ts-ignore Deterministic rare activity, using the existing climate and calendar.
import {insectEvent,noise} from './sensitive-model.mjs';
import {natureArtMaterial} from '../nature/material';
import {groundAppearance} from '../nature/surfaces';
import {coverageReceiver,selectDetailIndices} from '../world/coverage';
// @ts-ignore Existing continuous wind, not a new simulation.
import {lifeUniforms} from './state.mjs';
export function createSensitiveWorld(scene:THREE.Scene,seed:number){
 const root=new THREE.Group();root.name='sensitive-world-interpretations';scene.add(root);
 const stats=scene.userData.sensitiveWorld={insects:0,kind:'',banks:0,splashes:0,cpuMs:0,maxCpuMs:0,extraDraws:0};
 const mistGeometry=new THREE.PlaneGeometry(220,7),mistMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{mist:sensitiveUniforms.valleyMist,tint:sensitiveUniforms.valleyTint,time:lifeUniforms.lifeTime},vertexShader:'varying vec2 uvMist;void main(){uvMist=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 uvMist;uniform vec4 mist;uniform vec3 tint;uniform float time;void main(){vec2 q=uvMist*2.-1.;float envelope=(1.-smoothstep(.18,1.,abs(q.x)))*(1.-smoothstep(.12,1.,abs(q.y)));float wisps=.76+.16*sin(uvMist.x*17.+sin(uvMist.x*31.)+time*.015);gl_FragColor=vec4(tint,mist.w*envelope*wisps*.44);\n#include <colorspace_fragment>\n}'});
 const mistPlane=new THREE.Mesh(mistGeometry,mistMaterial),mistFloor=new THREE.Mesh(mistGeometry,mistMaterial);mistFloor.rotation.x=-Math.PI/2;mistFloor.scale.y=5;root.add(mistPlane,mistFloor);mistPlane.visible=mistFloor.visible=false;
 // Original rounded fore/hind wings: generic morphology, no claimed local species.
 const wingShape=new THREE.Shape();wingShape.moveTo(0,-.013);wingShape.quadraticCurveTo(.012,-.036,.035,-.033);wingShape.quadraticCurveTo(.050,-.020,.030,-.004);wingShape.lineTo(.011,.003);wingShape.quadraticCurveTo(.039,-.002,.035,.021);wingShape.quadraticCurveTo(.020,.038,.005,.016);wingShape.lineTo(0,.012);wingShape.closePath();
 const wingG=new THREE.ShapeGeometry(wingShape,8);wingG.rotateX(Math.PI/2);wingG.computeVertexNormals();
 const dragonG=new THREE.BufferGeometry();dragonG.setAttribute('position',new THREE.Float32BufferAttribute([0,0,-.012,.058,0,-.024,.048,0,-.008,0,0,-.005,.048,0,-.008,0,0,.003,0,0,.005,.052,0,.008,.047,0,.020,0,0,.005,.047,0,.020,0,0,.014],3));dragonG.computeVertexNormals();
 const butterflyM=new THREE.MeshLambertMaterial({color:0xc5b77d,side:THREE.DoubleSide}),dragonM=new THREE.MeshLambertMaterial({color:0x8eaca2,side:THREE.DoubleSide}),bodyM=new THREE.MeshLambertMaterial({color:0x403e30});
 const insect=new THREE.Group(),left=new THREE.Mesh(wingG,butterflyM),right=new THREE.Mesh(wingG,butterflyM);right.scale.x=-1;insect.add(left,right);
 const bodyG=new THREE.CapsuleGeometry(.0028,.027,3,5);bodyG.rotateX(Math.PI/2);const insectBody=new THREE.Mesh(bodyG,bodyM);insect.add(insectBody);
 const antennaG=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.001,0,-.016),new THREE.Vector3(-.005,.003,-.025),new THREE.Vector3(.001,0,-.016),new THREE.Vector3(.005,.003,-.025)]),antennaM=new THREE.LineBasicMaterial({color:0x403e30}),antennae=new THREE.LineSegments(antennaG,antennaM);insect.add(antennae);root.add(insect);insect.visible=false;
 const splashesG=new THREE.BufferGeometry(),splashes=new Float32Array(28*6);splashesG.setAttribute('position',new THREE.BufferAttribute(splashes,3));
 const splashM=new THREE.LineBasicMaterial({color:0xbcc6bf,transparent:true,opacity:.22}),splashMesh=new THREE.LineSegments(splashesG,splashM);splashMesh.frustumCulled=false;splashMesh.visible=false;root.add(splashMesh);
 let configured=false,clock=0,epoch=-1,active=false,bankMesh:THREE.Mesh|null=null,bankMaterial:THREE.Material|null=null,anchor=new THREE.Vector3(),budgetKey='';
 let support:(x:number,z:number)=>number|null=()=>null,clear:(x:number,z:number)=>boolean=()=>false,habitat:(x:number,z:number)=>string=()=> 'unknown';
 return {stats,configure(rings:any[],height:typeof support,allowed:typeof clear,habitatAt:typeof habitat){if(configured)return;configured=true;support=height;clear=allowed;habitat=habitatAt;
   const p:number[]=[],colors:number[]=[],bend:number[]=[],kinds:number[]=[];let count=0;
   for(const ring of rings)for(let i=1;i<ring.length&&count<96;i++){const a=ring[i-1],b=ring[i],distance=Math.hypot(b.x-a.x,b.z-a.z);if(distance<3)continue;
    for(let d=2;d<distance&&count<96;d+=14+noise(i+seed)*12){const t=d/distance,nx=-(b.z-a.z)/distance,nz=(b.x-a.x)/distance;
     for(const side of [-1,1]){const x=a.x+(b.x-a.x)*t+nx*side*1.3,z=a.z+(b.z-a.z)*t+nz*side*1.3,y=height(x,z),h=habitatAt(x,z);if(y===null||!allowed(x,z)||!['riparian','grass','meadow','scrub'].includes(h)||noise(x+z)<.38)continue;
      const tall=noise(x*3-z)>.65;for(let blade=0;blade<5;blade++){const phase=blade*2.4+x,dx=Math.cos(phase)*.15,dz=Math.sin(phase)*.15,H=(tall?.65:.22)+noise(blade+x)*.22;for(const [xx,yy,zz]of [[x+dx-.018,y+.02,z+dz],[x+dx+.018,y+.02,z+dz],[x+dx+.1,y+H,z+dz+.06]]){p.push(xx,yy,zz);colors.push(tall?.25:.30,tall?.34:.39,.20);bend.push(yy-y);kinds.push(tall?7:0)}}count++;break;
     }
    }
   }
   if(p.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('natureBend',new THREE.Float32BufferAttribute(bend,1));g.setAttribute('natureKind',new THREE.Uint8BufferAttribute(kinds,1));g.computeVertexNormals();g.computeBoundingSphere();bankMaterial=natureArtMaterial(groundAppearance.earthGroundSeason,null,true);coverageReceiver(bankMaterial,new THREE.Vector2(45,85),-1000);bankMesh=new THREE.Mesh(g,bankMaterial);bankMesh.name='interpreted-riparian-herbs';root.add(bankMesh)}stats.banks=count;
  },update(dt:number,climate:any,player:THREE.Vector3,camera:THREE.Camera,profile:string){const start=performance.now();clock=lifeUniforms.lifeTime.value;const fog=sensitiveUniforms.valleyMist.value;mistPlane.visible=mistFloor.visible=fog.w>.002;
   if(mistPlane.visible){mistPlane.position.set(fog.x,fog.z+2.7,fog.y);mistPlane.rotation.y=Math.atan2(camera.position.x-fog.x,camera.position.z-fog.y);mistFloor.position.set(fog.x,fog.z+1.2,fog.y)}
   const c={habitat:habitat(player.x,player.z),month:climate.calendar?.month??1,day:lifeUniforms.lifeDay.value,rain:climate.weather?.rain??0,wind:climate.wind?.speed??1},event=insectEvent(clock,seed,c),budget=scene.userData.lifeBudget;
   if(epoch!==event.epoch){epoch=event.epoch;active=false;budget?.release(budgetKey)}
   if(!active&&event.active&&event.age<1.5&&profile!=='eco'&&(budget?.allocated.events??0)===0){budgetKey='sensitive-insect:'+epoch;if(budget?.claim(budgetKey,'events',1)){active=true;anchor.copy(player);anchor.x+=6+noise(seed+epoch)*8;anchor.z+=noise(seed-epoch)*12-6;anchor.y=(support(anchor.x,anchor.z)??player.y)+.8}}
   if(active&&(!event.active||player.distanceTo(anchor)>55)){active=false;budget?.release(budgetKey)}
   insect.visible=active;stats.insects=Number(active);stats.kind=active?event.kind:'';
   if(active){const t=event.age,dragon=event.kind==='dragonfly';left.material=right.material=dragon?dragonM:butterflyM;left.geometry=right.geometry=dragon?dragonG:wingG;insectBody.scale.z=dragon?1.8:1;antennae.visible=!dragon;insect.position.copy(anchor).add(new THREE.Vector3(Math.sin(t*.65)*1.8,Math.sin(t*1.7)*.22,Math.sin(t*.37)*2));insect.rotation.y=Math.cos(t*.65)*.7;left.rotation.z=Math.sin(t*(dragon?47:9))*(dragon?.15:1.1);right.rotation.z=-left.rotation.z;insect.scale.setScalar(Math.min(1,event.fade));}
   const n=profile==='eco'?0:profile==='quality'?28:16;stats.splashes=c.rain>.08?n:0;splashMesh.visible=stats.splashes>0;
   if(splashMesh.visible){const floor=support(player.x,player.z),protectedPlace=!clear(player.x,player.z);if(floor===null||protectedPlace)splashMesh.visible=false;else{for(let i=0;i<n;i++){const phase=clock*3.1+noise(i+seed),age=phase-Math.floor(phase),x=player.x+(noise(i*7+Math.floor(phase))- .5)*14,z=player.z+(noise(i*11+Math.floor(phase))-.5)*14,h=support(x,z);const valid=h!==null&&clear(x,z);const y=valid?h+.025:-10000,s=i*6;splashes.set([x,y,z,x+.045*Math.sin(i),y+Math.sin(age*Math.PI)*.085,z+.045*Math.cos(i)],s)}splashesG.setDrawRange(0,n*2);splashesG.attributes.position.needsUpdate=true;splashM.opacity=.12+c.rain*.16}}
   if(bankMesh){bankMesh.visible=profile!=='eco'&&(budget?.profile.vegetation??1)>0;if(bankMesh.visible){selectDetailIndices(bankMesh,camera,85);bankMesh.visible=bankMesh.geometry.drawRange.count>0;}}stats.extraDraws=Number(mistPlane.visible)*2+Number(insect.visible)*4+Number(splashMesh.visible)+Number(!!bankMesh?.visible);stats.cpuMs=performance.now()-start;stats.maxCpuMs=Math.max(stats.maxCpuMs,stats.cpuMs);
  },dispose(){scene.userData.lifeBudget?.release(budgetKey);scene.remove(root);mistGeometry.dispose();mistMaterial.dispose();wingG.dispose();dragonG.dispose();bodyG.dispose();bodyM.dispose();antennaG.dispose();antennaM.dispose();butterflyM.dispose();dragonM.dispose();splashesG.dispose();splashM.dispose();bankMesh?.geometry.dispose();bankMaterial?.dispose()}
 };
}
