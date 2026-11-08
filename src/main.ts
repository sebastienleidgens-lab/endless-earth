import * as THREE from 'three';
import { createDemoWorld } from './world/demo';
import { loadAnglesGeography, updateVegetationLOD } from './world/geodata';
import { fetchTerrain, type Terrain } from './world/terrain';
import { ANGLES, toLocal } from './world/geo';
import { InputController } from './controls/input';
import { canWalk, moveWithCollision } from './world/collisions';
// @ts-ignore shared deterministic runtime
import { movement, nextView, cameraFraction } from './controls/walking.mjs';
import { createAmbienceButton } from './controls/ambience';
import './style.css';
const root=document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML=`<div class="hud"><strong>ENDLESS EARTH</strong><span>France Alpha · ${ANGLES.name}</span><small>Décor illustratif — géographie réelle à importer</small></div><div class="help">Déplacement : ZQSD / WASD / flèches · Glisser : orienter la caméra · Molette : zoom · Shift : courir · V : changer de vue</div>`;
createAmbienceButton(root);
const scene=new THREE.Scene(); scene.background=new THREE.Color(0xdce8df); scene.fog=new THREE.Fog(0xdce8df,300,1000);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,1500);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6)); renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace; root.prepend(renderer.domElement);
renderer.domElement.setAttribute('aria-label','Vue 3D du village');
scene.add(new THREE.HemisphereLight(0xffffff,0x738465,2));
const sun=new THREE.DirectionalLight(0xffe5bc,2.3); sun.position.set(-60,100,55); sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-65; sun.shadow.camera.right=65; sun.shadow.camera.top=65; sun.shadow.camera.bottom=-65; scene.add(sun); scene.add(sun.target);
// Render a complete fallback synchronously: network requests must never block first paint.
const demo = new THREE.Group();
createDemoWorld(demo);
scene.add(demo);
let activeTerrain: Terrain | null = null;
let geographyReady=false;
const hint = document.querySelector<HTMLElement>('.hud small');
const params = new URLSearchParams(location.search);
const terrainPreview = params.get('terrain') === '1';
const tilesPreview = params.get('tiles') === '1';
const terrainDebug = params.get('terrainDebug') === '1';
// Approximate site reference, not a surveyed fortress footprint. Historical
// sources agree on the rocky promontory but differ on their POI coordinates.
const fortressSite=toLocal({lat:46.69390,lon:0.88310});
if(tilesPreview){
  const landmark=document.createElement('button');
  landmark.type='button';
  landmark.textContent='⌖ Forteresse · situer';
  landmark.title='Rejoindre le site approximatif du château (pas un relevé des murs)';
  landmark.style.cssText='position:fixed;right:14px;bottom:50px;z-index:20;background:#304d40ed;color:white;border:1px solid #ffffff55;border-radius:8px;padding:11px 14px;font:600 13px system-ui;cursor:pointer';
  landmark.addEventListener('click',()=>{
    setViewMode('aerial');
    avatar.position.x=fortressSite.x;
    avatar.position.z=fortressSite.z;
    const ground=activeTerrain?.relativeHeight(fortressSite.x,fortressSite.z);
    if(ground!==null&&ground!==undefined)avatar.position.y=ground;
    zoom=110;
  });
  root.append(landmark);
}

// Aerial OSM mode prioritizes responsiveness: terrain and facades still receive light.
if(tilesPreview)renderer.shadowMap.enabled=false;
// Optional live GPU diagnostics: ?tiles=1&perf=1 (disabled by default).
const perfPreview = params.get('perf') === '1';
const perfPanel = perfPreview ? document.createElement('div') : null;
if(perfPanel){
  perfPanel.setAttribute('role','status');
  perfPanel.className='perf-panel';
  perfPanel.style.cssText='position:fixed;right:12px;top:12px;z-index:30;background:#17251de6;color:#fff;padding:10px 13px;border-radius:7px;font:12px/1.6 monospace;pointer-events:none;white-space:pre';
  perfPanel.textContent='GPU : initialisation…';
  root.append(perfPanel);
}
if (terrainPreview) {
  fetchTerrain().then(terrain=>{
    if(!terrain) { if(hint)hint.textContent='Relief indisponible · décor illustratif'; return; }
    const mesh=terrain.createMesh();
    activeTerrain=terrain;
    scene.add(mesh);
    demo.visible=false;
    if(hint)hint.textContent='Aperçu du relief réel · bâtiments masqués';
  }).catch(error=>{
    console.warn('Terrain preview unavailable',error);
    if(hint)hint.textContent='Relief indisponible · décor illustratif';
  });
} else if (!tilesPreview) {
  const realWorld = new THREE.Group();
  loadAnglesGeography(realWorld).then(count=>{
    if(count>0){
      placeSafeStart();
      scene.add(realWorld);
      demo.visible=false;
      // A ground surface remains necessary for the OSM footprints.
      createDemoWorld(realWorld,true);
      if(hint)hint.textContent=`OSM : ${count} objets · relief provisoire`;
    } else if(hint) hint.textContent='Décor illustratif · données géographiques en attente';
  }).catch(error=>{
    console.warn('Geodata unavailable',error);
    if(hint)hint.textContent='Décor illustratif · import géographique indisponible';
  });
}
// Diagnostic real-geography mode: bypass the tile coordinator until we can
// prove that the actual OSM dataset is rendered correctly in the browser.
// Never silently show the illustrative village in this mode.
if(tilesPreview && !terrainPreview){
  demo.visible=false;
  const realWorld=new THREE.Group();
  scene.add(realWorld);
  if(hint)hint.textContent='OSM réel : recherche du relief et des bâtiments…';
  (async()=>{
    let terrain:Terrain|null=null;
    try{terrain=await fetchTerrain();}catch(error){console.warn('DEM unavailable',error);}
    if(terrain){
      const mesh=terrain.createMesh();
      realWorld.add(mesh);
      activeTerrain=terrain;
      if(terrainDebug){
        // Compare the same slope (15 m per 20 m) across DEM resolutions.
        const threshold=15*terrain.grid.step_m/20;
        const {overlay,cells}=terrain.createSlopeDiagnostics(threshold);
        realWorld.add(overlay);
        console.info('DEM diagnostic: steep cells', {cells,thresholdMetres:threshold,stepMetres:terrain.grid.step_m});
        const diagnostic=document.createElement('div');
        diagnostic.style.cssText='position:fixed;left:12px;bottom:12px;z-index:30;background:#17251de6;color:#fff;padding:9px 12px;border-radius:6px;font:12px/1.5 sans-serif;pointer-events:none';
        diagnostic.textContent=`Diagnostic relief : ${cells} cellules ≥ ${threshold.toFixed(1)} m / ${terrain.grid.step_m} m (contours roses)`;
        root.append(diagnostic);
      }
    }else{
      createDemoWorld(realWorld,true);
    }
    try{
      const count=await loadAnglesGeography(realWorld,terrain??undefined);
      geographyReady=count>0&&terrain!==null;
      if(geographyReady)geographyReady=placeSafeStart(terrain!);
      if(hint)hint.textContent=count>0
        ? `OSM réel : ${count} objets · ${terrain?`relief IGN ${terrain.grid.step_m} m · dénivelé ${(Math.max(...terrain.grid.elevations_m)-Math.min(...terrain.grid.elevations_m)).toFixed(0)} m`:'relief indisponible, sol plat'}`
        : 'ERREUR OSM : aucun objet géographique chargé';
    }catch(error){
      console.error('OSM geography rendering failed',error);
      if(hint)hint.textContent=`ERREUR OSM : ${String(error instanceof Error?error.message:error).slice(0,100)}`;
    }
  })();
}

function placeSafeStart(terrain?:Terrain){
  for(let r=0;r<100;r+=2)for(let i=0;i<32;i++){
    const x=Math.cos(i*Math.PI/16)*r,z=Math.sin(i*Math.PI/16)*r,h=terrain?terrain.relativeHeight(x,z):0;
    if(h!==null&&canWalk(x,z)&&(!terrain||[[-1,0],[1,0],[0,1],[0,-1]].every(([dx,dz])=>{const v=terrain.relativeHeight(x+dx,z+dz);return v!==null&&Math.abs(v-h)<.65}))){
      avatar.position.set(x,h,z);return true;
    }
  }
  return false;
}
const avatar=new THREE.Group();
const cloth=new THREE.MeshStandardMaterial({color:0x687c79,roughness:1});
const skin=new THREE.MeshStandardMaterial({color:0xe4b992,roughness:1});
const trousers=new THREE.MeshStandardMaterial({color:0x665c52,roughness:1});
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.23,.48,4,8),cloth);body.position.y=1.13;avatar.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(.17,10,8),skin);head.position.y=1.66;avatar.add(head);
const limbs:THREE.Group[]=[];
for(let i=0;i<4;i++){
  const pivot=new THREE.Group();pivot.position.set((i%2?1:-1)*(i<2?.13:.3),i<2?.87:1.37,0);
  const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(i<2?.085:.06,i<2?.57:.43,3,6),i<2?trousers:cloth);
  mesh.position.y=i<2?-.35:-.27;pivot.add(mesh);avatar.add(pivot);limbs.push(pivot);
}
avatar.traverse(o=>{if(o instanceof THREE.Mesh)o.castShadow=true});scene.add(avatar);
let yaw=.65, pitch=.2, zoom=tilesPreview?125:45, smoothZoom=zoom, dragging=false,lastX=0,lastY=0;
type ViewMode='aerial'|'first'|'third';
let viewMode:ViewMode='aerial';
const viewButton=document.createElement('button');
viewButton.type='button';
viewButton.style.cssText='position:fixed;right:14px;bottom:100px;z-index:21;background:#304d40ed;color:white;border:1px solid #ffffff55;border-radius:8px;padding:11px 14px;font:600 13px system-ui;cursor:pointer';
const viewNames:Record<ViewMode,string>={aerial:'Vue aérienne',first:'À pied · 1re personne',third:'À pied · 3e personne'};
function setViewMode(mode:ViewMode){
  if(mode!=='aerial'&&!canWalk(avatar.position.x,avatar.position.z))return;
  viewMode=mode;
  viewButton.textContent='◉ '+viewNames[mode]+' · changer (V)';
  zoom=mode==='aerial'?125:mode==='third'?7:0;
  avatar.visible=mode!=='first';
  smoothZoom=zoom;
  camera.position.copy(avatar.position).add(new THREE.Vector3(0,1.7,0));
}
viewButton.addEventListener('click',()=>setViewMode(nextView(viewMode)));
addEventListener('keydown',event=>{if(event.code==='KeyV'&&!event.repeat)setViewMode(nextView(viewMode))});
root.append(viewButton);
setViewMode('aerial');
const input = new InputController();
renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointerup',()=>dragging=false);
renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
renderer.domElement.addEventListener('lostpointercapture',()=>dragging=false);
renderer.domElement.addEventListener('pointermove',e=>{if(dragging){yaw-=(e.clientX-lastX)*.005;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-lastY)*.004,-1.15,1.15);lastX=e.clientX;lastY=e.clientY}});
renderer.domElement.addEventListener('wheel',e=>{if(viewMode==='aerial')zoom=THREE.MathUtils.clamp(zoom+e.deltaY*.055,22,210);else if(viewMode==='third')zoom=THREE.MathUtils.clamp(zoom+e.deltaY*.012,4,13)},{passive:true});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
camera.position.set(Math.sin(yaw)*zoom,zoom*.78,Math.cos(yaw)*zoom);
camera.lookAt(0,2,0);
renderer.render(scene,camera);
const qualityButton=document.createElement('button');
qualityButton.className='quiet-control quality-control';
let quality:'low'|'high'='high',qualityAuto=true,qualitySeconds=0,qualityFrames=0;
function applyQuality(level:'low'|'high'){
  quality=level;renderer.setPixelRatio(Math.min(devicePixelRatio,level==='low'?1:1.6));
  renderer.shadowMap.enabled=!tilesPreview&&level==='high';
  qualityButton.textContent=`Qualité : ${level==='low'?'éco':'douce'}${qualityAuto?' (auto)':''}`;
}
qualityButton.addEventListener('click',()=>{qualityAuto=false;applyQuality(quality==='high'?'low':'high')});
root.append(qualityButton);applyQuality('high');
const clock=new THREE.Clock();
let vegetationLodElapsed=0;
let perfElapsed=0,perfFrames=0,walkPhase=0;
if(perfPreview)Object.defineProperty(window,'endlessDiagnostics',{get:()=>({mode:viewMode,ready:geographyReady,position:avatar.position.toArray(),camera:camera.position.toArray(),quality,avatarVisible:avatar.visible})});
function frame(){requestAnimationFrame(frame);const elapsed=clock.getDelta();const dt=Math.min(elapsed,.25);
const controls=input.getVector();
const displacement=movement(yaw,controls.forward,controls.strafe,dt,input.running);
const previous=avatar.position.clone();
const groundHeight=(x:number,z:number)=>activeTerrain?activeTerrain.relativeHeight(x,z):0;
// Wait for the real dataset before allowing walking in geography mode.
if(!tilesPreview||geographyReady)moveWithCollision(avatar.position,displacement,groundHeight);
const moved=avatar.position.distanceTo(previous);
if(moved>.0001){
  const facing=Math.atan2(displacement.x,displacement.z);
  avatar.rotation.y+=Math.atan2(Math.sin(facing-avatar.rotation.y),Math.cos(facing-avatar.rotation.y))*(1-Math.exp(-dt*12));
}
walkPhase+=moved*(input.running?7:9);
limbs.forEach((limb,i)=>{limb.rotation.x=THREE.MathUtils.lerp(limb.rotation.x,moved>.0001?Math.sin(walkPhase+(i%2?Math.PI:0))*(i<2?.48:-.35):0,1-Math.exp(-dt*14))});
if(activeTerrain){const h=groundHeight(avatar.position.x,avatar.position.z);if(h!==null)avatar.position.y=h;}
smoothZoom=THREE.MathUtils.lerp(smoothZoom,zoom,1-Math.exp(-dt*10));
const eye=avatar.position.clone().add(new THREE.Vector3(0,1.65,0));
const offset=viewMode==='first'?new THREE.Vector3():viewMode==='third'?new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch)*smoothZoom,Math.sin(pitch)*smoothZoom+.5,Math.cos(yaw)*Math.cos(pitch)*smoothZoom):new THREE.Vector3(Math.sin(yaw)*smoothZoom,smoothZoom*.78,Math.cos(yaw)*smoothZoom);
const target=eye.clone().add(offset);
if(viewMode==='third'){
  // Sweep from the eye on every frame; never interpolate across a wall after a turn.
  target.copy(eye).addScaledVector(offset,cameraFraction(eye,offset,canWalk,groundHeight));
}
if(viewMode==='first'){
  camera.position.copy(eye);
  camera.lookAt(eye.x-Math.sin(yaw)*Math.cos(pitch),eye.y-Math.sin(pitch),eye.z-Math.cos(yaw)*Math.cos(pitch));
}else if(viewMode==='third'){
  camera.position.copy(target);camera.lookAt(eye);
}else{
  const h=groundHeight(target.x,target.z);if(h!==null)target.y=Math.max(target.y,h+12);
  camera.position.lerp(target,1-Math.exp(-dt*6));camera.lookAt(eye);
}
sun.position.set(avatar.position.x-60,100,avatar.position.z+55);sun.target.position.copy(avatar.position);sun.target.updateMatrixWorld();
vegetationLodElapsed+=dt;
if(vegetationLodElapsed>=.25){vegetationLodElapsed=0;updateVegetationLOD(scene,camera)}
renderer.render(scene,camera);
if(qualityAuto&&geographyReady&&!document.hidden){
  qualitySeconds+=elapsed;qualityFrames++;
  if(qualitySeconds>=6){const fps=qualityFrames/qualitySeconds;applyQuality(fps<45?'low':'high');qualityAuto=false;}
}
if(perfPanel){
  perfElapsed+=elapsed;perfFrames++;
  if(perfElapsed>=1){
    const info=renderer.info;
    perfPanel.textContent=`FPS ≈ ${Math.round(perfFrames/perfElapsed)}\nDraw calls : ${info.render.calls}\nTriangles : ${info.render.triangles.toLocaleString('fr-FR')}\nGéométries : ${info.memory.geometries}\nTextures : ${info.memory.textures}\nRatio pixels : ${renderer.getPixelRatio().toFixed(1)}\nVue : ${viewMode} · terrain prêt : ${geographyReady}\nPosition : ${avatar.position.x.toFixed(2)}, ${avatar.position.y.toFixed(2)}, ${avatar.position.z.toFixed(2)}`;
    perfElapsed=0;perfFrames=0;
  }
}
}frame();
