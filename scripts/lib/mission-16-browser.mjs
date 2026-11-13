import {openWalker,launch,settle} from './mission-15c-browser.mjs';
export {launch,settle};
export const injection=`
window.q16={
 state(){return window.c15.snapshot()},
 camera(p,target,fov=55){camera.position.fromArray(p);camera.lookAt(...target);camera.fov=fov;camera.updateProjectionMatrix();camera.updateMatrixWorld();},
 terrain(x,z){return {terrain:activeTerrain.relativeHeight(x,z),support:walkingHeight((x,z)=>activeTerrain.relativeHeight(x,z))(x,z),clear:canWalk(x,z)}},
 roads(){return paths},
 features(){return window.endlessDiagnostics.roads},
 move(p,d){const v=new THREE.Vector3(p.x,p.y??walkingHeight((x,z)=>activeTerrain.relativeHeight(x,z))(p.x,p.z),p.z);moveWithCollision(v,d,(x,z)=>activeTerrain.relativeHeight(x,z),false);return {x:v.x,y:v.y,z:v.z}},
 faceList(){const rows=[];scene.traverse(o=>{if(!o.name.startsWith('architecture-')||!o.geometry)return;const g=o.geometry,p=g.attributes.position,n=g.attributes.normal,a=g.attributes.architectureMaterial,ids=g.index;if(!a||!ids)return;for(let k=0;k<ids.count;k+=3){const i=ids.getX(k);if(a.getX(i)>1||Math.abs(n.getY(i))>.01)continue;const v=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(p,ids.getX(k+j)).applyMatrix4(o.matrixWorld)),size=v[0].distanceTo(v[1]);if(size<3)continue;const c=v[0].clone().add(v[1]).add(v[2]).multiplyScalar(1/3),normal=new THREE.Vector3().fromBufferAttribute(n,i);if(c.distanceTo(new THREE.Vector3(0,0,0))<250)rows.push({mesh:o.name,index:k,center:c.toArray(),normal:normal.toArray(),size,vertices:v.map(v=>v.toArray())})}});return rows.sort((a,b)=>Math.hypot(...a.center)-Math.hypot(...b.center)).slice(0,150)},
 pose(v){window.c15.setup(v)},
 heading(x,z){yaw=Math.atan2(avatar.position.x-x,avatar.position.z-z);return Math.hypot(avatar.position.x-x,avatar.position.z-z)},
 moment(v){const s=document.querySelector('select[aria-label="Moment de la journée"]');s.value=v;s.dispatchEvent(new Event('change'));for(let i=0;i<240;i++)updateAtmosphere(1,quality==='low');},
 exportSurface(){return activeTerrain.singleSurface.tiles.map(t=>({descriptor:t.descriptor,position:Array.from(t.attributes.position.array),road:Array.from(t.attributes.earthRoad.array),wet:Array.from(t.attributes.earthWater.array),index:Array.from(t.fine.array)}))},
 buildings(){return scene.userData.architectureAnchors},
};`;
export async function open16(browser,port=5303,options={}){port=port===5303?Number(process.env.MISSION16_PORT??port):port;return openWalker(browser,port,{...options,append:injection+(options.append??'')})}
