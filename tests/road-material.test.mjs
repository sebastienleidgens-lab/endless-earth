import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {transpileModule} from 'typescript';
import * as THREE from 'three';
import {createRoadAtlas,materialPixel,roadUV,ROAD_TILE_PIXELS,ROAD_TILE_GUTTER} from '../src/world/road-texture.mjs';
import {boundaryDistanceField,signedBoundaryField} from '../scripts/prepare-road-edges.mjs';
import {pc} from '../scripts/lib/road-topology.mjs';
import {roadStyle} from '../src/world/road-style.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
mkdirSync('work/road-tests',{recursive:true});
for(const [input,output] of [['src/world/road-material.ts','material'],['src/nature/surfaces.ts','surface']]){
 let code=transpileModule(readFileSync(input,'utf8'),{compilerOptions:{target:9,module:99}}).outputText;
 code=code.replace("'./road-texture.mjs'","'../../src/world/road-texture.mjs'").replace("'../world/road-material'","'./material.mjs'");writeFileSync(`work/road-tests/${output}.mjs`,code);
}
const {groundDetail}=await import('../work/road-tests/surface.mjs');
test('original mineral atlas is deterministic, bounded and materials have distinct spatial statistics',()=>{
 const a=createRoadAtlas(),b=createRoadAtlas();assert.deepEqual(a,b);assert.equal(a.width,576);assert.equal(a.data.length,576*576*4);
 const hist=[];
 for(let k=0;k<4;k++){const values=[];for(let y=0;y<64;y++)for(let x=0;x<64;x++)values.push(materialPixel(k,(x+.5)/64,(y+.5)/64)[0]);hist.push(sha(Buffer.from(Float64Array.from(values).buffer)));assert.ok(Math.max(...values)-Math.min(...values)>.1);}
 assert.equal(new Set(hist).size,4);
});
test('atlas gutters wrap their own material, not adjacent quadrants; metric UV is independent of mesh density',()=>{
 const {data,width}=createRoadAtlas(),stride=ROAD_TILE_PIXELS+2*ROAD_TILE_GUTTER;
 for(let k=0;k<4;k++)for(const [x,y] of [[0,24],[15,110],[273,220],[287,200],[90,0],[120,287]]){
  const wrap=q=>((q-16)%256+256)%256+16,offset=(a,b)=>((Math.floor(k/2)*stride+b)*width+k%2*stride+a)*4;
  assert.deepEqual(data.slice(offset(x,y),offset(x,y)+4),data.slice(offset(wrap(x),wrap(y)),offset(wrap(x),wrap(y))+4));
 }
 const a=roadUV(-7,21,4),b=roadUV(1,25,4);assert.deepEqual(b.map((v,i)=>v-a[i]),[2,1]);
 for(let t=0;t<=1;t+=.1)assert.ok(roadUV(-7+8*t,21+4*t,4).every((v,i)=>Math.abs(v-(a[i]+(b[i]-a[i])*t))<1e-12));
});
test('edge field uses exterior union boundary: no shoulder across a crossing or seam',()=>{
 const h=[[[[-8,-2],[8,-2],[8,2],[-8,2],[-8,-2]]]],v=[[[[-2,-8],[2,-8],[2,8],[-2,8],[-2,-8]]]];
 const rings=pc.union(h,v).flat(),config={size:200,origin:[-10,-10],extent:[20,20],range:3};
 const field=boundaryDistanceField(rings,config),at=(x,z)=>field[Math.floor((z+10)*10)*200+Math.floor((x+10)*10)]*3/255;
 assert.ok(at(0,0)>2.6);assert.ok(at(4,1.9)<.15);assert.ok(at(4,0)>1.8);
 assert.deepEqual(field,boundaryDistanceField(rings,config));
});
test('delivered shoulder field belongs to exact source data, with bounded one-channel memory',()=>{
 const m=JSON.parse(readFileSync('public/data/angles-road-edge.json')),data=gunzipSync(readFileSync('public/data/angles-road-edge.pack'));
 assert.equal(m.osmSha256,sha(readFileSync('public/data/angles-osm.geojson')));assert.equal(m.terrainSha256,sha(readFileSync('public/data/angles-terrain.json')));
 assert.equal(sha(data),m.sha256);assert.equal(data.length,2048*2048);assert.equal(m.range,3);
});
test('road shader adds filtered dry relief on the existing surface, with a distinct optional-shoulder program',()=>{
 const material=new THREE.MeshLambertMaterial({vertexColors:true});groundDetail(material,true);
 const shader={uniforms:{},vertexShader:THREE.ShaderLib.lambert.vertexShader,fragmentShader:THREE.ShaderLib.lambert.fragmentShader};material.onBeforeCompile(shader,{});
 assert.ok(shader.vertexShader.includes('earthRoadType=earthRoad'));assert.ok(shader.fragmentShader.includes('textureGrad'));assert.ok(shader.fragmentShader.includes('normal=mineralNormal'));
 assert.equal(material.polygonOffset,false);assert.equal(material.transparent,false);assert.equal(material.depthWrite,true);assert.ok(shader.uniforms.roadAtlas.value.generateMipmaps);
 const key=material.customProgramCacheKey();groundDetail(material,true,{texture:new THREE.DataTexture(),manifest:{origin:[0,0],extent:[1,1],range:3}});assert.notEqual(material.customProgramCacheKey(),key);
 assert.equal(roadStyle({highway:'residential'}),5);assert.equal(roadStyle({highway:'track'}),6);
});

test('signed field interpolates subpixel straight edges and keeps exterior scanlines outside',()=>{
 const config={size:100,origin:[-5,-5],extent:[10,10],range:3};
 const ring=[[-2,-4],[2,-4],[2,4],[-2,4],[-2,-4]],data=signedBoundaryField([ring],config);
 const at=(x,z)=>(data[Math.floor((z+5)*10)*100+Math.floor((x+5)*10)]/255*2-1)*3;
 assert.ok(at(0,0)>1.9);assert.ok(at(3,0)<-.9);assert.ok(Math.abs((at(1.95,0)+at(2.05,0))/2)<.015);
 const outside=[[-20,-20],[-10,-20],[-10,20],[-20,20],[-20,-20]];
 assert.ok(signedBoundaryField([outside],config).every(v=>v===0));
});
