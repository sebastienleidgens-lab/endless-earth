// @ts-ignore On-demand metric inspection, hidden from the ordinary interface.
import {inspectGround} from './world/ground-inspection.mjs';
import {createTerrainInspector} from './world/terrain-inspector';
import {createLanterns} from './architecture/lanterns';
// @ts-ignore Shared mapped footprint index for conservative rain shelter.
import {acousticObstacles} from './audio/occlusion.mjs';
import {createTraffic} from './life/traffic';
import {createVillageLife} from './life/village';
import {createSensitiveWorld} from './earthlife/sensitive-world';
import {acousticRoads,acousticBuildings,riverAreas,riverLines,mappedWeirs,restrictedAreas} from './living/geography';
// @ts-ignore Shared read-only interaction support and bounded native effects.
import {createPlayerWorld} from './player/world.mjs';
// @ts-ignore Pure transactional player state owner.
import {PlayerActivity} from './player/activity.mjs';
// @ts-ignore Explicitly estimated, immutable-world gameplay depth.
import {createEstimatedBathymetry} from './player/bathymetry.mjs';
// @ts-ignore Single-instance boat simulation and original procedural rendering.
import {PackraftController} from './player/packraft.mjs';
// @ts-ignore Original procedural asset, no external resources.
import {createPackraft} from './player/packraft-render.mjs';
// @ts-ignore Ground-confirmed limited interactions.
import {createInteractionDecor} from './player/interaction-decor.mjs';
// @ts-ignore Ground-confirmed limited interactions.
import {GroundInteractions} from './player/traversal.mjs';
// @ts-ignore Shared climate appearance.
import {TravelerExposure} from './player/exposure.mjs';
// @ts-ignore Pooled confirmed contact appearance.
import {createGroundMarks} from './player/ground-marks.mjs';
// @ts-ignore Same mapped contact classification as the sound renderer.
import {footContact} from './audio/materials.mjs';
// @ts-ignore Shared mapped road contact index.
import {footRoadIndex} from './audio/geography.mjs';
// @ts-ignore Shared read-only obstacle proximity index.
import {proximityIndex} from './audio/context.mjs';
// @ts-ignore Provenance-gated aquatic movement; estimated gameplay depths stay explicit.
import {AquaticController} from './player/aquatic.mjs';
// @ts-ignore Bounded marks on a verified water surface.
import {createWaterMarks} from './player/water-marks.mjs';
// @ts-ignore Joint/surface contacts shared by the visual and acoustic owners.
import {WaterContacts} from './player/water-contacts.mjs';
// @ts-ignore Original projected impressions and camp props.
import {createFootprints} from './player/footprints.mjs';
// @ts-ignore Original procedural camp, no external model.
import {createCamp} from './player/camp.mjs';
import {createActions} from './ui/actions';
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
import { canWalk as pilotCanWalk, moveWithCollision as pilotMoveWithCollision, walkingHeight as pilotWalkingHeight, cameraClear as pilotCameraClear, hasWalkingSupport as pilotHasWalkingSupport, lastMovementDiagnostic as pilotLastMovementDiagnostic, inspectCollision as pilotInspectCollision, aquaticClear } from './world/collisions';
// @ts-ignore Canonical loaded-water dispatch.
import {combineWater} from './planet/water-dispatch.mjs';
import {createPlanetRuntime} from './planet/runtime';
// @ts-ignore shared deterministic runtime
import { circleHitsPolygon, movement, nextView, cameraFraction, smoothMovement, transitionWeight,moveGrounded } from './controls/walking.mjs';

let planet:ReturnType<typeof createPlanetRuntime>|null=null;
const inPilot=(x:number,z:number)=>Math.abs(x)<=1000&&Math.abs(z)<=1000;
let departmentMovementDiagnostic:any=null;
function lastMovementDiagnostic(){return departmentMovementDiagnostic??pilotLastMovementDiagnostic();}
function canWalk(x:number,z:number,camera=false):boolean{return inPilot(x,z)?pilotCanWalk(x,z,camera)&&(camera||!planet?.ready||planet.canWalk(x,z)):camera?planet?.height(x,z)!==null&&!!planet?.ready:!!planet?.canWalk(x,z);}
const cameraClear=(x:number,z:number)=>inPilot(x,z)?pilotCameraClear(x,z):!!planet?.ready&&planet.height(x,z)!==null;
const hasWalkingSupport=(x:number,z:number)=>inPilot(x,z)&&pilotHasWalkingSupport(x,z);
function walkingHeight(height:(x:number,z:number)=>number|null){const pilot=pilotWalkingHeight(height);return (x:number,z:number)=>inPilot(x,z)?pilot(x,z):planet?.height(x,z)??null;}
function inspectCollision(x:number,z:number){if(inPilot(x,z))return pilotInspectCollision(x,z);const a=planet?.admission(x,z),obstruction=planet?.walkingObstruction(x,z);return {surface:'planet-terrain',obstacle:obstruction?.reason??null,access:{clear:!obstruction,support:null,slope:.7,reasons:[]},building:null,collider:null};}
function moveWithCollision(position:THREE.Vector3,displacement:{x:number;z:number},height:(x:number,z:number)=>number|null,slide=true,seconds=0){departmentMovementDiagnostic=null;if(inPilot(position.x,position.z)&&inPilot(position.x+displacement.x,position.z+displacement.z)){if(planet?.car.placed&&!planet.canWalk(position.x+displacement.x,position.z+displacement.z))return;pilotMoveWithCollision(position,displacement,height,slide,seconds);return;}moveGrounded(position,displacement,canWalk,walkingHeight(height),()=>.7,slide,(failure:any)=>{departmentMovementDiagnostic??={...failure,obstruction:planet?.walkingObstruction(failure.requested.x,failure.requested.z),gps:planet?.geo(failure.requested),admission:planet?.admission(failure.requested.x,failure.requested.z)};});}

// @ts-ignore Source-bound immutable pilot navigation cache.
import {loadPreparedWater} from './player/prepared-water.mjs';
import {floatingRenderOrigin} from './planet/render-origin';
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
let pilotWorld:THREE.Group|null=null;
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
  pilotWorld=realWorld;
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
      const surfaceAssets=terrain?.singleSurface?.manifest.groundTruth?'angles-ground-truth':terrain?.singleSurface?.manifest.walkCorrection?'angles-walk':'angles';
      void landscapeLighting.install(realWorld,terrain,{manifestUrl:import.meta.env.BASE_URL+'data/'+surfaceAssets+'-lighting.json',packUrl:import.meta.env.BASE_URL+'data/'+surfaceAssets+'-lighting.pack'});
      if(terrain?.singleSurface&&realWorld.userData.decorationManifest)scene.userData.snowExposureSource={manifestUrl:import.meta.env.BASE_URL+'data/'+surfaceAssets+'-snow-exposure.json',packUrl:import.meta.env.BASE_URL+'data/'+surfaceAssets+'-snow-exposure.pack',bindings:{terrain:terrain.sourceSha256,refinement:terrain.relief?.sha256,surface:terrain.singleSurface.manifest.binarySha256,landmarks:terrain.singleSurface.manifest.landmarksSha256,static:realWorld.userData.decorationManifest.static.sha256}};
      scene.userData.decorationStream=realWorld.userData.decorationStream;
      scene.userData.lifeHabitat=(x:number,z:number)=>inPilot(x,z)?realWorld.userData.lifeHabitat?.(x,z)??'unknown':planet?.habitat(x,z)??'unknown';
      scene.userData.lifeCeiling=new THREE.Box3().setFromObject(realWorld).max.y+12;
      await navigationLoaded();
      signs.install(realWorld,acousticBuildings);
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
const activity=new PlayerActivity(),aquatic=new AquaticController(activity),waterMarks=createWaterMarks(scene),waterContacts=new WaterContacts(),footprints=createFootprints(scene),camp=createCamp(scene,()=>walkerModel.packGeometry());const boat=new PackraftController(activity),boatRender=createPackraft(scene,()=>walkerModel.packGeometry()),groundActions=new GroundInteractions(activity),exposure=new TravelerExposure(),groundMarks=createGroundMarks(scene);let footIndex:any=null,waterObstacles:any=null;let interactionDecor:any=null;let playerWorld:any=null,campValidationAge=0,contextAge=1,actionContext:any={};

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
const input = new InputController(renderer.domElement,()=>!geographyReady||!!walkMenu?.open||activity.locked);
planet=createPlanetRuntime({scene,root,player:avatar,activity,origin:ANGLES,manifestUrl:import.meta.env.BASE_URL+'planet/fr-86/manifest.json',verticalDatum:'IGN69',pilotBounds:[-1000,-1000,1000,1000],heightBase:()=>activeTerrain?.sample(0,0)??0,pilotHeight:(x,z)=>activeTerrain?pilotWalkingHeight((a,b)=>activeTerrain!.relativeHeight(a,b))(x,z):null,pilotSupport:(x,z)=>activeTerrain?.supportAt(x,z),pilotClear:pilotCanWalk,pilotSurfaceSHA:()=>activeTerrain?.singleSurface?.manifest.binarySha256,clearInput:()=>{input.clear();walker.stop('Promenade en pause · voiture');tourContinue=false;},climate:()=>scene.userData.climate,journey:{
 capture(toGeo:any){const encode=(layout:any)=>layout?{...layout,...Object.fromEntries(['origin','tent','fire','bag'].map(k=>[k,toGeo(layout[k])])),pegs:layout.pegs.map(toGeo)}:null;return {profile:lifeSettings.name,boat:{visible:boat.visible,heading:boat.heading,stroke:boat.stroke,following:boat.following},camp:encode(activity.camp),exposure:{wetness:exposure.wetness},camera:{yaw,pitch,zoom,view:viewMode}};},
 async validate(saved:any,p:any,fromGeo:any){const provider=scene.userData.aquaticProvider?.at(p.x,p.z),started=performance.now();if(['boating','swimming','wading'].includes(saved.activity)){while(provider&&!provider.network.metrics.ready&&performance.now()-started<60000)await new Promise(r=>setTimeout(r,100));}if(saved.activity==='boating')return {ok:!!provider?.network?.metrics.ready&&boat.clearAt(provider,playerWaterClear,p.x,p.z,saved.extensions?.boat?.heading??saved.heading)&&provider.returnRouteVerified(p.x,p.z)};if(['swimming','wading'].includes(saved.activity))return {ok:!!provider?.sample(p.x,p.z)?.reliable&&provider.returnRouteVerified(p.x,p.z)&&playerWaterClear(p.x,p.z)};if(saved.activity==='camping'){const origin=saved.extensions?.camp?.origin;return origin?playerWorld?.camp(fromGeo(origin),saved.extensions.camp.heading):{ok:false};}return {ok:false};},
 restore(saved:any,p:any,fromGeo:any){
  boat.reset();camp.clear();aquatic.provider=null;const e=saved.extensions??{},provider=scene.userData.aquaticProvider;
  if(e.profile&&['eco','balanced','quality'].includes(e.profile)){applyQuality(e.profile==='eco'?'low':'high');setLifeProfile(e.profile);}
  if(saved.climate?.date)dispatchEvent(new CustomEvent('nature-test-date',{detail:saved.climate.date}));
  if(saved.climate?.weather){const select=document.querySelector<HTMLSelectElement>('select[aria-label="Météo simulée"]');if(select){select.value=saved.climate.weather;select.dispatchEvent(new Event('change'));}}
  if(saved.activity==='boating'){activity.state='boating';const level=provider.sample(p.x,p.z).surfaceY;avatar.position.set(p.x,level+.1,p.z);boat.position={x:p.x,y:level,z:p.z};boat.heading=e.boat?.heading??saved.heading;boat.stroke=e.boat?.stroke??0;boat.visible=true;boat.scale=boat.pose=1;boat.provider=provider;if(e.boat?.following)boat.toggleFollow(provider);}
  else if(saved.activity==='camping'){const check=playerWorld.camp(fromGeo(e.camp.origin),e.camp.heading);if(check.ok){activity.state='camping';activity.camp=check.layout;camp.install(check.layout,(x:number,z:number)=>playerWorld.query(x,z));}}
  else if(['swimming','wading'].includes(saved.activity)){activity.state=saved.activity;aquatic.provider=provider;aquatic.last=provider.sample(p.x,p.z);avatar.position.set(p.x,p.y,p.z);}
  if(e.camera&&['first','third','aerial'].includes(e.camera.view)&&[e.camera.yaw,e.camera.pitch,e.camera.zoom].every(Number.isFinite)){setViewMode(e.camera.view);yaw=e.camera.yaw;pitch=THREE.MathUtils.clamp(e.camera.pitch,-1.1,1.3);zoom=smoothZoom=e.camera.view==='first'?0:e.camera.view==='aerial'?aerialZoom=THREE.MathUtils.clamp(e.camera.zoom,22,210):thirdZoom=clampZoom(e.camera.zoom);}
  if(Number.isFinite(e.exposure?.wetness))exposure.wetness=e.exposure.wetness;velocity.x=velocity.z=0;
 }
}});
scene.userData.planet=planet;
const floatingWorld=floatingRenderOrigin(renderer,scene,camera,()=>avatar.position);
if(perfPreview)Object.defineProperty(window,'endlessPlanetDiagnostics',{get:()=>({metrics:planet?.metrics,ready:planet?.ready,region:planet?.region?.id,position:planet?.geo(avatar.position),car:planet?.car,mapOpen:planet?.mapOpen})});
const walker=new AutoWalk(), sound=new Soundscape(sensorySeed);let tourContinue=false,tourWait=0;
const actions=createActions(root,()=>{if(!playerWorld||!geographyReady)return;const result=activity.toggleCamp(()=>playerWorld.camp(avatar.position,avatar.rotation.y));if(result.ok){activity.message='';input.clear();velocity.x=velocity.z=0;tourContinue=false;walker.stop('Promenade en pause · campement');}},{boat:()=>playerAction('boat'),seat:()=>playerAction('seat'),jump:()=>playerAction('jump'),recover:()=>{boat.stopFollow();boat.recovery=!boat.recovery;},follow:()=>{boat.toggleFollow(scene.userData.aquaticProvider);}});
function playerWaterClear(x:number,z:number){return (inPilot(x,z)?aquaticClear(x,z):!!planet?.waterClear(x,z))&&!restrictedAreas.some(r=>circleHitsPolygon(x,z,r,.6))&&!waterObstacles?.query({x,z},1.1).point;}
function playerAction(kind:string){if(!playerWorld||!geographyReady||walkMenu?.open)return;const provider=scene.userData.aquaticProvider;const result=kind==='boat'?(boat.active?boat.dock(avatar.position,provider,playerWaterClear):boat.launch(avatar.position,avatar.rotation.y,provider,playerWaterClear)):kind==='seat'?groundActions.toggleSeat(avatar.position,playerWorld):groundActions.requestJump(avatar.position,avatar.rotation.y,playerWorld);if(result.ok){activity.message='';input.clear();velocity.x=velocity.z=0;tourContinue=false;walker.stop('Promenade en pause');}else activity.message=result.reason;contextAge=1;}
const updateAtmosphere=naturalSky(scene,sun,(x,z)=>inPilot(x,z)?activeTerrain?.relativeHeight(x,z)??0:planet?.height(x,z)??0,ANGLES,hemisphere,avatar,camera);
const panel=document.createElement('div');panel.className='living-panel';
panel.innerHTML='<button id="auto-walk" disabled>Promenade automatique</button><button id="sound">Activer le son</button><span id="walk-status" role="status">Chargement des voies OSM…</span>';
root.append(panel);
const autoButton=panel.querySelector<HTMLButtonElement>('#auto-walk')!;
const soundButton=panel.querySelector<HTMLButtonElement>('#sound')!;
const walkStatus=panel.querySelector<HTMLElement>('#walk-status')!;
const volume=document.createElement('input');volume.type='range';volume.min='0';volume.max='100';volume.value='70';volume.setAttribute('aria-label',"Volume de l’ambiance");volume.oninput=()=>sound.setVolume(Number(volume.value)/100);const volumeLabel=document.createElement('label');volumeLabel.className='ambience-volume';volumeLabel.append('Ambiance ',volume,audioCredit);audioCredit.style.cssText='color:inherit;font-size:10px';panel.append(volumeLabel);
autoButton.onclick=()=>{if(!['walking','running'].includes(activity.state))return;if(walker.active||tourContinue){tourContinue=false;walker.stop()}else{walker.start(routeAt(avatar.position,activeTerrain));tourContinue=walker.active;tourWait=0;if(walker.active)walkMenu?.dialog.close()}};
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
let playerDisposed=false;function disposePlayer(){if(playerDisposed)return;playerDisposed=true;planet?.dispose();scene.userData.aquaticProvider?.dispose();interactionDecor?.dispose();playerWorld?.interactions?.clear();activity.reset();boat.reset();boatRender.dispose();groundMarks.dispose();waterMarks.dispose();footprints.dispose();camp.dispose();actions.dispose();}
if(import.meta.hot)import.meta.hot.dispose(()=>{disposePlayer();lanterns.dispose();villageLife.dispose();traffic.dispose();sensitiveWorld.dispose();landscapeLighting.dispose();disposeWorldMaterials();disposeRiverFlow();updateAtmosphere.dispose();signs.dispose();walkerModel.dispose();input.dispose();void sound.dispose()});
addEventListener('pagehide',event=>{if(!(event as PageTransitionEvent).persisted){disposePlayer();lanterns.dispose();villageLife.dispose();traffic.dispose();sensitiveWorld.dispose();landscapeLighting.dispose();disposeWorldMaterials();disposeRiverFlow();updateAtmosphere.dispose();signs.dispose();walkerModel.dispose();input.dispose();void sound.dispose()}});
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
const lifeCredit=document.createElement('p');lifeCredit.textContent='Banc, roche et tronc interactifs : décors artistiques originaux, sans attestation géographique. Faune, brume et rares voitures sont des interprétations artistiques. Avions et fumées simulés artistiquement. Cheminées interprétées sur les toitures générées ; aucune observation de trafic ou d’occupation réelle.';walkMenu.mount('.menu-sources',lifeCredit);
walkMenu.mount('.menu-sources',credits);walkMenu.mount('.menu-version',document.querySelector<HTMLElement>('.hud')!);
if(perfPanel){walkMenu.mount('.menu-diagnostics',perfPanel);walkMenu.dialog.querySelector<HTMLElement>('.menu-diagnostics')!.hidden=false;perfPanel.setAttribute('aria-live','off');for(const button of Array.from(document.querySelectorAll<HTMLButtonElement>('.nature-controls button')))walkMenu.mount('.menu-diagnostics',button)}
const terrainInspector=perfPreview?createTerrainInspector(scene,camera,renderer.domElement,walkMenu.dialog.querySelector<HTMLElement>('.menu-diagnostics')!,()=>activeTerrain,(x,z)=>activeTerrain?inspectGround(scene,x,z,walkingHeight((x:number,z:number)=>activeTerrain!.relativeHeight(x,z)),inspectCollision,activeTerrain):null,lastMovementDiagnostic):null;
if(import.meta.hot)import.meta.hot.dispose(()=>terrainInspector?.dispose());
const clock=new THREE.Clock();
if(perfPreview)Object.defineProperty(window,'endlessPlayerDiagnostics',{get:()=>({state:activity.state,aquatic:{active:aquatic.active,reason:aquatic.reason,history:aquatic.history,provider:!!scene.userData.aquaticProvider},message:activity.message,fade:activity.fade,history:activity.history,boat:{active:boat.active,visible:boat.visible,scale:boat.scale,speed:boat.speed,stroke:boat.stroke,cycles:boat.cycles,reason:boat.reason,recovery:boat.recovery,render:boatRender.metrics},depth:scene.userData.aquaticProvider?.metrics,accesses:scene.userData.aquaticProvider?.accesses,exposure:{...exposure},groundMarks:groundMarks.metrics,camp:camp.metrics,footprints:footprints.metrics,query:(x:number,z:number)=>playerWorld?.query(x,z),campAt:(x:number,z:number,heading=0)=>playerWorld?.camp({x,z},heading)})});
let vegetationLodElapsed=0;
let perfElapsed=0,perfFrames=0;
function architectureStats(){const stats:unknown[]=[];scene.traverse(o=>{if(o.userData.architecture)stats.push(o.userData.architecture)});return stats;}
if(perfPreview)Object.defineProperty(window,'endlessDiagnostics',{get:()=>({inspectGround:(x:number,z:number)=>activeTerrain?inspectGround(scene,x,z,walkingHeight((x:number,z:number)=>activeTerrain!.relativeHeight(x,z)),inspectCollision,activeTerrain):null,publicRest:scene.userData.publicRestAudit,villageLife:villageLife.metrics,traffic:traffic.metrics,sensitiveWorld:sensitiveWorld.stats,adaptiveResolution:scene.userData.adaptiveResolution,authentic:worldMaterialStatus(),lighting:scene.userData.landscapeLighting??null,snow:scene.userData.snow??null,decorations:scene.userData.decorationStream?.metrics??null,terrain:activeTerrain?.metrics,nature:natureMemory(scene),climate:scene.userData.climate,earthLife:scene.userData.earthLife,render:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries},architecture:architectureStats(),architectureMemory:architectureMemory(scene),mode:viewMode,ready:geographyReady,navigation:navigationGraphStats,spawn:scene.userData.spawn??null,walker:walkerModel.metrics,movement:lastMovementDiagnostic(),roads:roadInventory,signs:signs.metrics,menuOpen:walkMenu?.open??false,position:avatar.position.toArray(),camera:camera.position.toArray(),zoom,smoothZoom,yaw,routeLength:walker.route?.length,routePoints:walker.route?.points,routeIndex:walker.index,quality,natureAnchors:nature.length,autoWalk:walker.active,walkMessage:walker.message,sound:sound.enabled,soundState:sound.context?.state??'uninitialized',audio:sound.stats(),avatarVisible:avatar.visible})});
function prepareWorldSenses(){if(!activeTerrain||worldSensoryReady)return;const groundHeight=walkingHeight((x:number,z:number)=>activeTerrain!.relativeHeight(x,z));worldSensoryReady=true;const roofs=acousticObstacles(acousticBuildings.map(b=>{const y=groundHeight(b.ring[0].x,b.ring[0].z)??0;return {ring:b.ring,base:y,top:y+b.height}}));scene.userData.weatherFloorAt=(x:number,z:number)=>roofs.roofAt(x,z,-10000);traffic.prepare(acousticRoads,groundHeight,canWalk);villageLife.prepare(exportTourGraph(),acousticRoads,groundHeight,canWalk,scene.userData.lifeHabitat??(()=> 'unknown'));sensitiveWorld.configure(riverAreas.flatMap(a=>a.rings),groundHeight,canWalk,scene.userData.lifeHabitat??(()=> 'unknown'));
 const foliageAnchors:any[]=[];scene.traverse(o=>{if(o.userData.forest)for(const t of o.userData.forest.items){const b=t.model.tree.branches.find((b:any)=>b.order===1);if(b){const p=b.points.at(-1).clone().applyMatrix4(t.worldMatrix);foliageAnchors.push({id:t.id,x:p.x,y:p.y,z:p.z});}}});sound.foliage(foliageAnchors);
 const trees:any[]=[];scene.traverse(o=>{if(o.userData.forest)trees.push(...o.userData.forest.items.map((t:any)=>({x:t.anchor[0],z:t.anchor[1]})))});
 playerWorld=createPlayerWorld({support:(x:number,z:number)=>!inPilot(x,z)?(()=>{const a=planet?.admission(x,z);return a?.ok?{id:a.tile,height:a.height,category:a.road?'road':'terrain',visible:true,walkable:true,normal:a.normal,slope:a.slope,provenance:a.provenance}:null;})():hasWalkingSupport(x,z)?{id:'verified-deck',height:groundHeight(x,z),category:'bridge',visible:true,walkable:true,normal:{x:0,y:1,z:0},slope:0}:activeTerrain!.supportAt(x,z),clear:canWalk,collision:inspectCollision,roads:acousticRoads,banks:riverAreas.flatMap(a=>a.rings.map(r=>[...r,r[0]])),trees,restricted:restrictedAreas});
 const pilotCamp=playerWorld.camp;playerWorld.camp=(p:any,heading:number)=>inPilot(p.x,p.z)?pilotCamp(p,heading):{ok:false,reason:'road'};
 interactionDecor=createInteractionDecor(scene,playerWorld);playerWorld.clearPose=interactionDecor.clearPose;
 footIndex=footRoadIndex(acousticRoads);waterObstacles=proximityIndex(mappedWeirs);
 scene.userData.aquaticProvider=combineWater(createEstimatedBathymetry({prepared:loadPreparedWater(new URL(import.meta.env.BASE_URL+'planet/fr-86/navigation/',location.origin),activeTerrain!.singleSurface?.manifest.binarySha256),incremental:true,origin:avatar.position,areas:riverAreas,lines:riverLines,support:(x:number,z:number)=>activeTerrain!.supportAt(x,z),landClear:canWalk,clear:playerWaterClear}),()=>planet?.water,()=>avatar.position);
 scene.userData.playerInteractions={query:(x:number,z:number)=>playerWorld.query(x,z),camp:(x:number,z:number,heading=0)=>playerWorld.camp({x,z},heading),activity,campMetrics:camp.metrics,footprints:footprints.metrics};
}
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
const carHandled=planet?.update(dt,avatar,camera,controls,geographyReady,!!walkMenu?.open,lifeSettings.name)??false;
if(pilotWorld)pilotWorld.visible=Math.hypot(Math.max(0,Math.abs(avatar.position.x)-1000),Math.max(0,Math.abs(avatar.position.z)-1000))<1800;
const boatHandled=!carHandled&&geographyReady&&!walkMenu?.open&&boat.update(dt,avatar.position,controls,scene.userData.aquaticProvider,playerWaterClear);
const groundHandled=geographyReady&&!walkMenu?.open&&!boatHandled&&!carHandled&&groundActions.update(dt,avatar.position,playerWorld);
if(geographyReady&&!walkMenu?.open&&!activity.locked&&!boatHandled&&!groundHandled&&!carHandled){
 const water=aquatic.move(avatar.position,displacement,dt,{provider:scene.userData.aquaticProvider,clear:playerWaterClear,auto:autoStep,landHeight:groundHeight,landClear:canWalk});
 if(!water.handled){if(interactionDecor&&!interactionDecor.walkingClear({x:avatar.position.x+displacement.x,y:avatar.position.y,z:avatar.position.z+displacement.z})){displacement.x=displacement.z=0;}moveWithCollision(avatar.position,displacement,terrainHeight,!autoStep,dt);if(Math.hypot(displacement.x,displacement.z)>.001&&['mapped-water','rendered-water'].includes(String(lastMovementDiagnostic()?.obstacle)))activity.message='unknown-depth';}
}
const moved=avatar.position.distanceTo(previous);
if(!carHandled&&!boatHandled&&!groundHandled&&lastMovementDiagnostic()?.obstruction?.reason==='tile-loading'&&(controls.forward||controls.strafe))activity.message='terrain-loading';else if(activity.message==='terrain-loading'&&moved>.0001)activity.message='';
if(autoStep&&walker.active&&Math.hypot(avatar.position.x-previous.x-displacement.x,avatar.position.z-previous.z-displacement.z)>.00001)walker.stop('Chemin bloqué · promenade arrêtée');

if(carHandled){avatar.rotation.y=planet!.car.heading;if(!dragging&&performance.now()-lastCameraInteraction>3500)yaw=behind(yaw,planet!.car.heading+Math.PI,dt);}else if(groundHandled&&groundActions.sit>0&&groundActions.seat?.kind!=='ground'){avatar.rotation.y=groundActions.heading??avatar.rotation.y;}else if(boatHandled){avatar.rotation.y=boat.heading;}else if(moved>.0001){
  const facing=Math.atan2(avatar.position.x-previous.x,avatar.position.z-previous.z);
  avatar.rotation.y+=Math.atan2(Math.sin(facing-avatar.rotation.y),Math.cos(facing-avatar.rotation.y))*(1-Math.exp(-dt*12));
}
if(activeTerrain&&!aquatic.active&&!boatHandled&&!groundHandled&&!carHandled){const h=groundHeight(avatar.position.x,avatar.position.z);if(h!==null)avatar.position.y=h;}
campValidationAge+=elapsed;
activity.update(dt,(site:any)=>{if(!playerWorld||!site)return {ok:false,reason:'unknown-support'};if(activity.state==='camping'&&campValidationAge<1)return {ok:true};campValidationAge=0;return playerWorld.camp(site.origin,site.heading)},(state:string,site:any)=>{if(state==='camping')camp.install(site,playerWorld.query);else camp.clear();});
activity.grounded(dt>0?moved/dt:0);
exposure.update(dt,scene.userData.climate,aquatic.active);boatRender.update(boat,scene.userData.climate?.elapsedSeconds??0);
const locomotion=walkerModel.update(Math.hypot(avatar.position.x-previous.x,avatar.position.z-previous.z),dt,aquatic.active?(x:number,z:number)=>aquatic.provider?.sample(x,z)?.bedY??null:groundHeight,{kind:carHandled?'sitting':camp.metrics.active?'camping':boatHandled?'boating':groundActions.sit>0?'sitting':activity.state==='swimming'?'swimming':activity.state==='jumping'?'jumping':'walking',sit:carHandled?1:groundActions.sit,seatHeight:carHandled?.28:groundActions.seatHeight??0,stepOver:activity.kind==='step-over',stepPhase:groundActions.flight?groundActions.flight.time/groundActions.flight.duration:1,boatPose:boat.pose??0,stroke:boat.stroke,jump:groundActions.jump,wetness:exposure.wetness,profile:lifeSettings.name,cameraDistance:zoom,handTargets:boatRender.hands});
waterMarks.update(scene.userData.climate,avatar.position,locomotion,aquatic,lifeSettings.name);
const contacts=waterContacts.update(activity.state,avatar.position,walkerModel.waterContacts,boat.active?boatRender.tip:null,scene.userData.aquaticProvider,locomotion.footContacts,boat);
for(const contact of contacts)waterMarks.emit(contact.position,scene.userData.climate?.elapsedSeconds??0,lifeSettings.name,contact);
sound.water(contacts);
if(aquatic.active)locomotion.footContacts=[];
contextAge+=dt;if(playerWorld&&contextAge>=.3){contextAge=0;const provider=scene.userData.aquaticProvider;actionContext={bank:boat.site(avatar.position,provider,playerWaterClear),dock:boat.active&&provider?.accesses.some((a:any)=>Math.hypot(a.water.x-avatar.position.x,a.water.z-avatar.position.z)<3),seat:['walking','running'].includes(activity.state)?groundActions.seatAt(avatar.position,playerWorld):groundActions.seat,stepOver:['walking','running'].includes(activity.state)&&playerWorld.interactions.stepOver(avatar.position,avatar.rotation.y,playerWorld)?.ok};}
actionContext.canFollow=boat.active&&!!scene.userData.aquaticProvider?.network?.metrics.ready;actionContext.following=boat.following;
actions.update(activity,geographyReady,!!walkMenu?.open,actionContext);
smoothZoom=THREE.MathUtils.lerp(smoothZoom,zoom,1-Math.exp(-dt*10));
const desiredEye=avatar.position.y+(carHandled?1.12:camp.metrics.active?.95:activity.state==='swimming'?1.5:boatHandled?1.65-(boat.pose??0)*.6:groundActions.sit>0?1.65-groundActions.sit*.68:1.65);
eyeHeight=cameraComfort||eyeHeight===undefined?desiredEye:THREE.MathUtils.lerp(eyeHeight,desiredEye,1-Math.exp(-dt*14));
if(Math.abs(eyeHeight-desiredEye)<.0001)eyeHeight=desiredEye;
// Bound vertical lag on ramps; never let smoothing sink the eyes into the ground.
eyeHeight=THREE.MathUtils.clamp(eyeHeight,desiredEye-.15,desiredEye+.15);
const eye=avatar.position.clone();eye.y=eyeHeight;
const offset=viewMode==='first'?new THREE.Vector3():viewMode==='third'?new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch)*smoothZoom,Math.sin(pitch)*smoothZoom+.5,Math.cos(yaw)*Math.cos(pitch)*smoothZoom):new THREE.Vector3(Math.sin(yaw)*smoothZoom,smoothZoom*.78,Math.cos(yaw)*smoothZoom);
const target=eye.clone().add(offset);
if(viewMode==='third'){
  // Sweep from the eye on every frame; never interpolate across a wall after a turn.
  const allowed=offset.length()*cameraFraction(eye,offset,(x:number,z:number)=>{const t=((x-eye.x)*offset.x+(z-eye.z)*offset.z)/(offset.x**2+offset.z**2||1);return cameraClear(x,z)&&camp.cameraClear(x,z)&&(!interactionDecor||interactionDecor.cameraClear(x,eye.y+offset.y*t,z));},groundHeight);
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
    camera.position.copy(eye).addScaledVector(boom,cameraFraction(eye,boom,(x:number,z:number)=>{const t=((x-eye.x)*offset.x+(z-eye.z)*offset.z)/(offset.x**2+offset.z**2||1);return cameraClear(x,z)&&camp.cameraClear(x,z)&&(!interactionDecor||interactionDecor.cameraClear(x,eye.y+offset.y*t,z));},groundHeight));
  }
}

updateAtmosphere(dt,quality==='low',elapsed);updateForestLife(scene,camera);
// The source-bound pilot keeps its established lighting path. New tiles use
// the same sun and wind; snap its local shadow plane to world texels.
if(!inPilot(avatar.position.x,avatar.position.z)){
 renderer.shadowMap.enabled=lifeSettings.name!=='eco';const size=lifeSettings.name==='quality'?1536:1024;
 if(sun.shadow.mapSize.x!==size){sun.shadow.map?.dispose();sun.shadow.map=null;sun.shadow.mapSize.set(size,size);}
 const sc=sun.shadow.camera;sc.position.copy(sun.position);sc.lookAt(sun.target.position);sc.updateMatrixWorld(true);sc.updateProjectionMatrix();const extent=(sc.right-sc.left)/2,texel=extent*2/size,plane=avatar.position.clone().applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(sc.quaternion).invert());sc.projectionMatrix.elements[12]-=(Math.round(plane.x/texel)*texel-plane.x)/extent;sc.projectionMatrix.elements[13]-=(Math.round(plane.y/texel)*texel-plane.y)/extent;
}else renderer.shadowMap.enabled=!tilesPreview&&quality==='high';
signs.update(elapsed,scene.userData.climate,avatar.position,geographyReady);
if(geographyReady)prepareWorldSenses();
if(playerWorld)footprints.update(elapsed,avatar.position,scene.userData.climate,locomotion.footContacts,playerWorld,lifeSettings.name,['walking','running'].includes(activity.state));
if(playerWorld)groundMarks.update(dt,locomotion.footContacts,playerWorld,(p:any)=>{const road=footIndex?.query(p,8),onRoad=!!road?.point&&road.distance<=(road.width??5.5)/2;return footContact({surface:onRoad?road.surface:null,onRoad,habitat:scene.userData.lifeHabitat?.(p.x,p.z)??'unknown',season:scene.userData.climate?.season,wetness:scene.userData.climate?.groundWetness??0,snow:scene.userData.climate?.groundSnowAt?.(p)}).material;},lifeSettings.name);
camp.update(scene.userData.climate,lifeSettings.name);
sound.camp(camp.metrics.active?activity.camp?.fire??null:null);
villageLife.update(elapsed,scene.userData.climate??{},avatar.position,lifeSettings.name,traffic.metrics.position?{position:{x:traffic.metrics.position[0],y:traffic.metrics.position[1],z:traffic.metrics.position[2]},speed:traffic.metrics.speed}:null);
traffic.update(elapsed,scene.userData.climate??{},avatar.position,lifeSettings.name,villageLife.director.groups.flatMap((g:any)=>g.members.map((m:any)=>m.position)));
sensitiveWorld.update(elapsed,scene.userData.climate??{},avatar.position,camera,lifeSettings.name);
if(activeTerrain)lanterns.update(scene.userData.climate,avatar.position,(x,z)=>activeTerrain!.relativeHeight(x,z),lifeSettings.name);
const motor=traffic.vehicle,mp=traffic.metrics.position,driven=planet?.car;sound.vehicle(driven?.active?{id:'player-travel-car',position:{x:driven.position.x,y:driven.position.y+.7,z:driven.position.z},speed:Math.abs(driven.speed),rain:scene.userData.climate?.weather?.rain??0}:planet?.nearbyVehicle??(motor&&mp?{id:motor.id,position:{x:mp[0],y:mp[1]+.7,z:mp[2]},speed:traffic.metrics.speed,rain:scene.userData.climate?.weather?.rain??0}:null));

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
