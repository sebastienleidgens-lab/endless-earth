// @ts-ignore Indexed mapped habitat queries.
import {habitatIndex} from '../earthlife/habitat.mjs';
// @ts-ignore Shared normalized environmental features.
import {mergeEnvironment} from './environment.mjs';
// @ts-ignore Water line clipping shared with offline tests.
import {clipLineToGrid} from './terrain-grid.mjs';
// @ts-ignore Explicitly illustrative ruin profile.
import {ruinHeight} from './ruins.mjs';
import {addNature,updateNatureLOD} from '../nature/render';
import {waterMaterial} from '../nature/surfaces';
import * as THREE from 'three';
// @ts-ignore Validated, source-bound offline geometry and progressive detail stream.
import {loadDecorations} from './decoration-stream.mjs';
import { ArchitectureBatch,installPreparedArchitecture } from '../architecture/render';
import {heritageMaterial,loadArchitectureAtlas} from '../architecture/material';
// @ts-ignore Pure shared footprint helper.
import { edgeKey } from '../architecture/plan.mjs';
import { nature } from '../living/geography';
import { animateFoliage } from '../living/atmosphere';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toLocal } from './geo';
import { setBuildingFootprints } from './collisions';
import type { Terrain } from './terrain';
type Feature = { geometry?: { type: string; coordinates: unknown }; properties?: Record<string,unknown> };
type Collection = { type: string; features: Feature[] };
function coordsToPoints(coords: unknown, terrain?:Terrain): THREE.Vector3[] {
  if(!Array.isArray(coords)) return [];
  return coords.flatMap((p:unknown) => {
    if(!Array.isArray(p)||typeof p[0]!=='number'||typeof p[1]!=='number') return [];
    const v=toLocal({lon:p[0],lat:p[1]}); return [new THREE.Vector3(v.x,(terrain?.relativeHeight(v.x,v.z)??0)+0.12,v.z)];
  });
}
const LOCAL_LIMIT=1050;
function sharedBuildingEdges(features:Feature[]):Set<string>{
  const counts=new Map<string,number>();
  for(const feature of features){
    if(!feature.properties?.building||feature.geometry?.type!=='Polygon'||!Array.isArray(feature.geometry.coordinates))continue;
    const points=coordsToPoints(feature.geometry.coordinates[0]);
    if(points.length<3||!points.some(insideArea))continue;
    const ring=points.length>1&&points[0].distanceTo(points[points.length-1])<.01?points.slice(0,-1):points;
    for(let i=0;i<ring.length;i++){
      const key=edgeKey(ring[i],ring[(i+1)%ring.length]);
      counts.set(key,(counts.get(key)??0)+1);
    }
  }
  return new Set([...counts].filter(([,count])=>count>1).map(([key])=>key));
}
const RIVER_MATERIAL=waterMaterial();
const WATER_MATERIAL=waterMaterial();
function insideArea(p:THREE.Vector3){return Math.abs(p.x)<=LOCAL_LIMIT&&Math.abs(p.z)<=LOCAL_LIMIT;}
function addLine(scene:THREE.Object3D,points:THREE.Vector3[],width:number,terrain?:Terrain){
  if(points.length<2)return;
  // Densify existing water lines before batching; road surfaces are prepared offline.
  const vertices:number[]=[];
  for(let i=1;i<points.length;i++){
    const start=points[i-1],end=points[i];
    const length=Math.hypot(end.x-start.x,end.z-start.z);
    if(length<.05)continue;
    const pieces=terrain?Math.min(120,Math.ceil(length/8)):1;
    for(let part=0;part<pieces;part++){
      const t0=part/pieces,t1=(part+1)/pieces;
      const a=start.clone().lerp(end,t0),b=start.clone().lerp(end,t1);
      // Ignore geometry outside the currently supported 2 km pilot area.
      if(!insideArea(a)&&!insideArea(b))continue;
      if(terrain){
        const clipped=clipLineToGrid(terrain.grid,a,b);if(!clipped)continue;
        a.x=clipped[0].x;a.z=clipped[0].z;b.x=clipped[1].x;b.z=clipped[1].z;
        const ha=terrain.relativeHeight(a.x,a.z),hb=terrain.relativeHeight(b.x,b.z);
        // Never substitute local zero for an unknown river altitude at the
        // DEM edge: that produced a visible vertical water strip.
        if(ha===null||hb===null)continue;a.y=ha+.19;b.y=hb+.19;
      }else{a.y=.19;b.y=.19;}
      const dx=b.x-a.x,dz=b.z-a.z,segment=Math.hypot(dx,dz);
      if(segment<.01)continue;
      const nx=-dz/segment*width/2,nz=dx/segment*width/2;
      vertices.push(
        a.x+nx,a.y,a.z+nz,a.x-nx,a.y,a.z-nz,b.x+nx,b.y,b.z+nz,
        b.x+nx,b.y,b.z+nz,a.x-nx,a.y,a.z-nz,b.x-nx,b.y,b.z-nz
      );
    }
  }
  if(!vertices.length)return;
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,RIVER_MATERIAL);
  mesh.receiveShadow=true;scene.add(mesh);
}
// Historic OSM outlines are mapped linework; wall heights are deliberately
// illustrative until a verified height or architectural model is available.
const HISTORIC_WALL_MATERIAL=heritageMaterial;
HISTORIC_WALL_MATERIAL.userData.natureShared=true;
function addHistoricWall(scene:THREE.Object3D,points:THREE.Vector3[],terrain?:Terrain,castle=false):void{
  // Only OSM-mapped linework determines the wall plan. The fragmented
  // elevations below are illustrative and must not imply measured ruin heights.
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i];
    if(!insideArea(a)&&!insideArea(b))continue;
    const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
    if(length<.5||length>150)continue;
    const pieces=Math.max(1,Math.ceil(length/5));
    for(let j=0;j<pieces;j++){
      const t0=j/pieces,t1=(j+1)/pieces;
      const midT=(t0+t1)/2;
      const x=a.x+dx*midT,z=a.z+dz*midT;
      const ground=terrain?.relativeHeight(x,z)??(a.y+b.y)/2;
      const height=ruinHeight(x,z,castle);
      const segmentLength=length/pieces;
      const geometry=new THREE.BoxGeometry(segmentLength+.04,height,1.25);
      geometry.rotateY(-Math.atan2(dz,dx));geometry.translate(x,0,z);
      const positions=geometry.getAttribute('position');
      for(let k=0;k<positions.count;k++){
        const px=positions.getX(k),pz=positions.getZ(k);
        const base=terrain?.relativeHeight(px,pz)??ground;
        positions.setY(k,base-.12+(positions.getY(k)>0?height:0));
      }
      geometry.computeVertexNormals();
      const mesh=new THREE.Mesh(geometry,HISTORIC_WALL_MATERIAL);
      mesh.receiveShadow=true;scene.add(mesh);
    }
  }
}
function makeFootprint(ring:THREE.Vector3[]):THREE.Shape{
  const shape=new THREE.Shape();
  ring.forEach((p,i)=>i===0?shape.moveTo(p.x,-p.z):shape.lineTo(p.x,-p.z));
  return shape;
}
// Mapped habitat boundaries constrain deterministic, inferred individual trees.
function addMappedTrees(scene:THREE.Object3D,features:Feature[],terrain?:Terrain,prepared?:any):number{
 const local=features.map(f=>{const g=f.geometry,tags=f.properties??{},c=g?.coordinates;if(!g||!Array.isArray(c))return {tags};if(g.type==='Polygon')return {tags,rings:c.map(r=>coordsToPoints(r))};if(g.type==='LineString')return {tags,line:coordsToPoints(c)};if(g.type==='Point'&&typeof c[0]==='number'&&typeof c[1]==='number')return {tags,point:toLocal({lon:c[0],lat:c[1]})};return {tags};});
 scene.userData.lifeHabitat=habitatIndex(local);
 const trees=addNature(scene,local,(x,z)=>terrain?terrain.relativeHeight(x,z):0,prepared);
 const anchors=trees.map((p:{x:number;y:number;z:number;scale:number;kind:string})=>({x:p.x,z:p.z,perchY:p.y+8.5*p.scale*(p.kind==='riparian'?1.35:1)}));nature.push(...anchors);scene.userData.natureAnchors=anchors;
 return trees.length;
}
export function updateVegetationLOD(scene:THREE.Object3D,camera:THREE.Camera,eco=false){updateNatureLOD(scene,camera,eco)}
// Merge existing water and historic-wall meshes into one mesh per material.
// This cuts draw calls without altering the OSM linework or its DEM heights.
function batchLinearFeatures(scene:THREE.Object3D):void{
  for(const material of [RIVER_MATERIAL,HISTORIC_WALL_MATERIAL]){
    const meshes=scene.children.filter((child):child is THREE.Mesh=>
      child instanceof THREE.Mesh && child.material===material);
    if(meshes.length<2)continue;
    const merged=mergeGeometries(meshes.map(mesh=>mesh.geometry),false);
    if(!merged)continue;
    for(const mesh of meshes){scene.remove(mesh);mesh.geometry.dispose();}
    const combined=new THREE.Mesh(merged,material);
    combined.name=material===HISTORIC_WALL_MATERIAL?'OSM ruins':'OSM linear features';
    combined.receiveShadow=true;
    scene.add(combined);
  }
}
export function renderGeoFeatures(scene:THREE.Object3D, features:Feature[], terrain?:Terrain,prepared?:any):number{
  if(prepared)scene.userData.decorationStream=prepared.stream;
  let count=addMappedTrees(scene,features,terrain,prepared);
  const sharedEdges=sharedBuildingEdges(features);
  const architecture=prepared?null:new ArchitectureBatch(scene);
  for(const f of features){
    const tags=f.properties??{};
    if(f.geometry?.type==='LineString'){
      const pts=coordsToPoints(f.geometry.coordinates,terrain);
      if(tags.historic==='citywalls'||tags.historic==='castle'||tags.historic==='ruins'||tags.barrier==='city_wall'){addHistoricWall(scene,pts,terrain,tags.historic==='castle'||tags.historic==='ruins');count++;}
      else if(tags.highway){count++;} // Rendered once inside the prepared ground surface.
      else if(tags.waterway){if(!terrain?.waterIntegrated&&['river','stream','canal'].includes(String(tags.waterway)))addLine(scene,pts,6,terrain);count++;}
    } else if(f.geometry?.type==='Polygon' && Array.isArray(f.geometry.coordinates)){
      const ring=coordsToPoints(f.geometry.coordinates[0],terrain);
      if(ring.length<4 || !ring.some(insideArea))continue;
      if(tags.historic==='castle'||tags.historic==='ruins'){
        // The mapped castle perimeter takes priority over generic building
        // extrusion: an intact terracotta-roofed house would be misleading.
        addHistoricWall(scene,ring,terrain,true);count++;
      } else if(tags.building){
        const holes=(f.geometry.coordinates.slice(1) as unknown[]).map(h=>coordsToPoints(h,terrain)).map(h=>h.length>1&&h[0].distanceTo(h[h.length-1])<.01?h.slice(0,-1):h).filter(h=>h.length>=3);
        architecture?.add(ring,tags,sharedEdges,(x,z)=>terrain?terrain.relativeHeight(x,z):0,holes);
        count++;
      } else if(tags.natural==='wood'||tags.natural==='scrub'||tags.landuse==='forest'||tags.landuse==='orchard'||tags.leisure==='park'){
        // Habitat colors are now baked into the source terrain material.
        // No duplicate ground surface and no additional collision geometry.
        count++;
      } else if(tags.historic==='castle'||tags.historic==='ruins'){
        // Preserve the mapped footprint without inventing an intact castle.
        // Only its surveyed perimeter is represented as a low schematic wall.
        addHistoricWall(scene,ring,terrain);count++;
      } else if(tags.natural==='water'){
        if(terrain?.waterIntegrated){count++;continue;}
        // Water surfaces remain level at their lowest mapped edge.
        const shape=makeFootprint(ring);
        for(const coords of f.geometry.coordinates.slice(1)){const hole=coordsToPoints(coords);const path=new THREE.Path();hole.forEach((p,i)=>i===0?path.moveTo(p.x,-p.z):path.lineTo(p.x,-p.z));shape.holes.push(path)}
        const geometry=new THREE.ShapeGeometry(shape);
        geometry.rotateX(-Math.PI/2);
        const water=new THREE.Mesh(geometry,WATER_MATERIAL);
        water.position.y=terrain?(Math.min(...ring.map(p=>p.y))+.05):.2;
        scene.add(water);count++;
      }
    }
  }
  batchLinearFeatures(scene);
  if(prepared)installPreparedArchitecture(scene,prepared);else architecture!.finish();
  return count;
}
export async function loadAnglesGeography(scene:THREE.Object3D, terrain?:Terrain):Promise<number>{
  await loadArchitectureAtlas();
  const response=await fetch(`${import.meta.env.BASE_URL}data/angles-osm.geojson`);
  if(!response.ok)return 0;
  const text=await response.text(),data=JSON.parse(text) as Collection;
  const prepared=await loadDecorations(terrain,text);
  if(data.type!=='FeatureCollection'||!Array.isArray(data.features))throw new Error('Invalid GeoJSON');
  const count=renderGeoFeatures(scene,mergeEnvironment(data.features,terrain?.environment),terrain,prepared);
  if(count>0)setBuildingFootprints(data.features);
  return count;
}

