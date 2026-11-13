import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
// @ts-ignore Pure source/physical audit and kinematic controller, also used by tests.
import {auditMotorRoutes,routePose,trafficDelay,advanceVehicle} from './traffic-model.mjs';
export function createTraffic(scene:THREE.Scene,camera:THREE.Camera,seed:number){
 const root=new THREE.Group();root.name='rare-interpreted-road-traffic';scene.add(root);
 const body=new THREE.MeshLambertMaterial({color:0x7e8982}),glass=new THREE.MeshLambertMaterial({color:0x263a43}),rubber=new THREE.MeshLambertMaterial({color:0x242626}),rim=new THREE.MeshLambertMaterial({color:0x7b817e}),lamps=new THREE.MeshBasicMaterial({color:0xffe7b4}),rear=new THREE.MeshBasicMaterial({color:0x701c19});
 const car=new THREE.Group();root.add(car);car.visible=false;const geometries:THREE.BufferGeometry[]=[];
 const box=(w:number,h:number,l:number,x:number,y:number,z:number,m:THREE.Material)=>{const g=new THREE.BoxGeometry(w,h,l);geometries.push(g);const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);car.add(mesh);return mesh};
 const shellGeometry=new RoundedBoxGeometry(1.68,.56,3.85,2,.08);geometries.push(shellGeometry);const shell=new THREE.Mesh(shellGeometry,body);shell.position.y=.68;car.add(shell);box(1.62,.20,3.55,0,.99,-.04,body);
 // Original metric compact-car cabin, a tapered prism with sloping glass.
 const shape=new THREE.Shape();shape.moveTo(-1.25,0);shape.lineTo(-.83,.51);shape.lineTo(.48,.51);shape.lineTo(1.13,0);shape.closePath();const cabin=new THREE.ExtrudeGeometry(shape,{depth:1.43,bevelEnabled:false,steps:1});cabin.rotateY(-Math.PI/2);cabin.translate(.715,1.02,0);geometries.push(cabin);car.add(new THREE.Mesh(cabin,glass));box(1.47,.065,1.34,0,1.55,-.17,body);
 for(const x of [-.73,.73]){box(.055,.51,.07,x,1.28,-.20,body);box(.08,.08,.30,x*1.17,1.04,-.54,rim);box(.18,.13,.23,x*1.24,1.13,.69,body);}
 box(.50,.12,.025,0,.62,-1.97,rim);box(1.25,.10,.04,0,.63,1.98,rubber);
 const shadowG=new THREE.CircleGeometry(1,20);shadowG.rotateX(-Math.PI/2);shadowG.scale(.97,1,2.02);const shadowM=new THREE.MeshBasicMaterial({color:0x172017,transparent:true,opacity:.13,depthWrite:false});const shadow=new THREE.Mesh(shadowG,shadowM);shadow.position.y=.035;car.add(shadow);geometries.push(shadowG);
 box(1.72,.13,.12,0,.46,1.95,rubber);box(1.72,.13,.12,0,.46,-1.95,rubber);
 for(const x of [-.59,.59]){box(.32,.14,.045,x,.83,1.945,lamps);box(.25,.19,.045,x,.83,-1.945,rear)}
 const wheels:THREE.Group[]=[],wheelG=new THREE.CylinderGeometry(.295,.295,.19,12),hubG=new THREE.CylinderGeometry(.15,.15,.195,8);geometries.push(wheelG,hubG);
 for(const x of [-.79,.79])for(const z of [-1.2,1.22]){const pivot=new THREE.Group();pivot.position.set(x,.295,z);for(const [g,m]of [[wheelG,rubber],[hubG,rim]]as const){const mesh=new THREE.Mesh(g,m);mesh.rotation.z=Math.PI/2;pivot.add(mesh)}wheels.push(pivot);car.add(pivot)}
 const lod=new THREE.Mesh(new THREE.BoxGeometry(1.7,1.15,3.9),body);geometries.push(lod.geometry);lod.position.y=.85;const far=new THREE.Group();far.add(lod);lod.geometry.dispose();lod.geometry=new THREE.BoxGeometry(1.68,.56,3.85);geometries.push(lod.geometry);lod.position.y=.68;const farCabin=new THREE.Mesh(cabin,glass);far.add(farCabin);root.add(far);far.visible=false;
 let audit:Generator<any,any,unknown>|null=null,routes:any[]=[],vehicle:any=null,clock=0,next=Infinity,sequence=0,initialized=false;
 const frustum=new THREE.Frustum(),matrix=new THREE.Matrix4(),sphere=new THREE.Sphere(),position=new THREE.Vector3(),pose:any={};
 const metrics=scene.userData.traffic={state:'waiting',routes:0,report:[]as any[],active:0,attempts:0,completed:0,skippedVisible:0,cpuMs:0,maxCpuMs:0,auditCpuMs:0,maxAuditSliceMs:0,provenance:'artistic rare circulation, OSM access plus sampled physical support; no measured local traffic',position:null as any,speed:0,metres:0};
 function hidden(p:any,player:THREE.Vector3){position.set(p.x,p.y+.9,p.z);sphere.set(position,3);return position.distanceTo(player)>180&&!frustum.intersectsSphere(sphere)}
 return {metrics,get routes(){return routes},get vehicle(){return vehicle},
  prepare(roads:any[],support:(x:number,z:number)=>number|null,clear:(x:number,z:number)=>boolean){if(initialized)return;initialized=true;audit=auditMotorRoutes(roads,support,clear);metrics.state='auditing'},
  constrain(player:THREE.Vector3,delta:{x:number;z:number}){if(!vehicle||!metrics.position||Math.abs(player.y-pose.y)>2.5)return;const steps=Math.max(1,Math.ceil(Math.hypot(delta.x,delta.z)/.1));for(let i=1;i<=steps;i++){const x=player.x+delta.x*i/steps-pose.x,z=player.z+delta.z*i/steps-pose.z;if(Math.abs(x*pose.dx+z*pose.dz)<2.4&&Math.abs(x*pose.dz-z*pose.dx)<1.2){const safe=Math.max(0,(i-1)/steps);delta.x*=safe;delta.z*=safe;break}}},
  inspect(routeId?:string){if(!new URLSearchParams(location.search).has('perf'))return false;const route=routes.find(r=>r.id===routeId)??routes[0];if(!route||vehicle)return false;vehicle={route,s:0,speed:0,id:'inspection:'+sequence++};metrics.state='inspection';return route.id},
  update(dt:number,climate:any,player:THREE.Vector3,profile:string){const start=performance.now();clock+=Math.min(1,Math.max(0,dt));
   if(audit){let result;do{result=audit.next()}while(!result.done&&performance.now()-start<.6);const ms=performance.now()-start;metrics.auditCpuMs+=ms;metrics.maxAuditSliceMs=Math.max(metrics.maxAuditSliceMs,ms);if(result.done){routes=result.value.routes;metrics.report=result.value.report;metrics.routes=routes.length;metrics.state=routes.length?'ready':'no admissible continuous route';audit=null;next=clock+trafficDelay(seed,sequence,climate?.localHour??12)}}
   if(!vehicle&&clock<next&&!audit){metrics.active=0;metrics.cpuMs=performance.now()-start;return;}
   camera.updateMatrixWorld();frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
   if(!vehicle&&routes.length&&clock>=next){metrics.attempts++;const index=Math.floor(((Math.sin(seed+sequence*37)*43758.5)%1+1)%1*routes.length),route=routes[index];sequence++;next=clock+trafficDelay(seed,sequence,climate.localHour,climate.snow?.cover??0);
    if(profile!=='eco'&&(scene.userData.lifeBudget?.profile.events??2)>0&&(scene.userData.lifeBudget?.allocated.events??0)===0&&(climate.snow?.cover??0)<.4&&hidden(route.points[0],player)&&hidden(route.points.at(-1),player)){vehicle={route,s:0,speed:0,id:'car:'+sequence};body.color.setHex([0x7e8982,0x656c7c,0xa59c89,0x7e4440][sequence%4]);}else metrics.skippedVisible++;
   }
   if(vehicle){const old=vehicle.s;advanceVehicle(vehicle,Math.min(.25,dt),player,{...climate.weather,snowCover:climate.snow?.cover},pose);metrics.metres+=vehicle.s-old;car.position.set(pose.x,pose.y+.015,pose.z);car.rotation.set(-Math.atan2(routePose(vehicle.route,Math.min(vehicle.route.length,vehicle.s+1)).y-pose.y,1),Math.atan2(pose.dx,pose.dz),0);for(const w of wheels)w.rotation.x+=(vehicle.s-old)/.295;
    const distant=car.position.distanceTo(camera.position)>110;car.visible=!distant;far.visible=distant;far.position.copy(car.position);far.quaternion.copy(car.quaternion);lamps.color.setHex(climate.solar?.altitude<.12?0xffe7b4:0xb9bcb3);rear.color.setHex(vehicle.speed<.3?0xc53224:0x701c19);metrics.position=car.position.toArray();metrics.speed=vehicle.speed;
    if(vehicle.s>=vehicle.route.length&&hidden(pose,player)){vehicle=null;car.visible=far.visible=false;metrics.completed++;next=Math.max(next,clock+120);metrics.position=null}
   }
   metrics.active=Number(!!vehicle);metrics.cpuMs=performance.now()-start;metrics.maxCpuMs=Math.max(metrics.maxCpuMs,metrics.cpuMs);
  },dispose(){scene.remove(root);geometries.forEach(g=>g.dispose());[body,glass,rubber,rim,lamps,rear,shadowM].forEach(m=>m.dispose())}
 };
}
