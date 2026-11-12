import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Terrain} from '../world/terrain';
import {addLandmarks} from '../world/landmarks';
import {ArchitectureBatch,updateArchitectureLOD} from '../architecture/render';
import {architectureMaterial,loadArchitectureAtlas} from '../architecture/material';
import {addNature,updateNatureLOD,disposeNatureZone} from '../nature/render';
import {naturalSky} from '../nature/sky';
import {createLandscapeLighting} from '../lighting/runtime';
// @ts-ignore Shared cloud and local-light receiver composition.
import {cloudReceiver} from '../earthlife/state.mjs';
import {setLifeProfile} from '../earthlife/preferences';
import {selectWorldRegion} from '../materials/world';
// @ts-ignore Original, explicitly synthetic local data.
import {remarkableFixture,remarkableSource,SYNTHETIC_DATUM} from './remarkable.mjs';
// @ts-ignore Same provider-neutral contracts as the real world.
import {validateRefinement} from '../world/terrain-refinement.mjs';
// @ts-ignore Same provider-neutral local mesh decoder.
import {prepareLandmarks} from '../world/landmark-model.mjs';
// @ts-ignore Existing regional appearance, independent of coordinates.
import {regionalStyle} from '../art/regions.mjs';
// @ts-ignore Same terrain/road triangulation.
import {drapePolygon} from '../world/terrain-grid.mjs';
// @ts-ignore Native navigation and walking kernel.
import {createNavigation} from '../world/navigation.mjs';
// @ts-ignore Native collision kernel.
import {moveGrounded} from '../controls/walking.mjs';
const scene=new THREE.Scene();scene.background=new THREE.Color();scene.fog=new THREE.Fog(0xc2d0d4,150,800);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);document.querySelector('#app')!.append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.2,1000),controls=new OrbitControls(camera,renderer.domElement),sun=new THREE.DirectionalLight(),hemisphere=new THREE.HemisphereLight(),player=new THREE.Object3D();scene.add(sun,sun.target,hemisphere,player);
const select=document.querySelector<HTMLSelectElement>('#fixture')!,status=document.querySelector<HTMLOutputElement>('#status')!;select.value=new URLSearchParams(location.search).get('fixture')??'relief';setLifeProfile('balanced');
let zone:THREE.Group|null=null,sky:ReturnType<typeof naturalSky>|null=null,lighting:ReturnType<typeof createLandscapeLighting>|null=null,terrain:Terrain,local:any,landmarks:any,navigation:any,ready=false,version=0;
function view(){const id=local.id;camera.position.set(...(id==='bridge'?[8,11.5,42]:id==='relief'?[-39,21,54]:[37,21,42]) as [number,number,number]);controls.target.set(0,id==='bridge'?12.3:0,0);controls.update();camera.updateMatrixWorld()}
async function load(id:string,detail=true){ready=false;select.value=id;const current=++version;lighting?.dispose();lighting=null;delete scene.userData.landscapeLighting;sky?.dispose();sky=null;if(zone){const materials=zone.userData.syntheticMaterials??[],used=new Set<THREE.Material>();zone.traverse(o=>{if(o instanceof THREE.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])used.add(m)});scene.remove(zone);disposeNatureZone(zone);for(const m of materials)if(!used.has(m))m.dispose()}local=remarkableFixture(id);const style=regionalStyle(local.region);await selectWorldRegion(renderer,local.region);await loadArchitectureAtlas();if(current!==version)return;
 terrain=new Terrain(Terrain.validate(local.grid));if(detail&&local.refinement)terrain.grid.refinement=validateRefinement(terrain.grid,local.refinement);const baseline=terrain.sample(0,0)!;landmarks=detail?prepareLandmarks(local.raw,baseline,{synthetic:id},SYNTHETIC_DATUM):prepareLandmarks({...local.raw,objects:[]},baseline,{synthetic:id},SYNTHETIC_DATUM);zone=new THREE.Group();scene.add(zone);const ground=terrain.createMesh();zone.add(ground);
 ground.traverse(o=>{if(o instanceof THREE.Mesh){const color=o.geometry.attributes.color,c=new THREE.Color(style.ground.colors.meadow);for(let i=0;i<color.count;i++)color.setXYZ(i,c.r,c.g,c.b);color.needsUpdate=true}});
 const stone=architectureMaterial(true);stone.color.set(style.architecture.walls[0]);stone.userData.architectureShared=false;const road=new THREE.MeshLambertMaterial({color:0xaaa693}),metal=new THREE.MeshLambertMaterial({color:0x4b5b59});cloudReceiver(road);cloudReceiver(metal);addLandmarks(zone,landmarks,{stone,road,metal});zone.userData.syntheticMaterials=[stone,road,metal];
 const roadPoints=local.road.points,xRoad=roadPoints[0].x,zRoad=roadPoints[0].z;
 if(id!=='bridge'){const points=[{x:xRoad-1.5,z:-50},{x:xRoad+1.5,z:-50},{x:xRoad+1.5,z:50},{x:xRoad-1.5,z:50}],g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(drapePolygon(points,terrain.grid,.025),3));g.computeVertexNormals();zone.add(new THREE.Mesh(g,road))}
 else {for(const [a,b]of [[-55,-24],[24,55]]){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(drapePolygon([{x:a,z:-2},{x:b,z:-2},{x:b,z:2},{x:a,z:2}],terrain.grid,.025),3));g.computeVertexNormals();zone.add(new THREE.Mesh(g,road))}const g=new THREE.PlaneGeometry(32,120);g.rotateX(-Math.PI/2);g.translate(0,8-baseline,0);zone.add(new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:0x829b9d,transparent:true,opacity:.8})))}
 const batch=new ArchitectureBatch(zone,style.architecture);for(const f of local.buildings)batch.add(f.rings[0],f.tags,new Set(),(x,z)=>terrain.relativeHeight(x,z));batch.finish();addNature(zone,local.features,(x,z)=>terrain.relativeHeight(x,z),undefined,style.nature);
 navigation=createNavigation(local.navigation.map((f:any)=>({...f,...(f.featureId?{support:(x:number,z:number)=>landmarks.support(f.featureId,x,z)}:{})})));player.position.set(id==='bridge'?-24:local.road.points[0].x,id==='bridge'?landmarks.support('synthetic-span',-24,0)??terrain.relativeHeight(-24,0):terrain.relativeHeight(local.road.points[0].x,0),0);view();
 sky=naturalSky(scene,sun,(x,z)=>terrain.relativeHeight(x,z),{lat:46,lon:1,timeZone:'Europe/Paris'},hemisphere,player,camera);for(let i=0;i<240;i++)sky(1,false);
 if(detail){const base=import.meta.env.BASE_URL+'data/remarkable-fixtures/',binding={sha256:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(remarkableSource(local))))).map(v=>v.toString(16).padStart(2,'0')).join('')};terrain.sourceSha256=binding.sha256;terrain.relief={sha256:binding.sha256};terrain.singleSurface={manifest:{osmSha256:binding.sha256,landmarksSha256:binding.sha256,binarySha256:binding.sha256}};zone.userData.decorationManifest={static:{sha256:binding.sha256},trees:[]};lighting=createLandscapeLighting(scene,renderer,sun,()=>player,{manifestUrl:base+id+'.json',packUrl:base+id+'.pack'});await lighting.install(zone,terrain)}
 if(current!==version)return;status.textContent=`${id} · ${local.region} · ${detail?'géométrie locale chargée':'repli sans détail local'} · données synthétiques CC0`;ready=true;
}
select.onchange=()=>void load(select.value);const profile=document.querySelector<HTMLSelectElement>('#profile')!;profile.onchange=()=>setLifeProfile(profile.value as 'eco'|'balanced'|'quality');
const clock=new THREE.Clock();function frame(){requestAnimationFrame(frame);if(!ready||(window as any).fixtureHold)return;sky?.(Math.min(.25,clock.getDelta()),false);updateArchitectureLOD(scene,camera);updateNatureLOD(scene,camera);controls.update();renderer.render(scene,camera)}
(window as any).remarkableFixture={get ready(){return ready},choose:load,view,step(dt=0){sky?.(dt,false);updateArchitectureLOD(scene,camera);updateNatureLOD(scene,camera);renderer.render(scene,camera)},move(x:number,z:number,dx:number,dz:number){const h=(x:number,z:number)=>navigation(x,z).support??terrain.relativeHeight(x,z),p={x,y:h(x,z),z};moveGrounded(p,{x:dx,z:dz},(x:number,z:number)=>navigation(x,z).clear,h);return p},state(){return {fixture:local.id,synthetic:local.synthetic,provenance:local.provenance,datum:local.datum,region:local.region,refinedCells:terrain.grid.refinement?.cells.size??0,objects:landmarks.objects.map((o:any)=>o.id),triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,memory:{...renderer.info.memory},programs:renderer.info.programs?.length??0,lighting:{...scene.userData.landscapeLighting},camera:camera.position.toArray(),support:[-24,0,24].map(x=>landmarks.support('synthetic-span',x,0))}}};
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});await load(select.value);frame();
