import * as THREE from 'three';
import { nature } from './geography';
// @ts-ignore Node-tested shared environmental functions.
import { windAt } from './walk.mjs';
export const windUniform={value:0};
export function animateFoliage(material:THREE.MeshLambertMaterial){
 material.onBeforeCompile=shader=>{
  shader.uniforms.livingTime=windUniform;
  shader.vertexShader='uniform float livingTime;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    transformed.x += sin(livingTime * .8 + position.y * .7) * .045 * max(0.0, position.y + 2.0);
    transformed.z += sin(livingTime * .53 + position.x) * .025;`);
 };
 material.customProgramCacheKey=()=> 'living-foliage-v1';
}
export function createAtmosphere(scene:THREE.Scene,sun:THREE.DirectionalLight,height:(x:number,z:number)=>number|null=()=>0){
 const clouds=new THREE.InstancedMesh(new THREE.SphereGeometry(1,12,7),new THREE.MeshLambertMaterial({color:0xfff6e6}),36);
 clouds.frustumCulled=false;
 const dummy=new THREE.Object3D();
 const birds=new THREE.Group();scene.add(clouds,birds);
 const birdGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.9,0,0),new THREE.Vector3(0,-.12,.12),new THREE.Vector3(.9,0,0)]);
 for(let i=0;i<4;i++){const bird=new THREE.Line(birdGeometry,new THREE.LineBasicMaterial({color:0x4b5147}));birds.add(bird);}
 let elapsed=0;
 return (dt:number,eco:boolean)=>{
  elapsed+=dt;
  // Integrate a bounded phase speed; multiplying elapsed by gust intensity
  // made foliage oscillate increasingly fast during long sessions.
  windUniform.value+=dt*(.6+windAt(elapsed));
  const sunset=(1-Math.cos(elapsed*Math.PI/600))*.5;
  const sky=new THREE.Color(0xdce8df).lerp(new THREE.Color(0xeeb997),sunset);
  (scene.background as THREE.Color).copy(sky);(scene.fog as THREE.Fog).color.copy(sky);
  sun.color.set(0xffe5bc).lerp(new THREE.Color(0xffae78),sunset);sun.intensity=2.3-.8*sunset;
  for(let i=0;i<36;i++){
   const cluster=Math.floor(i/3),part=i%3;
   dummy.position.set(((cluster*173+elapsed*.9)%1800)-900+part*19,160+(cluster%3)*22,Math.sin(cluster*7)*680);
   dummy.scale.set(32+Math.sin(cluster*3+part)*9,7+part*2+Math.sin(cluster)*2,20+Math.cos(cluster+part)*7);dummy.updateMatrix();clouds.setMatrixAt(i,dummy.matrix);
  }
  clouds.count=eco?18:36;clouds.instanceMatrix.needsUpdate=true;
  birds.children.forEach((bird,i)=>{
   const anchor=nature[(i*17)%nature.length];
   bird.visible=!!anchor&&(elapsed+i*13)%65<22&&(!eco||i<2);
   if(!anchor)return;
   const phase=elapsed*.19+i*2;
   bird.position.set(anchor.x+Math.cos(phase)*22,(height(anchor.x,anchor.z)??0)+18+i*3+Math.sin(phase*2),anchor.z+Math.sin(phase)*16);
   bird.rotation.y=-phase;bird.rotation.z=Math.sin(elapsed*(4.5+i*.37)+i)*.12+Math.sin(phase)*.16;
  });
 };
}
