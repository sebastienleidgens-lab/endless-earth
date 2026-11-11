// @ts-ignore Shared provider-neutral provenance validation.
import {validateEnvironment} from './environment.mjs';
import {configureRoadFiltering,type RoadEdges,roadTexture} from './road-material';
import {groundDetail} from '../nature/surfaces';
import {fetchSurfaceAppearance,configureSurfaceFiltering,type SurfaceAppearance} from './surface-material';
import * as THREE from 'three';
// @ts-ignore Shared, tested source surface.
import {sampleGrid,cellIndices} from './terrain-grid.mjs';
// @ts-ignore Shared offline source geometry.
import {sourceGeometry} from './source-geometry.mjs';
// @ts-ignore Validated binary geometry decoder.
import {decodeSurface} from './surface-mesh.mjs';
export type TerrainGrid = {
  schema: 'endless-earth-terrain-v1';
  origin_x_m: number;
  origin_z_m: number;
  step_m: number;
  width: number;
  height: number;
  elevations_m: number[];
  source: string;
  vertical_datum?: string;
};
export class Terrain {
  landcover:THREE.Texture|null=null;
  roadEdges:RoadEdges|null=null;
  surfaceAppearance:SurfaceAppearance|null=null;
  singleSurface:any=null;
  get roadsAvailable(){return this.singleSurface!==null;}
  get waterIntegrated(){return this.singleSurface?.manifest.water?.mode==='mapped-outline-dem-drape-v1';}
  prepared:any=null;
  environment:any=null;
  environmentSha256:string|null=null;
  sourceSha256:string|null=null;
  metrics={preparationMs:0,tiles:0,fineTriangles:0,farTriangles:0,farTiles:0,maxFarErrorM:0,surface:'source',water:'legacy'};
  constructor(readonly grid: TerrainGrid) {}
  static validate(raw: unknown): TerrainGrid {
    if(!raw || typeof raw !== 'object') throw new Error('Invalid terrain payload');
    const g=raw as Partial<TerrainGrid>;
    if(g.schema!=='endless-earth-terrain-v1'||!Number.isInteger(g.width)||!Number.isInteger(g.height)||
      (g.width??0)<2||(g.height??0)<2||(g.width??0)>2048||(g.height??0)>2048||
      !Number.isFinite(g.step_m)||g.step_m!<=0||!Number.isFinite(g.origin_x_m)||!Number.isFinite(g.origin_z_m)||
      !Array.isArray(g.elevations_m)||g.elevations_m.length!==g.width!*g.height!||
      !g.elevations_m.every(v=>typeof v==='number'&&Number.isFinite(v))||
      typeof g.source!=='string'||!g.source.trim())throw new Error('Invalid terrain grid: metadata or dimensions');
    return g as TerrainGrid;
  }
  // Rows increase in local +Z, columns in local +X. Heights are absolute metres.
  sample(x:number,z:number):number|null {
    return sampleGrid(this.grid,x,z);
  }
  createMesh():THREE.Object3D {
    const started=performance.now();
    const g=this.grid,geometry=this.singleSurface?null:sourceGeometry(g);
    const material=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.FrontSide});
    groundDetail(material,!!this.singleSurface,this.roadEdges,this.waterIntegrated,this.surfaceAppearance);
    const bareMaterial=this.landcover?material.clone():material;groundDetail(bareMaterial,!!this.singleSurface,this.roadEdges,this.waterIntegrated,this.surfaceAppearance);
    if(this.landcover){
      const detail=material.onBeforeCompile;
      material.onBeforeCompile=(shader,renderer)=>{
        detail.call(material,shader,renderer);
        shader.uniforms.earthCover={value:this.landcover};
        const c=this.prepared.manifest.cover;
        shader.uniforms.earthOrigin={value:new THREE.Vector2(...c.origin)};
        shader.uniforms.earthExtent={value:new THREE.Vector2(...c.extent)};
        shader.fragmentShader='uniform sampler2D earthCover; uniform vec2 earthOrigin; uniform vec2 earthExtent;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
          ${this.singleSurface?'if(earthRoadType<.5){':''}
          vec2 coverUV=(naturePosition.xz-earthOrigin)/earthExtent;
          vec4 cover=texture2D(earthCover,coverUV);
          float inCover=step(0.,coverUV.x)*step(0.,coverUV.y)*step(coverUV.x,1.)*step(coverUV.y,1.)${this.singleSurface?'*(1.-step(.5,earthRoadType))':''};
          diffuseColor.rgb=diffuseColor.rgb*(1.-cover.a*inCover)+cover.rgb*inCover;
          ${this.singleSurface?'}':''}`);
      };
      const appearanceKey=material.customProgramCacheKey();
      material.customProgramCacheKey=()=> appearanceKey+'-earth-cover-v3';
    }
    const group=new THREE.Group();group.name='IGN source terrain';group.userData.terrainTexture=this.landcover;
    group.userData.roadEdgeTexture=this.roadEdges?.texture;
    group.userData.surfaceTextures=this.surfaceAppearance?[this.surfaceAppearance.field,this.surfaceAppearance.atlas]:[];
    group.userData.roadTextures=this.singleSurface?[roadTexture,...(this.roadEdges?[this.roadEdges.texture]:[])]:[];
    const owned:THREE.BufferGeometry[]=[];group.userData.terrainResources={geometries:owned,materials:[material,bareMaterial]};
    if(this.singleSurface){
      const {manifest,tiles}=this.singleSurface;
      for(const tile of tiles){
        const t=tile.descriptor,geom=new THREE.BufferGeometry();
        for(const [name,attribute] of Object.entries(tile.attributes))geom.setAttribute(name,attribute as THREE.BufferAttribute);
        geom.setIndex(tile.fine);geom.computeBoundingSphere();
        const farGeometry=new THREE.BufferGeometry();for(const [name,attribute] of Object.entries(geom.attributes))farGeometry.setAttribute(name,attribute);
        farGeometry.setIndex(tile.far);farGeometry.boundingSphere=geom.boundingSphere;owned.push(geom,farGeometry);
        const mesh=new THREE.Mesh(geom,t.cover===false?bareMaterial:material);mesh.receiveShadow=true;mesh.name='IGN ground and OSM roads';
        mesh.onBeforeRender=renderer=>{configureRoadFiltering(renderer,this.roadEdges);configureSurfaceFiltering(renderer,this.surfaceAppearance,(mesh.material as any).defines?.LIFE_SURFACE_MODE??1)};
        mesh.userData.earthTile={fineIndex:tile.fine,farIndex:tile.far,fineGeometry:geom,farGeometry,far:false,x:g.origin_x_m+t.x*g.step_m,z:g.origin_z_m+t.z*g.step_m,size:t.size*g.step_m};group.add(mesh);
      }
      this.metrics.tiles=tiles.length;this.metrics.fineTriangles=manifest.stats.fineTriangles;this.metrics.farTriangles=manifest.stats.farTriangles;this.metrics.maxFarErrorM=manifest.maxFarErrorM;this.metrics.surface='integrated';this.metrics.water=this.waterIntegrated?'mapped-outline-dem-drape-v1':'legacy';
    }else if(this.prepared){
      const {manifest,indices:far}=this.prepared;
      for(const tile of manifest.tiles){
        const size=tile.size,stride=size+1,geom=new THREE.BufferGeometry();
        for(const name of ['position','normal','color']){
          const source=geometry!.getAttribute(name),array=new Float32Array(stride*stride*3);
          for(let z=0;z<=size;z++)for(let x=0;x<=size;x++){
            const from=(tile.z+z)*g.width+tile.x+x,to=z*stride+x;
            array[to*3]=source.getX(from);array[to*3+1]=source.getY(from);array[to*3+2]=source.getZ(from);
          }geom.setAttribute(name,new THREE.BufferAttribute(array,3));
        }
        const fine:number[]=[];
        for(let z=0;z<size;z++)for(let x=0;x<size;x++)fine.push(...cellIndices(g,tile.x+x,tile.z+z,stride,z*stride+x));
        const fineIndex=new THREE.Uint16BufferAttribute(fine,1),farIndex=new THREE.BufferAttribute(far.slice(tile.offset,tile.offset+tile.count),1);
        geom.setIndex(fineIndex);geom.computeBoundingSphere();
        // Two owned geometries ensure both GPU index buffers are freed on unload.
        const farGeometry=new THREE.BufferGeometry();for(const [name,attribute] of Object.entries(geom.attributes))farGeometry.setAttribute(name,attribute);
        farGeometry.setIndex(farIndex);farGeometry.boundingSphere=geom.boundingSphere;owned.push(geom,farGeometry);
        const mesh=new THREE.Mesh(geom,tile.cover===false?bareMaterial:material);mesh.receiveShadow=true;
        mesh.userData.earthTile={fineIndex,farIndex,fineGeometry:geom,farGeometry,far:false,x:g.origin_x_m+tile.x*g.step_m,z:g.origin_z_m+tile.z*g.step_m,size:size*g.step_m};group.add(mesh);
      }
      geometry!.dispose();
      this.metrics.tiles=manifest.tiles.length;this.metrics.fineTriangles=manifest.fineTriangles;this.metrics.farTriangles=manifest.farTriangles;this.metrics.maxFarErrorM=manifest.maxFarErrorM;
    }else{
      const mesh=new THREE.Mesh(geometry!,material);mesh.receiveShadow=true;group.add(mesh);owned.push(geometry!);
      this.metrics.tiles=1;this.metrics.fineTriangles=geometry!.index!.count/3;
    }
    this.metrics.preparationMs=performance.now()-started;
    group.userData.terrainMetrics=this.metrics;
    return group;
  }

  // Optional terrain inspection: highlight DEM cells with abrupt elevation
  // transitions without modifying any source heights or the normal view.
  createSlopeDiagnostics(thresholdMetres=15):{overlay:THREE.LineSegments;cells:number}{
    const g=this.grid,baseline=this.sample(0,0)??g.elevations_m[0];
    const positions:number[]=[];
    let cells=0;
    for(let z=0;z<g.height-1;z++)for(let x=0;x<g.width-1;x++){
      const i=z*g.width+x;
      const h=[g.elevations_m[i],g.elevations_m[i+1],g.elevations_m[i+g.width],g.elevations_m[i+g.width+1]];
      if(Math.max(...h)-Math.min(...h)<thresholdMetres)continue;
      cells++;
      const x0=g.origin_x_m+x*g.step_m,z0=g.origin_z_m+z*g.step_m;
      const corners=[[x0,h[0]-baseline+.7,z0],[x0+g.step_m,h[1]-baseline+.7,z0],
        [x0+g.step_m,h[3]-baseline+.7,z0+g.step_m],[x0,h[2]-baseline+.7,z0+g.step_m]];
      for(let edge=0;edge<4;edge++)positions.push(...corners[edge],...corners[(edge+1)%4]);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    const overlay=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0xff00c8,depthTest:false,transparent:true,opacity:.85}));
    overlay.frustumCulled=false;
    overlay.renderOrder=100;
    return {overlay,cells};
  }
  relativeHeight(x:number,z:number):number|null {
    const h=this.sample(x,z),baseline=this.sample(0,0)??this.grid.elevations_m[0];
    return h===null?null:h-baseline;
  }
}
// A bounded set of 25 tiles; all LOD buffers are prepared once, never per frame.
export function updateTerrainLOD(scene:THREE.Object3D,camera:{x:number;z:number},player:{x:number;z:number},eco=false){
  const radius=eco?240:340;
  scene.traverse(o=>{
    const t=o.userData.earthTile;if(!t)return;
    const distance=(p:{x:number;z:number})=>Math.hypot(Math.max(t.x-p.x,0,p.x-t.x-t.size),Math.max(t.z-p.z,0,p.z-t.z-t.size));
    const d=Math.min(distance(camera),distance(player));
    t.far=d>(t.far?radius:radius+60);
    (o as THREE.Mesh).geometry=t.far?t.farGeometry:t.fineGeometry;
  });
  scene.traverse(o=>{if(o.userData.terrainMetrics){let count=0;o.traverse(c=>{if(c.userData.earthTile?.far)count++});o.userData.terrainMetrics.farTiles=count}});
}
const sha256=async(data:BufferSource)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(v=>v.toString(16).padStart(2,'0')).join('');
export async function fetchTerrain():Promise<Terrain|null>{
  const base=`${import.meta.env.BASE_URL}data/`,response=await fetch(base+'angles-terrain.json');
  if(!response.ok)return null;
  const text=await response.text(),terrain=new Terrain(Terrain.validate(JSON.parse(text)));
  terrain.sourceSha256=await sha256(new TextEncoder().encode(text));
  try{
    const r=await fetch(base+'angles-environment.json');if(!r.ok)throw new Error('Normalized environment unavailable');
    const content=await r.text();terrain.environment=validateEnvironment(JSON.parse(content));terrain.environmentSha256=await sha256(new TextEncoder().encode(content));
  }catch(error){console.warn('Environment unavailable; legacy OSM habitats retained',error);}
  try{
    const r=await fetch(base+'angles-earth.json');if(!r.ok)throw new Error('Prepared landcover unavailable');const m=await r.json();
    if(m.schema!=='endless-earth-prepared-v1'||m.terrainSha256!==await sha256(new TextEncoder().encode(text)))throw new Error('Stale prepared terrain');
    if(m.environmentSha256&&m.environmentSha256!==terrain.environmentSha256)throw new Error('Stale environment derivative');
    const [lod,image,osm]=await Promise.all([fetch(base+'angles-terrain-lod.bin'),fetch(base+'angles-landcover.png'),fetch(base+'angles-osm.geojson')]);
    if(!lod.ok||!image.ok||!osm.ok)throw new Error('Prepared data missing');
    if(await sha256(new TextEncoder().encode(await osm.text()))!==m.osmSha256)throw new Error('Stale landcover source');
    const bytes=await lod.arrayBuffer(),png=await image.arrayBuffer();
    if(await sha256(bytes)!==m.lodSha256||await sha256(png)!==m.coverSha256)throw new Error('Prepared data hash mismatch');
    const indices=new Uint16Array(bytes);
    if(!Array.isArray(m.tiles)||m.tiles.length>256||!m.tiles.every((t:any)=>Number.isInteger(t.x)&&Number.isInteger(t.z)&&t.size===m.tileCells&&t.x>=0&&t.z>=0&&t.x+t.size<terrain.grid.width&&t.z+t.size<terrain.grid.height&&t.offset>=0&&t.count%3===0&&t.offset+t.count<=indices.length&&indices.subarray(t.offset,t.offset+t.count).every(v=>v<(t.size+1)**2)))throw new Error('Invalid prepared indices');
    terrain.prepared={manifest:m,indices};
    const bitmap=await createImageBitmap(new Blob([png],{type:'image/png'}),{premultiplyAlpha:'none',colorSpaceConversion:'none'});
    const texture=new THREE.Texture(bitmap);texture.flipY=false;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;
    terrain.landcover=texture;
  }catch(error){console.warn('Prepared Earth data unavailable; exact IGN grid retained',error);}
  try{
    const r=await fetch(base+'angles-surface.json');if(!r.ok)throw new Error('Unified surface unavailable');const m=await r.json();
    const [terrainHash,osmHash]=await Promise.all([sha256(new TextEncoder().encode(text)),fetch(base+'angles-osm.geojson').then(r=>r.text()).then(t=>sha256(new TextEncoder().encode(t)))]);
    if(m.terrainSha256!==terrainHash||m.osmSha256!==osmHash||m.sourceSpacingM!==terrain.grid.step_m)throw new Error('Stale unified surface');
    if(!m.tiles.every((t:any)=>Number.isInteger(t.x)&&Number.isInteger(t.z)&&t.x>=0&&t.z>=0&&t.size>0&&t.x+t.size<terrain.grid.width&&t.z+t.size<terrain.grid.height))throw new Error('Invalid unified tile extent');
    const packed=await fetch(base+'angles-surface.pack');if(!packed.ok)throw new Error('Unified surface buffer unavailable');
    const buffer=await new Response(packed.body!.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    if(await sha256(buffer)!==m.binarySha256)throw new Error('Unified surface checksum mismatch');terrain.singleSurface=decodeSurface(m,buffer);
  }catch(error){console.warn('Road surfaces unavailable; exact source ground retained without overlapping fallback roads',error);}
  if(terrain.singleSurface)try{
    const response=await fetch(base+'angles-road-edge.json');if(!response.ok)throw new Error('Road edge field missing');const m=await response.json();
    const g=terrain.grid,source=terrain.singleSurface.manifest;
    if(m.schema!=='endless-earth-road-edge-v2'||m.size!==2048||m.bytes!==m.size*m.size||m.range!==3||
      !Array.isArray(m.origin)||!Array.isArray(m.extent)||m.origin[0]!==g.origin_x_m||m.origin[1]!==g.origin_z_m||
      m.extent[0]!==g.step_m*(g.width-1)||m.extent[1]!==g.step_m*(g.height-1)||
      m.osmSha256!==source.osmSha256||m.terrainSha256!==source.terrainSha256)throw new Error('Stale road edge field');
    const packed=await fetch(base+'angles-road-edge.pack');if(!packed.ok)throw new Error('Road edge field missing');
    const bytes=await new Response(packed.body!.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    if(bytes.byteLength!==m.bytes||await sha256(bytes)!==m.sha256)throw new Error('Invalid road edge field');
    const texture=new THREE.DataTexture(new Uint8Array(bytes),m.size,m.size,THREE.RedFormat);
    texture.name='OSM union boundary distance';texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
    texture.generateMipmaps=true;texture.needsUpdate=true;terrain.roadEdges={texture,manifest:m};
  }catch(error){console.warn('Road shoulders unavailable; unified road geometry and mineral materials retained',error);}
  if(terrain.singleSurface){
    const g=terrain.grid;
    terrain.surfaceAppearance=await fetchSurfaceAppearance({terrain:terrain.sourceSha256,osm:terrain.singleSurface.manifest.osmSha256,environment:terrain.environmentSha256},[g.origin_x_m,g.origin_z_m],[(g.width-1)*g.step_m,(g.height-1)*g.step_m]);
  }
  return terrain;
}
