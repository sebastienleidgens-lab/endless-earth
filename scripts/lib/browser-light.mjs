import {launch} from './mission-14-browser.mjs';
import {injection} from './browser-road-fixture.mjs';
import assert from 'node:assert/strict';
export {launch};
export const views=[
 ['chateau',-187,160,-1.6,-.28,0,'first',null,1.65,73.9],
 ['falaise',-80,210,-.75,-.28,0,'first'],
 ['pont',-202,160,-1.1,-.12,0,'first',null,1.65,67.8],
 ['facade',-55,70,.85,-.05,0,'first'],
 ['sous-bois',-426.72308821603656,346.51291632745415,.7853981633974483,.20,0,'first'],
 ['vallee',-100,155,.5,.5,210,'aerial']
];
export async function openGame(browser,port=5173,options={}){
 const page=await browser.newPage({viewport:{width:960,height:640}}),errors=[],warnings=[];page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text())});await page.addInitScript(()=>window.earthHold=true);if(options.init)await page.addInitScript(options.init);if(options.route)await options.route(page);
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');assert.ok(body.includes('if(window.earthHold)return;'));
 await route.fulfill({response,body:body+injection+`
 window.m14c={
  setup(v,moment='afternoon',profile='balanced',pose){window.earthTest.setup(v);applyQuality(profile==='eco'?'low':'high');setLifeProfile(profile);const select=document.querySelector('select[aria-label="Moment de la journée"]');select.value=moment;select.dispatchEvent(new Event('change'));for(let i=0;i<240;i++)updateAtmosphere(1,quality==='low');if(v[9]!==undefined)camera.position.y=v[9]-activeTerrain.sample(0,0);if(pose){camera.position.fromArray(pose.position);camera.quaternion.fromArray(pose.quaternion);camera.fov=pose.fov;camera.updateProjectionMatrix()}camera.updateMatrixWorld()},
  tick(){window.earthTest.lod();scene.userData.decorationStream?.tick(quality==='low',16,0)},
  render(){return window.earthTest.render()},forceRefresh(){if(typeof landscapeLighting!=='undefined')landscapeLighting.invalidate()},step(dt){updateAtmosphere(dt,quality==='low')},
  state(){return {camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),matrix:camera.matrixWorld.toArray(),fov:camera.fov},climate:scene.userData.climate,lighting:scene.userData.landscapeLighting??null,gpu:{geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,programs:renderer.info.programs.length},memory:window.earthTest.memory(),gpuAllocation:window.gpuAllocation?.snapshot(),terrain:activeTerrain.metrics,walkable:canWalk(avatar.position.x,avatar.position.z),sun:{direction:sun.position.clone().sub(sun.target.position).normalize().toArray(),intensity:sun.intensity},hemisphere:hemisphere.intensity,shadowMap:renderer.shadowMap.enabled}},
  export(){scene.updateMatrixWorld(true);const meshes=[],trees=[];scene.traverse(o=>{if(!o.isMesh)return;const tile=o.userData.earthTile;if(tile||o.name.startsWith('architecture-')&&o.name!=='architecture-detail'||o.name.startsWith('landmark-')||o.name==='mapped-linear-features'){if(o.isInstancedMesh)return;const g=tile?.fineGeometry??o.geometry,p=g.attributes.position,n=g.attributes.normal;meshes.push({name:o.name,position:Array.from(p.array),normal:Array.from({length:p.count},(_,i)=>[n.getX(i),n.getY(i),n.getZ(i)]).flat(),index:g.index?Array.from(g.index.array):null,matrix:o.matrixWorld.toArray(),water:g.attributes.earthWater?Array.from(g.attributes.earthWater.array):null})}if(o.userData.natureTreeCell){}});scene.traverse(o=>{if(!o.userData.natureTreeCell)return;const m=o.children[1],g=o.userData.natureTreeCell.farGeometry;g.computeBoundingBox();for(let i=0;i<m.count;i++){const q=new THREE.Matrix4();m.getMatrixAt(i,q);q.premultiply(m.matrixWorld);const box=g.boundingBox.clone().applyMatrix4(q),center=box.getCenter(new THREE.Vector3()),radius=box.getSize(new THREE.Vector3()).multiplyScalar(.5);trees.push({center:center.toArray(),radius:radius.toArray(),evergreen:m.geometry.attributes.natureTraits.getZ(i)})}});return {meshes,trees,baseline:activeTerrain.sample(0,0)}}
 };`});});
 const t=performance.now();await page.goto(`http://localhost:${port}/endless-earth/?perf=1&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z${options.query??''}`);await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);if(port===5173)await page.waitForFunction(()=>!window.m14c.state().lighting||!['loading','idle'].includes(window.m14c.state().lighting.state));const startupMs=performance.now()-t;await page.addStyleTag({content:'.perf-panel,.living-panel,.quiet-control,.nature-controls,.joystick,.help,#app>button{visibility:hidden}'});return {page,errors,warnings,startupMs};
}
export async function settle(page){for(let i=0;i<55;i++){await page.evaluate(()=>window.m14c.tick());await page.waitForTimeout(25)}}
