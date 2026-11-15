import * as THREE from 'three';
// @ts-ignore Generic provider implementation.
import {createProjection,legacyAdapter} from '../planet/coordinates.mjs';
// @ts-ignore Generic streaming implementation.
import {WorldTileManager,tileLoader} from '../planet/tile-manager.mjs';
// @ts-ignore Generic physical provider.
import {PlanetSurface} from '../planet/surface.mjs';
import {createPlanetRenderer} from '../planet/render';
const scene=new THREE.Scene();scene.background=new THREE.Color(0xdce8df);const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);document.body.append(renderer.domElement);const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,1,20000);camera.position.set(4100,4600,3600);camera.lookAt(2000,0,-2000);scene.add(new THREE.HemisphereLight(0xffffff,0x6d7e60,2));const sun=new THREE.DirectionalLight(0xfff2d5,2);sun.position.set(100,400,100);scene.add(sun);
const url=new URL(import.meta.env.BASE_URL+'planet/validation-other-frame/manifest.json',location.origin),manifest=await(await fetch(url)).json(),projection=createProjection(manifest.projection),legacy=legacyAdapter(manifest.projection.origin),surface=new PlanetSurface(manifest),view=createPlanetRenderer(scene,(x,y)=>legacy.fromGeo(projection.unproject({x,y})),()=>100,surface,[1e20,1e20,1e20,1e20]);
const manager=new WorldTileManager(manifest,{load:tileLoader(url),capacity:4,onLoad(tile:any){surface.add(tile);view.add(tile);},onUnload(tile:any){view.remove(tile);surface.remove(tile);}});manager.demand(manifest.tiles.map((t:any)=>({id:t.id,priority:0})));
function frame(){requestAnimationFrame(frame);view.update();renderer.render(scene,camera);document.querySelector('output')!.textContent=`${manager.resident.size}/4 tuiles · ${view.metrics.trees} arbres inférés · ${manager.failed.size} erreurs`;}frame();
Object.assign(window,{planetFixture:{manager,surface,view,manifest}});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
