import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {buildSurface,packSurface} from '../scripts/prepare-road-surface.mjs';
import {roadSegments,partitionRoads,rectangle,area,pc} from '../scripts/lib/road-topology.mjs';
import {roadStyle,roadWidth} from '../src/world/road-style.mjs';
import {decodeSurface} from '../src/world/surface-mesh.mjs';
import {sampleGrid,clipConvex} from '../src/world/terrain-grid.mjs';
const feature=(coordinates,properties={})=>({properties:{highway:'residential',...properties},geometry:{type:'LineString',coordinates}});
const sha=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(readFileSync('public/data/angles-surface.json'));
const packed=gunzipSync(readFileSync('public/data/angles-surface.pack'));
const binary=packed.buffer.slice(packed.byteOffset,packed.byteOffset+packed.byteLength);
const decoded=decodeSurface(manifest,binary);
const grid=JSON.parse(readFileSync('public/data/angles-terrain.json'));
const polygonArea=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a.x*b.z-b.x*a.z},0)/2);

test('complex crossings, T, acute joins, width changes, loops and duplicates form one partition',()=>{
 const fixtures=[
  [feature([[-20,0],[20,0]],{surface:'asphalt'}),feature([[0,-20],[0,20]],{surface:'earth'}),feature([[-20,-20],[20,20]])],
  [feature([[-20,0],[20,0]]),feature([[0,0],[0,20]],{width:'3 m',surface:'sett'})],
  [feature([[-20,0],[0,0],[20,1]],{width:8}),feature([[0,0],[20,3]],{width:2})],
  [feature([[-15,-15],[15,-15],[15,15],[-15,15],[-15,-15]])],
  [feature([[-20,0],[0,0],[0,0],[20,0]]),feature([[-20,0],[20,0]])]
 ];
 for(const input of fixtures){const s=roadSegments(input),parts=partitionRoads(s,rectangle(-30,-30,60));
  assert.ok(Math.abs(parts.reduce((v,p)=>v+area(p.polygons),0)-3600)<1e-7);
  for(let a=0;a<parts.length;a++)for(let b=a+1;b<parts.length;b++)assert.ok(area(pc.intersection(parts[a].polygons,parts[b].polygons))<1e-8);
  const g={width:7,height:7,origin_x_m:-30,origin_z_m:-30,step_m:10,elevations_m:Array.from({length:49},(_,i)=>100+Math.floor(i/7)*.3+(i%7)*.2)};
  const result=buildSurface(g,s,{tileCells:3});assert.ok(result.stats.fineTriangles>72);assert.ok(result.stats.sliverAreaM2<1e-6);
  const one=packSurface(result,{}),two=packSurface(buildSurface(g,s,{tileCells:3}),{});assert.deepEqual(one.binary,two.binary);
 }
});

test('material and width interpretations distinguish known data from estimates',()=>{
 assert.equal(roadStyle({surface:'asphalt'}),1);assert.equal(roadStyle({surface:'sett'}),2);assert.equal(roadStyle({surface:'dirt'}),3);assert.equal(roadStyle({surface:'gravel'}),4);
 assert.equal(roadStyle({highway:'residential'}),5);assert.equal(roadStyle({highway:'track'}),6);
 assert.deepEqual(roadWidth({width:'3.7 m'}),{metres:3.7,estimated:false});assert.equal(roadWidth({highway:'residential'}).estimated,true);assert.equal(roadWidth({width:'unknown'}).estimated,true);
});

test('prepared surface belongs to exact OSM/DEM sources and has no depth bias',()=>{
 assert.equal(manifest.terrainSha256,sha(readFileSync('public/data/angles-terrain.json')));assert.equal(manifest.osmSha256,sha(readFileSync('public/data/angles-osm.geojson')));
 assert.equal(manifest.binarySha256,sha(packed));assert.equal(manifest.roadOffsetM,0);assert.equal(manifest.polygonOffset,false);
 assert.equal(manifest.estimatedWidthSegments,roadSegments(JSON.parse(readFileSync('public/data/angles-osm.geojson')).features,([lon,lat])=>[(lon-.8844)*111320*Math.cos(46.6953*Math.PI/180),-(lat-46.6953)*111320]).filter(s=>s.estimated).length);assert.ok(manifest.stats.legacyOverlapExcessM2>2000);
});

test('all actual source-cell triangles cover the terrain once, with no overlap or degeneracy',()=>{
 let total=0,maxOverlap=0,maxHeightError=0,count=0;const baseline=sampleGrid(grid,0,0);
 for(const t of decoded.tiles){const p=t.attributes.position.array,r=t.attributes.earthRoad.array,cells=new Map();
  for(let i=0;i<t.fine.count;i+=3){const ids=Array.from(t.fine.array.slice(i,i+3));const q=ids.map(id=>({x:p[id*3],y:p[id*3+1],z:p[id*3+2]}));
   const cross=(q[1].x-q[0].x)*(q[2].z-q[0].z)-(q[1].z-q[0].z)*(q[2].x-q[0].x);assert.ok(cross< -1e-9,'upward, nondegenerate winding');
   assert.ok(ids.every(id=>r[id]===r[ids[0]]),'one class per face');total-=cross/2;count++;
   const x=q.reduce((s,p)=>s+p.x/3,0),z=q.reduce((s,p)=>s+p.z/3,0),y=q.reduce((s,p)=>s+p.y/3,0);
   maxHeightError=Math.max(maxHeightError,Math.abs(y-(sampleGrid(grid,x,z)-baseline)));
   const key=Math.floor((x-grid.origin_x_m)/grid.step_m)+':'+Math.floor((z-grid.origin_z_m)/grid.step_m);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(q);
  }
  for(const faces of cells.values())for(let i=0;i<faces.length;i++)for(let j=i+1;j<faces.length;j++)maxOverlap=Math.max(maxOverlap,polygonArea(clipConvex([...faces[i]].reverse(),[...faces[j]].reverse())));
 }
 assert.equal(count,manifest.stats.fineTriangles);assert.ok(Math.abs(total-4e6)<.02,`area ${total}`);assert.ok(maxOverlap<.00001,`overlap ${maxOverlap}`);assert.ok(maxHeightError<.0001,`height ${maxHeightError}`);
});

test('road faces are identical in near and far LOD; shared positions have identical normals across tile seams',()=>{
 const shared=new Map();let roads=0;
 for(const t of decoded.tiles){const p=t.attributes.position.array,n=t.attributes.normal.array,r=t.attributes.earthRoad.array;
  const faces=index=>{const out=[];for(let i=0;i<index.length;i+=3)if(r[index[i]])out.push(Array.from(index.slice(i,i+3)).join(':'));return out.sort()};
  const fine=faces(t.fine.array);roads+=fine.length;assert.deepEqual(faces(t.far.array),fine);
  for(let i=0;i<r.length;i++){const key=[p[i*3],p[i*3+2]].join(':'),value=[p[i*3+1],...n.slice(i*3,i*3+3)];if(shared.has(key))assert.deepEqual(value,shared.get(key));else shared.set(key,value)}
 }
 assert.ok(roads>10000);
});

test('surface decoder rejects truncated buffers, unsafe descriptors and invalid indices',()=>{
 assert.throws(()=>decodeSurface(manifest,binary.slice(4)),/manifest/);
 const bad=structuredClone(manifest);bad.tiles[0].position.offset=-4;assert.throws(()=>decodeSurface(bad,binary),/buffer/);
 const altered=binary.slice(0),badIndex=manifest.tiles[0].fine;new Uint16Array(altered,badIndex.offset,badIndex.length)[0]=65535;assert.throws(()=>decodeSurface(manifest,altered),/topology/);
});
