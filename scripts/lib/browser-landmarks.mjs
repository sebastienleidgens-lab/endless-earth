import {launch} from './mission-14-browser.mjs';
import {injection} from './browser-road-fixture.mjs';
import assert from 'node:assert/strict';
export {launch};
export const views=[
 ['chateau-pont',-187,160,-1.60,-.28,0,'first',null,1.65,73.9],
 ['chateau-rive',-230,150,-1.57,-.22,0,'first'],
 ['chateau-vallee',-80,210,-.75,-.28,0,'first'],
 ['chateau-rue',-55,70,.85,-.05,0,'first'],
 ['chateau-haut',80,90,1,.08,0,'first'],
 ['chateau-aerien',-90,143,.4,.5,130,'aerial'],
 ['pont-ensemble',-185,156,.9,.5,105,'aerial'],
 ['pont-dessous',-202,160,-1.1,-.12,0,'first',null,1.65,67.8],
 ['pont-traversee',-185,156,.57,0,0,'first',null,1.65,73.9],
 ['village',-100,155,.5,.5,210,'aerial'],
 ['foret-temoin',-430,340,1,-.12,0,'first']
];
export async function openGame(browser,port,{route:routeSetup}={}){
 const page=await browser.newPage({viewport:{width:960,height:640}}),errors=[],warnings=[];page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text())});
 await page.addInitScript(()=>window.earthHold=true);if(routeSetup)await routeSetup(page);
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace(/function frame\(\)\s*\{\s*requestAnimationFrame\(frame\);/,m=>m+'if(window.earthHold)return;');assert.ok(body.includes('if(window.earthHold)return;'));
 await route.fulfill({response,body:body+injection+`
 window.m14b={
  setup(v,profile='balanced',pose){window.earthTest.setup(v);applyQuality(profile==='eco'?'low':'high');setLifeProfile(profile);if(v[9]!==undefined)camera.position.y=v[9]-activeTerrain.sample(0,0);for(let i=0;i<240;i++)updateAtmosphere(1,quality==='low');if(pose){camera.position.fromArray(pose.position);camera.quaternion.fromArray(pose.quaternion);camera.fov=pose.fov;camera.updateProjectionMatrix()}camera.updateMatrixWorld()},
  tick(){window.earthTest.lod();scene.userData.decorationStream?.tick(quality==='low',16,0)},
  state(){return {camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),matrix:camera.matrixWorld.toArray(),fov:camera.fov},climate:scene.userData.climate,terrain:activeTerrain.metrics,landmarks:activeTerrain.landmarks?.objects.map(o=>({id:o.id,triangles:o.parts.reduce((n,p)=>n+p.index.length/3,0)}))??[],memory:window.earthTest.memory(),stream:scene.userData.decorationStream?.metrics,walkable:canWalk(avatar.position.x,avatar.position.z),baseline:activeTerrain.sample(0,0)}},
  support(x,z){return walkingHeight((x,z)=>activeTerrain.relativeHeight(x,z))(x,z)},
  walkable(x,z){return canWalk(x,z)},
  valid(x,z){return validPoint({x,z},activeTerrain)},
  move(p,dx,dz){const v=new THREE.Vector3(...p);moveWithCollision(v,{x:dx,z:dz},(x,z)=>activeTerrain.relativeHeight(x,z),false);return v.toArray()},
  landmarkSupport(x,z){return activeTerrain.landmarks?.support('osm-way-647696691',x,z)??null}
 };`});});
 const started=performance.now();await page.goto(`http://localhost:${port}/endless-earth/?perf=1&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z`);await page.waitForFunction(()=>window.endlessDiagnostics?.ready&&!document.querySelector('#auto-walk').disabled);const startupMs=performance.now()-started;
 await page.addStyleTag({content:'.perf-panel,.living-panel,.quiet-control,.nature-controls,.joystick,.help,#app>button{visibility:hidden}'});
 return {page,errors,warnings,startupMs};
}
export async function settle(page){for(let i=0;i<55;i++){await page.evaluate(()=>window.m14b.tick());await page.waitForTimeout(25)}}
