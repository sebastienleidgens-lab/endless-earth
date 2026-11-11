import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';import {cpuModules} from '../scripts/lib/cpu-modules.mjs';
const load=await cpuModules(process.cwd(),'work/cpu-nature-owner-tests'),{renderGeoFeatures}=await load('src/world/geodata.ts'),{disposeNatureZone}=await load('src/nature/render.ts'),registry=await load('src/living/geography.ts');
test('a geographic zone releases only its own shared nature anchors on repeated unload',()=>{
 const unrelated={x:901,z:902};registry.nature.push(unrelated);const local=(x,z)=>[.8844+x/(111320*Math.cos(46.6953*Math.PI/180)),46.6953-z/111320],feature={type:'Feature',properties:{natural:'wood'},geometry:{type:'Polygon',coordinates:[[local(-60,-60),local(60,-60),local(60,60),local(-60,60),local(-60,-60)]]}},terrain={relativeHeight:()=>0,waterIntegrated:true};let expected;
 for(let i=0;i<3;i++){const zone=new THREE.Group();renderGeoFeatures(zone,[feature],terrain);assert.ok(registry.nature.length>10);expected??=registry.nature.length;assert.equal(registry.nature.length,expected);assert.ok(registry.nature.includes(unrelated));disposeNatureZone(zone);assert.deepEqual(registry.nature,[unrelated]);disposeNatureZone(zone);assert.deepEqual(registry.nature,[unrelated]);}
 registry.nature.length=0;
});
