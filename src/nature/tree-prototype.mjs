import * as THREE from 'three';

// Mission 17A prototypes only. Metres, original art, no surveyed species claim.
export const TREE_PROTOTYPE_VERSION='branch-attached-prototypes-v1';
export const TREE_ARCHETYPES=Object.freeze({
 spreading:{label:'Feuillu étalé · inspiration chêne',height:14.5,width:16.4,trunk:.56,base:2.7,limbs:10,leaf:.23,color:0x71854b,bark:0x6a6251,seed:1711},
 slender:{label:'Feuillu élancé · cime haute',height:19.2,width:9.2,trunk:.29,base:5.2,limbs:17,leaf:.18,color:0x789652,bark:0xaaa492,seed:1723},
 riverside:{label:'Arbre de berge · rameaux souples',height:13.3,width:15,trunk:.46,base:2.6,limbs:10,leaf:.25,color:0x8b9b62,bark:0x746d56,seed:1733},
 young:{label:'Jeune feuillu · flèche et branches',height:4.2,width:3.4,trunk:.065,base:1.0,limbs:9,leaf:.13,color:0x87a158,bark:0x827e62,seed:1741},
});
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
function random(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}}
function sample(path,t){const u=THREE.MathUtils.clamp(t,0,1)*(path.length-1),i=Math.min(path.length-2,Math.floor(u));return path[i].clone().lerp(path[i+1],u-i)}

export function createTreeSkeleton(id='spreading',seed=TREE_ARCHETYPES[id]?.seed){
 const c=TREE_ARCHETYPES[id];if(!c)throw Error('Unknown prototype '+id);
 const rnd=random(seed),branches=[],leaves=[];
 function branch(parent,t,delta,radius,order,arch=0){
  const start=parent?sample(parent.points,t):V(),length=delta.length(),points=[start];
  const side=V(-delta.z,0,delta.x).normalize().multiplyScalar((rnd()-.5)*length*.15);
  const count=order===0?16:order===1?8:order===2?5:3;
  for(let i=1;i<=count;i++){const u=i/count,p=start.clone().addScaledVector(delta,u).addScaledVector(side,Math.sin(u*Math.PI)+.28*Math.sin(u*Math.PI*3));p.y+=arch*Math.sin(u*Math.PI);if(order===0){p.x+=Math.sin(u*8.1)*radius*.35;p.z+=Math.sin(u*5.7)*radius*.25}points.push(p)}
  const b={id:branches.length,parent:parent?.id??null,t,order,radius,points,length};branches.push(b);return b;
 }
 const h=c.height,isSpread=id==='spreading',wet=id==='riverside',young=id==='young';
 const trunkHeight=isSpread?h*.36:wet?h*.65:h;
 const trunk=branch(null,0,V((rnd()-.5)*.7,trunkHeight,(rnd()-.5)*.7),c.trunk,0);
 // Buttress roots terminate at the same ground datum; never raise the anchor.
 for(let i=0;i<(young?4:7);i++){const a=i*2.39996,r=c.trunk*(2.2+rnd());const b=branch(trunk,.025,V(Math.cos(a)*r,-trunkHeight*.025,Math.sin(a)*r),c.trunk*.46,1,.04);b.root=true;}
 for(let i=0;i<c.limbs;i++){
  const u=i/(c.limbs-1),t=(c.base+(trunkHeight-c.base)*(u*.86+(rnd()-.5)*.065))/trunkHeight;
  const a=i*2.399963+(.5-rnd())*.6;
  const width=c.width*.5*(isSpread?(.78+.25*Math.sin(u*Math.PI)):wet?(.75+.22*Math.sin(u*Math.PI)):Math.pow(Math.sin(Math.PI*(.08+u*.9)),.8));
  const inner=isSpread&&i%3===1;
  const reach=width*(.60+rnd()*.24)*(inner?.24:1),rise=isSpread?(inner?6.6:4.3)+rnd()*1.6-u*.6:wet?2.8+rnd()*.7:young?.5+rnd()*.6:1.2+rnd()*1.1;
  const main=branch(trunk,t,V(Math.cos(a)*reach,rise,Math.sin(a)*reach),c.trunk*(isSpread?.49:wet?.40:.28)*(1-u*.67),1,isSpread?-.28:wet?.35:.2);
  const secondaryCount=young?4:id==='slender'?5:isSpread?9:7;
  for(let j=0;j<secondaryCount;j++){
   const st=.20+j/(secondaryCount-1)*.76,spread=(j%2?1:-1)*(.48+rnd()*.63),az=a+spread;
   const len=(isSpread?2.6:wet?2.3:young?.65:1.6)*(.7+rnd()*.55)*(1-st*.23);
   const secondary=branch(main,st,V(Math.cos(az)*len,(wet?.1:young?.6:isSpread?1.75:1.0)*(0.6+rnd()),Math.sin(az)*len),main.radius*(.26+(1-st)*.14),2,wet?.55:isSpread?-.2:.1);
   const twigs=young||id==='slender'?4:isSpread?7:5;
   for(let k=0;k<twigs;k++){
    const tt=.15+k/(twigs-1)*.81,angle=az+(k%2?1:-1)*(.6+rnd()*.9),l=(young?.42:wet?1.8:1.2)*(.65+rnd()*.8);
    const twig=branch(secondary,tt,V(Math.cos(angle)*l,wet?-1.25-rnd()*1.1:(rnd()+(isSpread?.25:-.15))*l,Math.sin(angle)*l),Math.max(.004,secondary.radius*.28),3,wet?.28:.10);
    // Fine shoots on each twig, each with alternating, physically rooted leaves.
    const shoots=young?3:id==='slender'?4:5;
    for(let q=0;q<shoots;q++){
     const ft=.16+q/(shoots-1)*.80,fa=angle+(q%2?-.9:.9)+(rnd()-.5)*.6,fl=(young?.28:wet?.62:.68)*(.6+rnd()*.7);
     const shoot=branch(twig,ft,V(Math.cos(fa)*fl,wet?-fl*.95:(rnd()-.2)*fl,Math.sin(fa)*fl),young?.002:.0035,4,wet?.03:.05);
     const n=wet?17:young||id==='slender'?12:16;
     for(let l=0;l<n;l++){
      const lt=.08+l/(n-1)*.91,attachment=sample(shoot.points,lt),a=fa+l*2.39996+(rnd()-.5)*.8;
      const size=c.leaf*(.65+rnd()*.65),direction=V(Math.cos(a),wet?-.65:(rnd()-.4)*1.2,Math.sin(a)).normalize();
      leaves.push({id:leaves.length,branch:shoot.id,t:lt,attachment,direction,size,width:wet?.22:id==='slender'?.55:.63,roll:rnd()*Math.PI,phase:rnd(),retention:rnd(),shade:.76+rnd()*.28});
     }
    }
   }
  }
 }
 return {id,seed,version:TREE_PROTOTYPE_VERSION,config:c,branches,leaves};
}

function meshData(){return {position:[],normal:[],color:[],uv:[],treeAttachment:[],treeLeaf:[],treePhase:[],treeKeep:[],index:[]}}
function vertex(out,p,n,color,attachment,leaf,phase,keep,uv=[0,0]){const i=out.position.length/3;out.position.push(...p.toArray());out.normal.push(...n.toArray());out.color.push(...color.toArray());out.uv.push(...uv);out.treeAttachment.push(...attachment.toArray());out.treeLeaf.push(leaf);out.treePhase.push(phase);out.treeKeep.push(keep);return i}
function geometry(out,name){const g=new THREE.BufferGeometry();for(const [k,n]of Object.entries({position:3,treeAttachment:3,treePhase:1,treeKeep:1}))g.setAttribute(k,new THREE.Float32BufferAttribute(out[k],n));g.setAttribute('normal',new THREE.Int16BufferAttribute(out.normal.map(v=>Math.round(v*32767)),3,true));g.setAttribute('color',new THREE.Uint8BufferAttribute(out.color.map(v=>Math.round(THREE.MathUtils.clamp(v,0,1)*255)),3,true));g.setAttribute('treeLeaf',new THREE.Uint8BufferAttribute(out.treeLeaf,1));g.setIndex(out.index);g.name=name;g.computeBoundingBox();g.computeBoundingSphere();g.boundingSphere.radius+=1.2;return g}

// Reference meshing of the explicit skeleton. No spheres, crown shells or cards.
// The optional coarse trunk ring count is not a production forest LOD system.
export function createPrototypeGeometry(tree,detail='reference'){
 const wood=meshData(),foliage=meshData(),c=tree.config;
 for(const b of tree.branches){
  const sides=b.order===0?(detail==='reference'?12:8):b.order===1?8:b.order===2?5:3;
  const steps=b.points.length-1;
  for(let j=0;j<=steps;j++){
   const p=b.points[j],t=j/steps,tangent=b.points[Math.min(j+1,steps)].clone().sub(b.points[Math.max(0,j-1)]).normalize();
   const x=V(0,0,1).cross(tangent).normalize(),z=tangent.clone().cross(x).normalize();
   const radius=b.radius*(.10+.90*Math.pow(1-t,.92))*(b.order===0?1+.25*Math.exp(-t*15):1);
   for(let k=0;k<sides;k++){
    const a=k/sides*Math.PI*2,n=x.clone().multiplyScalar(Math.cos(a)).addScaledVector(z,Math.sin(a)),r=radius*(1+.055*Math.sin(k*3.3+b.id));
    const color=new THREE.Color(c.bark).multiplyScalar(.82+.18*Math.sin(k*2.3+b.id*.8)**2);
    const idx=vertex(wood,p.clone().addScaledVector(n,r),n,color,p,0,b.id*.137,0,[k/sides,b.length*t]);
    if(j<steps){const next=(k+1)%sides,base=idx-k;wood.index.push(idx,base+sides+k,base+sides+next,idx,base+sides+next,base+next)}
   }
  }
 }
 for(const l of tree.leaves){
  const forward=l.direction,side=V(0,1,0).cross(forward).normalize().applyAxisAngle(forward,(l.roll-Math.PI*.5)*.7),normal=forward.clone().cross(side).normalize();
  // The blade starts at its actual shoot. The slim basal triangle is its petiole.
  const pts=[[0,0,0],[.30,-1,.02],[.52,0,.11],[.70,-.78,0],[1,0,-.06],[.70,.78,0],[.30,1,.02]];
  const base=foliage.position.length/3,col=new THREE.Color(c.color).multiplyScalar(l.shade);
  for(const [u,v,r]of pts){const p=l.attachment.clone().addScaledVector(forward,u*l.size).addScaledVector(side,v*l.size*l.width*.5).addScaledVector(normal,r*l.size);vertex(foliage,p,normal,col,l.attachment,1,l.phase,l.retention,[u,v*.5+.5])}
  for(const [a,b,d]of [[0,1,2],[1,3,2],[3,4,2],[4,5,2],[5,6,2],[6,0,2]])foliage.index.push(base+a,base+b,base+d);
 }
 return {wood:geometry(wood,tree.id+'-connected-wood'),foliage:geometry(foliage,tree.id+'-attached-leaves'),tree,detail};
}

export function prototypeMetrics(art){const geometries=[art.wood,art.foliage];return {id:art.tree.id,seed:art.tree.seed,branches:art.tree.branches.length,leaves:art.tree.leaves.length,woodTriangles:art.wood.index.count/3,leafTriangles:art.foliage.index.count/3,bytes:geometries.reduce((n,g)=>n+Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0)+g.index.array.byteLength,0),bounds:new THREE.Box3().copy(art.wood.boundingBox).union(art.foliage.boundingBox).min.toArray().concat(new THREE.Box3().copy(art.wood.boundingBox).union(art.foliage.boundingBox).max.toArray()),drawCalls:2,textures:0}}

// Appearance-only root contact for a proposed placement. Continuous over shared
// vertex positions; no new tree, horizontal anchor or collision is introduced.
export function conformPrototypeRoots(art,anchor,yaw,height){
 const p=art.wood.attributes.position,cs=Math.cos(yaw),sn=Math.sin(yaw);let adjusted=0,maxAdjustment=0;
 for(let i=0;i<p.count;i++){
  const y=p.getY(i);if(y>=.8)continue;
  const x=p.getX(i),z=p.getZ(i),ground=height(anchor.x+x*cs+z*sn,anchor.z-x*sn+z*cs);
  if(!Number.isFinite(ground))continue;
  const d=(ground-anchor.y)*(1-THREE.MathUtils.smoothstep(y,0,.8));p.setY(i,y+d);adjusted++;maxAdjustment=Math.max(maxAdjustment,Math.abs(d));
 }
 art.wood.computeBoundingBox();art.wood.computeBoundingSphere();art.wood.boundingSphere.radius+=1.2;
 return {adjusted,maxAdjustment};
}
