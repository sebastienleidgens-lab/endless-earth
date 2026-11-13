import * as THREE from 'three';
// Original, generic temperate architecture. No local species identification.
// Derived artistically from the four approved Mission 17A references.
export const FOREST_VERSION='branch-attached-forest-v2';
const form=(label,height,width,trunk,base,stem,limbs,rise,gravity,options={})=>Object.freeze({label,height,width,trunk,base,stem,limbs,rise,gravity,flex:1,leaf:0,...options});
export const FOREST_LIBRARY=Object.freeze({
 spreading:form('Grand feuillu étalé',[11,19],16,.50,2.7,.36,9,4.8,0,{inner:true}),
 high:form('Feuillu à cime haute',[16,24],12,.36,8.1,.83,10,2.1,0),
 slender:form('Feuillu élancé',[12,22],8,.25,4.8,.94,13,1.4,-.1,{leaf:1,flex:1.2}),
 riverside:form('Feuillu de berge',[8,17],12,.38,2.5,.64,8,2.6,1.15,{leaf:2,flex:1.4}),
 pendant:form('Ramure retombante',[8,15],14,.44,2.8,.57,7,2.9,2.0,{leaf:2,flex:1.6,arch:.6}),
 young:form('Jeune feuillu',[2.7,6.5],3.8,.065,1.1,.91,8,.65,0,{leaf:1,flex:1.8}),
 asymmetric:form('Feuillu mature asymétrique',[10,20],16,.53,3.1,.50,7,3.7,.1,{lean:1.6,asym:.42,inner:true}),
 small:form('Petit arbre isolé',[4,9],7,.19,1.8,.49,7,1.9,.1,{inner:true}),
 dense:form('Couronne dense et arrondie',[8,16],12,.38,2.4,.57,11,2.8,.2,{inner:true,dense:true}),
 needle:form('Conifère à étages irréguliers',[8,23],8,.29,2.2,.98,20,.2,.1,{leaf:3,evergreen:true,flex:.7}),
 orchard:form('Petit arbre de verger',[3.5,7.5],6.5,.17,1.2,.40,6,2,.05,{inner:true,habitat:'orchard'}),
});
export function forestHash(x,z,salt=0){let h=2166136261;for(const ch of `${x.toFixed(6)}:${z.toFixed(6)}:${salt}`){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
const rand=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296};
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
export function forestPoint(points,t){const f=THREE.MathUtils.clamp(t,0,1)*(points.length-1),i=Math.min(points.length-2,Math.floor(f));return points[i].clone().lerp(points[i+1],f-i)}
export function forestSkeleton(id,seed=forestHash(id.length,17,Object.keys(FOREST_LIBRARY).indexOf(id))){
 const c=FOREST_LIBRARY[id];if(!c)throw Error('Unknown forest form '+id);const r=rand(seed),branches=[],sprigs=[],h=c.height[1]*.84;
 const branch=(parent,t,delta,radius,order,arch=0)=>{const start=parent?forestPoint(parent.points,t):V(),points=[start],steps=order?4:9,side=V(-delta.z,0,delta.x).normalize().multiplyScalar((r()-.5)*delta.length()*.17);
  for(let i=1;i<=steps;i++){const u=i/steps,p=start.clone().addScaledVector(delta,u).addScaledVector(side,Math.sin(u*Math.PI));p.y+=arch*Math.sin(u*Math.PI);if(!order){p.x+=Math.sin(u*6.4)*c.trunk*.35;p.z+=Math.sin(u*4.7)*c.trunk*.4}points.push(p)}
  const b={id:branches.length,parent:parent?.id??null,t,radius,order,points};branches.push(b);return b};
 const trunk=branch(null,0,V(c.lean??.16,h*c.stem,.12),c.trunk,0);
 for(let i=0;i<c.limbs;i++){
  const u=i/(c.limbs-1),t=THREE.MathUtils.clamp((c.base+(h*c.stem-c.base)*u*.91)/Math.max(1,h*c.stem),.12,.98),a=i*2.399963+r()*.5;
  const inner=c.inner&&i%3===1,shape=c.evergreen?Math.pow(1-u,.8):c.stem>.8?Math.pow(Math.sin((.08+u*.88)*Math.PI),.75):.78+.22*Math.sin(u*Math.PI);
  const reach=c.width*.36*shape*(.8+r()*.25)*(inner?.3:1)*(1+(c.asym??0)*Math.cos(a));
  const main=branch(trunk,t,V(Math.cos(a)*reach,c.rise*(inner?1.10:1)*(.82+r()*.3),Math.sin(a)*reach),c.trunk*(c.stem>.8?.27:.48)*(1-u*.68),1,c.arch??-.12);
  const count=c.evergreen?3:c.dense||c.inner?4:3;
  for(let j=0;j<count;j++){
   const st=.25+j/(count-1)*.69,az=a+(j%2?1:-1)*(.65+r()*.55),l=c.width*(c.evergreen?.085:.13)*(.8+r()*.35);
   const secondary=branch(main,st,V(Math.cos(az)*l,c.evergreen?.05:(c.gravity?-.1:.65+r()*.6),Math.sin(az)*l),main.radius*.28,2,c.gravity?.25:.08);secondary.sprayIndex=j;
   // Every small foliage spray grows on a real third-order shoot.
   for(let k=0;k<3;k++){
    const tt=.22+k*.36,aa=az+(k%2?-.8:.9),length=(id==='young'?.46:id==='small'||id==='orchard'?.7:1.15)*(.7+r()*.5),d=V(Math.cos(aa)*length,-c.gravity*(.65+r()*.6)+(c.gravity?0:r()*.65),Math.sin(aa)*length);
    const twig=branch(secondary,tt,d,Math.max(id==='young'?.006:.009,secondary.radius*.3),3,c.gravity?.15:.08);
    for(let n=0;n<(c.dense?4:3);n++){
     const at=.20+n/(c.dense?3:2)*.77,attachment=forestPoint(twig.points,at),direction=d.clone().normalize().add(V((r()-.5)*.6,c.gravity?-.15:.15,(r()-.5)*.6)).normalize();
     sprigs.push({id:sprigs.length,branch:twig.id,t:at,attachment,direction,roll:r()*Math.PI*2,length:(id==='young'?.75:id==='small'||id==='orchard'?1.0:1.55)*(.8+r()*.35),width:c.evergreen?.60:c.leaf===2?.83:1.18,keep:r(),shade:.76+r()*.26});
    }
   }
  }
 }
 const fineSprigs=[];
 for(const s of sprigs){const parent=branches[s.branch],length=s.length*.43,shoot=branch(parent,s.t,s.direction.clone().multiplyScalar(length),Math.max(.003,parent.radius*.34),4,.03);
  for(let j=0;j<3;j++){const at=.22+j*.34,attachment=forestPoint(shoot.points,at),side=V(-s.direction.z,0,s.direction.x).normalize().multiplyScalar((j%2?-.6:.6)),direction=s.direction.clone().add(side).normalize();fineSprigs.push({...s,id:fineSprigs.length,branch:shoot.id,t:at,attachment,direction,length:s.length*.67,width:s.width*.63,roll:s.roll+j*2.4,keep:r(),shade:.76+r()*.26})}
 }
 return {id,config:c,height:h,branches,sprigs,fineSprigs,seed};
}
const arrays=()=>({position:[],normal:[],color:[],uv:[],natureCluster:[],forestData:[],forestPrimary:[],forestSecondary:[],forestTwig:[],forestLeafRoot:[],forestLeafAxis:[],index:[]});
function vert(a,p,n,col,uv,keep,height,flex,leaf){const i=a.position.length/3;a.position.push(...p.toArray());a.normal.push(...n.toArray());a.color.push(...col.toArray());a.uv.push(...uv);a.natureCluster.push(keep);a.forestData.push(height,flex,leaf);return i}
function motionVertex(a,tree,branch,root=null,axis=null){
 const chain=[];let b=branch;while(b){chain.push(b);b=b.parent===null?null:tree.branches[b.parent]}
 const encode=p=>p.toArray().map(v=>Math.round(THREE.MathUtils.clamp((v+32)/64,0,1)*65535));
 for(const [order,key]of [[1,'forestPrimary'],[2,'forestSecondary'],[3,'forestTwig']]){const j=chain.find(b=>b.order===order);a[key].push(...encode(j?j.points[0]:V()),j?Math.round((.02+((j.id*.61803398875)%1)*.96)*65535):0)}
 a.forestLeafRoot.push(...encode(root??V()));a.forestLeafAxis.push(...(axis??V(0,1,0)).toArray().map(v=>Math.round((v*.5+.5)*65535)));
}
function finish(a,name){const g=new THREE.BufferGeometry();g.name=name;g.setAttribute('position',new THREE.Float32BufferAttribute(a.position,3));g.setAttribute('normal',new THREE.Int16BufferAttribute(a.normal.map(v=>Math.round(v*32767)),3,true));g.setAttribute('color',new THREE.Uint8BufferAttribute(a.color.map(v=>Math.round(THREE.MathUtils.clamp(v,0,1)*255)),3,true));g.setAttribute('uv',new THREE.Float32BufferAttribute(a.uv,2));g.setAttribute('natureCluster',new THREE.Float32BufferAttribute(a.natureCluster,1));g.setAttribute('forestData',new THREE.Float32BufferAttribute(a.forestData,3));for(const key of ['forestPrimary','forestSecondary','forestTwig'])g.setAttribute(key,new THREE.Uint16BufferAttribute(a[key],4,true));for(const key of ['forestLeafRoot','forestLeafAxis'])g.setAttribute(key,new THREE.Uint16BufferAttribute(a[key],3,true));g.setIndex(a.index);g.computeBoundingBox();g.computeBoundingSphere();g.boundingSphere.radius+=1;return g}
export function forestGeometry(tree,lod=0){
 const wood=arrays(),leaves=arrays(),c=tree.config;
 for(const b of tree.branches){if(lod===2&&(b.order>2||c.inner&&b.order===2&&b.sprayIndex===1)||lod===1&&b.order>3)continue;const sides=!b.order?(lod===0?10:lod===1?6:4):lod===0?(b.order===1?6:b.order===2?4:3):lod===1?3:2,steps=!b.order?(lod===0?9:3):lod===0?(b.order===1?4:2):1;
  for(let j=0;j<=steps;j++){
   const t=j/steps,p=forestPoint(b.points,t);if(!b.order&&j===0)p.y=-.7;
   const tangent=forestPoint(b.points,Math.min(1,t+.02)).sub(forestPoint(b.points,Math.max(0,t-.02))).normalize(),x=V(0,0,1).cross(tangent).normalize(),z=tangent.clone().cross(x).normalize(),radius=b.radius*(.13+.87*Math.pow(1-t,.9))*(!b.order?1+.25*Math.exp(-t*13):1);
   for(let k=0;k<sides;k++){const a=k/sides*Math.PI*2,n=x.clone().multiplyScalar(Math.cos(a)).addScaledVector(z,Math.sin(a)),col=new THREE.Color(0x817969).multiplyScalar(.85+.15*Math.sin(k*2.7+b.id)**2),idx=vert(wood,p.clone().addScaledVector(n,radius),n,col,[0,0],-1,tree.height,c.flex,0);motionVertex(wood,tree,b);if(j<steps){const base=idx-k,next=(k+1)%sides;wood.index.push(idx,base+sides+k,base+sides+next,idx,base+sides+next,base+next)}}
  }
 }
 const sprays=lod===2?tree.branches.filter(b=>b.order===2&&!(c.inner&&b.sprayIndex===1)).map(b=>({branch:b.id,attachment:forestPoint(b.points,.22),direction:b.points.at(-1).clone().sub(b.points[0]).normalize(),roll:b.id*2.4,length:tree.id==='young'?1.4:tree.id==='small'||tree.id==='orchard'?2.1:3.0,width:tree.id==='young'?1.35:c.leaf===2?2.7:3.3,keep:(b.id*.618)%1,shade:.95})):lod===0?tree.fineSprigs:tree.sprigs.filter((_,i)=>i%3!==1);
 for(const s of sprays){
  const forward=s.direction.clone(),side=V(0,1,0).cross(forward).normalize().applyAxisAngle(forward,s.roll),length=s.length*(lod===1?1.17:1),width=s.width*(lod===1?1.12:1);
  // Two small planes give each branch-rooted shoot depth; far keeps the stem
  // rooted exactly at the retained secondary branch, encoded in the alpha art.
  for(let plane=0;plane<2;plane++){
   const crossSide=side.clone().applyAxisAngle(forward,plane*Math.PI*.5),crossNormal=forward.clone().cross(crossSide).normalize(),base=leaves.position.length/3;
   const shape=lod<2?[[0,0,0],[.44,-.5,0],[1,0,0],[.44,.5,0],[.48,0,.10]]:[[0,0,0],[.5,-.5,0],[1,0,0],[.5,.5,0]];
   for(const [u,v,fold]of shape){const p=s.attachment.clone().addScaledVector(forward,u*length).addScaledVector(crossSide,v*width).addScaledVector(crossNormal,fold*width),col=new THREE.Color(c.evergreen?0x66845c:c.leaf===2?0x9aab72:0x89a55c).multiplyScalar(s.shade*(.84+.16*Math.min(1,p.y/tree.height)));vert(leaves,p,crossNormal,col,[(c.leaf+(v+.5)*.91+.045)/4,(lod===2?.5:0)+(.045+u*.91)*.5],s.keep,tree.height,c.flex,1);motionVertex(leaves,tree,tree.branches[s.branch],s.attachment,forward)}
   for(const [a,b,d]of lod<2?[[0,1,4],[1,2,4],[2,3,4],[3,0,4]]:[[0,1,2],[0,2,3]])leaves.index.push(base+a,base+b,base+d);
  }
 }
 const result={wood:finish(wood,`forest-${tree.id}-${lod}-wood`),leaves:finish(leaves,`forest-${tree.id}-${lod}-leaves`),lod};return result;
}
export function createForestModels(){const models=new Map();for(const id of Object.keys(FOREST_LIBRARY)){const tree=forestSkeleton(id),levels=[0,1,2].map(lod=>forestGeometry(tree,lod)),box=levels.reduce((b,l)=>b.union(l.wood.boundingBox).union(l.leaves.boundingBox),new THREE.Box3()),crownBox=levels.reduce((b,l)=>b.union(l.leaves.boundingBox),new THREE.Box3());models.set(id,{id,tree,levels,height:box.max.y,radius:Math.max(Math.hypot(box.min.x,box.min.z),Math.hypot(box.max.x,box.max.z)),box,crownBox})}return models}

export function forestIdentity(p,context={}){
 const seed=forestHash(p.x,p.z),f=seed/4294967296;
 const evergreen=p.leaf==='needle'&&p.kind!=='riparian';let id=evergreen?'needle':p.kind==='riparian'?(seed%3?'riverside':'pendant'):p.kind==='young'?(seed%5?'young':'small'):context.habitat==='orchard'?'orchard':['spreading','high','slender','asymmetric','dense','spreading','high','small'][seed%8];
 return {id,seed,phase:f,width:.88+(seed>>>9)%1024/1024*.26,depth:.90+(seed>>>19)%1024/1024*.22,age:(forestHash(p.x,p.z,21)%1024)/1024,density:.89+(seed>>>6)%128/128*.11,form:[((seed>>>12)%256/255-.5)*.20,.82+(seed>>>3)%256/255*.36,((seed>>>16)%256/255-.5)*.22,.80+(seed>>>22)%256/255*.40],evergreen,yaw:f*Math.PI*2,lean:((seed>>>7)%256/255-.5)*.045};
}
export function forestLayout(p,context,models){
 const identity=forestIdentity(p,context);if(['spreading','high','dense','asymmetric'].includes(identity.id)){identity.width*=1.28;identity.depth*=1.28}let id=identity.id,model=models.get(id),c=FOREST_LIBRARY[id],height=c.height[0]+(c.height[1]-c.height[0])*(.35*identity.age+.65*THREE.MathUtils.clamp((p.scale-(p.kind==='young'?.45:.8))/(p.kind==='young'?.3:.8),0,1));
 const clearance=context?.clearance??Infinity,available=Math.max(.7,clearance-.85);
 let sy=height/model.height,sx=sy*identity.width,sz=sy*identity.depth,radius=model.radius*Math.max(sx,sz)+height*Math.abs(identity.lean)+.65;
 if(radius>available&&!identity.evergreen){
  const alternatives=identity.id==='riverside'||identity.id==='pendant'?['riverside','slender','young']:['slender','small','young'];
  for(const alternate of alternatives){const next=models.get(alternate),d=FOREST_LIBRARY[alternate],fitHeight=Math.min(height,d.height[1],(available-.65)/(next.radius*Math.max(identity.width,identity.depth)/next.height+Math.abs(identity.lean)));
   if(fitHeight<d.height[0])continue;id=alternate;model=next;c=d;height=fitHeight;sy=height/model.height;sx=sy*identity.width;sz=sy*identity.depth;radius=model.radius*Math.max(sx,sz)+height*Math.abs(identity.lean)+.65;break;
  }
 }
 return {...identity,id,height,scale:[sx,sy,sz],radius,clearance,clear:radius<=available+.001,provenance:p.mapped?'mapped anchor, interpreted architecture':'inferred individual in mapped habitat'};
}

// Four original tiles: broad, oval, narrow riparian, evergreen. No photographs.
export function forestAtlas(size=128){
 const data=new Uint8Array(size*4*size*8),width=size*4;
 for(let band=0;band<2;band++)for(let tile=0;tile<4;tile++){
  const r=rand(711+tile),leaves=[],stems=[];
  for(let j=0;j<(band?5:3);j++){const mid=band?2:1,endX=.5+(j-mid)*(band?.15:.29),endY=.87-Math.abs(j-mid)*(band?.06:.12);stems.push([.5,.04,endX,endY]);for(let n=0;n<13;n++){const t=.18+n*.06,x=.5+(endX-.5)*t,y=.04+(endY-.04)*t,side=n%2?-1:1,angle=Math.atan2(endY-.04,endX-.5)+side*(.8+r()*.55),len=tile===3?.115:(band?.080:.065)+r()*.022,rx=tile===2?(band?.033:.025):tile===3?(band?.015:.011):(band?.048:.033);leaves.push({x:x+Math.cos(angle)*len*.6,y:y+Math.sin(angle)*len*.6,c:Math.cos(angle),s:Math.sin(angle),ry:len,rx,tone:.69+r()*.28,rank:.05+((n*0.61803398875+j*.41421356237)%1)*.90})}}
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const u=(x+.5)/size,v=(y+.5)/size;let alpha=0,tone=.8,rank=0,edge=1;for(const [ax,ay,bx,by]of stems){const dx=bx-ax,dy=by-ay,t=THREE.MathUtils.clamp(((u-ax)*dx+(v-ay)*dy)/(dx*dx+dy*dy),0,1);if(Math.hypot(u-ax-t*dx,v-ay-t*dy)<.008){alpha=255;tone=.47}}
   for(const l of leaves){const dx=u-l.x,dy=v-l.y,along=(dx*l.c+dy*l.s)/l.ry,across=(-dx*l.s+dy*l.c)/l.rx,lobe=tile===0?1+.14*Math.sin(along*15):1;if(along*along+across*across/(lobe*lobe)<1){alpha=255;tone=l.tone*(.92+.08*Math.abs(along));rank=l.rank;edge=Math.min(1,along*along+across*across/(lobe*lobe))}}
   const i=((y+band*size)*width+tile*size+x)*4;data[i]=Math.round(tone*255);data[i+1]=Math.round(rank*255);data[i+2]=Math.round(edge*255);data[i+3]=alpha;
  }
 }
 return {data,width,height:size*2};
}
