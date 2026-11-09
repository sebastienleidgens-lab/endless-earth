import * as THREE from 'three';
import {sampleGrid,cellIndices} from './terrain-grid.mjs';
export function sourceGeometry(g){
    const positions=[],indices=[],colors=[];
    const baseline=sampleGrid(g,0,0)??g.elevations_m[0];
    // Reuse colors and the blend function across the entire 40,401-vertex DEM.
    // The former implementation allocated four THREE.Color objects per vertex.
    const grass=new THREE.Color(0x8d9b79);
    const dryGrass=new THREE.Color(0xa5a58a);
    const limestone=new THREE.Color(0xb8b09a);
    const exposedRock=new THREE.Color(0xaaa394);
    const color=new THREE.Color();
    const smoothstep=(a,b,v)=>{
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
      // Inferred limestone palette on steep Anglin valley sides.
      // Shade it within the DEM's existing vertex colors: an extra rock
      // surface would intersect the terrain and reintroduce z-fighting.
      const dry=smoothstep(.12,.38,slope);
      const rock=smoothstep(.34,.95,slope);
      color.copy(grass).lerp(dryGrass,dry).lerp(limestone,rock);
      // Faceted, stratified limestone variation derived from source
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
return geometry;
}
