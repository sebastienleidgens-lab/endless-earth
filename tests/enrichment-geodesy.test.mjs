import test from 'node:test';
import assert from 'node:assert/strict';
import {toECEF,fromECEF,createProjection,createECEFTangent,globalCellId,globalCellBounds,globalCellParent,normalizeLongitude,FloatingOrigin,lambert93,inverseLambert93,legacyAdapter} from '../src/planet/coordinates.mjs';

const datum='WGS84-ellipsoid';
const geo=(lat,lon,height=0)=>({lat,lon,height,datum});
const separation=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);

test('WGS84 ECEF known axes and ellipsoidal round-trips preserve centimetres globally',()=>{
 assert.deepEqual(toECEF(geo(0,0)),{x:6378137,y:0,z:0});
 const places=[geo(46.6953,.8844,69),geo(-33.9,151.2,32),geo(27,86.9,8848),geo(0,179.9999,-50),geo(89.99999,-170,14),geo(-89.99999,45,100),geo(90,81),geo(-90,-64)];
 for(const p of places){
  const e=toECEF(p),q=fromECEF(e);
  assert.equal(q.datum,datum);
  assert.ok(separation(e,toECEF(q))<.000001,JSON.stringify({p,q}));
  assert.ok(Math.abs(p.height-q.height)<.000001);
 }
});

test('ENU patches cross the antimeridian and both polar neighbourhoods without a singularity',()=>{
 const cases=[
  {origin:geo(10,179.9999,12),target:geo(10,-179.9999,13)},
  {origin:geo(90,0,0),target:geo(89.9999,140,8)},
  {origin:geo(-90,73,100),target:geo(-89.9999,-111,101)},
  {origin:geo(89.9999,179.9,20),target:geo(89.9999,-179.9,22)},
  {origin:geo(-45,-72,950),target:geo(-45.00001,-71.99999,951)}
 ];
 for(const {origin,target}of cases){
  const frame=createProjection({type:'ecef-tangent',origin,maxDistanceM:5000}),p=frame.project(target),q=frame.unproject(p);
  assert.equal(frame.code,'WGS84-ENU-v1');
  assert.ok(Math.hypot(p.x,p.y)<100,'A short boundary crossing must stay local');
  assert.ok(separation(toECEF(target),toECEF(q))<.000001);
  assert.deepEqual(frame.project(origin),{x:0,y:0,up:0,datum});
 }
});

test('ENU explicitly retains curvature, datum and local-patch limits',()=>{
 const frame=createECEFTangent({origin:geo(0,0),maxDistanceM:250000});
 const p=frame.project(geo(0,1));
 assert.ok(p.up<-900,'The ellipsoid curves below the tangent plane');
 assert.ok(separation(toECEF(geo(0,1)),toECEF(frame.unproject(p)))<.000001);
 assert.throws(()=>frame.unproject({x:p.x,y:p.y,datum}),/patch/);
 assert.throws(()=>frame.project(geo(0,3)),/patch/);
 assert.throws(()=>frame.project({...geo(0,0),datum:'IGN69'}),/ellipsoidal/);
 assert.throws(()=>createECEFTangent({origin:{lat:0,lon:0,height:0}}),/ellipsoidal/);
 assert.throws(()=>fromECEF({x:0,y:0,z:0}),/shell/);
 assert.throws(()=>toECEF({...geo(0,0),height:NaN}),/ellipsoidal/);
});

test('Global cells have deterministic half-open owners at the dateline and poles',()=>{
 assert.equal(globalCellId(geo(0,180)),globalCellId(geo(0,-180)));
 assert.equal(globalCellId(geo(90,160)),globalCellId(geo(90,-70)));
 assert.equal(globalCellId(geo(-90,0)),globalCellId(geo(-90,170)));
 assert.notEqual(globalCellId(geo(0,-.00001),4),globalCellId(geo(0,0),4));
 for(const p of [geo(46.7,.9),geo(-20,179.999),geo(89.9,-172)]){
  const id=globalCellId(p,20),b=globalCellBounds(id),parent=globalCellParent(id);
  assert.equal(globalCellId(p,19),parent);
  assert.ok(p.lon>=b.west&&p.lon<b.east&&p.lat>=b.south&&p.lat<b.north);
  assert.equal(JSON.parse(JSON.stringify({id})).id,id);
 }
 assert.equal(globalCellParent(globalCellId(geo(0,0),0)),null);
 assert.equal(normalizeLongitude(540),-180);
 for(const bad of [-1,25,1.5])assert.throws(()=>globalCellId(geo(0,0),bad));
 for(const bad of ['earth-angular-v1/2/8/0','earth-angular-v1/2/0/4','earth-angular-v1/25/0/0','earth-angular-v1/02/0/0','wrong'])assert.throws(()=>globalCellBounds(bad));
});

test('Save, rebase and return preserve the three-dimensional ENU canonical point',()=>{
 const projection=createECEFTangent({origin:geo(-16,-179.99,240)}),target=geo(-16.001,179.999,242),p=projection.project(target);
 const canonical={x:p.x,y:p.y,height:p.up},origin=new FloatingOrigin({x:0,y:0,height:0},256),render=origin.local(canonical);
 origin.subscribe(delta=>{render.x+=delta.x;render.y+=delta.y;render.z+=delta.z;});
 assert.equal(origin.update(canonical),true);
 const saved=JSON.parse(JSON.stringify({canonical,datum,cell:globalCellId(target),origin:origin.origin}));
 const restored=origin.canonical(render);
 assert.ok(Math.hypot(restored.x-saved.canonical.x,restored.y-saved.canonical.y,restored.height-saved.canonical.height)<1e-9);
 const q=projection.unproject({x:restored.x,y:restored.y,up:restored.height,datum});
 assert.ok(separation(toECEF(target),toECEF(q))<.000001);
 origin.update({x:0,y:0,height:0});
 assert.ok(Math.hypot(render.x-canonical.x,render.z+canonical.y,render.y-canonical.height)<1e-9);
});

test('Historical Lambert, local-tangent and pilot adapter contracts remain unchanged',()=>{
 const p={lat:46.6953,lon:.8844},q=inverseLambert93(lambert93(p));
 assert.ok(Math.abs(q.lat-p.lat)<1e-9&&Math.abs(q.lon-p.lon)<1e-9);
 const old=legacyAdapter(p),local={x:-620,z:346.5},result=old.fromGeo(old.toGeo(local));
 assert.ok(Math.hypot(result.x-local.x,result.z-local.z)<1e-8);
 const other=createProjection({type:'local-tangent',origin:{lat:47,lon:-71}}),point={lat:47.01,lon:-70.99};
 assert.deepEqual(other.unproject(other.project(point)),point);
 assert.throws(()=>other.project({lat:60,lon:-71}));
 assert.throws(()=>createProjection({type:'local-tangent',origin:{lat:90,lon:0}}),/polar/);
});
