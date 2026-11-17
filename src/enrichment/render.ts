import * as THREE from 'three';
// @ts-ignore Existing shared world clock and wind, also used by depth casters.
import {lifeUniforms} from '../earthlife/state.mjs';
// @ts-ignore No second wind simulation.
import {windGLSL} from '../earthlife/wind.mjs';
// @ts-ignore Existing lighting and snow remain the sole appearance authorities.
import {lightingReceiver} from '../lighting/state.mjs';
// @ts-ignore Existing snow coating changes appearance, never support height.
import {snowReceiver} from '../nature/snow-state.mjs';

type Detail={id:string;kind:string;x:number;y:number;scale:number;rotation:number;habitat?:string;phase?:number};
type Anchor={x:number;z:number;y:number};
type InstanceRecord={mesh:THREE.InstancedMesh;items:Detail[];anchors:Anchor[]};

/** Small non-blocking plants and surface debris. Instances retain their
 * canonical identity through every profile, terrain refinement and rebase. */
export function createEnrichmentDetailRenderer(sharedCalendar?:{value:THREE.Vector4}){
 const evergreenCalendar={value:new THREE.Vector4(1,0,0,.1)};
 const geometries=new Map<string,THREE.BufferGeometry>(),materials=new Map<string,THREE.Material>(),depths=new Map<string,THREE.Material>();
 const dummy=new THREE.Object3D();
 function bladeGeometry(kind:string){
  const positions:number[]=[];
  const tri=(a:number[],b:number[],c:number[])=>positions.push(...a,...b,...c);
  const blades=kind==='fern'?7:kind==='reed'?4:5;
  for(let i=0;i<blades;i++){
   const angle=i*2.399963229728653,dx=Math.cos(angle),dz=Math.sin(angle),height=kind==='reed'?.95+i*.14:kind==='fern'?.34+i%3*.09:.25+i%4*.07,width=kind==='fern'?.2:kind==='reed'?.035:.045;
   const lean=kind==='fern'?.4:.11;
   tri([-dz*width,0,dx*width],[dz*width,0,-dx*width],[dx*lean,height,dz*lean]);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.computeVertexNormals();g.computeBoundingSphere();return g;
 }
 function wind(material:THREE.Material,calendar=evergreenCalendar){
  material.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,lifeUniforms,{enrichmentCalendar:calendar});
   shader.vertexShader='uniform float lifeTime,lifeMeanWind;uniform vec4 enrichmentCalendar;\n'+windGLSL+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    transformed.y*=.35+.65*enrichmentCalendar.x;
    vec2 enrichmentAnchor=(modelMatrix*instanceMatrix[3]).xz;
    vec2 enrichmentWind=lifeInstanceWind(lifeWind(enrichmentAnchor,lifeTime,lifeMeanWind),instanceMatrix[0].xz,instanceMatrix[2].xz);
    transformed.xz+=enrichmentWind*transformed.y*transformed.y*.19;`);
   shader.fragmentShader='uniform vec4 enrichmentCalendar;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(vec3(1.),vec3(1.16,.96,.67),max(enrichmentCalendar.w,(1.-enrichmentCalendar.x)*.7));');
  };
  material.customProgramCacheKey=()=> 'enrichment-shared-wind-v1';
 }
 function assets(kind:string,seasonal=false){
  const key=kind+':'+seasonal,calendar=seasonal&&sharedCalendar?sharedCalendar:evergreenCalendar;
  if(!geometries.has(key)){
   let geometry:THREE.BufferGeometry;
   if(kind==='stone'){geometry=new THREE.IcosahedronGeometry(.18,0);geometry.scale(1,.6,.85);geometry.translate(0,.06,0);}
   else if(kind==='deadwood'){geometry=new THREE.CylinderGeometry(.045,.065,.8,5);geometry.rotateZ(Math.PI/2);geometry.translate(0,.06,0);}
   else geometry=bladeGeometry(kind);
   geometries.set(key,geometry);
   const color=kind==='stone'?0xaba58e:kind==='deadwood'?0x77634e:kind==='reed'?0x838b56:kind==='fern'?0x68784e:0x83905c;
   const material=new THREE.MeshLambertMaterial({color,side:THREE.DoubleSide});
   const animated=!['stone','deadwood'].includes(kind);
   if(animated)wind(material,calendar);
   lightingReceiver(material);snowReceiver(material);materials.set(key,material);
   const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,side:THREE.DoubleSide});if(animated)wind(depth,calendar);depths.set(key,depth);
  }
  return {geometry:geometries.get(key)!,material:materials.get(key)!,depth:depths.get(key)!};
 }
 function set(record:InstanceRecord,index:number,height:number,origin:{x:number;z:number}){
  const d=record.items[index],p=record.anchors[index];dummy.position.set(p.x-origin.x,height,p.z-origin.z);dummy.rotation.set(0,d.rotation,0);dummy.scale.setScalar(d.scale);dummy.updateMatrix();record.mesh.setMatrixAt(index,dummy.matrix);
 }
 function* install(parent:THREE.Group,details:Detail[],local:(x:number,y:number)=>{x:number;z:number},height:(x:number,z:number)=>number|null,outside:(x:number,z:number)=>boolean,pack?:any){
  const group=new THREE.Group();group.name='world-enrichment-details';group.visible=false;parent.userData.enrichmentDetails=group;group.userData.instances=[];parent.add(group);
  const records:InstanceRecord[]=group.userData.instances,byKind=new Map<string,Array<{detail:Detail;anchor:Anchor}>>();
  let count=0,animated=0;
  for(const detail of details){yield;const p=local(detail.x,detail.y);if(!outside(p.x,p.z))continue;const y=height(p.x,p.z);if(y===null)continue;if(!byKind.has(detail.kind))byKind.set(detail.kind,[]);byKind.get(detail.kind)!.push({detail,anchor:{...p,y}});}
  for(const [kind,items] of byKind){
   yield;const asset=assets(kind,pack?.climate?.seasonModel==='historical-runtime-temperate'),mesh=new THREE.InstancedMesh(asset.geometry,asset.material,items.length),origin=items[0].anchor;
   mesh.name='enrichment-'+kind;mesh.position.set(origin.x,0,origin.z);mesh.castShadow=mesh.receiveShadow=true;mesh.customDepthMaterial=asset.depth;mesh.userData.sharedGeometry=true;mesh.userData.worldObjectIds=items.map(p=>p.detail.id);mesh.userData.provenance='procedural-decorative';mesh.userData.accessAuthority=false;
   const record={mesh,items:items.map(p=>p.detail),anchors:items.map(p=>p.anchor)};group.add(mesh);
   for(let i=0;i<items.length;i++){if(i%32===0)yield;set(record,i,items[i].anchor.y,origin);}
   mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();records.push(record);count+=items.length;if(!['stone','deadwood'].includes(kind))animated+=items.length;
  }
  group.userData.instances=records;group.userData.count=count;group.userData.animated=animated;group.visible=true;parent.userData.enrichmentDetails=group;parent.add(group);
  return {count,animated};
 }
 function* prepareReanchor(parent:THREE.Group,height:(x:number,z:number)=>number|null):Generator<any,()=>void,any>{
  const group=parent.userData.enrichmentDetails as THREE.Group|undefined;if(!group)return ()=>{};
  const updates:Array<{record:InstanceRecord;matrices:Float32Array;heights:number[]}>=[];
  for(const record of group.userData.instances as InstanceRecord[]){
   const origin={x:record.mesh.position.x,z:record.mesh.position.z},matrices=new Float32Array(record.mesh.instanceMatrix.array),heights:number[]=[];
   for(let i=0;i<record.items.length;i++){
    if(i%32===0)yield;const p=record.anchors[i],d=record.items[i],y=height(p.x,p.z)??p.y;heights.push(y);
    dummy.position.set(p.x-origin.x,y,p.z-origin.z);dummy.rotation.set(0,d.rotation,0);dummy.scale.setScalar(d.scale);dummy.updateMatrix();dummy.matrix.toArray(matrices,i*16);
   }
   updates.push({record,matrices,heights});
  }
  // Called with terrain/support activation in the same synchronous commit.
  // Until then every old terrain vertex and instance matrix stays visible.
  return ()=>{for(const {record,matrices,heights} of updates){record.mesh.instanceMatrix.array.set(matrices);record.mesh.instanceMatrix.needsUpdate=true;heights.forEach((y,i)=>record.anchors[i].y=y);record.mesh.computeBoundingBox();record.mesh.computeBoundingSphere();}};
 }

 return {install,prepareReanchor,dispose(){for(const g of geometries.values())g.dispose();for(const m of materials.values())m.dispose();for(const d of depths.values())d.dispose();geometries.clear();materials.clear();depths.clear();}};
}
