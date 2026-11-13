import {coverageReceiver} from '../world/coverage';
import * as THREE from 'three';
// @ts-ignore Deterministic, noncolliding window gardens, seasonal calendar.
import {villageFlowerRecipes,flowerSeason,FLOWER_VERSION} from './flowers.mjs';
// @ts-ignore Reuse the continuous Mission 11 wind and cloud illumination.
import {lifeUniforms,cloudReceiver} from '../earthlife/state.mjs';
// @ts-ignore No new weather simulation.
import {windGLSL} from '../earthlife/wind.mjs';
// @ts-ignore Bounded shader specialization owned by existing profiles.
import {registerLifeMaterial} from '../earthlife/capabilities.mjs';
type Recipe={x:number;y:number;z:number;ux:number;uz:number;nx:number;nz:number;width:number;seed:number;kind:string};
export function addVillageFlowers(zone:THREE.Object3D,features:any[],height:(x:number,z:number)=>number|null){
 const recipes=villageFlowerRecipes(features,height),cells=new Map<string,Recipe[]>();
 for(const p of recipes){const k=`${Math.floor(p.x/64)}:${Math.floor(p.z/64)}`;if(!cells.has(k))cells.set(k,[]);cells.get(k)!.push(p)}
 const season={value:new THREE.Vector2(1,1)},material=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
 material.onBeforeCompile=s=>{
  Object.assign(s.uniforms,lifeUniforms,{flowerCalendar:season});
  s.vertexShader='attribute float flowerPart,flowerPhase;varying float vFlowerPart,vFlowerPhase;uniform float lifeTime,lifeMeanWind,lifeVegetation,lifeFine;\n'+windGLSL+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vFlowerPart=flowerPart;vFlowerPhase=flowerPhase;
   #if LIFE_WIND_MODE > 0
   vec2 wind=lifeLocalWind;
   #if LIFE_WIND_MODE == 2
   wind=lifeWind(position.xz,lifeTime,lifeMeanWind);
   #endif
   transformed.xz+=wind*.004*flowerPart*(.4+sin(lifeTime*1.7+flowerPhase)*.6)*lifeVegetation;
   #endif`);
  s.fragmentShader='varying float vFlowerPart,vFlowerPhase;uniform vec2 flowerCalendar;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float snowBloom=1.;
   #if EARTH_SNOW == 1
   snowBloom=1.-smoothstep(0.,.15,earthSnowCover);
   #endif
   if(vFlowerPart>1.5){if(fract(vFlowerPhase*.017)>snowBloom*.98*flowerCalendar.y)discard;diffuseColor.rgb*=.85+.15*flowerCalendar.y;}
   else if(vFlowerPart>.5&&fract(vFlowerPhase*.013)>.98*flowerCalendar.x)discard;`);
 };
 material.customProgramCacheKey=()=>FLOWER_VERSION;coverageReceiver(material,new THREE.Vector2(60,95));cloudReceiver(material);registerLifeMaterial(material,{foliage:true});
 zone.userData.natureResources.materials.push(material);
 zone.userData.villageFlowers={version:FLOWER_VERSION,recipes,season,material,cells:[],builds:0,
  provenance:'C16/C24 photograph-guided types; every placement is decorative interpretation; no new collider'};
 for(const [key,points]of cells){const [x,z]=key.split(':').map(Number),cell=new THREE.Group();cell.userData.flowerCell={x:(x+.5)*64,z:(z+.5)*64,points,lastUsed:0};zone.userData.villageFlowers.cells.push(cell);zone.add(cell)}
}
function buildFlowers(points:Recipe[],material:THREE.Material){
 const pos:number[]=[],colors:number[]=[],parts:number[]=[],phases:number[]=[],color=new THREE.Color();
 for(const p of points){
  const emit=(v:number[],part:number,tint:number)=>{pos.push(p.x+p.ux*v[0]-p.nx*v[2],p.y+v[1],p.z+p.uz*v[0]-p.nz*v[2]);color.setHex(tint);colors.push(color.r,color.g,color.b);parts.push(part);phases.push(p.seed%1024+v[0]*13+v[1]*17)};
  const tri=(a:number[],b:number[],c:number[],part:number,tint:number)=>{emit(a,part,tint);emit(b,part,tint);emit(c,part,tint)};
  const quad=(a:number[],b:number[],c:number[],d:number[],part:number,tint:number)=>{tri(a,b,c,part,tint);tri(a,c,d,part,tint)};
  // Low stems, pointed leaves and small five-petal cups. All vertices stay
  // behind the wall plane in the same 9 cm recess as the existing planter.
  const n=p.kind==='climber'?16:14;
  let previous=[-p.width*.38,0,.04];
  for(let j=0;j<n;j++){
   const f=j/(n-1),climber=p.kind==='climber';
   const x=climber?-p.width*.38+Math.sin(f*10)*.07:(f-.5)*p.width*.9;
   const y=climber?.045+f*.70:.09+Math.sin(j*2.4+p.seed)*.075,z=.025+(j%3)*.014;
   const leaf=0x60734e,stem=0x69734e,petal=[0xb76677,0xd0b8a6,0xa35562,0x9d91b2][p.seed%4];
   const base=climber?previous:[x-.03,0,z];
   quad([base[0]-.004,base[1],base[2]],[base[0]+.004,base[1],base[2]],[x+.004,y+.10,z],[x-.004,y+.10,z],0,stem);
   for(const side of [-1,1]){
    const a=[x,y*.9,z],b=[x+side*.06,y*.9+.015,z+.018],tip=[x+side*.09,y*.9+.07,z+.006],d=[x+side*.025,y*.9+.065,z];
    quad(a,b,tip,d,1,leaf);
   }
   for(let k=0;k<5;k++){
    const a=k*Math.PI*2/5+.18*(j%3),r=.055+(j%3)*.009,cs=Math.cos(a),sn=Math.sin(a);
    const centre=[x,y+.12,z+.003],left=[x+cs*r*.65-sn*r*.42,y+.12+sn*r*.65+cs*r*.42,z+.022];
    const tip=[x+cs*r,y+.12+sn*r,z+.028],right=[x+cs*r*.65+sn*r*.42,y+.12+sn*r*.65-cs*r*.42,z+.022];
    quad(centre,left,tip,right,2,petal);
   }
   tri([x-.012,y+.11,z+.001],[x+.012,y+.11,z+.001],[x,y+.132,z+.001],2,0xd5c38d);
   previous=[x,y,z];
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('flowerPart',new THREE.Float32BufferAttribute(parts,1));g.setAttribute('flowerPhase',new THREE.Float32BufferAttribute(phases,1));g.computeVertexNormals();g.computeBoundingSphere();g.boundingSphere!.radius+=.1;
 const mesh=new THREE.Mesh(g,material);mesh.name='village-flowers';return mesh;
}
export function updateVillageFlowers(zone:THREE.Object3D,camera:THREE.Camera,date:string,eco=false){
 const f=zone.userData.villageFlowers;if(!f)return;const season=flowerSeason(date);f.season.value.set(season.leaf,season.bloom);
 f.material.userData.coverage19.range.value.set(eco?35:60,eco?55:95);
 const resident:THREE.Object3D[]=[],wanted:THREE.Object3D[]=[];
 for(const cell of f.cells){const c=cell.userData.flowerCell;if(!c.height19)c.height19=[Math.min(...c.points.map((p:Recipe)=>p.y))-.2,Math.max(...c.points.map((p:Recipe)=>p.y))+1];const d=Math.hypot(Math.max(0,Math.abs(camera.position.x-c.x)-32),Math.max(0,Math.abs(camera.position.z-c.z)-32),Math.max(0,c.height19[0]-camera.position.y,camera.position.y-c.height19[1]));c.distance=d;
  cell.visible=d<(eco?55:95)+(cell.visible?12:0);if(cell.children.length)resident.push(cell);else if(d<(eco?55:95)+40)wanted.push(cell);
 }
 wanted.sort((a,b)=>a.userData.flowerCell.distance-b.userData.flowerCell.distance);
 if(wanted.length){const cell=wanted[0];cell.add(buildFlowers(cell.userData.flowerCell.points,f.material));f.builds++;}
 const hidden=resident.filter(o=>!o.visible).sort((a,b)=>a.userData.flowerCell.distance-b.userData.flowerCell.distance);
 for(const cell of hidden.slice(4)){(cell.children[0] as THREE.Mesh).geometry.dispose();cell.clear()}
}
