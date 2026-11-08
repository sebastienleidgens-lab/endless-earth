import * as THREE from 'three';
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
    const g=this.grid,fx=(x-g.origin_x_m)/g.step_m,fz=(z-g.origin_z_m)/g.step_m;
    if(fx<0||fz<0||fx>g.width-1||fz>g.height-1)return null;
    const x0=Math.min(Math.floor(fx),g.width-2),z0=Math.min(Math.floor(fz),g.height-2);
    const tx=fx-x0,tz=fz-z0;
    const h=(xx:number,zz:number)=>g.elevations_m[zz*g.width+xx];
    const a=h(x0,z0),b=h(x0+1,z0),cc=h(x0,z0+1),d=h(x0+1,z0+1);
    // Match the exact two triangles used by createMesh(), not a bilinear
    // surface that can float above or sink below the rendered terrain.
    // Choose the shorter elevation diagonal in steep cells. The same
    // decision is used for mesh indices below, so sampling stays exact.
    if(Math.abs(a-d)<Math.abs(b-cc)){
      if(tx>=tz)return a+(b-a)*tx+(d-b)*tz;
      return a+(cc-a)*tz+(d-cc)*tx;
    }
    if(tx+tz<=1)return a+(b-a)*tx+(cc-a)*tz;
    return d+(cc-d)*(1-tx)+(b-d)*(1-tz);
  }
  createMesh():THREE.Mesh {
    const g=this.grid, positions:number[]=[],indices:number[]=[],colors:number[]=[];
    const baseline=this.sample(0,0)??g.elevations_m[0];
    // Reuse colors and the blend function across the entire 40,401-vertex DEM.
    // The former implementation allocated four THREE.Color objects per vertex.
    const grass=new THREE.Color(0x86a47a);
    const dryGrass=new THREE.Color(0x9eaa80);
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
      // The Anglin valley has real limestone cliffs. Blend bare limestone
      // into steep slopes directly in the terrain's vertex colors: no extra
      // overlapping ground meshes (which previously caused z-fighting).
      const dry=smoothstep(.12,.38,slope);
      const rock=smoothstep(.38,1.05,slope);
      // copy() is essential: never mutate the shared grass palette entry.
      color.copy(grass).lerp(dryGrass,dry).lerp(limestone,rock);
      color.lerp(exposedRock,smoothstep(1.05,1.9,slope)*.55);
      colors.push(color.r,color.g,color.b);
    }
    for(let z=0;z<g.height-1;z++)for(let x=0;x<g.width-1;x++){
      const a=z*g.width+x,b=a+1,c=a+g.width,d=c+1;
      // Prefer the diagonal with the smaller height jump. A fixed diagonal
      // across a cliff can create long, unnatural triangular wedges.
      const h=g.elevations_m;
      if(Math.abs(h[a]-h[d])<Math.abs(h[b]-h[c]))
        indices.push(a,c,d,a,d,b);
      else indices.push(a,c,b,b,c,d);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setIndex(indices);geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));
    mesh.receiveShadow=true;return mesh;
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
export async function fetchTerrain():Promise<Terrain|null>{
  const response=await fetch(`${import.meta.env.BASE_URL}data/angles-terrain.json`);
  if(!response.ok)return null;
  return new Terrain(Terrain.validate(await response.json()));
}
