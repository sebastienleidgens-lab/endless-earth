import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createTreeSkeleton,createPrototypeGeometry,prototypeMetrics,conformPrototypeRoots,TREE_ARCHETYPES} from '../src/nature/tree-prototype.mjs';
const at=(path,t)=>{const u=t*(path.length-1),i=Math.min(path.length-2,Math.floor(u));return path[i].clone().lerp(path[i+1],u-i)};
for(const id of Object.keys(TREE_ARCHETYPES)){
 test(id+': every branch and leaf has a real parent and exact attachment',()=>{
  const t=createTreeSkeleton(id);assert.equal(t.branches[0].parent,null);
  for(const b of t.branches.slice(1)){assert.ok(b.parent<b.id);assert.ok(b.points[0].distanceTo(at(t.branches[b.parent].points,b.t))<1e-10);assert.ok(b.radius>0)}
  for(const l of t.leaves){assert.equal(t.branches[l.branch].order,4);assert.ok(l.attachment.distanceTo(at(t.branches[l.branch].points,l.t))<1e-10);assert.ok(l.size>=.07&&l.size<.4)}
 });
 test(id+': finite metric meshes retain whole leaves and match the graph',()=>{
  const art=createPrototypeGeometry(createTreeSkeleton(id)),m=prototypeMetrics(art);assert.ok(m.bounds[4]>4&&m.bounds[4]<25);assert.ok(m.bounds[3]-m.bounds[0]<22);assert.ok(m.bytes<30000000);assert.equal(m.drawCalls,2);
  for(const g of [art.wood,art.foliage]){const count=g.attributes.position.count;for(const a of Object.values(g.attributes)){assert.equal(a.count,count);for(const v of a.array)assert.ok(Number.isFinite(v))}for(const i of g.index.array)assert.ok(i<count)}
  for(const l of art.tree.leaves){const a=art.foliage.attributes;assert.ok(Math.abs(a.treeKeep.getX(l.id*7)-l.retention)<1e-6);for(let j=0;j<7;j++){const i=l.id*7+j;assert.ok(Math.abs(a.treeKeep.getX(i)-l.retention)<1e-6);for(let k=0;k<3;k++)assert.ok(Math.abs(a.treeAttachment.array[i*3+k]-l.attachment.getComponent(k))<1e-5)}}
  art.wood.dispose();art.foliage.dispose();
 });
}
test('stable seeds reproduce buffers; archetypes have different architecture and metric scale',()=>{
 const digest=a=>createHash('sha256').update(a.wood.attributes.position.array).update(a.foliage.attributes.position.array).digest('hex');
 const a=createPrototypeGeometry(createTreeSkeleton('spreading')),b=createPrototypeGeometry(createTreeSkeleton('spreading')),c=createPrototypeGeometry(createTreeSkeleton('spreading',99));assert.equal(digest(a),digest(b));assert.notEqual(digest(a),digest(c));
 const tall=prototypeMetrics(createPrototypeGeometry(createTreeSkeleton('slender'))),wet=prototypeMetrics(createPrototypeGeometry(createTreeSkeleton('riverside'))),young=prototypeMetrics(createPrototypeGeometry(createTreeSkeleton('young')));assert.ok(tall.bounds[4]>wet.bounds[4]+6);assert.ok(wet.bounds[3]-wet.bounds[0]>young.bounds[3]-young.bounds[0]+8);assert.ok(tall.bounds[4]>young.bounds[4]*3);
});
test('root contact follows a sloping support without moving the horizontal anchor or upper ramure',()=>{
 const art=createPrototypeGeometry(createTreeSkeleton('young')),p=art.wood.attributes.position,before=p.array.slice(),anchor={x:40,y:7,z:-12};
 const result=conformPrototypeRoots(art,anchor,Math.PI/2,(x,z)=>7+(x-40)*.15+(z+12)*.08);assert.ok(result.adjusted>0&&result.maxAdjustment>.01);
 for(let i=0;i<p.count;i++){assert.equal(p.getX(i),before[i*3]);assert.equal(p.getZ(i),before[i*3+2]);if(before[i*3+1]>=.8)assert.equal(p.getY(i),before[i*3+1]);else if(Math.abs(before[i*3+1])<1e-5){const h=7+before[i*3+2]*.15-before[i*3]*.08;assert.ok(Math.abs(p.getY(i)-(h-7))<1e-5)}}
});
