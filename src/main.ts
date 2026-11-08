import * as THREE from 'three';
import { createDemoWorld } from './world/demo';
import { loadAnglesGeography } from './world/geodata';
import { fetchTerrain, type Terrain } from './world/terrain';
import { ANGLES } from './world/geo';
import { InputController } from './controls/input';
import { moveWithCollision } from './world/collisions';
import { startTilePreview } from './world/tile-preview';
import './style.css';
const root=document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML=`<div class="hud"><strong>ENDLESS EARTH</strong><span>France Alpha · ${ANGLES.name}</span><small>Décor illustratif — géographie réelle à importer</small></div><div class="help">Déplacement : ZQSD / WASD / flèches · Glisser : orienter la caméra · Molette : zoom</div>`;
const scene=new THREE.Scene(); scene.background=new THREE.Color(0xdce8df); scene.fog=new THREE.Fog(0xdce8df,130,410);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,850);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6)); renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace; root.prepend(renderer.domElement);
renderer.domElement.setAttribute('aria-label','Vue 3D du village');
scene.add(new THREE.HemisphereLight(0xffffff,0x738465,2));
const sun=new THREE.DirectionalLight(0xffe5bc,2.3); sun.position.set(-60,100,55); sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-115; sun.shadow.camera.right=115; sun.shadow.camera.top=115; sun.shadow.camera.bottom=-115; scene.add(sun); scene.add(sun.target);
// Render a complete fallback synchronously: network requests must never block first paint.
const demo = new THREE.Group();
createDemoWorld(demo);
scene.add(demo);
let activeTerrain: Terrain | null = null;
const hint = document.querySelector<HTMLElement>('.hud small');
const params = new URLSearchParams(location.search);
const terrainPreview = params.get('terrain') === '1';
const tilesPreview = params.get('tiles') === '1';
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
const avatar=new THREE.Group();
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.65,1.65,5,8),new THREE.MeshStandardMaterial({color:0x715d4f}));body.position.y=2;body.castShadow=true;avatar.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(.52,10,8),new THREE.MeshStandardMaterial({color:0xe4b992}));head.position.y=3.65;head.castShadow=true;avatar.add(head);scene.add(avatar);
let yaw=.65, zoom=45, dragging=false,lastX=0;
const input = new InputController();
renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointerup',()=>dragging=false);
renderer.domElement.addEventListener('pointermove',e=>{if(dragging){yaw+=(e.clientX-lastX)*.005;lastX=e.clientX}});
renderer.domElement.addEventListener('wheel',e=>{zoom=THREE.MathUtils.clamp(zoom+e.deltaY*.035,18,85)},{passive:true});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
camera.position.set(Math.sin(yaw)*zoom,zoom*.78,Math.cos(yaw)*zoom);
camera.lookAt(0,2,0);
renderer.render(scene,camera);
const tilePreview = tilesPreview ? startTilePreview(scene,avatar,status=>{
  if(hint)hint.textContent=status;
  if(status.startsWith('Tuiles réelles'))demo.visible=false;
}) : null;
const clock=new THREE.Clock();
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);
const controls=input.getVector();
const dir=new THREE.Vector3(Math.sin(yaw)*controls.forward+Math.cos(yaw)*controls.strafe,0,Math.cos(yaw)*controls.forward-Math.sin(yaw)*controls.strafe);
if(dir.lengthSq()>0){dir.normalize();moveWithCollision(avatar.position,dir.clone().multiplyScalar(dt*8));avatar.rotation.y=Math.atan2(dir.x,dir.z)}
if(tilePreview)void tilePreview.update();
if(activeTerrain){const h=activeTerrain.relativeHeight(avatar.position.x,avatar.position.z);if(h!==null)avatar.position.y=h;}
const offset=new THREE.Vector3(Math.sin(yaw)*zoom,zoom*.78,Math.cos(yaw)*zoom);
camera.position.lerp(avatar.position.clone().add(offset),.09);camera.lookAt(avatar.position.x,2,avatar.position.z);
sun.position.set(avatar.position.x-60,100,avatar.position.z+55);sun.target.position.copy(avatar.position);sun.target.updateMatrixWorld();renderer.render(scene,camera)}frame();
