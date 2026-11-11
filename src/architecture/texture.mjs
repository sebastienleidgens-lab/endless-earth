// Original periodic material data, prepared offline. RG = tone/relief, B = warmth.
import {noise,hash} from '../world/road-texture.mjs';
export const ARCHITECTURE_ATLAS_VERSION='endless-earth-architecture-atlas-v1';
export const ARCH_TILE=256,ARCH_GUTTER=16;
const fract=x=>x-Math.floor(x),smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
export function architecturePixel(kind,u,v){
 const fine=noise(u*128,v*128,128,203),mid=noise(u*32,v*32,32,211),broad=noise(u*8,v*8,8,223);
 let tone=.72,height=.5,warm=mid;
 if(kind===0){
  // 4 × 2.4 m, eight slightly uneven courses; irregular blocks, restrained joints.
  const row=Math.floor(v*8),fy=fract(v*8),cols=row%3===0?11:row%3===1?9:13;
  const xx=u*cols+hash(row,0,227)*.7,col=Math.floor(xx),fx=fract(xx),id=hash((col%cols+cols)%cols,row,229);
  const warp=(mid-.5)*.10,joint=Math.min(fx+warp,1-fx-warp,fy+(fine-.5)*.04,1-fy-(fine-.5)*.04);
  const stone=smooth(.012,.065,joint);
  tone=.48+stone*.30+(id-.5)*.17+(mid-.5)*.10+(fine-.5)*.08;
  height=.20+stone*(.48+id*.15)+(fine-.5)*.08;warm=id;
 }else if(kind===1){tone=.83+(fine-.5)*.15+(mid-.5)*.10+(broad-.5)*.08;height=.5+(fine-.5)*.27+(mid-.5)*.13;}
 else if(kind===2){
  const row=Math.floor(v*22),fy=fract(v*22),px=u*18+(row%2)*.10,fx=fract(px),col=Math.floor(px),id=hash((col%18+18)%18,row,239);
  const curve=Math.sin(fx*Math.PI),edge=smooth(.01,.07,fy)*smooth(.01,.06,fx);
  tone=.56+curve*.20+edge*.05+(id-.5)*.23+(fine-.5)*.045;
  height=.12+curve*.65*edge;warm=id;
 }else if(kind===3){
  const row=Math.floor(v*16),fy=fract(v*16),px=u*16+(row%2)*.5,fx=fract(px),id=hash(Math.floor(px)%16,row,241),edge=smooth(.015,.065,Math.min(fx,1-fx,fy,1-fy));
  tone=.58+edge*.14+(id-.5)*.18+(fine-.5)*.045;height=.22+edge*.40+(mid-.5)*.12;warm=id;
 }else if(kind===4){
  const fibre=noise(u*128,v*16,128,251);
  tone=.72+(fibre-.5)*.24+(mid-.5)*.09;height=.5+(fibre-.5)*.25;warm=broad;
 }else{tone=.80+(fine-.5)*.06+(broad-.5)*.045;height=.5+(fine-.5)*.08;}
 return [tone,height,warm,1];
}
export function createArchitectureAtlas(size=ARCH_TILE,gutter=ARCH_GUTTER){
 const stride=size+gutter*2,width=stride*3,height=stride*2,data=new Uint8Array(width*height*4);
 for(let kind=0;kind<6;kind++)for(let y=0;y<stride;y++)for(let x=0;x<stride;x++){
  const u=(((x-gutter)%size+size)%size+.5)/size,v=(((y-gutter)%size+size)%size+.5)/size,p=architecturePixel(kind,u,v),i=((y+Math.floor(kind/3)*stride)*width+x+(kind%3)*stride)*4;
  for(let c=0;c<4;c++)data[i+c]=Math.round(Math.max(0,Math.min(1,p[c]))*255);
 }
 return {data,width,height,size,gutter};
}
