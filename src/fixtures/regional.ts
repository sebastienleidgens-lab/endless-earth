import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
// @ts-ignore Versioned common/regional/local contracts.
import {ART_DNA} from '../art/dna.mjs';
// @ts-ignore Only this validation entry imports the alternative library.
import {regionalStyle} from '../art/regions.mjs';
// @ts-ignore Original synthetic local data, without geographic claims.
import {landscapeFixture} from './landscapes.mjs';
// @ts-ignore Exact common cover predicates.
import {coverAt} from '../world/landcover.mjs';
// @ts-ignore Original common atlas model.
import {makeGroundAtlas} from '../world/surface-art.mjs';
// @ts-ignore Indexed habitat queries used by Mission 11.
import {habitatIndex} from '../earthlife/habitat.mjs';
import {ArchitectureBatch,updateArchitectureLOD,architectureMemory} from '../architecture/render';
import {loadArchitectureAtlas} from '../architecture/material';
import {addNature,updateNatureLOD,natureMemory,disposeNatureZone} from '../nature/render';
import {groundDetail,waterMaterial} from '../nature/surfaces';
import {naturalSky} from '../nature/sky';
import {setLifeProfile} from '../earthlife/preferences';
import {selectWorldRegion,worldMaterialStatus,disposeWorldMaterials} from '../materials/world';
// @ts-ignore Appearance-only 13D variants; older fixture URLs keep their old rules.
import {frenchMaterialStyle} from '../materials/france-style.mjs';

const params=new URLSearchParams(location.search),materialContexts=params.has('materials'),scene=new THREE.Scene();scene.background=new THREE.Color();scene.fog=new THREE.Fog(0xb9c8bc,180,650);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);document.querySelector('#app')!.append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.2,1500);camera.position.set(104,76,118);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,4,0);controls.update();
const hemisphere=new THREE.HemisphereLight(),sun=new THREE.DirectionalLight();scene.add(hemisphere,sun,sun.target);
const player=new THREE.Object3D();scene.add(player);setLifeProfile('balanced');
const sceneSelect=document.querySelector<HTMLSelectElement>('#scene')!,regionSelect=document.querySelector<HTMLSelectElement>('#region')!;
sceneSelect.value=params.get('fixture')??'atlantic-village';regionSelect.value=params.get('region')??(sceneSelect.value==='mediterranean-rock'?'mediterranean':'atlantic');
if(materialContexts){
 regionSelect.options[1].text='Atlantique · granite et ardoise';regionSelect.options[2].text='Méridional · enduit, pierre claire et tuile';
 document.querySelector('header p')!.textContent='Scènes synthétiques, sans village réel. Changer les matières conserve les dimensions, les toits, les routes, le relief et les emplacements des arbres.';
 const back=document.querySelector<HTMLAnchorElement>('header a')!;back.href='../docs/mission-13-evidence/optimization/index.html';back.textContent='Retour à la galerie des matières';
}
let zone:THREE.Group,sky:ReturnType<typeof naturalSky>,fixture:any,style:any,trees:any[],ready=false,version=0;
function texture(data:Uint8Array,w:number,h:number){const t=new THREE.DataTexture(data,w,h);t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.needsUpdate=true;return t;}
function appearance(){
 const a=makeGroundAtlas(),atlas=texture(a.data,a.width,a.height),size=64,pixels=new Uint8Array(size*size*4);
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){const wx=-110+(x+.5)*220/size,wz=-90+(z+.5)*180/size,k=coverAt(wx,wz,fixture.features),i=(z*size+x)*4;pixels[i]=k==='meadow'?255:0;pixels[i+1]=k==='wood'?255:0;pixels[i+2]=k==='rock'?255:0;pixels[i+3]=255;}
 const field=texture(pixels,size,size);return {field,atlas,manifest:{origin:[-110,-90],extent:[220,180]}};
}
function terrain(){
 const a=appearance(),g=new THREE.PlaneGeometry(220,180,64,48);g.rotateX(-Math.PI/2);const p=g.attributes.position,c=new Float32Array(p.count*3);
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),kind=coverAt(x,z,fixture.features),col=new THREE.Color(style.ground.colors[kind]??style.ground.colors.meadow);p.setY(i,fixture.height(x,z));c.set([col.r,col.g,col.b],i*3)}
 g.setAttribute('color',new THREE.BufferAttribute(c,3));g.setAttribute('earthRoad',new THREE.Uint8BufferAttribute(new Uint8Array(p.count),1));g.computeVertexNormals();
 const m=new THREE.MeshLambertMaterial({vertexColors:true});groundDetail(m,true,null,false,a,style.ground);const mesh=new THREE.Mesh(g,m);mesh.name='Synthetic local terrain';zone.add(mesh);zone.userData.surfaceTextures=[a.field,a.atlas];
 // A 5.5 m source ribbon, draped by the same metric chart; no road inferred.
 const positions:number[]=[],colors:number[]=[],kinds:number[]=[];const col=new THREE.Color(0xa6a28f);
 for(let z=-85;z<85;z+=5){const points=[[-2.75,z],[2.75,z],[2.75,z+5],[-2.75,z+5]];for(const k of [0,1,2,0,2,3]){const [x,zz]=points[k];positions.push(x,fixture.height(x,zz)+.025,zz);colors.push(col.r,col.g,col.b);kinds.push(4)}}
 const road=new THREE.BufferGeometry();road.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));road.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));road.setAttribute('earthRoad',new THREE.Uint8BufferAttribute(kinds,1));road.computeVertexNormals();const rm=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});groundDetail(rm,true,null,false,null,style.ground);zone.add(new THREE.Mesh(road,rm));
 const water=new THREE.PlaneGeometry(48,13,12,4);water.rotateX(-Math.PI/2);water.translate(-75,0,-63.5);const wp=water.attributes.position;for(let i=0;i<wp.count;i++)wp.setY(i,fixture.height(wp.getX(i),wp.getZ(i))+.19);water.computeVertexNormals();const wm=waterMaterial();wm.userData.natureShared=false;zone.add(new THREE.Mesh(water,wm));
}
async function load(){
 ready=false;const current=++version;if(materialContexts)await selectWorldRegion(renderer,regionSelect.value);if(current!==version)return;if(sky)sky.dispose();if(zone){scene.remove(zone);disposeNatureZone(zone)}fixture=landscapeFixture(sceneSelect.value);style=materialContexts?frenchMaterialStyle(regionSelect.value):regionalStyle(regionSelect.value);zone=new THREE.Group();scene.add(zone);terrain();await loadArchitectureAtlas();if(current!==version)return;
 const batch=new ArchitectureBatch(zone,style.architecture);for(const f of fixture.buildings)batch.add(f.rings[0],f.tags,new Set(),fixture.height);batch.finish();trees=addNature(zone,fixture.features,fixture.height,undefined,style.nature);
 const marker=new THREE.CapsuleGeometry(.22,1.21,4,8);marker.translate(0,.825,0);const human=new THREE.Mesh(marker,new THREE.MeshLambertMaterial({color:0xc6b489}));human.position.set(0,fixture.height(0,24),24);zone.add(human);
 scene.userData.lifeHabitat=habitatIndex(fixture.features);scene.userData.lifeCeiling=55;sky=naturalSky(scene,sun,fixture.height,{lat:46,lon:1,timeZone:'Europe/Paris'},hemisphere,player,camera);sky(0,false);for(let i=0;i<70;i++){updateNatureLOD(scene,camera);updateArchitectureLOD(scene,camera)}ready=true;
}
sceneSelect.onchange=()=>{regionSelect.value=sceneSelect.value==='mediterranean-rock'?'mediterranean':'atlantic';void load()};regionSelect.onchange=()=>void load();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
const clock=new THREE.Clock();function frame(){requestAnimationFrame(frame);if(!ready||(window as any).fixtureHold)return;const dt=Math.min(.25,clock.getDelta());sky(dt,false);updateNatureLOD(scene,camera);updateArchitectureLOD(scene,camera);controls.update();renderer.render(scene,camera)}
(window as any).regionalFixture={get ready(){return ready},async choose(local:string,region:string){sceneSelect.value=local;regionSelect.value=region;await load()},advance(dt=0){sky(dt,false);updateNatureLOD(scene,camera);updateArchitectureLOD(scene,camera)},step(dt=0){sky(dt,false);updateNatureLOD(scene,camera);updateArchitectureLOD(scene,camera);renderer.render(scene,camera)},materialView(){camera.position.set(-1,4,-3);controls.target.set(-13,3,-3);controls.update();camera.updateMatrixWorld()},view(close=false){camera.position.set(...(close?[20,12,23]:[104,76,118]) as [number,number,number]);controls.target.set(0,close?3:4,0);controls.update();camera.updateMatrixWorld()},state(physical=false){const physicalMeshes:any[]=[];if(physical)zone.traverse(o=>{if(o instanceof THREE.Mesh)physicalMeshes.push({name:o.name,position:Array.from(o.geometry.attributes.position.array),normal:o.geometry.attributes.normal?Array.from(o.geometry.attributes.normal.array):[],uv:o.geometry.attributes.uv?Array.from(o.geometry.attributes.uv.array):[],index:o.geometry.index?Array.from(o.geometry.index.array):[]})});return {physicalMeshes,climate:scene.userData.climate,authentic:worldMaterialStatus(),fixture:fixture.id,region:style.id,dna:ART_DNA.version,provenance:fixture.provenance,roadWidthM:5.5,humanHeightM:1.65,trees,architecture:zone.userData.architecture,architectureMemory:architectureMemory(scene),nature:natureMemory(scene),terrainPositions:Array.from((zone.children.find(o=>o.name==='Synthetic local terrain') as THREE.Mesh).geometry.attributes.position.array),parameters:{walls:style.architecture.walls,roofDefault:style.architecture.roof.defaultMaterial,vegetation:style.nature.palette,spacing:style.nature.spacing},heights:[[-70,-60],[0,0],[35,55]].map(([x,z])=>fixture.height(x,z)),camera:camera.matrixWorld.toArray(),render:{...renderer.info.render},memory:{...renderer.info.memory},programs:renderer.info.programs?.length}}};
await load();frame();

if(import.meta.hot)import.meta.hot.dispose(()=>disposeWorldMaterials());
addEventListener('pagehide',()=>disposeWorldMaterials());
