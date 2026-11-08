import {test} from 'node:test';
import assert from 'node:assert/strict';
import {movement, cameraFraction, nextView, circleHitsPolygon, moveGrounded} from '../src/controls/walking.mjs';
test('human walking, sprint, diagonal normalization and forward relative to gaze',()=>{
  assert.equal(movement(0,1,0,1).z,-1.45);
  assert.equal(movement(0,1,0,1,true).z,-3.2);
  assert.ok(Math.abs(Math.hypot(...Object.values(movement(1,1,1,1)))-1.45)<1e-9);
  const a=movement(.7,1,0,1),b=movement(.7,1,0,1/60);
  assert.ok(Math.abs(a.x-b.x*60)<1e-9);
});
test('camera cycle returns freely to aerial',()=>assert.equal(nextView(nextView(nextView('aerial'))),'aerial'));
const wall=[{x:1,z:-5},{x:2,z:-5},{x:2,z:5},{x:1,z:5}];
test('body radius, polygon interior and exterior',()=>{
  assert.equal(circleHitsPolygon(.8,0,wall),true);
  assert.equal(circleHitsPolygon(1.5,0,wall),true);
  assert.equal(circleHitsPolygon(.5,0,wall),false);
});
test('swept movement cannot tunnel through walls and slides along them',()=>{
  const p={x:0,y:0,z:0};moveGrounded(p,{x:10,z:2},(x,z)=>!circleHitsPolygon(x,z,wall),()=>0);
  assert.ok(p.x<=.71);assert.ok(p.z>1.9);
});
test('gentle slopes follow ground; steep slopes, cliffs and unknown terrain block',()=>{
  const clear=()=>true;
  const p={x:0,y:0,z:0};moveGrounded(p,{x:2,z:0},clear,x=>x*.4);assert.ok(p.x>1.9);assert.ok(Math.abs(p.y-.8)<1e-9);
  for(const height of [x=>x, x=>-x, x=>x>.4?null:0]){
    const p={x:0,y:0,z:0};moveGrounded(p,{x:2,z:0},clear,height);assert.ok(p.x<.5);
  }
});

test('camera sweep stops before walls, terrain and unknown coverage',()=>{
  const eye={x:0,y:1.65,z:0},offset={x:5,y:1,z:0};
  assert.equal(cameraFraction(eye,offset,()=>true,()=>0),1);
  const wallStop=cameraFraction(eye,offset,(x,z)=>!circleHitsPolygon(x,z,wall),()=>0);
  assert.ok(wallStop>0&&wallStop*5<.7);
  assert.ok(cameraFraction(eye,offset,()=>true,x=>x>1?4:0)<.21);
  assert.ok(cameraFraction(eye,offset,()=>true,x=>x>1?null:0)<.21);
});
