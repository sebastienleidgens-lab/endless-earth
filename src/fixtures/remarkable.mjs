// Original validation data only. No real coordinates, place, survey or IGN datum.
export const SYNTHETIC_DATUM='SYNTHETIC-METRES';
export const REMARKABLE_FIXTURES=['relief','bridge','atlantic-site'];
// Canonical synthetic data: libm last-bit differences must not change bindings.
const fixed=v=>Math.round(v*1e6)/1e6;
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
const box=(x0,z0,x1,z1)=>[{x:x0,z:z0},{x:x1,z:z0},{x:x1,z:z1},{x:x0,z:z1}];
export function syntheticRefinement(g,height){
 const cells=[],selected=new Set();
 for(let z=1;z<g.height-2;z++)for(let x=0;x<g.width-1;x++){const x0=g.origin_x_m+x*g.step_m,z0=g.origin_z_m+z*g.step_m,i=z*g.width+x,h=g.elevations_m;if(Math.abs(height(x0+5,z0+5)-(h[i]+h[i+1]+h[i+g.width]+h[i+g.width+1])/4)>=.3)selected.add(x+':'+z)}
 for(const key of selected){const [x,z]=key.split(':').map(Number),x0=g.origin_x_m+x*10,z0=g.origin_z_m+z*10,i=z*g.width+x,h=g.elevations_m,vertices=[x0,h[i],z0,x0+10,h[i+1],z0,x0+10,h[i+g.width+1],z0+10,x0,h[i+g.width],z0+10],indices=[],id=(xx,zz)=>4+(zz-1)*9+xx-1;
  for(let zz=1;zz<=9;zz++)for(let xx=1;xx<=9;xx++)vertices.push(x0+xx,fixed(height(x0+xx,z0+zz)),z0+zz);
  for(let zz=1;zz<9;zz++)for(let xx=1;xx<9;xx++){const a=id(xx,zz),b=id(xx+1,zz),c=id(xx,zz+1),d=id(xx+1,zz+1);indices.push(a,b,d,a,d,c)}
  // Fine/fine neighbours share sampled edges. The coarse interface retains
  // its original two corners; no T junction and no periodic coarse-edge fins.
  const stitch=(a,b,line,neighbour)=>{if(!selected.has(neighbour)){indices.push(a,b,line.at(-1));for(let j=line.length-1;j>0;j--)indices.push(a,line[j],line[j-1]);return}const edge=[a];for(let j=1;j<10;j++){const xx=vertices[a*3]+(vertices[b*3]-vertices[a*3])*j/10,zz=vertices[a*3+2]+(vertices[b*3+2]-vertices[a*3+2])*j/10;edge.push(vertices.length/3);vertices.push(xx,fixed(height(xx,zz)),zz)}edge.push(b);indices.push(a,edge[1],line[0]);for(let j=1;j<9;j++)indices.push(edge[j],edge[j+1],line[j],edge[j],line[j],line[j-1]);indices.push(edge[9],b,line[8])};
  stitch(0,1,Array.from({length:9},(_,i)=>id(i+1,1)),x+':'+(z-1));stitch(1,2,Array.from({length:9},(_,i)=>id(9,i+1)),(x+1)+':'+z);stitch(2,3,Array.from({length:9},(_,i)=>id(9-i,9)),x+':'+(z+1));stitch(3,0,Array.from({length:9},(_,i)=>id(1,9-i)),(x-1)+':'+z);cells.push({x,z,vertices,indices});
 }
 return {schema:'endless-earth-terrain-refinement-v1',verticalDatum:SYNTHETIC_DATUM,baseSpacingM:g.step_m,provenance:{license:'CC0-1.0',sourceUrl:'urn:endless-earth:synthetic-validation:mission-14'},cells};
}
function part(kind,triangles){const position=[],normal=[],index=[];for(const input of triangles){const triangle=input.map(p=>p.map(fixed)),[a,b,c]=triangle,u=b.map((v,i)=>v-a[i]),v=c.map((q,i)=>q-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n)||1;for(const p of triangle){index.push(index.length);position.push(...p);normal.push(...n.map(q=>Math.round(q/len*32767)))}}return {kind,position,index,normal}}
function cuboid(x0,y0,z0,x1,y1,z1){const p=[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],out=[];for(const [a,b,c,d]of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]])out.push([p[a],p[b],p[c]],[p[a],p[c],p[d]]);return out}
export function remarkableFixture(id='relief'){
 if(!REMARKABLE_FIXTURES.includes(id))throw RangeError('Unknown synthetic remarkable fixture');
 const height=id==='relief'?(x,z)=>4+15*(Math.tanh((x+3)/2)+1)/2+z*.03+.7*Math.sin(z*.11):id==='bridge'?(x,z)=>6+14*smooth(12,20,Math.abs(x))+.02*x:(x,z)=>8+3*Math.sin(x*.025)+2*Math.cos(z*.04)+.025*z;
 const grid={schema:'endless-earth-terrain-v1',origin_x_m:-60,origin_z_m:-60,step_m:10,width:13,height:13,elevations_m:[],vertical_datum:SYNTHETIC_DATUM,source:'Original synthetic validation data · CC0-1.0 · not a real place'};for(let z=-60;z<=60;z+=10)for(let x=-60;x<=60;x+=10)grid.elevations_m.push(fixed(height(x,z)));
 const raw={schema:'endless-earth-landmarks-v1',verticalDatum:SYNTHETIC_DATUM,bindings:{synthetic:id},objects:[],collisionFeatures:[]},navigation=[],buildings=[],features=[];
 if(id==='bridge'){
  const top=x=>20+.02*x,p=[[-24,top(-24),-2],[24,top(24),-2],[24,top(24),2],[-24,top(-24),2]],beam=[...cuboid(-24,18.8,-2,24,19.98,2).map(t=>t.map(([x,y,z])=>[x,y+.02*x,z])),...cuboid(-9,5.5,-1.3,-7,19,1.3),...cuboid(7,5.5,-1.3,9,19,1.3)],rails=[];
  for(const z of [-2.1,2.1]){rails.push(...cuboid(-24,21.1,z-.06,24,21.25,z+.06).map(t=>t.map(([x,y,z])=>[x,y+.02*x,z])));for(let x=-24;x<=24;x+=4)rails.push(...cuboid(x-.06,top(x),z-.06,x+.06,21.15+.02*x,z+.06));navigation.push({tags:{barrier:'fence',width:'.12'},points:[{x:-24,z},{x:24,z}]})}
  raw.objects.push({id:'synthetic-beam-span',featureId:'synthetic-span',confidence:'synthetic, fully invented for interface validation',supportPart:0,parts:[part('road',[[p[0],p[2],p[1]],[p[0],p[3],p[2]]]),part('stone',beam),part('metal',rails)]});navigation.push({tags:{natural:'water'},polygon:true,points:box(-16,-60,16,60)},{tags:{highway:'footway',bridge:'yes',width:'4'},points:[{x:-24,z:0},{x:24,z:0}],featureId:'synthetic-span'});
 }else if(id==='atlantic-site'){
  // Two low curved wall fragments around an open granite outlook, no castle.
  const stone=[];for(let i=0;i<14;i++){const a=(-.3+i*.12),b=a+.12,r=11,x0=Math.sin(a)*r,z0=Math.cos(a)*r,x1=Math.sin(b)*r,z1=Math.cos(b)*r,ground=Math.max(height(x0,z0),height(x1,z1));stone.push(...cuboid(Math.min(x0,x1)-.25,ground-1,Math.min(z0,z1)-.25,Math.max(x0,x1)+.25,ground+1.2+(i%3)*.22,Math.max(z0,z1)+.25));navigation.push({tags:{barrier:'wall',width:'.6'},points:[{x:x0,z:z0},{x:x1,z:z1}]})}
  stone.push(...cuboid(-7,height(-7,-3),-3,-4,height(-7,-3)+3.1,0));raw.objects.push({id:'synthetic-granite-lookout',featureId:'synthetic-lookout',confidence:'synthetic, not an actual monument',parts:[part('stone',stone)]});
  buildings.push({rings:[box(-28,-24,-20,-13)],tags:{building:'house',height:'7',osm_id:'synthetic-regional-house'}});features.push({tags:{natural:'wood'},rings:[box(-52,5,-26,52)]});
 }
 const road=id==='relief'?{tags:{highway:'path',width:'3'},points:[{x:16,z:-50},{x:16,z:50}]}:id==='bridge'?{tags:{highway:'footway',width:'4'},points:[{x:-55,z:0},{x:-24,z:0},{x:24,z:0},{x:55,z:0}]}:{tags:{highway:'path',width:'3'},points:[{x:18,z:-50},{x:18,z:50}]};navigation.push(road);
 return {id,synthetic:true,provenance:'Original synthetic CC0-1.0 geometry. Local metres; no geographic position, real monument, measured survey or IGN69 claim.',datum:SYNTHETIC_DATUM,region:id==='atlantic-site'?'atlantic':'mediterranean',height,grid,raw,navigation,road,buildings,features,refinement:id==='relief'?syntheticRefinement(grid,height):null};
}

// Appearance is independent of this local geographic/geometry binding.
export function remarkableSource(f){return JSON.stringify({id:f.id,datum:f.datum,grid:f.grid.elevations_m,refinement:f.refinement,landmarks:f.raw})}
