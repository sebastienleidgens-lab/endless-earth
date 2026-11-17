// Appended only by the diagnostic build. No fixture is part of normal play.
export const fixtureDiagnostic=`
window.p262.fixture=async function(){
 window.p252.hold(true);
 const origin={lat:47,lon:-71},projection=mission262Projection({type:'local-tangent',origin});
 const local=(x,y)=>{const g=projection.unproject({x,y});return {x:(g.lon-origin.lon)*111320*Math.cos(origin.lat*Math.PI/180),z:-(g.lat-origin.lat)*111320};};
 const world=new THREE.Scene(),actor=new THREE.Object3D(),ui=document.createElement('div'),state=new PlayerActivity();ui.hidden=true;document.body.append(ui);world.add(actor);world.add(new THREE.HemisphereLight(0xffffff,0x777777,2));
 const start=local(500,1000),end=local(3000,1000);actor.position.set(start.x,0,start.z);
 const runtime=createPlanetRuntime({scene:world,root:ui,player:actor,activity:state,origin,manifestUrl:import.meta.env.BASE_URL+'planet/validation-other-frame/manifest.json',verticalDatum:'WGS84-ellipsoid',pilotBounds:[1e6,1e6,1e6+1,1e6+1],heightBase:()=>0,pilotHeight:()=>null,pilotSupport:()=>null,pilotClear:()=>false,pilotSurfaceSHA:()=>'',clearInput:()=>{},climate:()=>({elapsedSeconds:0,date:'2026-06-21',targetWeather:'clear'})});
 const camera=new THREE.PerspectiveCamera(50,renderer.domElement.width/renderer.domElement.height,.1,15000);camera.position.set(2000,1800,-3200);camera.lookAt(2000,50,-1000);
 const trace=[],errors=[];let physicalM=0,completed=false;
 try{
  await runtime.init();const t=performance.now();while((runtime.height(start.x,start.z)===null||runtime.metrics.stream.loaded<4||runtime.metrics.stream.active)&&performance.now()-t<60000){runtime.update(.25,actor,camera,{forward:0,strafe:0},true,false,'eco');await new Promise(r=>setTimeout(r,25));}
  if(runtime.height(start.x,start.z)===null)throw Error('Fixture support unavailable');actor.position.y=runtime.height(start.x,start.z);
  const parked=local(3600,1000);runtime.car.place({x:parked.x,y:runtime.height(parked.x,parked.z),z:parked.z},Math.PI/2);runtime.car.placed=true;
  const initial=actor.position.toArray();
  // The same grounded production controller. No assignments after tracing starts.
  for(let i=0;i<12000;i++){
   const d=Math.hypot(end.x-actor.position.x,end.z-actor.position.z);if(d<.02){completed=true;break;}
   const before=actor.position.clone(),step=Math.min(d,1.45*.25);
   moveGrounded(actor.position,{x:(end.x-actor.position.x)/d*step,z:(end.z-actor.position.z)/d*step},(x,z)=>runtime.canWalk(x,z),(x,z)=>runtime.height(x,z),()=>.7,false);
   physicalM+=Math.hypot(actor.position.x-before.x,actor.position.z-before.z);
   if(i%100===0){runtime.update(.25,actor,camera,{forward:0,strafe:0},true,false,'eco');trace.push({step:i,position:actor.position.toArray(),geo:runtime.geo(actor.position),support:runtime.admission(actor.position.x,actor.position.z)});await new Promise(r=>setTimeout(r,0));}
   if(before.distanceTo(actor.position)<1e-10)break;
  }
  const saved=runtime.save(),beforeResume=actor.position.toArray();await runtime.resume();const afterResume=actor.position.toArray();
  const route=await runtime.plan({x:0,y:1000},{x:4096,y:1000},'foot');
  const note=document.createElement('div');note.textContent='FIXTURE SYNTHÉTIQUE · repère 47 N / 71 O · aucune reconstitution géographique';note.style.cssText='position:fixed;top:0;left:0;background:#fff;color:#111;padding:8px;z-index:999';document.body.append(note);
  renderer.render(world,camera);await new Promise(r=>setTimeout(r,0));
  const meshes=[];world.traverse(o=>{if(o.isMesh&&(o.name.startsWith('planet-terrain-')||o.material?.color?.getHex()===0x93968c))meshes.push(o);});world.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(new THREE.Vector3(actor.position.x,10000,actor.position.z),new THREE.Vector3(0,-1,0),0,20000),hit=ray.intersectObjects(meshes,false)[0];
  window.__fixtureCleanup=()=>note.remove();
  return {method:'Independent SYNTHETIC fixture outside France using production runtime, tile loader, renderer, contact, graph, grounded kernel and v2 save. Not a Vienne journey or a surveyed Quebec scene.',sourceSHA:window.p262.source,origin,datum:'WGS84-ellipsoid',initial,end:actor.position.toArray(),completed,physicalM,trace,route,saved,beforeResume,afterResume,renderedSupport:hit?.point.y,physicalSupport:runtime.height(actor.position.x,actor.position.z),metrics:structuredClone(runtime.metrics),functionalSuccess:completed&&saved&&route.complete&&beforeResume.every((v,i)=>Math.abs(v-afterResume[i])<1e-8)&&hit&&Math.abs(hit.point.y-runtime.height(actor.position.x,actor.position.z))<.0001};
 }finally{runtime.dispose();ui.remove();}
};
`;
