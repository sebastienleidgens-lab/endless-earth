// Appearance only. Habitat weights never assign a use to unknown ground.
import {noise,hash} from './road-texture.mjs';
export const SURFACE_ART_VERSION='endless-earth-surface-art-v1';
export const ART_TILE=256,ART_GUTTER=16,SHORE_RANGE=16;
export const ART_METRES=Object.freeze([1.7,2.8,2.4,27]);
export function habitatWeights(type){
 if(['meadow','open','orchard','garden','scrub'].includes(type))return [1,0,0];
 if(type==='wood')return [0,1,0];
 if(type==='rock')return [0,0,1];
 return [0,0,0];
}
// New original, periodic tone/height tiles. No inferred cracks, tracks or paving.
export function groundPixel(kind,u,v){
 const fine=noise(u*128,v*128,128,113),medium=noise(u*32,v*32,32,127),broad=noise(u*8,v*8,8,131);
 let tone=.5+(medium-.5)*.4+(fine-.5)*.24,height=.5+(medium-.5)*.35+(fine-.5)*.2;
 if(kind===1){
  const fibre=noise(u*128,v*128,128,139),tuft=noise(u*16,v*16,16,149);
  tone=.5+(tuft-.5)*.38+(fibre-.5)*.48+(medium-.5)*.20;
  height=.5+(fibre-.5)*.5+(medium-.5)*.28;
  // Jittered, independently oriented small blades. Periodic roots include the
  // neighbouring cells so neither the tile nor the tuft grid leaves a seam.
  const px=u*28,py=v*28,ix=Math.floor(px),iy=Math.floor(py);let blades=0;
  for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++){
   const a=(ix+x+28)%28,b=(iy+z+28)%28,dx=px-(ix+x+.18+hash(a,b,181)*.64),dy=py-(iy+z+.18+hash(a,b,191)*.64),angle=hash(a,b,193)*Math.PI,cs=Math.cos(angle),sn=Math.sin(angle);
   const along=(dx*cs-dy*sn)/.43,across=(dx*sn+dy*cs)/.07;
   blades=Math.max(blades,Math.max(0,1-along*along-across*across));
  }
  tone+=blades*.14-(tuft-.5)*.06;height+=blades*.22;
 }else if(kind===2){
  // Scattered, centimetre-scale litter impressions; a material, not new objects.
  const x=u*25,y=v*25,ix=Math.floor(x),iy=Math.floor(y),dx=x-ix-.3-hash(ix,iy,167)*.4,dy=y-iy-.3-hash(ix,iy,169)*.4;
  const angle=hash(ix,iy,157)*Math.PI,c=Math.cos(angle),s=Math.sin(angle);
  const a=(c*dx-s*dy)/.38,b=(s*dx+c*dy)/.17;
  const leaf=Math.max(0,1-a*a-b*b)*(.6+hash(ix,iy,163)*.4),vein=Math.max(0,1-Math.abs(b)*9)*Math.max(0,1-a*a);
  tone=.44+leaf*.18+(broad-.5)*.30+(fine-.5)*.12;
  height=.4+leaf*.30+vein*.045+(medium-.5)*.2;
 }else if(kind===3){
  // Alternative procedural rock, retained for the in-engine asset comparison.
  const vein=Math.abs(Math.sin(v*42+noise(u*8,v*8,8,173)*2.2));
  tone=.50+(medium-.5)*.32+(broad-.5)*.30-(1-vein)**8*.13;
  height=.48+(medium-.5)*.28-(1-vein)**8*.22;
 }
 return [tone,height];
}
export function makeGroundAtlas(rock=null){
 const stride=ART_TILE+2*ART_GUTTER,width=stride*2,data=new Uint8Array(width*width*4);
 for(let kind=0;kind<4;kind++)for(let y=0;y<stride;y++)for(let x=0;x<stride;x++){
  const px=((x-ART_GUTTER)%ART_TILE+ART_TILE)%ART_TILE,py=((y-ART_GUTTER)%ART_TILE+ART_TILE)%ART_TILE;
  const out=((y+Math.floor(kind/2)*stride)*width+x+(kind%2)*stride)*4;
  const value=kind===3&&rock?[rock[(py*ART_TILE+px)*2]/255,rock[(py*ART_TILE+px)*2+1]/255]:groundPixel(kind,(px+.5)/ART_TILE,(py+.5)/ART_TILE);
  data[out]=Math.round(Math.max(0,Math.min(1,value[0]))*255);data[out+1]=Math.round(Math.max(0,Math.min(1,value[1]))*255);data[out+2]=0;data[out+3]=255;
 }
 return {data,width,height:width};
}
export function validateSurfaceArt(m,sources){
 if(m?.schema!==SURFACE_ART_VERSION||m.size!==1024||m.range!==SHORE_RANGE||m.atlasSize!==576||m.origin?.length!==2||m.extent?.length!==2||!m.origin.every(Number.isFinite)||!m.extent.every(v=>Number.isFinite(v)&&v>0)||!['terrain','osm','environment'].every(k=>m.sources?.[k]===sources[k])||!['field','atlas'].every(k=>/^[a-f0-9]{64}$/.test(m.hashes?.[k])))throw Error('Invalid or stale surface appearance');
 return m;
}
