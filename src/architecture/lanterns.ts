import * as THREE from 'three';
import {facadeOutward} from './window-seeds';
// @ts-ignore Existing deterministic building identity and occupancy schedule.
import {windowIdentity,windowSchedule} from './windows.mjs';
/** Sparse artistic fixtures at existing CLOSED decorative door anchors. They
 * imply no surveyed lamp or actual occupants. No light, shadow or extra pass. */
export function createLanterns(scene:THREE.Scene){
 const root=new THREE.Group();root.name='interpreted-entry-lanterns';scene.add(root);
 const shellG=new THREE.BoxGeometry(.11,.21,.10),glassG=new THREE.BoxGeometry(.07,.14,.08),poolG=new THREE.PlaneGeometry(1.25,1.25),shellM=new THREE.MeshLambertMaterial({color:0x262d2c});
 const fixtures:Array<{position:THREE.Vector3;seed:number;node:THREE.Group;glass:THREE.MeshBasicMaterial;pool:THREE.MeshBasicMaterial}>=[];
 const metrics=scene.userData.lanterns={installed:0,visible:0,draws:0,provenance:'Sparse original artistic fixtures at interpreted procedural doors; not documented lamps, occupancy or surveyed lighting. One-sided prepared ground patches, no dynamic lights.'};let prepared=false;
 return {metrics,update(climate:any,observer:THREE.Vector3,height:(x:number,z:number)=>number|null,profile:string){
 if(!prepared){let source:any[]=[];scene.traverse(o=>{if(o.userData.architectureAnchors)source=o.userData.architectureAnchors});if(source.length){prepared=true;const candidates=source.map(b=>({b,seed:windowIdentity(b.id,[0,0,0])})).filter(b=>b.seed<.035&&b.b.doors.length).sort((a,b)=>a.seed-b.seed);
 for(const {b,seed}of candidates){if(fixtures.length>=6)break;const d=b.doors[0],normal=facadeOutward(d.x,d.z);if(!normal||normal.distance>.6)continue;if(fixtures.some(f=>Math.hypot(f.position.x-d.x,f.position.z-d.z)<45))continue;const ground=height(d.x+normal.x*.6,d.z+normal.z*.6);if(ground===null)continue;
 const node=new THREE.Group(),p=new THREE.Vector3(d.x+normal.x*.15,d.y+1.95,d.z+normal.z*.15);node.position.copy(p);node.rotation.y=Math.atan2(normal.x,normal.z);const glass=new THREE.MeshBasicMaterial({color:0xd99240}),pool=new THREE.MeshBasicMaterial({color:0xb47c39,transparent:true,opacity:0,depthWrite:false});const box=new THREE.Mesh(shellG,shellM),pane=new THREE.Mesh(glassG,glass);pane.position.z=.026;node.add(box,pane);
 const patch=new THREE.Mesh(poolG,pool);patch.rotation.x=-Math.PI/2;patch.position.set(0,ground-p.y+.022,.78);node.add(patch);root.add(node);fixtures.push({position:p,seed:seed*11,node,glass,pool});}metrics.installed=fixtures.length;}}
 metrics.visible=metrics.draws=0;for(const f of fixtures){const brightness=windowSchedule(f.seed,climate.localHour??12,climate.solar?.altitude??1,climate.elapsedSeconds??0),fade=1-THREE.MathUtils.smoothstep(f.position.distanceTo(observer),profile==='eco'?24:45,profile==='eco'?40:70);f.node.visible=fade>0;f.glass.color.setRGB(.028+brightness*.65,.024+brightness*.28,.018+brightness*.065);f.pool.opacity=brightness*.22*fade*(.7+(climate.groundWetness??0)*.3);if(f.node.visible){metrics.visible++;metrics.draws+=3}}
 },dispose(){scene.remove(root);shellG.dispose();glassG.dispose();poolG.dispose();shellM.dispose();for(const f of fixtures){f.glass.dispose();f.pool.dispose()}fixtures.length=0;delete scene.userData.lanterns}};
}
