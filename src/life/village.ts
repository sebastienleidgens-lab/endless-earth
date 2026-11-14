import * as THREE from 'three';
// @ts-ignore Camera-independent source-bound simulation, exercised by Node.
import {VillageLifeDirector,PERSISTENCE_KEY} from './village-director.mjs';
// @ts-ignore Shared source restrictions; no graph reconstruction.
import {annotateGraph} from './village-navigation.mjs';
// @ts-ignore Fixed representation budgets and calendar adapter.
import {LIFE_BUDGETS,contextFromClimate} from './village-identity.mjs';
// @ts-ignore Original bounded, texture-free instanced model library.
import {createVillageRender} from './village-render.mjs';
export function createVillageLife(scene:THREE.Scene,camera:THREE.Camera){
 const renderer=createVillageRender(scene),leases=new Map<string,any>(),director=new VillageLifeDirector();
 let height:(x:number,z:number)=>number|null=()=>null,clear:(x:number,z:number)=>boolean=()=>false,ready=false,poseAge=0,saveAge=0,renderProfile='balanced';
 const frustum=new THREE.Frustum(),matrix=new THREE.Matrix4(),sphere=new THREE.Sphere(),vector=new THREE.Vector3();
 const animalLeases=new Map<string,any>();const audio:any[]=[];const lastSteps=new Map<string,number>();let lastEvent=0;
 const metrics=scene.userData.villageLife={version:'village-life-v1',ready:false,virtualPeople:0,visiblePeople:0,animals:0,leases:0,admissionDeferred:0,simulationMs:0,maxSimulationMs:0,installMs:0,persistenceBytes:0,persistence:'pending',renderer:renderer.stats,stats:director.stats,provenance:'procedural fictional community; OSM pedestrian graph, no real households or local demographics'};
 function visible(g:any){return g.members.some((m:any)=>{vector.set(m.position.x,m.position.y+.9,m.position.z);sphere.set(vector,2);return frustum.intersectsSphere(sphere)})}
 function save(){try{const data=JSON.stringify(director.snapshot());if(data.length<=180000){localStorage.setItem(PERSISTENCE_KEY,data);metrics.persistenceBytes=data.length;metrics.persistence='local only'}}catch{metrics.persistence='unavailable; session continues'}}
 return {director,renderer,metrics,get groups(){return [...leases.values()]},
 prepare(graph:any,roads:any[],ground:typeof height,valid:typeof clear,habitat:(x:number,z:number)=>string){if(ready||!graph)return;const start=performance.now();height=ground;clear=valid;director.graph=annotateGraph(graph,roads,habitat);try{const text=localStorage.getItem(PERSISTENCE_KEY);if(text){metrics.persistence=director.restore(JSON.parse(text))?'restored':'invalid or obsolete snapshot ignored';metrics.persistenceBytes=text.length}}catch{metrics.persistence='unavailable; session only'}ready=metrics.ready=true;metrics.installMs=performance.now()-start},
 drainAudio(){return audio.splice(0,audio.length)},
 update(dt:number,climate:any,player:THREE.Vector3,profile:string,vehicle:any=null){if(!ready||!Number.isFinite(dt)||dt<0)return;const start=performance.now(),budget=LIFE_BUDGETS[profile]??LIFE_BUDGETS.balanced;renderProfile=profile;director.update(dt,contextFromClimate(climate),{height,clear,vehicle});metrics.simulationMs=performance.now()-start;metrics.maxSimulationMs=Math.max(metrics.maxSimulationMs,metrics.simulationMs);
 camera.updateMatrixWorld();frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
 let people=0,animals=0;for(const g of leases.values()){people+=g.members.length;animals+=Number(!!g.animal);const far=g.members.every((m:any)=>Math.hypot(m.position.x-player.x,m.position.z-player.z)>budget.perceptibleM+30);if(far&&!visible(g)){leases.delete(g.id);people-=g.members.length;animals-=Number(!!g.animal)}}
 for(const g of director.groups){if(leases.has(g.id)||g.state==='off-duty')continue;const distances=g.members.map((m:any)=>Math.hypot(m.position.x-player.x,m.position.z-player.z)),min=Math.min(...distances);if(min>budget.perceptibleM||min<65)continue;if(people+g.members.length>budget.people||animals+Number(!!g.animal)>budget.animals){metrics.admissionDeferred++;continue}if(g.members.some((m:any)=>height(m.position.x,m.position.z)===null))continue;leases.set(g.id,g);people+=g.members.length;animals+=Number(!!g.animal);}
 // Poses and footsteps are driven by distance, with no catch-up sound burst.
 for(const [id,a] of animalLeases)if(Math.hypot(a.position.x-player.x,a.position.z-player.z)>budget.perceptibleM+30)animalLeases.delete(id);
 for(const a of director.critters){const d=Math.hypot(a.position.x-player.x,a.position.z-player.z);if(!animalLeases.has(a.id)&&d>65&&d<budget.perceptibleM&&animals+animalLeases.size<budget.animals)animalLeases.set(a.id,a);}
 poseAge+=dt;if(poseAge>=1/budget.hz||dt===0){renderer.draw([...leases.values(),...[...animalLeases.values()].map(a=>({id:a.id,members:[],animal:a,state:a.state}))],director.clock,height,(m:any)=>Math.hypot(m.position.x-player.x,m.position.z-player.z)<budget.detailM);poseAge=0;}
 for(const g of leases.values())for(const m of g.members){const step=Math.floor(m.phase/Math.PI),old=lastSteps.get(m.person.id);lastSteps.set(m.person.id,step);if(m.person.age!=='baby'&&g.kind!=='cycle'&&old!==undefined&&old!==step&&m.speed>.05&&dt<2&&Math.hypot(m.position.x-player.x,m.position.z-player.z)<42){const e=director.graph.edges[g.route.points.find((p:any)=>p.s>=m.s)?.edge??g.route.points.at(-1).edge];audio.push({kind:'step',id:m.person.id,position:{...m.position},surface:e?.surface,speed:m.speed,time:performance.now()});}}
 for(const g of leases.values())if(['cycle','stroller'].includes(g.kind)&&g.state==='walk'&&director.clock-(g.lastWheelSound??-99)>11){g.lastWheelSound=director.clock;audio.push({kind:'cycle',id:g.id,position:{...g.members[0].position},time:performance.now()});}
 for(const e of director.events){if(e.time<=lastEvent)continue;const g=leases.get(e.group);if(g&&dt<2&&['regroup','encounter','arrival'].includes(e.type)&&g.activity==='conversation')audio.push({kind:'conversation',id:g.id,position:{...g.members[0].position},time:performance.now()});if(g&&dt<2&&e.type==='sniff')audio.push({kind:'dog',id:g.id,position:{...g.animal.position},time:performance.now()});}lastEvent=director.clock;
 if(audio.length>24)audio.splice(0,audio.length-24);metrics.virtualPeople=director.groups.reduce((a:number,g:any)=>a+g.members.length,0);metrics.visiblePeople=people;metrics.animals=animals+animalLeases.size;metrics.leases=leases.size;saveAge+=dt;if(saveAge>=30){saveAge=0;save();}
 },save,dispose(){save();leases.clear();animalLeases.clear();audio.length=0;renderer.dispose();lastSteps.clear()}};
}
