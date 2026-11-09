import {groundDetail} from '../nature/surfaces';
import * as THREE from 'three';
// @ts-ignore Shared, tested source surface.
import {sampleGrid,cellIndices} from './terrain-grid.mjs';
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
  prepared:any=null;
  metrics={preparationMs:0,tiles:0,fineTriangles:0,farTriangles:0,farTiles:0,maxFarErrorM:0};
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
    const g=this.grid, positions:number[]=[],indices:number[]=[],colors:number[]=[];
    const baseline=this.sample(0,0)??g.elevations_m[0];
    // Reuse colors and the blend function across the entire 40,401-vertex DEM.
    // The former implementation allocated four THREE.Color objects per vertex.
    const grass=new THREE.Color(0x8d9b79);
    const dryGrass=new THREE.Color(0xa5a58a);
    const limestone=new THREE.Color(0xb8b09a);
    const exposedRock=new THREE.Color(0xaaa394);
    const color=new THREE.Color();
    const smoothstep=(a:number,b:number,v:number)=>{
      const t=THREE.MathUtils.clamp((v-a)/(b-a),0,1);
      return t*t*(3-2*t);
    };
    for(let z=0;z<g.height;z++)for(let x=0;x<g.width;x++){
      const elevation=g.elevations_m[z*g.width+x];
      positions.push(g.origin_x_m+x*g.step_m,elevation-baseline,g.origin_z_m+z*g.step_m);
      const left=g.elevations_m[z*g.width+Math.max(0,x-1)];
      const right=g.elevations_m[z*g.width+Math.min(g.width-1,x+1)];
      const up=g.elevations_m[Math.max(0,z-1)*g.width+x];
      const down=g.elevations_m[Math.min(g.height-1,z+1)*g.width+x];
      const slope=Math.hypot(right-left,down-up)/(2*g.step_m);
      // Exposed limestone is visible on the steep Anglin valley sides.
      // Shade it within the DEM's existing vertex colors: an extra rock
      // surface would intersect the terrain and reintroduce z-fighting.
      const dry=smoothstep(.12,.38,slope);
      const rock=smoothstep(.34,.95,slope);
      color.copy(grass).lerp(dryGrass,dry).lerp(limestone,rock);
      // Faceted, stratified limestone variation derived from surveyed
      // elevation and slope. This changes only color, never DEM geometry.
      if(rock>.001){
        const band=Math.sin(elevation*1.65+Math.sin(x*.31+z*.17)*.8);
        const grain=Math.sin(x*2.17+z*1.31)*Math.sin(x*.73-z*1.93);
        const shade=THREE.MathUtils.clamp(.93+band*.065+grain*.035,.79,1.08);
        color.multiplyScalar(1+(shade-1)*rock);
        color.lerp(exposedRock,smoothstep(.95,1.75,slope)*.64);
      }
      colors.push(color.r,color.g,color.b);
    }
    for(let z=0;z<g.height-1;z++)for(let x=0;x<g.width-1;x++)indices.push(...cellIndices(g,x,z,g.width,z*g.width+x));
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setIndex(indices);geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
    const material=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.FrontSide});
    groundDetail(material);
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
          vec2 coverUV=(naturePosition.xz-earthOrigin)/earthExtent;
          vec4 cover=texture2D(earthCover,coverUV);
          float inCover=step(0.,coverUV.x)*step(0.,coverUV.y)*step(coverUV.x,1.)*step(coverUV.y,1.);
          diffuseColor.rgb=diffuseColor.rgb*(1.-cover.a*inCover)+cover.rgb*inCover;`);
      };
      material.customProgramCacheKey=()=> 'earth-cover-v1';
    }
    const group=new THREE.Group();group.name='IGN source terrain';group.userData.terrainTexture=this.landcover;
    const owned:THREE.BufferGeometry[]=[];group.userData.terrainResources={geometries:owned,materials:[material]};
    if(this.prepared){
      const {manifest,indices:far}=this.prepared;
      for(const tile of manifest.tiles){
        const size=tile.size,stride=size+1,geom=new THREE.BufferGeometry();
        for(const name of ['position','normal','color']){
          const source=geometry.getAttribute(name),array=new Float32Array(stride*stride*3);
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
        const mesh=new THREE.Mesh(geom,material);mesh.receiveShadow=true;
        mesh.userData.earthTile={fineIndex,farIndex,fineGeometry:geom,farGeometry,far:false,x:g.origin_x_m+tile.x*g.step_m,z:g.origin_z_m+tile.z*g.step_m,size:size*g.step_m};group.add(mesh);
      }
      geometry.dispose();
      this.metrics.tiles=manifest.tiles.length;this.metrics.fineTriangles=manifest.fineTriangles;this.metrics.farTriangles=manifest.farTriangles;this.metrics.maxFarErrorM=manifest.maxFarErrorM;
    }else{
      const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;group.add(mesh);owned.push(geometry);
      this.metrics.tiles=1;this.metrics.fineTriangles=indices.length/3;
    }
    this.metrics.preparationMs=performance.now()-started;
    group.userData.terrainMetrics=this.metrics;
    return group;
  }

  // Optional terrain inspection: highlight DEM cells with abrupt elevation
  // transitions without modifying any surveyed heights or the normal view.
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
  try{
    const r=await fetch(base+'angles-earth.json');if(!r.ok)return terrain;const m=await r.json();
    if(m.schema!=='endless-earth-prepared-v1'||m.terrainSha256!==await sha256(new TextEncoder().encode(text)))throw new Error('Stale prepared terrain');
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
  return terrain;
}
