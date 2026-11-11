// Original deterministic leaf-spray artwork. No photographic or third-party asset.
export function leafSprayPixels(size=256){
 const data=new Uint8Array(size*size*4),leaves=[];
 const rand=n=>{let v=n+137;v=Math.imul(v^(v>>>16),0x7feb352d);v=Math.imul(v^(v>>>15),0x846ca68b);return ((v^(v>>>16))>>>0)/4294967296};
 for(let i=0;i<110;i++){const a=rand(i*7)*Math.PI*2,r=Math.sqrt(rand(i*7+1))*.44,angle=rand(i*7+4)*Math.PI;leaves.push({x:.5+Math.cos(a)*r,y:.5+Math.sin(a)*r,rx:.05+rand(i*7+2)*.045,ry:.025+rand(i*7+3)*.025,c:Math.cos(angle),s:Math.sin(angle),t:.62+rand(i*7+5)*.35});}
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=(x+.5)/size,v=(y+.5)/size;let alpha=0,tone=.8;
  for(const l of leaves){const dx=u-l.x,dy=v-l.y;if(Math.abs(dx)>.12||Math.abs(dy)>.12)continue;const px=(dx*l.c+dy*l.s)/l.rx,py=(-dx*l.s+dy*l.c)/l.ry,d=px*px+py*py;if(d<1){alpha=1;tone=l.t*(.92+.08*Math.abs(px));}}
  const i=(y*size+x)*4;data[i]=Math.round(tone*255);data[i+1]=Math.round(tone*255);data[i+2]=Math.round(tone*255);data[i+3]=alpha*255;
 }
 return {data,width:size,height:size};
}
