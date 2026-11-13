import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
// @ts-ignore Original graph and shared models exercised in Node.
import {createTreeSkeleton,createPrototypeGeometry,prototypeMetrics,TREE_ARCHETYPES} from '../nature/tree-prototype.mjs';
import {prototypeMaterial} from '../nature/tree-prototype-material';
// @ts-ignore Existing calendar and protagonist, unchanged.
import {foliageSeason} from '../nature/library.mjs';
// @ts-ignore Native walker provides the metric scale.
import {createWalker} from '../character/walker.mjs';
import {naturalSky} from '../nature/sky';
import {setLifeProfile,type LifeProfileName} from '../earthlife/preferences';
// @ts-ignore Supplier evaluation uses the same daylight/cloud receiver.
import {cloudReceiver} from '../earthlife/state.mjs';
const scene=new THREE.Scene();scene.background=new THREE.Color();scene.fog=new THREE.Fog(0xb9c8bc,160,600);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);document.querySelector('#app')!.append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.1,1500),controls=new OrbitControls(camera,renderer.domElement);controls.maxPolarAngle=Math.PI*.51;controls.minDistance=1;controls.maxDistance=160;
const sun=new THREE.DirectionalLight(),hemisphere=new THREE.HemisphereLight();scene.add(sun,sun.target,hemisphere);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshLambertMaterial({color:0x9b9d78}));ground.rotation.x=-Math.PI/2;ground.position.y=-.025;scene.add(ground);
const walker=createWalker();scene.add(walker.avatar);walker.update(0,1/60,()=>0);setLifeProfile('balanced');
const sky=naturalSky(scene,sun,()=>0,{lat:46.7,lon:.9,timeZone:'Europe/Paris'},hemisphere,walker.avatar,camera);
const calendar={value:new THREE.Vector4(1,0,0,.1)},models=new Map<string,any>(),dates:Record<string,string>={summer:'2026-06-21',autumn:'2026-10-21',winter:'2026-01-21',spring:'2026-04-21'};
for(const [i,id]of Object.keys(TREE_ARCHETYPES).entries()){
 const art=createPrototypeGeometry(createTreeSkeleton(id)),c=TREE_ARCHETYPES[id],anchor=new THREE.Vector3([-23,-4,15,30][i],0,0),g=new THREE.Group();g.position.copy(anchor);
 const flex=id==='young'?1.8:id==='riverside'?1.5:id==='slender'?1.2:.7;
 const wood=new THREE.Mesh(art.wood,prototypeMaterial(calendar,c.height,flex,anchor)),leaf=new THREE.Mesh(art.foliage,prototypeMaterial(calendar,c.height,flex,anchor,true));g.add(wood,leaf);scene.add(g);models.set(id,{g,art,metrics:prototypeMetrics(art)});
}
const choice=document.querySelector<HTMLSelectElement>('#tree')!,season=document.querySelector<HTMLSelectElement>('#season')!,view=document.querySelector<HTMLSelectElement>('#view')!;let paused=false;
function date(){dispatchEvent(new CustomEvent('nature-test-date',{detail:dates[season.value]+'T12:00:00Z'}));for(let i=0;i<240;i++)sky(1,false);calendar.value.fromArray(foliageSeason(scene.userData.climate.date))}
function show(){const id=choice.value,all=id==='all';for(const [key,m]of models)m.g.visible=all||key===id;const m=models.get(id),x=all?3:m.g.position.x,h=all?9:m.metrics.bounds[4]*.5,d=all?115/camera.aspect:Math.max(m.metrics.bounds[4],m.metrics.bounds[3]-m.metrics.bounds[0])*2.05;walker.avatar.position.set(all?0:x-2.0,0,all?6:2.6);walker.update(0,1/60,()=>0);view.disabled=all;
 const a=all||view.value==='front'?0:view.value==='profile'?Math.PI/2:Math.PI*.25;
 camera.position.set(x+Math.sin(a)*d,all?12:h*.98,Math.cos(a)*d);controls.target.set(x,all?8:h,0);
 if(view.value==='below'&&!all){camera.position.set(x+1.4,1.75,1.8);controls.target.set(x+1,h+2,0)}controls.update();
 document.querySelector('#title')!.textContent=all?'Quatre architectures, une même échelle':TREE_ARCHETYPES[id].label;
 document.querySelector('#metrics')!.textContent=all?'Comparer les hauteurs, les départs de branches et les couronnes.':`${m.metrics.branches.toLocaleString('fr')} branches · ${m.metrics.leaves.toLocaleString('fr')} feuilles · ${(m.metrics.woodTriangles+m.metrics.leafTriangles).toLocaleString('fr')} triangles`;
}
choice.onchange=show;view.onchange=show;season.onchange=date;document.querySelector<HTMLButtonElement>('#pause')!.onclick=e=>{paused=!paused;(e.target as HTMLButtonElement).textContent=paused?'Reprendre l’animation':'Mettre l’animation en pause'};
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
const params=new URLSearchParams(location.search);choice.value=params.get('tree')??'all';season.value=params.get('season')??'summer';view.value=params.get('view')??'three-quarter';date();show();
if(innerWidth<700)document.querySelector<HTMLDetailsElement>('header details')!.open=false;
const clock=new THREE.Clock();function render(){renderer.render(scene,camera)}function frame(){requestAnimationFrame(frame);const dt=Math.min(.25,clock.getDelta());if((window as any).tree17Hold)return;if(!paused){sky(dt,false);calendar.value.fromArray(foliageSeason(scene.userData.climate.date))}controls.update();render()}
let supplier:THREE.Group|null=null;
(window as any).tree17={ready:true,advance(dt=0){sky(dt,false);calendar.value.fromArray(foliageSeason(scene.userData.climate.date))},profile(name:LifeProfileName){setLifeProfile(name);sky(0,name==='eco')},choose(id:string,s='summer',v='three-quarter'){if(supplier)supplier.visible=false;choice.value=id;season.value=s;view.value=v;date();show();render()},camera(p:number[],target:number[],fov=43){camera.position.fromArray(p);controls.target.fromArray(target);camera.fov=fov;camera.updateProjectionMatrix();controls.update();render()},async sapling(){
 if(!supplier){const data=await fetch('../work/mission-17/sapling-evaluation.json').then(r=>{if(!r.ok)throw Error('Generate the offline Sapling evaluation first');return r.json()});supplier=new THREE.Group();supplier.name='Sapling 0.3.6 comparison only';supplier.position.set(-23,0,0);for(const m of data.meshes){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(m.position,3));g.setIndex(m.index);g.computeVertexNormals();const material=new THREE.MeshLambertMaterial({color:m.name==='leaves'?0x71854b:0x6a6251,side:m.name==='leaves'?THREE.DoubleSide:THREE.FrontSide});cloudReceiver(material);supplier.add(new THREE.Mesh(g,material))}scene.add(supplier)}for(const {g}of models.values())g.visible=false;supplier.visible=true;render();return {triangles:supplier.children.map(o=>({name:(o as THREE.Mesh).geometry.name,triangles:(o as THREE.Mesh).geometry.index!.count/3})),bounds:new THREE.Box3().setFromObject(supplier).min.toArray().concat(new THREE.Box3().setFromObject(supplier).max.toArray())}
},render(){const t=performance.now();render();renderer.getContext().finish();return {ms:performance.now()-t,...renderer.info.render,...renderer.info.memory}},state(){return {models:[...models.values()].map(m=>m.metrics),camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),fov:camera.fov},calendar:calendar.value.toArray(),climate:scene.userData.climate,render:{...renderer.info.render},memory:{...renderer.info.memory}}},dispose(){sky.dispose();for(const {g,art}of models.values()){scene.remove(g);art.wood.dispose();art.foliage.dispose();for(const o of g.children)(o.material as THREE.Material).dispose()}models.clear();if(supplier){scene.remove(supplier);supplier.children.forEach(o=>{(o as THREE.Mesh).geometry.dispose();((o as THREE.Mesh).material as THREE.Material).dispose()});supplier=null}}};
frame();
