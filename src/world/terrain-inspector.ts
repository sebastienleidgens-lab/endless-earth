import * as THREE from 'three';
import type {Terrain} from './terrain';
// Created only by ?perf=1. No raycasts or record collection in ordinary play.
export function createTerrainInspector(scene:THREE.Scene,camera:THREE.Camera,canvas:HTMLCanvasElement,mount:HTMLElement,terrain:()=>Terrain|null,inspect:(x:number,z:number)=>any,movement:()=>any){
 const controller=new AbortController(),ray=new THREE.Raycaster(),material=new THREE.LineBasicMaterial({color:0xff44bb,depthTest:false}),lines=new THREE.LineSegments(new THREE.BufferGeometry(),material);
 lines.name='terrain-diagnostic-overlay';lines.renderOrder=1000;lines.frustumCulled=false;lines.visible=false;scene.add(lines);
 let enabled=false,record:any=null;
 const toggle=document.createElement('button'),block=document.createElement('button'),download=document.createElement('button'),status=document.createElement('pre');
 toggle.textContent='Inspecter le terrain';toggle.setAttribute('aria-pressed','false');block.textContent='Inspecter le dernier blocage';download.textContent='Exporter le diagnostic';status.style.cssText='white-space:pre-wrap;max-width:100%;font:11px/1.4 monospace';
 mount.append(toggle,block,download,status);
 const draw=(segments:THREE.Vector3[])=>{lines.geometry.dispose();lines.geometry=new THREE.BufferGeometry().setFromPoints(segments);lines.visible=segments.length>0};
 const show=(value:any)=>{record={schema:'endless-earth-local-diagnostic-v1',surfaceHash:terrain()?.singleSurface?.manifest.binarySha256??null,...value};status.textContent=JSON.stringify(record,null,2)};
 toggle.addEventListener('click',()=>{enabled=!enabled;toggle.setAttribute('aria-pressed',String(enabled));toggle.textContent=enabled?'Cliquer sur une surface · inspection active':'Inspecter le terrain';if(!enabled)lines.visible=false},{signal:controller.signal});
 canvas.addEventListener('pointerdown',e=>{if(!enabled)return;const rect=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const meshes:THREE.Object3D[]=[];scene.traverse(o=>{if(o instanceof THREE.Mesh&&!((o as THREE.InstancedMesh).isInstancedMesh))meshes.push(o)});const hit=ray.intersectObjects(meshes,false)[0];if(!hit?.face)return;
  const mesh=hit.object as THREE.Mesh,p=mesh.geometry.attributes.position,vertices=[hit.face.a,hit.face.b,hit.face.c].map(i=>new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld));draw(vertices.flatMap((v,i)=>[v,vertices[(i+1)%3]]));show({kind:'selected-triangle',mesh:mesh.name,face:hit.faceIndex,position:hit.point.toArray(),vertices:vertices.map(v=>v.toArray()),normal:hit.face.normal.clone().transformDirection(mesh.matrixWorld).toArray(),ground:inspect(hit.point.x,hit.point.z),lastMovement:movement()});
 },{signal:controller.signal});
 block.addEventListener('click',()=>{const d=movement();if(!d){show({kind:'movement',message:'Aucun refus enregistré'});return}const points=d.collider?.points??[],segments:THREE.Vector3[]=[];for(let i=1;i<points.length;i++){for(const p of [points[i-1],points[i]])segments.push(new THREE.Vector3(p.x,terrain()?.relativeHeight(p.x,p.z)??d.currentHeight??0,p.z).add(new THREE.Vector3(0,.15,0)))}
  const a=d.previous??d.position,b=d.requested,c=d.allowed;if(a&&b)segments.push(new THREE.Vector3(a.x,a.y+.2,a.z),new THREE.Vector3(b.x,(d.nextHeight??a.y)+.2,b.z));if(a&&c)segments.push(new THREE.Vector3(a.x,a.y+.3,a.z),new THREE.Vector3(c.x,c.y+.3,c.z));draw(segments);show({kind:'movement',movement:d,ground:b?inspect(b.x,b.z):null});
 },{signal:controller.signal});
 download.addEventListener('click',()=>{const value=record??{schema:'endless-earth-local-diagnostic-v1',lastMovement:movement()},url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='endless-earth-diagnostic.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)},{signal:controller.signal});
 return {dispose(){controller.abort();scene.remove(lines);lines.geometry.dispose();material.dispose();for(const element of [toggle,block,download,status])element.remove()}};
}
