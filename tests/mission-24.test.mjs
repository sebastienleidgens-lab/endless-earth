import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createForestModels} from '../src/nature/forest-model.mjs';
import {optimizeForestModels} from '../src/nature/forest-lod.mjs';
import {coherentForestModels} from '../src/nature/forest-continuity.mjs';
import {surfaceSnowMask} from '../src/nature/snow-model.mjs';
import {snowReceiver,setSnowAppearance,resetSnowAppearance} from '../src/nature/snow-state.mjs';

const models=createForestModels();
test('all eleven solid branch families agree on exterior winding and radial normals at near/mid LOD',()=>{
 const a=new THREE.Vector3(),b=a.clone(),c=a.clone(),normal=a.clone(),temp=a.clone();let checked=0;
 for(const [id,m]of models)for(const l of m.levels.slice(0,2)){
  const g=l.wood,p=g.attributes.position,n=g.attributes.normal,index=g.index;
  for(let i=0;i<index.count;i+=3){const ids=[0,1,2].map(k=>index.getX(i+k));a.fromBufferAttribute(p,ids[0]);b.fromBufferAttribute(p,ids[1]).sub(a);c.fromBufferAttribute(p,ids[2]).sub(a);normal.set(0,0,0);for(const j of ids)normal.add(temp.fromBufferAttribute(n,j));
   assert.ok(b.cross(c).dot(normal)>=-1e-8,`${id}, LOD ${l.lod}, triangle ${i/3} faces inward`);checked++;
  }
 }
 assert.equal(checked,75556);
});

test('branch snow stays on the same world-up surface through camera turns and nonuniform instance scales',()=>{
 const transforms=[new THREE.Matrix4(),new THREE.Matrix4().compose(new THREE.Vector3(27,-31,42),new THREE.Quaternion().setFromEuler(new THREE.Euler(.035,2.4,-.04)),new THREE.Vector3(.6,1.4,1.1))];
 const world=new THREE.Matrix4().makeRotationY(.63);let tops=0,bottoms=0;
 for(const [id,m]of models)for(const l of m.levels){const normals=l.wood.attributes.normal;for(const instance of transforms){const model=world.clone().multiply(instance),matrix=new THREE.Matrix3().getNormalMatrix(model);
  for(let i=0;i<normals.count;i+=1){const expected=new THREE.Vector3().fromBufferAttribute(normals,i).applyMatrix3(matrix).normalize();if(expected.y>.82)tops++;if(expected.y<-.1)bottoms++;
   for(const eye of [[5,4,9],[-5,-4,-9],[9,.3,-2]]){const camera=new THREE.PerspectiveCamera();camera.position.fromArray(eye);camera.lookAt(0,2,0);camera.updateMatrixWorld();const viewModel=camera.matrixWorldInverse.clone().multiply(model),viewNormal=new THREE.Vector3().fromBufferAttribute(normals,i).applyMatrix3(new THREE.Matrix3().getNormalMatrix(viewModel)).normalize().transformDirection(camera.matrixWorld);
    assert.ok(Math.abs(expected.y-viewNormal.y)<1e-9,`${id}: camera-dependent world normal`);
    if(expected.y<0)assert.equal(surfaceSnowMask(viewNormal.y,1),0);
   }
  }
 }}
 assert.ok(tops>1000&&bottoms>1000,'upper and lower solid surfaces were both inspected');
});

test('LOD assembly preserves orientation of solid wood and keeps root and count budgets',()=>{
 const optimized=coherentForestModels(optimizeForestModels(createForestModels()));
 for(const [,m]of optimized){assert.equal(m.levels.length,4);assert.ok(m.levels[3].wood.index.count<m.levels[2].wood.index.count);const root=m.levels[0].wood.attributes.position;assert.ok(Math.abs(Array.from({length:10},(_,i)=>root.getY(i)).reduce((a,b)=>a+b,0)/10+.7)<1e-7);
  for(const l of m.levels){assert.ok(l.wood.index.array.every(i=>i<l.wood.attributes.position.count));assert.ok(l.wood.attributes.position.array.every(Number.isFinite));assert.ok(l.wood.attributes.normal.array.every(Number.isFinite));}
 }
});

test('forest snow uses outward wood normals while thin leaves and other double-sided receivers keep face semantics',()=>{
 for(const forest of [false,true]){const m=new THREE.MeshLambertMaterial({side:THREE.DoubleSide});m.userData.forestSnow=forest;snowReceiver(m);setSnowAppearance(true);const shader={uniforms:{},vertexShader:THREE.ShaderLib.lambert.vertexShader,fragmentShader:THREE.ShaderLib.lambert.fragmentShader};m.onBeforeCompile(shader,{});
  assert.equal(shader.fragmentShader.includes('if(vForestPart>.5)snowNormal*=gl_FrontFacing'),forest);
  assert.ok(shader.fragmentShader.includes('float up=max(0.,snowNormal.y)'));
  assert.ok(!shader.fragmentShader.includes('abs(snowNormal.y)'));
  assert.ok(shader.vertexShader.includes('instanceMatrix*snowWorld'));
  assert.ok(m.customProgramCacheKey().includes('surface-snow-v2'));m.dispose();
 }resetSnowAppearance();
});
