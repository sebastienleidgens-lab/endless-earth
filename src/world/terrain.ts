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
    return (1-tz)*((1-tx)*h(x0,z0)+tx*h(x0+1,z0))+
      tz*((1-tx)*h(x0,z0+1)+tx*h(x0+1,z0+1));
  }
  createMesh():THREE.Mesh {
    const g=this.grid, positions:number[]=[],indices:number[]=[];
    const baseline=this.sample(0,0)??g.elevations_m[0];
    for(let z=0;z<g.height;z++)for(let x=0;x<g.width;x++)
      positions.push(g.origin_x_m+x*g.step_m,g.elevations_m[z*g.width+x]-baseline,g.origin_z_m+z*g.step_m);
    for(let z=0;z<g.height-1;z++)for(let x=0;x<g.width-1;x++){
      const a=z*g.width+x,b=a+1,c=a+g.width,d=c+1;
      indices.push(a,c,b,b,c,d);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({color:0x91a985,side:THREE.DoubleSide}));
    mesh.receiveShadow=true;return mesh;
  }
  relativeHeight(x:number,z:number):number|null {
    const h=this.sample(x,z),baseline=this.sample(0,0)??this.grid.elevations_m[0];
    return h===null?null:h-baseline;
  }
}
export async function fetchTerrain():Promise<Terrain|null>{
  const response=await fetch('/data/angles-terrain.json');
  if(!response.ok)return null;
  return new Terrain(Terrain.validate(await response.json()));
}
