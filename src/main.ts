import {createLanterns} from './architecture/lanterns';
// @ts-ignore Shared mapped footprint index for conservative rain shelter.
import {acousticObstacles} from './audio/occlusion.mjs';
import {createTraffic} from './life/traffic';
import {createVillageLife} from './life/village';
import {createSensitiveWorld} from './earthlife/sensitive-world';
import {acousticRoads,acousticBuildings,riverAreas} from './living/geography';
// @ts-ignore Stable conservative resolution controller.
import {AdaptiveResolution} from './world/adaptive-resolution.mjs';
import {disposeRiverFlow} from './earthlife/river-flow';
import {initializeWorldMaterials,configureWorldFiltering,disposeWorldMaterials,worldMaterialStatus} from './materials/world';
import {lifeSettings,setLifeProfile,readLifePreferences,saveLifePreferences,type LifeProfileName} from './earthlife/preferences';
import {natureMemory,updateForestLife} from './nature/render';
import { updateArchitectureLOD, architectureMemory } from './architecture/render';
// @ts-ignore Pure camera helpers.
import {clampZoom,behind} from './controls/orbit.mjs';
import {naturalSky} from './nature/sky';
import { Soundscape } from './living/sound';
import { loadNavigation, navigationReady, nature, paths, routeAt, rememberTour, validPoint, loadPreparedGraph, hasPreparedGraph, prepareGraphForDiagnostics, exportNavigationGraph, walkingGraphBindings, navigationGraphStats, roadInventory, exportTourGraph } from './living/geography';
// @ts-ignore Shared controller tested directly in Node.
import { AutoWalk } from './living/walk.mjs';
import * as THREE from 'three';
import { createDemoWorld } from './world/demo';
import { loadAnglesGeography, updateVegetationLOD } from './world/geodata';
import { fetchTerrain, updateTerrainLOD, type Terrain } from './world/terrain';
import { ANGLES } from './world/geo';
import { InputController } from './controls/input';
// @ts-ignore Shared original life props and bounded session events.
import {createSignsOfLife} from './life/render.mjs';
import {createWalkMenu} from './ui/menu';
// @ts-ignore Original articulated mesh and shared distance gait.
import {createWalker} from './character/walker.mjs';
// @ts-ignore Source-bound, physically verified starts.
import {prepareStarts,chooseStart,inspectStart} from './controls/spawn.mjs';
import { canWalk, moveWithCollision, walkingHeight, cameraClear, hasWalkingSupport, lastMovementDiagnostic } from './world/collisions';
// @ts-ignore shared deterministic runtime
import { movement, nextView, cameraFraction, smoothMovement, transitionWeight } from './controls/walking.mjs';

import './style.css';
import {buildIdentity} from 'virtual:build-identity';
import {createLandscapeLighting} from './lighting/runtime';
// @ts-ignore Pure HTML formatter, shared with the compiled-build tests.
import {buildIdentityMarkup} from './ui/build-identity.mjs';
const root=document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML=`<div class="hud"><div id="build-identity"></div><small>Décor illustratif — géographie réelle à importer</small></div>`;
const identityElement=document.querySelector<HTMLElement>('#build-identity')!;
identityElement.innerHTML=buildIdentityMarkup(buildIdentity,ANGLES.name);
if(import.meta.hot)import.meta.hot.accept('virtual:build-identity',module=>{
 if(module)identityElement.innerHTML=buildIdentityMarkup(module.buildIdentity,ANGLES.name);
});
const credits=document.createElement('div');credits.className='geo-credit';
credits.innerHTML='<a href="https://www.data.gouv.fr/datasets/mnt-lidar-hd" target="_blank" rel="noopener">IGN · LiDAR HD 2023 / OCS GE 2023 / BD TOPO / BD Forêt · ASP RPG 2024 · Licence Ouverte 2.0</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors · ODbL</a>';
const audioCredit=document.createElement('a');audioCredit.href=`${import.meta.env.BASE_URL}audio/credits.html`;audioCredit.target='_blank';audioCredit.rel='noopener';audioCredit.textContent='Sons et licences';const materialCredit=document.createElement('a');materialCredit.href=import.meta.env.BASE_URL+'materials/authentic/credits.html';materialCredit.target='_blank';materialCredit.rel='noopener';materialCredit.textContent=' · Matières CC0 et auteurs';credits.append(materialCredit);root.append(credits);

const scene=new THREE.Scene(); scene.background=new THREE.Color(0xdce8df); scene.fog=new THREE.Fog(0xdce8df,300,1000);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,1500);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6)); renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace; root.prepend(renderer.domElement);
renderer.domElement.setAttribute('aria-label','Vue 3D du village');
const hemisphere=new THREE.HemisphereLight(0xffffff,0x738465,2);scene.add(hemisphere);
const sun=new THREE.DirectionalLight(0xffe5bc,2.3); sun.position.set(-60,100,55); sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-65; sun.shadow.camera.right=65; sun.shadow.camera.top=65; sun.shadow.camera.bottom=-65; scene.add(sun); scene.add(sun.target);
const landscapeLighting=createLandscapeLighting(scene,renderer,sun,()=>avatar,{manifestUrl:import.meta.env.BASE_URL+'data/angles-lighting.json',packUrl:import.meta.env.BASE_URL+'data/angles-lighting.pack'});
const adaptiveResolution=new AdaptiveResolution();
const sensorySeed=new URLSearchParams(location.search).has('perf')?20:crypto.getRandomValues(new Uint32Array(1))[0];
const traffic=createTraffic(scene,camera,sensorySeed);
const villageLife=createVillageLife(scene,camera);
const sensitiveWorld=createSensitiveWorld(scene,sensorySeed);
const lanterns=createLanterns(scene);
let worldSensoryReady=false;
const signs=createSignsOfLife(scene,camera,renderer,{diagnostic:new URLSearchParams(location.search).get('perf')==='1'});
// Render a complete fallback synchronously: network requests must never block first paint.
const demo = new THREE.Group();
createDemoWorld(demo);
scene.add(demo);
let activeTerrain: Terrain | null = null;
let geographyReady=false;
const hint = document.querySelector<HTMLElement>('.hud small');
const params = new URLSearchParams(location.search);
const spawnSeed=params.has('spawnSeed')?(params.get('spawnSeed')??'').slice(0,128):Array.from(crypto.getRandomValues(new Uint32Array(2))).join('-');
const loading=document.createElement('div');loading.id='world-status';loading.setAttribute('role','status');loading.textContent='Préparation de votre promenade…';root.append(loading);
const worldMaterialsReady=initializeWorldMaterials(renderer);
const terrainPreview = params.get('terrain') === '1';
const tilesPreview = params.get('tiles') !== '0';
const terrainDebug = params.get('terrainDebug') === '1';
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
      // Diagnostic without verified relief: no unverified avatar placement.
      scene.add(realWorld);
      demo.visible=false;
      // A ground surface remains necessary for the OSM footprints.
      createDemoWorld(realWorld,true);
      if(hint)hint.textContent=`OSM : ${count} objets · relief provisoire`;
      loading.textContent='Relief vérifié indisponible · promenade en attente';
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
    try{await worldMaterialsReady;terrain=await fetchTerrain();}catch(error){console.warn('DEM unavailable',error);}
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
      void landscapeLighting.install(realWorld,terrain,terrain?.walkSupport?{manifestUrl:import.meta.env.BASE_URL+'data/angles-walk-lighting.json',packUrl:import.meta.env.BASE_URL+'data/angles-walk-lighting.pack'}:undefined);
      if(terrain?.singleSurface&&realWorld.userData.decorationManifest)scene.userData.snowExposureSource={manifestUrl:import.meta.env.BASE_URL+'data/'+(terrain.walkSupport?'angles-walk-snow-exposure.json':'angles-snow-exposure.json'),packUrl:import.meta.env.BASE_URL+'data/'+(terrain.walkSupport?'angles-walk-snow-exposure.pack':'angles-snow-exposure.pack'),bindings:{terrain:terrain.sourceSha256,refinement:terrain.relief?.sha256,surface:terrain.singleSurface.manifest.binarySha256,landmarks:terrain.singleSurface.manifest.landmarksSha256,static:realWorld.userData.decorationManifest.static.sha256}};
      scene.userData.decorationStream=realWorld.userData.decorationStream;
      scene.userData.lifeHabitat=realWorld.userData.lifeHabitat;
      scene.userData.lifeCeiling=new THREE.Box3().setFromObject(realWorld).max.y+12;
      signs.install(realWorld);
      await navigationLoaded();
      if(count>0&&terrain&&navigationReady()){if(perfPreview&&params.get('graphBuild')==='1'){prepareGraphForDiagnostics(terrain);scene.userData.graphExport=()=>({graph:exportNavigationGraph(),bindings:walkingGraphBindings(terrain!)});}else await loadPreparedGraph(terrain);prepareWalk(terrain);}
      else loading.textContent='Le lieu est indisponible. Rechargez pour réessayer.';
      if(hint)hint.textContent=count>0
        ? `Sources IGN / ASP / OSM · ${terrain?`relief IGN ${terrain.grid.step_m} m · dénivelé ${(terrain.grid.elevations_m.reduce((a,b)=>Math.max(a,b),-Infinity)-terrain.grid.elevations_m.reduce((a,b)=>Math.min(a,b),Infinity)).toFixed(0)} m`:'relief indisponible, sol plat'}${terrain&&!terrain.roadsAvailable?' · voies visuelles indisponibles':''}${terrain&&!terrain.environment?' · occupation IGN/ASP indisponible':''}`
        : 'ERREUR OSM : aucun objet géographique chargé';
    }catch(error){
      console.error('OSM geography rendering failed',error);loading.textContent='Le lieu est indisponible. Rechargez pour réessayer.';
      if(hint)hint.textContent=`ERREUR OSM : ${String(error instanceof Error?error.message:error).slice(0,100)}`;
    }
  })();
}

const walkerModel=createWalker(),avatar=walkerModel.avatar;avatar.visible=false;scene.add(avatar);

let yaw=.65, pitch=.2, zoom=5, smoothZoom=zoom, dragging=false;
type ViewMode='aerial'|'first'|'third';
let viewMode:ViewMode='third';
let thirdZoom=5,aerialZoom=125,lastCameraInteraction=-Infinity;
const pointers=new Map<number,{x:number;y:number}>();
let transitionElapsed=1;
const transitionStart=new THREE.Vector3(),transitionRotation=new THREE.Quaternion();
const velocity={x:0,z:0};
let boomLength=0,eyeHeight=1.65;
const viewSelect=document.createElement('select');viewSelect.setAttribute('aria-label','Vue du personnage');
const viewNames:Record<ViewMode,string>={aerial:'Vue aérienne',first:'Première personne',third:'Troisième personne'};
for(const [value,label]of Object.entries(viewNames)){const option=document.createElement('option');option.value=value;option.textContent=label;viewSelect.append(option)}
const viewLabel=document.createElement('label');viewLabel.append('Vue du personnage',viewSelect);root.append(viewLabel);
function setViewMode(mode:ViewMode){
 if(geographyReady&&mode!=='aerial'&&!canWalk(avatar.position.x,avatar.position.z))return;
 transitionStart.copy(camera.position);transitionRotation.copy(camera.quaternion);transitionElapsed=0;viewMode=mode;viewSelect.value=mode;
 zoom=mode==='aerial'?aerialZoom:mode==='third'?thirdZoom:0;avatar.visible=geographyReady&&mode!=='first';smoothZoom=zoom;
}
viewSelect.onchange=()=>setViewMode(viewSelect.value as ViewMode);
addEventListener('keydown',event=>{if(event.code==='KeyV'&&!event.repeat&&!walkMenu?.open&&!(event.target as HTMLElement)?.closest('input,select,textarea,[contenteditable="true"]'))setViewMode(nextView(viewMode))});
let walkMenu:ReturnType<typeof createWalkMenu>|null=null;
setViewMode('third');
const input = new InputController(renderer.domElement,()=>!geographyReady||!!walkMenu?.open);
const walker=new AutoWalk(), sound=new Soundscape();let tourContinue=false,tourWait=0;
const updateAtmosphere=naturalSky(scene,sun,(x,z)=>activeTerrain?.relativeHeight(x,z)??0,ANGLES,hemisphere,avatar,camera);
const panel=document.createElement('div');panel.className='living-panel';
panel.innerHTML='<button id="auto-walk" disabled>Promenade automatique</button><button id="sound">Activer le son</button><span id="walk-status" role="status">Chargement des voies OSM…</span>';
root.append(panel);
const autoButton=panel.querySelector<HTMLButtonElement>('#auto-walk')!;
const soundButton=panel.querySelector<HTMLButtonElement>('#sound')!;
const walkStatus=panel.querySelector<HTMLElement>('#walk-status')!;
const volume=document.createElement('input');volume.type='range';volume.min='0';volume.max='100';volume.value='70';volume.setAttribute('aria-label',"Volume de l’ambiance");volume.oninput=()=>sound.setVolume(Number(volume.value)/100);const volumeLabel=document.createElement('label');volumeLabel.className='ambience-volume';volumeLabel.append('Ambiance ',volume,audioCredit);audioCredit.style.cssText='color:inherit;font-size:10px';panel.append(volumeLabel);
autoButton.onclick=()=>{if(walker.active||tourContinue){tourContinue=false;walker.stop()}else{walker.start(routeAt(avatar.position,activeTerrain));tourContinue=walker.active;tourWait=0;if(walker.active)walkMenu?.dialog.close()}};
soundButton.onclick=async()=>{try{const on=await sound.toggle();soundButton.textContent=on?'Désactiver le son':'Activer le son';soundButton.setAttribute('aria-pressed',String(on));}catch{walkStatus.textContent='Son indisponible dans ce navigateur';}};
let worldReady=false;
const navigationPromise=loadNavigation().then(()=>{autoButton.disabled=!worldReady;}).catch(()=>{walkStatus.textContent='Navigation OSM indisponible';});
async function navigationLoaded(){await navigationPromise;}
function prepareWalk(terrain:Terrain){
 if(worldReady)return;
 const access={height:(x:number,z:number)=>terrain.relativeHeight(x,z),clear:canWalk,supported:hasWalkingSupport},started=performance.now();
 const pool=prepareStarts(paths,access);let fallback=false;
 if(!pool.points.length){const p=inspectStart({x:-12.277392682727118,z:-32.416383999943434},access);if(p){pool.points.push(p);pool.sectors.push([p.sector,[p]]);fallback=true}}
 const revision=[terrain.sourceSha256,terrain.relief?.sha256,terrain.singleSurface?.manifest.binarySha256].join(':'),start=chooseStart(pool,spawnSeed,revision);
 if(!start){loading.textContent='Aucun départ praticable disponible. Rechargez pour réessayer.';return}
 avatar.position.set(start.x,start.y,start.z);yaw=start.yaw;avatar.rotation.y=yaw+Math.PI;eyeHeight=start.y+1.65;zoom=viewMode==='aerial'?aerialZoom:viewMode==='third'?thirdZoom:0;smoothZoom=zoom;boomLength=thirdZoom;transitionElapsed=1;
 scene.userData.spawn=Object.freeze({...start,fallback,preparationMs:performance.now()-started,provenance:'Initial selection from admitted OSM paths; actual loaded terrain and 30cm navigation capsule verified. Sector-balanced artistic start, not a surveyed viewpoint.'});
 if(perfPreview)scene.userData.spawnPool=pool;
 worldReady=geographyReady=true;avatar.visible=viewMode!=='first';autoButton.disabled=!hasPreparedGraph();if(!hasPreparedGraph())walker.message='Promenade automatique indisponible · marche libre disponible';loading.hidden=true;
}
addEventListener('blur',()=>walker.stop('Promenade en pause · fenêtre inactive'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)walker.stop('Promenade en pause');});

document.addEventListener('visibilitychange',()=>{void sound.setHidden(document.hidden).catch(()=>{walkStatus.textContent='Reprendre le son avec son bouton';})});
if(import.meta.hot)import.meta.hot.dispose(()=>{lanterns.dispose();villageLife.dispose();traffic.dispose();sensitiveWorld.dispose();landscapeLighting.dispose();disposeWorldMaterials();disposeRiverFlow();updateAtmosphere.dispose();signs.dispose();walkerModel.dispose();input.dispose();void sound.dispose()});
addEventListener('pagehide',event=>{if(!(event as PageTransitionEvent).persisted){lanterns.dispose();villageLife.dispose();traffic.dispose();sensitiveWorld.dispose();landscapeLighting.dispose();disposeWorldMaterials();disposeRiverFlow();updateAtmosphere.dispose();signs.dispose();walkerModel.dispose();input.dispose();void sound.dispose()}});
const acousticAltitude=(x:number,z:number)=>activeTerrain?.sample(x,z)??null;
const audioForward=new THREE.Vector3(),audioUp=new THREE.Vector3(),worldUp=new THREE.Vector3(0,1,0);
const canvas=renderer.domElement;canvas.style.touchAction='none';
const touchCamera=()=>{lastCameraInteraction=performance.now();};
canvas.tabIndex=0;canvas.addEventListener('pointerdown',e=>{if(input.ownsPointer(e.pointerId)||walkMenu?.open)return;touchCamera();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});dragging=true;canvas.setPointerCapture(e.pointerId);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{pointers.delete((e as PointerEvent).pointerId);dragging=pointers.size>0;touchCamera();});
canvas.addEventListener('pointermove',e=>{
 const old=pointers.get(e.pointerId);if(!old||input.ownsPointer(e.pointerId)||walkMenu?.open)return;touchCamera();
 if(pointers.size===2&&viewMode==='third'){
  const other=[...pointers.entries()].find(([id])=>id!==e.pointerId)![1];
  const before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(e.clientX-other.x,e.clientY-other.y);
  if(after>1)zoom=thirdZoom=clampZoom(zoom*before/after);
 }else if(pointers.size===1){yaw-=(e.clientX-old.x)*.005;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-old.y)*.004,viewMode==='third'?-.15:-1.15,1.15);}
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
});
canvas.addEventListener('wheel',e=>{e.preventDefault();touchCamera();if(viewMode==='aerial')zoom=aerialZoom=THREE.MathUtils.clamp(zoom+e.deltaY*.055,22,210);else if(viewMode==='third')zoom=thirdZoom=clampZoom(zoom+e.deltaY*.012);},{passive:false});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
camera.position.set(Math.sin(yaw)*zoom,zoom*.78,Math.cos(yaw)*zoom);
camera.lookAt(0,2,0);
renderer.render(scene,camera);
const qualityButton=document.createElement('details');
qualityButton.className='quiet-control quality-control';
let quality:'low'|'high'='high',qualityAuto=true,qualitySeconds=0,qualityFrames=0;
function applyQuality(level:'low'|'high'){
  configureWorldFiltering(renderer,level==='low');
  quality=level;renderer.setPixelRatio(Math.min(devicePixelRatio,level==='low'?1:1.6));
  renderer.shadowMap.enabled=!tilesPreview&&level==='high';
  setLifeProfile(level==='low'?'eco':'quality');
  const select=qualityButton.querySelector<HTMLSelectElement>('select');if(select)select.value=level==='low'?'eco':'quality';
}
qualityButton.innerHTML='<summary>Paysage vivant · réglages</summary><label>Profil graphique <select aria-label="Profil graphique"><option value="eco">Éco</option><option value="balanced" selected>Équilibré</option><option value="quality">Qualité</option><option value="custom">Personnalisé</option></select></label><div class="life-custom" hidden></div>';
const profileSelect=qualityButton.querySelector<HTMLSelectElement>('select')!,customControls=qualityButton.querySelector<HTMLElement>('.life-custom')!;
const savedLife=readLifePreferences();const customEffects:Record<string,number>={...(savedLife?.custom??{})};
for(const [key,label] of [['vegetation','Vent végétal'],['water','Courant visuel'],['clouds','Nuages'],['shadows','Ombres des nuages'],['birds','Oiseaux'],['events','Événements naturels']]){
 const row=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=customEffects[key]!==0;check.setAttribute('aria-label',label);row.append(check,label);customControls.append(row);
 check.onchange=()=>{customEffects[key]=check.checked?({shadows:.1,birds:6,events:2} as Record<string,number>)[key]??1:0;setLifeProfile('custom',customEffects);saveLifePreferences('custom',customEffects)};
}
profileSelect.onchange=()=>{qualityAuto=false;const name=profileSelect.value as LifeProfileName;applyQuality(name==='eco'?'low':'high');profileSelect.value=name;setLifeProfile(name,customEffects);customControls.hidden=name!=='custom';saveLifePreferences(name,customEffects)};
root.append(qualityButton);applyQuality(savedLife?.name==='eco'?'low':'high');setLifeProfile(savedLife?.name??'balanced',customEffects);profileSelect.value=lifeSettings.name;customControls.hidden=lifeSettings.name!=='custom';qualityAuto=savedLife===null;
walkMenu=createWalkMenu(root,()=>{input.clear();velocity.x=velocity.z=0;walker.stop('Promenade en pause · menu ouvert')});
walkMenu.mount('.menu-weather',document.querySelector<HTMLElement>('.nature-controls')!);document.querySelector<HTMLDetailsElement>('.nature-controls')!.open=true;
walkMenu.mount('.menu-walk',viewLabel);walkMenu.mount('.menu-walk',panel);walkMenu.mount('.menu-sound',soundButton);walkMenu.mount('.menu-sound',volumeLabel);
const runToggle=document.createElement('input');runToggle.type='checkbox';runToggle.setAttribute('aria-label','Course au toucher');runToggle.onchange=()=>{input.touchRunning=runToggle.checked};const runLabel=document.createElement('label');runLabel.className='run-toggle';runLabel.append(runToggle,'Course au toucher');walkMenu.mount('.menu-walk',runLabel);
let cameraComfort=false;try{cameraComfort=localStorage.getItem('endless-earth-camera-comfort')==='true'}catch{}const comfort=document.createElement('input');comfort.type='checkbox';comfort.checked=cameraComfort;comfort.setAttribute('aria-label','Caméra à mouvement réduit');comfort.onchange=()=>{cameraComfort=comfort.checked;try{localStorage.setItem('endless-earth-camera-comfort',String(cameraComfort))}catch{}};const comfortLabel=document.createElement('label');comfortLabel.append(comfort,'Caméra à mouvement réduit');walkMenu.mount('.menu-walk',comfortLabel);
walkMenu.mount('.menu-quality',qualityButton);qualityButton.open=true;
const lifeCredit=document.createElement('p');lifeCredit.textContent='Faune, brume et rares voitures sont des interprétations artistiques. Avions et fumées simulés artistiquement. Cheminées interprétées sur les toitures générées ; aucune observation de trafic ou d’occupation réelle.';walkMenu.mount('.menu-sources',lifeCredit);
walkMenu.mount('.menu-sources',credits);walkMenu.mount('.menu-version',document.querySelector<HTMLElement>('.hud')!);
if(perfPanel){walkMenu.mount('.menu-diagnostics',perfPanel);walkMenu.dialog.querySelector<HTMLElement>('.menu-diagnostics')!.hidden=false;perfPanel.setAttribute('aria-live','off');for(const button of Array.from(document.querySelectorAll<HTMLButtonElement>('.nature-controls button')))walkMenu.mount('.menu-diagnostics',button)}
const clock=new THREE.Clock();
let vegetationLodElapsed=0;
let perfElapsed=0,perfFrames=0;
function architectureStats(){const stats:unknown[]=[];scene.traverse(o=>{if(o.userData.architecture)stats.push(o.userData.architecture)});return stats;}
if(perfPreview)Object.defineProperty(window,'endlessDiagnostics',{get:()=>({villageLife:villageLife.metrics,traffic:traffic.metrics,sensitiveWorld:sensitiveWorld.stats,adaptiveResolution:scene.userData.adaptiveResolution,authentic:worldMaterialStatus(),lighting:scene.userData.landscapeLighting??null,snow:scene.userData.snow??null,decorations:scene.userData.decorationStream?.metrics??null,terrain:activeTerrain?.metrics,nature:natureMemory(scene),climate:scene.userData.climate,earthLife:scene.userData.earthLife,render:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries},architecture:architectureStats(),architectureMemory:architectureMemory(scene),mode:viewMode,ready:geographyReady,navigation:navigationGraphStats,spawn:scene.userData.spawn??null,walker:walkerModel.metrics,movement:lastMovementDiagnostic(),roads:roadInventory,signs:signs.metrics,menuOpen:walkMenu?.open??false,position:avatar.position.toArray(),camera:camera.position.toArray(),zoom,smoothZoom,yaw,routeLength:walker.route?.length,routePoints:walker.route?.points,routeIndex:walker.index,quality,natureAnchors:nature.length,autoWalk:walker.active,walkMessage:walker.message,sound:sound.enabled,soundState:sound.context?.state??'uninitialized',audio:sound.stats(),avatarVisible:avatar.visible})});
function prepareWorldSenses(){if(!activeTerrain||worldSensoryReady)return;const groundHeight=walkingHeight((x:number,z:number)=>activeTerrain!.relativeHeight(x,z));worldSensoryReady=true;const roofs=acousticObstacles(acousticBuildings.map(b=>{const y=groundHeight(b.ring[0].x,b.ring[0].z)??0;return {ring:b.ring,base:y,top:y+b.height}}));scene.userData.weatherFloorAt=(x:number,z:number)=>roofs.roofAt(x,z,-10000);traffic.prepare(acousticRoads,groundHeight,canWalk);villageLife.prepare(exportTourGraph(),acousticRoads,groundHeight,canWalk,scene.userData.lifeHabitat??(()=> 'unknown'));sensitiveWorld.configure(riverAreas.flatMap(a=>a.rings),groundHeight,canWalk,scene.userData.lifeHabitat??(()=> 'unknown'));}
function frame(){requestAnimationFrame(frame);const elapsed=clock.getDelta();const dt=Math.min(elapsed,.25);
const controls=input.getVector();
const displacement=smoothMovement(velocity,movement(yaw,controls.forward,controls.strafe,1,input.running),dt);
const previous=avatar.position.clone();
if(controls.forward||controls.strafe){tourContinue=false;if(walker.active){walker.stop('Contrôle manuel repris');velocity.x=velocity.z=0;}}
if(tourContinue&&!walker.active){if(walker.message.startsWith('Destination atteinte')){if(tourWait===0&&walker.route?.destination)rememberTour(walker.route.destination.id);tourWait+=dt;if(tourWait>=6){walker.start(routeAt(avatar.position,activeTerrain));tourContinue=walker.active;tourWait=0}}else tourContinue=false;}
const autoStep=walker.active;
if(autoStep){
 const delta=walker.update(avatar.position,dt,(p:{x:number;z:number})=>validPoint(p,activeTerrain));
 displacement.x=delta.x;displacement.z=delta.z;velocity.x=velocity.z=0;
 if(Math.hypot(delta.x,delta.z)>.00001){const angle=Math.atan2(-delta.x,-delta.z);if(!dragging&&performance.now()-lastCameraInteraction>3500)yaw=behind(yaw,angle,dt);}
}
if(walkStatus.textContent!==walker.message)walkStatus.textContent=walker.message;const walkLabel=walker.active?'Arrêter la promenade':'Promenade automatique';if(autoButton.textContent!==walkLabel)autoButton.textContent=walkLabel;autoButton.setAttribute('aria-pressed',String(walker.active));

const terrainHeight=(x:number,z:number)=>activeTerrain?activeTerrain.relativeHeight(x,z):0;
const groundHeight=walkingHeight(terrainHeight);
// Wait for the real dataset before allowing walking in geography mode.
traffic.constrain(avatar.position,displacement);
if(geographyReady&&!walkMenu?.open)moveWithCollision(avatar.position,displacement,terrainHeight,!autoStep);
const moved=avatar.position.distanceTo(previous);
if(autoStep&&walker.active&&Math.hypot(avatar.position.x-previous.x-displacement.x,avatar.position.z-previous.z-displacement.z)>.00001)walker.stop('Chemin bloqué · promenade arrêtée');

if(moved>.0001){
  const facing=Math.atan2(avatar.position.x-previous.x,avatar.position.z-previous.z);
  avatar.rotation.y+=Math.atan2(Math.sin(facing-avatar.rotation.y),Math.cos(facing-avatar.rotation.y))*(1-Math.exp(-dt*12));
}
if(activeTerrain){const h=groundHeight(avatar.position.x,avatar.position.z);if(h!==null)avatar.position.y=h;}
const locomotion=walkerModel.update(moved,dt,groundHeight);
smoothZoom=THREE.MathUtils.lerp(smoothZoom,zoom,1-Math.exp(-dt*10));
const desiredEye=avatar.position.y+1.65;
eyeHeight=cameraComfort||eyeHeight===undefined?desiredEye:THREE.MathUtils.lerp(eyeHeight,desiredEye,1-Math.exp(-dt*14));
if(Math.abs(eyeHeight-desiredEye)<.0001)eyeHeight=desiredEye;
// Bound vertical lag on ramps; never let smoothing sink the eyes into the ground.
eyeHeight=THREE.MathUtils.clamp(eyeHeight,desiredEye-.15,desiredEye+.15);
const eye=avatar.position.clone();eye.y=eyeHeight;
const offset=viewMode==='first'?new THREE.Vector3():viewMode==='third'?new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch)*smoothZoom,Math.sin(pitch)*smoothZoom+.5,Math.cos(yaw)*Math.cos(pitch)*smoothZoom):new THREE.Vector3(Math.sin(yaw)*smoothZoom,smoothZoom*.78,Math.cos(yaw)*smoothZoom);
const target=eye.clone().add(offset);
if(viewMode==='third'){
  // Sweep from the eye on every frame; never interpolate across a wall after a turn.
  const allowed=offset.length()*cameraFraction(eye,offset,cameraClear,groundHeight);
  boomLength=allowed<boomLength?allowed:THREE.MathUtils.lerp(boomLength,allowed,1-Math.exp(-dt*5));
  target.copy(eye).addScaledVector(offset,offset.length()>0?boomLength/offset.length():0);
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
if(transitionElapsed<.8){
  transitionElapsed+=dt;
  const weight=transitionWeight(transitionElapsed);
  camera.position.lerpVectors(transitionStart,camera.position.clone(),weight);
  camera.quaternion.slerpQuaternions(transitionRotation,camera.quaternion.clone(),weight);
  // Each interpolated walking viewpoint must also remain in front of obstacles.
  if(viewMode!=='aerial'){
    const boom=camera.position.clone().sub(eye);
    camera.position.copy(eye).addScaledVector(boom,cameraFraction(eye,boom,cameraClear,groundHeight));
  }
}

updateAtmosphere(dt,quality==='low',elapsed);updateForestLife(scene,camera);
signs.update(elapsed,scene.userData.climate,avatar.position,geographyReady);
if(geographyReady)prepareWorldSenses();
villageLife.update(elapsed,scene.userData.climate??{},avatar.position,lifeSettings.name,traffic.metrics.position?{position:{x:traffic.metrics.position[0],y:traffic.metrics.position[1],z:traffic.metrics.position[2]},speed:traffic.metrics.speed}:null);
traffic.update(elapsed,scene.userData.climate??{},avatar.position,lifeSettings.name,villageLife.director.groups.flatMap((g:any)=>g.members.map((m:any)=>m.position)));
sensitiveWorld.update(elapsed,scene.userData.climate??{},avatar.position,camera,lifeSettings.name);
if(activeTerrain)lanterns.update(scene.userData.climate,avatar.position,(x,z)=>activeTerrain!.relativeHeight(x,z),lifeSettings.name);
const motor=traffic.vehicle,mp=traffic.metrics.position;sound.vehicle(motor&&mp?{id:motor.id,position:{x:mp[0],y:mp[1]+.7,z:mp[2]},speed:traffic.metrics.speed,rain:scene.userData.climate?.weather?.rain??0}:null);

camera.getWorldDirection(audioForward);audioUp.copy(worldUp).applyQuaternion(camera.quaternion);sound.listener(camera.position,audioForward,audioUp);
sound.update(avatar.position,moved,scene.userData.earthLife?.wind.speed??.35,yaw,scene.userData.acousticClimate??scene.userData.climate,scene.userData.earthLife,scene.userData.lifeHabitat,lifeSettings.name,acousticAltitude,scene.userData.lifeSoundSources??[],locomotion,signs.audioFlight,activeTerrain?avatar.position.y+(activeTerrain.sample(0,0)??0):null);
sound.village(villageLife.drainAudio());
vegetationLodElapsed+=dt;
if(vegetationLodElapsed>=.25){vegetationLodElapsed=0;updateTerrainLOD(scene,camera.position,avatar.position,quality==='low');updateVegetationLOD(scene,camera,quality==='low');updateArchitectureLOD(scene,camera,quality==='low')}
scene.userData.decorationStream?.tick(quality==='low',elapsed*1000,dt>0?moved/dt:0);
// Resize BEFORE drawing: assigning canvas width/height discards its drawing buffer.
// Resizing after render used to present an uninitialized frame at each adaptive step.
if(geographyReady&&!document.hidden){const scale=adaptiveResolution.update(elapsed*1000,elapsed,lifeSettings.name),ratio=Math.min(devicePixelRatio,quality==='low'?1:1.6)*scale;if(Math.abs(renderer.getPixelRatio()-ratio)>.01){renderer.setPixelRatio(ratio);renderer.setSize(innerWidth,innerHeight);}scene.userData.adaptiveResolution={scale,filteredMs:adaptiveResolution.filtered,changes:adaptiveResolution.changes};}
renderer.render(scene,camera);

if(perfPanel){
  perfElapsed+=elapsed;perfFrames++;
  if(perfElapsed>=1){
    const info=renderer.info;
    perfPanel.textContent=`FPS ≈ ${Math.round(perfFrames/perfElapsed)}\nDraw calls : ${info.render.calls}\nTriangles : ${info.render.triangles.toLocaleString('fr-FR')}\nGéométries : ${info.memory.geometries}\nTextures : ${info.memory.textures}\nRatio pixels : ${renderer.getPixelRatio().toFixed(1)}\nVue : ${viewMode} · terrain prêt : ${geographyReady}\nPosition : ${avatar.position.x.toFixed(2)}, ${avatar.position.y.toFixed(2)}, ${avatar.position.z.toFixed(2)}`;
    perfElapsed=0;perfFrames=0;
  }
}
}frame();
