import * as THREE from 'three';
import {createPlanetRuntime} from '../planet/runtime';
// @ts-ignore Same production controller and explicit geographic frames.
import {moveGrounded} from '../controls/walking.mjs';
// @ts-ignore Same player activity state used in normal play.
import {PlayerActivity} from '../player/activity.mjs';
// @ts-ignore Coordinate provider selected by manifest, not the fixture name.
import {createProjection,legacyAdapter} from '../planet/coordinates.mjs';
// @ts-ignore The shared wind clock also drives the ordinary department renderer.
import {updateLifeTime} from '../earthlife/state.mjs';

const region=new URLSearchParams(location.search).get('region')??'validation-m27-mountain';
if(!/^validation-m27-[a-z]+$/.test(region))throw Error('Select a declared synthetic fixture');
const url=new URL(import.meta.env.BASE_URL+'planet/'+region+'/manifest.json',location.origin);
const manifest=await(await fetch(url)).json(),projection=createProjection(manifest.projection),legacy=legacyAdapter(manifest.projection.origin);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xcbd9d3);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;document.body.append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,15000),actor=new THREE.Object3D(),activity=new PlayerActivity();scene.add(actor);
scene.add(new THREE.HemisphereLight(0xfff9e5,0x5d7168,2));const sun=new THREE.DirectionalLight(0xffedcc,2);sun.position.set(600,1000,300);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
const climate={elapsedSeconds:0,date:'2026-06-21T12:00:00Z',targetWeather:'clear',wind:{speed:.35,gust:.1},solar:{altitude:1}};
const runtime=createPlanetRuntime({scene,root:document.querySelector<HTMLElement>('#ui')!,player:actor,activity,origin:manifest.projection.origin,manifestUrl:url.href,verticalDatum:manifest.verticalDatum,pilotBounds:[1e8,1e8,1e8+1,1e8+1],heightBase:()=>0,pilotHeight:()=>null,pilotSupport:()=>null,pilotClear:()=>false,pilotSurfaceSHA:()=>'',clearInput(){},climate:()=>climate});
let profile='balanced',last=performance.now();const frameTimes:number[]=[];
function frame(t:number){requestAnimationFrame(frame);const dt=Math.min(.25,Math.max(0,(t-last)/1000));if(frameTimes.length<4096)frameTimes.push(t-last);last=t;climate.elapsedSeconds+=dt;updateLifeTime(climate.elapsedSeconds,.35,actor.position.x,actor.position.z);runtime.update(dt,actor,camera,{forward:0,strafe:0},true,false,profile);renderer.render(scene,camera);}
requestAnimationFrame(frame);
await runtime.init();
const deadline=performance.now()+120000;
while((!runtime.ready||!runtime.metrics.stream?.loaded||runtime.metrics.stream.active)&&performance.now()<deadline)await new Promise(r=>setTimeout(r,50));
const roads=[...runtime.surface.features.values()].map((r:any)=>r.feature).filter((f:any)=>f.kind==='road');
const road=roads.find((f:any)=>f.points.length>1);if(!road)throw Error('Synthetic source road not loaded');
const middle=road.points[Math.floor((road.points.length-1)/2)],geo=projection.unproject({x:middle[0],y:middle[1]});
const admitted=await runtime.prepareLocation(geo);if(!admitted)throw Error('Synthetic source road not admitted');actor.position.set(admitted.x,admitted.y,admitted.z);
camera.position.set(actor.position.x+45,actor.position.y+30,actor.position.z+50);camera.lookAt(actor.position.x,actor.position.y+2,actor.position.z);
document.querySelector('#result')!.textContent=region+' · source synthétique · support, carte, sauvegarde et rendu communs';
const state=()=>({region,synthetic:true,position:actor.position.toArray(),geo:runtime.geo(actor.position),admission:runtime.admission(actor.position.x,actor.position.z),metrics:structuredClone(runtime.metrics),render:{...renderer.info.render},memory:{...renderer.info.memory},framebuffer:[renderer.domElement.width,renderer.domElement.height],frames:frameTimes.slice(),clock:climate.elapsedSeconds,method:'Synthetic fixture with production createPlanetRuntime, worker loader, renderer, contact, map and save. Fixture movement is accelerated grounded-kernel sampling, not a native game journey. Full atmosphere, animal and audio parity are not asserted.'});
Object.assign(window,{enrichmentFixture:{ready:true,state,profile(value:string){profile=value;},async verify(){
 const initial=actor.position.toArray(),saved=runtime.save();let distance=0;
 const targetPoint=road.points[road.points.length-1],target=legacy.fromGeo(projection.unproject({x:targetPoint[0],y:targetPoint[1]}));
 for(let i=0;i<200;i++){const before=actor.position.clone(),d=Math.hypot(target.x-actor.position.x,target.z-actor.position.z);if(d<.3)break;moveGrounded(actor.position,{x:(target.x-actor.position.x)/d*.2,z:(target.z-actor.position.z)/d*.2},(x:number,z:number)=>runtime.canWalk(x,z),(x:number,z:number)=>runtime.height(x,z),()=>.7,false);distance+=before.distanceTo(actor.position);if(before.distanceTo(actor.position)<1e-8)break;}
 await runtime.resume();const after=actor.position.toArray();return {...state(),saved,initial,after,physicalFixtureM:distance,resumeErrorM:Math.hypot(...initial.map((x,i)=>x-after[i]))};
},dispose(){runtime.dispose();renderer.dispose();}}});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
