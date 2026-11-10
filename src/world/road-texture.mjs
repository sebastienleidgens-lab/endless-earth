// Original CPU-generated, periodic material atlas. No external photographs.
// RGBA = mineral tone, relief height, stone variation, 255. Each quadrant
// repeats seamlessly; the shader blends a second, rotated scale to hide tiling.
export const ROAD_TILE_PIXELS=256;
export const ROAD_TILE_GUTTER=16;
const fract=x=>x-Math.floor(x),mix=(a,b,t)=>a+(b-a)*t;
export function hash(x,y,seed=0){let n=Math.imul(x+seed*131,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
export function noise(x,y,period,seed=0){
 const ix=Math.floor(x),iy=Math.floor(y),fx=fract(x),fy=fract(y),sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
 const at=(a,b)=>hash((a%period+period)%period,(b%period+period)%period,seed);
 return mix(mix(at(ix,iy),at(ix+1,iy),sx),mix(at(ix,iy+1),at(ix+1,iy+1),sx),sy);
}
export function materialPixel(kind,u,v){
 const fine=noise(u*128,v*128,128,11),medium=noise(u*32,v*32,32,17),broad=noise(u*8,v*8,8,23);
 let tone=.5,height=.5,stone=.5;
 if(kind===0){ // asphalt: 8–30 mm aggregate; restrained dry mineral relief
  tone=.5+(fine-.5)*.55+(medium-.5)*.24+(broad-.5)*.14;
  height=fine*.7+medium*.3;stone=medium;
 }else if(kind===1){ // 4 m tile: 20 courses, 13/17 stones/course, ~20 × 24–31 cm
  const row=Math.floor(v*20),fy=fract(v*20),shift=hash(row,0,31)*.6+(row%2)*.5,columns=row%3===0?13:17;
  const px=u*columns+shift,col=Math.floor(px),fx=fract(px),id=hash((col%columns+columns)%columns,row%20,43);
  const warp=(medium-.5)*.045,joint=Math.min(fx+warp,1-fx-warp,fy+(fine-.5)*.025,1-fy-(fine-.5)*.025);
  const edge=Math.max(0,Math.min(1,(joint-.012)/.07));
  height=.16+edge*(.45+id*.16)+(fine-.5)*.10;
  tone=.40+edge*.10+(id-.5)*.18+(medium-.5)*.08+(fine-.5)*.07;stone=id;
 }else if(kind===2){ // gravel: periodic cellular stones, ~2–8 cm plus fine matrix
  const px=u*64,py=v*64,ix=Math.floor(px),iy=Math.floor(py);let best=10,id=0;
  for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++){
   const xx=ix+x,yy=iy+z,a=(xx%64+64)%64,b=(yy%64+64)%64;
   const dx=xx+.18+hash(a,b,51)*.64-px,dy=yy+.18+hash(a,b,57)*.64-py,d=dx*dx+dy*dy;
   if(d<best){best=d;id=hash(a,b,61);}
  }
  const pebble=Math.max(0,1-Math.sqrt(best)*1.8);
  height=.25+pebble*.55+(fine-.5)*.16;
  tone=.47+(id-.5)*.32+pebble*.09+(medium-.5)*.14;stone=id;
 }else{ // earth / unclassified rural soil: no tracks, cracks or invented paving
  tone=.5+(medium-.5)*.30+(broad-.5)*.34+(fine-.5)*.12;
  height=.5+(medium-.5)*.48+(fine-.5)*.20;stone=broad;
 }
 return [tone,height,stone,1];
}
export function createRoadAtlas(size=ROAD_TILE_PIXELS,channels=4){
 if(channels!==2&&channels!==4)throw new Error("Road atlas requires RG or RGBA");
 const gutter=ROAD_TILE_GUTTER,stride=size+gutter*2,width=stride*2,data=new Uint8Array(width*width*channels);
 for(let kind=0;kind<4;kind++)for(let y=0;y<stride;y++)for(let x=0;x<stride;x++){
  const i=((y+Math.floor(kind/2)*stride)*width+x+(kind%2)*stride)*channels;
  const pixel=materialPixel(kind,fract((x-gutter+.5)/size),fract((y-gutter+.5)/size));
  for(let c=0;c<channels;c++)data[i+c]=Math.round(Math.max(0,Math.min(1,pixel[c]))*255);
 }
 return {data,width,height:width};
}
// A small CPU reference for tests and tooling; independent of tessellation.
export const roadUV=(x,z,tileMetres)=>[x/tileMetres,z/tileMetres];
