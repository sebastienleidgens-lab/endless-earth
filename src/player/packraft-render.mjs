import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {lightingReceiver} from '../lighting/state.mjs';
/** Original low-cost hull, inflated side tubes, floor, seat and one paddle. */
export function createPackraft(scene){
 const group=new THREE.Group(),paddle=new THREE.Group(),hull=new THREE.Group(),geometries=[],materials=[];group.name='original-packraft';group.visible=false;scene.add(group);group.add(hull,paddle);
 function material(c){const m=new THREE.MeshStandardMaterial({color:c,roughness:.78});lightingReceiver(m);materials.push(m);return m;}
 const tube=material(0x937548),floor=material(0x454c41),shaft=material(0xaaa18a),blade=material(0x617b79);
 function part(g,m,parent,x,y,z){geometries.push(g);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
 // One closed elliptical tube follows a rounded hull path, with an open cockpit.
 const path=new THREE.CatmullRomCurve3(Array.from({length:16},(_,i)=>{const a=i/16*Math.PI*2;return new THREE.Vector3(Math.cos(a)*.51,.12,Math.sin(a)*.94)}),true);
 part(new THREE.TubeGeometry(path,40,.18,8,true),tube,hull,0,0,0);
 part(new THREE.BoxGeometry(.74,.08,1.5),floor,hull,0,.04,0);
 part(new THREE.BoxGeometry(.5,.15,.34),floor,hull,0,.18,-.1);
 const back=part(new THREE.BoxGeometry(.47,.3,.08),floor,hull,0,.31,-.29);back.rotation.x=-.2;
 const bag=part(new THREE.BoxGeometry(.39,.25,.32),floor,hull,0,.32,-.66);bag.rotation.x=.1;
 const pole=part(new THREE.CylinderGeometry(.016,.016,2.15,8),shaft,paddle,0,0,0);pole.rotation.z=Math.PI/2;
 for(const side of [-1,1])part(new THREE.BoxGeometry(.38,.035,.16),blade,paddle,side*1.05,0,0);
 for(const parent of [hull,paddle]){const byMaterial=new Map();for(const o of [...parent.children]){o.updateMatrix();const g=o.geometry.clone().applyMatrix4(o.matrix);if(!byMaterial.has(o.material))byMaterial.set(o.material,[]);byMaterial.get(o.material).push(g);parent.remove(o);}for(const [m,parts]of byMaterial){const g=mergeGeometries(parts);for(const p of parts)p.dispose();geometries.push(g);parent.add(new THREE.Mesh(g,m));}}
 const tip=new THREE.Vector3();const hands=[new THREE.Vector3(),new THREE.Vector3()];
 return {group,paddle,hands,tip,metrics:{triangles:[...hull.children,...paddle.children].reduce((n,o)=>n+(o.geometry.index?.count??o.geometry.attributes.position.count)/3,0),instances:1},update(boat,time){group.visible=boat.visible;if(!group.visible)return;group.position.set(boat.position.x,boat.position.y,boat.position.z);group.rotation.set(Math.sin(time*1.7)*.008,boat.heading,Math.sin(time*1.3)*.012);group.scale.setScalar(Math.max(.001,boat.scale));const v=Math.sin(boat.stroke),c=Math.cos(boat.stroke);paddle.position.set(v*.18,.72-Math.abs(v)*.18,.33+c*.16);paddle.rotation.set(c*.18,Math.sin(boat.stroke)*.25,v*.55);paddle.visible=(boat.pose??0)>.5;group.updateWorldMatrix(true,true);paddle.localToWorld(tip.set(v>0?-1.12:1.12,0,0));for(let i=0;i<2;i++)paddle.localToWorld(hands[i].set(i===0?-.27:.27,.045,0));},dispose(){scene.remove(group);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}};
}
