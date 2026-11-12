import * as THREE from 'three';
import {loadAuthenticLibrary,filterAuthenticLibrary,type AuthenticEntry} from '../materials/authentic';
import {architectureMaterial,loadArchitectureAtlas} from '../architecture/material';
import {groundDetail} from '../nature/surfaces';
import {naturalSky} from '../nature/sky';
import {setLifeProfile,type LifeProfileName} from '../earthlife/preferences';
// @ts-ignore Reuse the actual common artistic contract.
import {ART_DNA} from '../art/dna.mjs';
type Approach='photographic'|'procedural'|'hybrid';
const approaches:Approach[]=['photographic','procedural','hybrid'];
const params=new URLSearchParams(location.search),held=params.has('hold');
const scene=new THREE.Scene();scene.background=new THREE.Color();scene.fog=new THREE.Fog(0xb9c8bc,320,1450);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);document.querySelector('#app')!.append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(55,1,.1,1500),sun=new THREE.DirectionalLight(),hemisphere=new THREE.HemisphereLight(),player=new THREE.Object3D();scene.add(sun,hemisphere,sun.target,player);
setLifeProfile('balanced');
const sky=naturalSky(scene,sun,()=>0,{lat:46.6953,lon:.8844,timeZone:'Europe/Paris'},hemisphere,player,camera);
let photo:Awaited<ReturnType<typeof loadAuthenticLibrary>>,hybrid:Awaited<ReturnType<typeof loadAuthenticLibrary>>;
let entries:AuthenticEntry[]=[],entry:AuthenticEntry,ready=false,selection=0;
let geometries:THREE.BufferGeometry[]=[],specimen:THREE.Mesh;
const materials=new Map<string,THREE.Material[]>(),owned=new Set<THREE.Texture>(),fields=new Map<string,THREE.DataTexture>();
const select=document.querySelector<HTMLSelectElement>('#material')!,distance=document.querySelector<HTMLSelectElement>('#distance')!,profile=document.querySelector<HTMLSelectElement>('#profile')!;
const status=document.querySelector<HTMLOutputElement>('#status')!;
const atlas=await new THREE.TextureLoader().loadAsync(import.meta.env.BASE_URL+'materials/earth/surface-atlas.png');atlas.flipY=false;atlas.generateMipmaps=true;atlas.minFilter=THREE.LinearMipmapLinearFilter;owned.add(atlas);
function field(key:string){
 if(fields.has(key))return fields.get(key)!;
 const data=key==='rock'?new Uint8Array([0,0,255,255]):new Uint8Array([0,0,0,key==='bank'?0:255]);
 const t=new THREE.DataTexture(data,1,1);t.needsUpdate=true;fields.set(key,t);owned.add(t);return t;
}
function procedural(e:AuthenticEntry){
 if(e.family==='wall'||e.family==='roof')return architectureMaterial();
 const m=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
 groundDetail(m,true,null,false,{field:field(e.family==='rock'?'rock':e.id==='bank-soil'?'bank':'soil'),atlas,manifest:{origin:[-100,-100],extent:[200,200]}});return m;
}
function makeGeometry(e:AuthenticEntry,baseline=false){
 const wide=distance.value!=='close',side=wide?24:e.family==='ground'?6:4,height=wide&&e.family==='wall'?10:side;
 const g=new THREE.PlaneGeometry(side,height,1,1),uv=g.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*side/(baseline?e.proceduralMetres[0]:1),uv.getY(i)*height/(baseline?e.proceduralMetres[1]:1));
 if(e.family==='ground')g.rotateX(-Math.PI/2);
 else if(e.family==='roof'){g.rotateX(-Math.PI/4);g.translate(0,1,0)}
 else g.translate(0,height/2,0);
 const c=new THREE.Color(e.palette),colors=new Float32Array(g.attributes.position.count*3);
 for(let i=0;i<g.attributes.position.count;i++)colors.set([c.r,c.g,c.b],i*3);
 g.setAttribute('color',new THREE.BufferAttribute(colors,3));
 g.setAttribute('architectureMaterial',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(e.proceduralKind),1));
 g.setAttribute('earthRoad',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(e.id==='gravel'?4:0),1));return g;
}
const marker=new THREE.Mesh(new THREE.CapsuleGeometry(.19,1.27,4,8),new THREE.MeshLambertMaterial({color:0x617363}));scene.add(marker);
function choose(id=select.value){
 entry=entries.find(e=>e.id===id)!;if(!entry)throw Error('Unknown lab material');select.value=entry.id;
 geometries.forEach(g=>g.dispose());geometries=approaches.map(a=>makeGeometry(entry,a==='procedural'));
 if(specimen)scene.remove(specimen);specimen=new THREE.Mesh(geometries[0],materials.get(entry.id)![0]);scene.add(specimen);
 const wide=distance.value!=='close',far=distance.value==='far';
 if(entry.family==='ground'){camera.position.set(0,wide?15:4,far?80:wide?21:6);camera.lookAt(0,0,0);marker.position.set(wide?-9:-2.5,.825,0)}
 else if(entry.family==='roof'){camera.position.set(0,wide?12:3.8,far?80:wide?24:6);camera.lookAt(0,1,0);marker.position.set(wide?-10:-1.55,.825,.22)}
 else{camera.position.set(0,wide?5:2,far?80:wide?40:6);camera.lookAt(0,wide?5:2,0);marker.position.set(wide?-10:-1.55,.825,.22)}
 camera.updateMatrixWorld();selection++;
 status.textContent=entry.label+' · tuile '+entry.metres.join(' × ')+' m · '+entry.scaleStatus;
}
function setProfile(name:LifeProfileName){profile.value=name;setLifeProfile(name);filterAuthenticLibrary(photo,renderer,name==='eco');filterAuthenticLibrary(hybrid,renderer,name==='eco');sky(0,name==='eco')}
let currentWidth=0,currentHeight=0;
let readback=new Uint8Array(0);
function size(){const w=innerWidth,h=document.body.hasAttribute('data-capture')?innerHeight:Math.max(320,Math.round(innerHeight*.62));if(w!==currentWidth||h!==currentHeight){renderer.setSize(w,h);currentWidth=w;currentHeight=h}return {w,h}}
function render(single:Approach|null=null){
 const {w,h}=size(),n=single?1:3,stats=[];renderer.setScissorTest(true);
 for(let i=0;i<n;i++){
  const a=single??approaches[i],index=approaches.indexOf(a),left=Math.floor(w*i/n),width=Math.floor(w*(i+1)/n)-left;
  camera.aspect=width/h;camera.updateProjectionMatrix();specimen.geometry=geometries[index];specimen.material=materials.get(entry.id)![index];
  renderer.setViewport(left,0,width,h);renderer.setScissor(left,0,width,h);renderer.render(scene,camera);stats.push({approach:a,...renderer.info.render});
 }
 renderer.setScissorTest(false);return stats;
}
async function load(){
 const wasReady=ready;ready=false;
 const results=await Promise.allSettled([loadAuthenticLibrary('photographic'),loadAuthenticLibrary('hybrid')]);
 if(results.some(r=>r.status==='rejected')){
  for(const r of results)if(r.status==='fulfilled')r.value.dispose();
  ready=wasReady;status.textContent='Nouvelle bibliothèque indisponible ; dernier état conservé. '+String(results.find(r=>r.status==='rejected')?.reason);
  if(ready){render();return}throw Error(status.textContent);
 }
 const [p,h]=results.map(r=>(r as PromiseFulfilledResult<Awaited<ReturnType<typeof loadAuthenticLibrary>>>).value);
 materials.forEach(ms=>ms[1].dispose());materials.clear();photo?.dispose();hybrid?.dispose();photo=p;hybrid=h;entries=photo.catalog.entries;
 await loadArchitectureAtlas();
 for(const e of entries)materials.set(e.id,[photo.create(e,'synthetic-specimen:'+e.id),procedural(e),hybrid.create(e,'synthetic-specimen:'+e.id)]);
 select.innerHTML=entries.map(e=>`<option value="${e.id}">${e.label}</option>`).join('');choose(entry?.id??params.get('material')??entries[0].id);setProfile(profile.value as LifeProfileName);
 for(let i=0;i<240;i++)sky(1,profile.value==='eco');ready=true;render();
}
select.onchange=()=>{choose();render()};distance.onchange=()=>{choose();render()};profile.onchange=()=>{setProfile(profile.value as LifeProfileName);render()};
document.querySelector<HTMLButtonElement>('#reload')!.onclick=()=>void load().catch(e=>{status.textContent='Bibliothèque indisponible : '+String(e)});
addEventListener('resize',()=>{if(ready)render()});
let last=performance.now();function frame(){requestAnimationFrame(frame);const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;if(!held&&ready){sky(dt,profile.value==='eco');render()}}
(window as any).materialLab={get ready(){return ready},choose(id:string,view='close'){distance.value=view;choose(id)},profile:setProfile,step(dt=0){sky(dt,profile.value==='eco')},render,
 synchronized(approach:Approach){const start=performance.now(),stats=render(approach),gl=renderer.getContext(),bytes=gl.drawingBufferWidth*gl.drawingBufferHeight*4;if(readback.length!==bytes)readback=new Uint8Array(bytes);gl.finish();gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,readback);return {ms:performance.now()-start,...stats[0]}},
 reload:load,state(){return {id:entry.id,selection,profile:profile.value,distance:distance.value,metres:entry.metres,scaleStatus:entry.scaleStatus,camera:camera.matrixWorld.toArray(),projection:camera.projectionMatrix.toArray(),geometryPositions:geometries.map(g=>Array.from(g.attributes.position.array)),identities:materials.get(entry.id)!.map(m=>m.userData.authentic??{approach:'Mission12'}),climate:scene.userData.climate,memory:{...renderer.info.memory},programs:renderer.info.programs?.length??0,manifestFiles:photo.catalog.files,gpu:renderer.getContext().getParameter(renderer.getContext().RENDERER)}}};
await load().catch(error=>{status.textContent=String(error)});frame();
