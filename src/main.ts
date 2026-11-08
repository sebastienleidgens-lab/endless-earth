import * as THREE from 'three';
import { createDemoWorld } from './world/demo';
import { loadAnglesGeography, updateVegetationLOD } from './world/geodata';
import { fetchTerrain, type Terrain } from './world/terrain';
import { ANGLES, toLocal } from './world/geo';
import { InputController } from './controls/input';
import { moveWithCollision } from './world/collisions';
import './style.css';
const root=document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML=`<div class="hud"><strong>ENDLESS EARTH</strong><span>France Alpha · ${ANGLES.name}</span><small>Décor illustratif — géographie réelle à importer</small></div><div class="help">Déplacement : ZQSD / WASD / flèches · Glisser : orienter la caméra · Molette : zoom</div>`;
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
  landmark.style.cssText='position:fixed;right:14px;bottom:18px;z-index:20;background:#304d40ed;color:white;border:1px solid #ffffff55;border-radius:8px;padding:11px 14px;font:600 13px system-ui;cursor:pointer';
  landmark.addEventListener('click',()=>{
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
      if(hint)hint.textContent=count>0
        ? `OSM réel : ${count} objets · ${terrain?`relief IGN ${terrain.grid.step_m} m · dénivelé ${(Math.max(...terrain.grid.elevations_m)-Math.min(...terrain.grid.elevations_m)).toFixed(0)} m`:'relief indisponible, sol plat'}`
        : 'ERREUR OSM : aucun objet géographique chargé';
    }catch(error){
      console.error('OSM geography rendering failed',error);
      if(hint)hint.textContent=`ERREUR OSM : ${String(error instanceof Error?error.message:error).slice(0,100)}`;
    }
  })();
}

const avatar=new THREE.Group();
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.65,1.65,5,8),new THREE.MeshStandardMaterial({color:0x715d4f}));body.position.y=2;body.castShadow=true;avatar.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(.52,10,8),new THREE.MeshStandardMaterial({color:0xe4b992}));head.position.y=3.65;head.castShadow=true;avatar.add(head);scene.add(avatar);
let yaw=.65, zoom=tilesPreview?125:45, dragging=false,lastX=0;
type ViewMode='aerial'|'first'|'third';
let viewMode:ViewMode='aerial';
const viewButton=document.createElement('button');
viewButton.type='button';
viewButton.style.cssText='position:fixed;right:14px;bottom:70px;z-index:21;background:#304d40ed;color:white;border:1px solid #ffffff55;border-radius:8px;padding:11px 14px;font:600 13px system-ui;cursor:pointer';
const viewNames:Record<ViewMode,string>={aerial:'Vue aérienne',first:'À pied · 1re personne',third:'À pied · 3e personne'};
function setViewMode(mode:ViewMode){
  viewMode=mode;
  viewButton.textContent='◉ '+viewNames[mode]+' · changer (V)';
  zoom=mode==='aerial'?125:mode==='third'?7:0;
  body.visible=head.visible=mode!=='first';
}
viewButton.addEventListener('click',()=>setViewMode(viewMode==='aerial'?'third':viewMode==='third'?'first':'aerial'));
addEventListener('keydown',event=>{if(event.code==='KeyV'&&!event.repeat)setViewMode(viewMode==='aerial'?'third':viewMode==='third'?'first':'aerial')});
root.append(viewButton);
setViewMode('aerial');
const input = new InputController();
renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointerup',()=>dragging=false);
renderer.domElement.addEventListener('pointermove',e=>{if(dragging){yaw+=(e.clientX-lastX)*.005;lastX=e.clientX}});
renderer.domElement.addEventListener('wheel',e=>{if(viewMode==='aerial')zoom=THREE.MathUtils.clamp(zoom+e.deltaY*.055,22,210);else if(viewMode==='third')zoom=THREE.MathUtils.clamp(zoom+e.deltaY*.012,4,13)},{passive:true});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
camera.position.set(Math.sin(yaw)*zoom,zoom*.78,Math.cos(yaw)*zoom);
camera.lookAt(0,2,0);
renderer.render(scene,camera);
const clock=new THREE.Clock();
let vegetationLodElapsed=0;
let perfElapsed=0,perfFrames=0;
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);
const controls=input.getVector();
const dir=new THREE.Vector3(Math.sin(yaw)*controls.forward+Math.cos(yaw)*controls.strafe,0,Math.cos(yaw)*controls.forward-Math.sin(yaw)*controls.strafe);
if(dir.lengthSq()>0){dir.normalize();moveWithCollision(avatar.position,dir.clone().multiplyScalar(dt*(viewMode==='aerial'?8:3.3)));avatar.rotation.y=viewMode==='first'?yaw+Math.PI:Math.atan2(dir.x,dir.z)}
if(activeTerrain){const h=activeTerrain.relativeHeight(avatar.position.x,avatar.position.z);if(h!==null)avatar.position.y=h;}
const offset=viewMode==='first'?new THREE.Vector3(0,1.7,0):viewMode==='third'?new THREE.Vector3(Math.sin(yaw)*zoom,3.2,Math.cos(yaw)*zoom):new THREE.Vector3(Math.sin(yaw)*zoom,zoom*.78,Math.cos(yaw)*zoom);
const target=avatar.position.clone().add(offset);
if(activeTerrain){
  const ground=activeTerrain.relativeHeight(target.x,target.z);
  if(ground!==null)target.y=Math.max(target.y,ground+(viewMode==='aerial'?12:1.6));
}
camera.position.lerp(target,1-Math.pow(viewMode==='first'?.68:.91,dt*60));
if(viewMode==='first')camera.lookAt(camera.position.x-Math.sin(yaw)*12,camera.position.y-.15,camera.position.z-Math.cos(yaw)*12);
else camera.lookAt(avatar.position.x,avatar.position.y+(viewMode==='third'?1.9:2),avatar.position.z);
sun.position.set(avatar.position.x-60,100,avatar.position.z+55);sun.target.position.copy(avatar.position);sun.target.updateMatrixWorld();
vegetationLodElapsed+=dt;
if(vegetationLodElapsed>=.25){vegetationLodElapsed=0;updateVegetationLOD(scene,camera)}
renderer.render(scene,camera);
if(perfPanel){
  perfElapsed+=dt;perfFrames++;
  if(perfElapsed>=1){
    const info=renderer.info;
    perfPanel.textContent=`FPS ≈ ${Math.round(perfFrames/perfElapsed)}\nDraw calls : ${info.render.calls}\nTriangles : ${info.render.triangles.toLocaleString('fr-FR')}\nGéométries : ${info.memory.geometries}\nTextures : ${info.memory.textures}\nRatio pixels : ${renderer.getPixelRatio().toFixed(1)}`;
    perfElapsed=0;perfFrames=0;
  }
}
}frame();
