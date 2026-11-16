import test from 'node:test';
import assert from 'node:assert/strict';
import {lambert93,inverseLambert93,createProjection,FloatingOrigin,legacyAdapter,requireSameDatum} from '../src/planet/coordinates.mjs';
import {WorldTileManager,tileLoader,sha256,validateTile,tileDemand} from '../src/planet/tile-manager.mjs';
import {sampleTile,PlanetSurface} from '../src/planet/surface.mjs';
import {TiledNetwork,admitFeature} from '../src/planet/network.mjs';
import {CarController} from '../src/planet/car.mjs';
import {JourneyStorage,validateJourney} from '../src/planet/save.mjs';
import {birdPhase,birdPosition,flockAt} from '../src/earthlife/fauna.mjs';
import {paddlePose} from '../src/player/paddle-motion.mjs';
import {PackraftController} from '../src/player/packraft.mjs';
import {PlayerActivity} from '../src/player/activity.mjs';
import {WaterContacts} from '../src/player/water-contacts.mjs';
import {gzipSync} from 'node:zlib';
import {RailMotion,airportCircuit} from '../src/planet/transport-motion.mjs';
import {excludeIndexedTriangles} from '../src/planet/pilot-clip.mjs';
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const grid=(id,x=0)=>({schema:'planet-tile-v1',id,bounds:[x,0,x+10,10],grid:{size:2,datum:'IGN69',heights:[x,10+x,20+x,30+x]},features:[]});
const entry=t=>({id:t.id,bounds:t.bounds,url:t.id+'.json',decodedBytes:100,bytes:100,sha256:'0'.repeat(64)});
test('a department river crossing the pilot preserves its historical water owner and interpolates only the exterior mesh',()=>{
 const vertices=[[-2,-2],[2,-2],[2,2],[-2,2]].map(([x,z])=>({x,y:3+2*x-z,z})),indices=new Uint16Array([0,1,2,0,2,3]),before=structuredClone(vertices),clipped=excludeIndexedTriangles(vertices,indices,[-1,-1,1,1]);
 let area=0;for(let i=0;i<clipped.length;i+=3){const [a,b,c]=clipped.slice(i,i+3),cross=(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);area+=Math.abs(cross)/2;if(Math.abs(cross)<1e-12)continue;
  for(let x=-.9;x<1;x+=.3)for(let z=-.9;z<1;z+=.3){const u=((x-a.x)*(c.z-a.z)-(z-a.z)*(c.x-a.x))/cross,v=((b.x-a.x)*(z-a.z)-(b.z-a.z)*(x-a.x))/cross;assert.ok(u<0||v<0||u+v>1,'no new water triangle may cover the protected interior');}
 }
 assert.ok(Math.abs(area-12)<1e-10,'16 square metres minus the 4 square metre pilot');for(const p of clipped)assert.ok(Math.abs(p.y-(3+2*p.x-p.z))<1e-10);assert.deepEqual(vertices,before);assert.equal(excludeIndexedTriangles(vertices,indices,[-3,-3,3,3]).length,0);assert.deepEqual(excludeIndexedTriangles(vertices,indices,[100,100,101,101]),[vertices[0],vertices[1],vertices[2],vertices[0],vertices[2],vertices[3]]);
});
test('Lambert93 agrees with its official false origin and round trips department-scale positions without converting heights',()=>{
 const origin=lambert93({lat:46.5,lon:3});assert.ok(Math.abs(origin.x-700000)<1e-6&&Math.abs(origin.y-6600000)<.001);
 for(const lat of [46,46.6953,47.2])for(const lon of [-.1,.8844,1.2]){const result=inverseLambert93(lambert93({lat,lon}));assert.ok(Math.abs(result.lat-lat)<1e-9&&Math.abs(result.lon-lon)<1e-9);}
 assert.throws(()=>lambert93({lat:NaN,lon:0}));assert.throws(()=>requireSameDatum('EGM2008','IGN69'));assert.throws(()=>requireSameDatum('unknown','unknown'));
});
test('legacy adapter preserves its historical east/south axes and an unrelated region uses another projection provider',()=>{
 const old=legacyAdapter({lat:46.6953,lon:.8844}),p={x:-620,z:346.5},q=old.fromGeo(old.toGeo(p));assert.ok(Math.hypot(q.x-p.x,q.z-p.z)<1e-8);
 const other=createProjection({type:'local-tangent',origin:{lat:47,lon:-71}}),geo={lat:47.01,lon:-70.99},xy=other.project(geo);assert.ok(xy.x>700&&xy.y>1000);assert.deepEqual(other.unproject(xy),geo);assert.throws(()=>other.project({lat:60,lon:-71}));
});
test('floating-origin moves camera, visual, physics proxy and sound together; canonical state survives multiple rebases',()=>{
 const frame=new FloatingOrigin({x:600000,y:6600000,height:100},1024),canonical={x:600020,y:6600010,height:105},objects=Array.from({length:4},()=>frame.local(canonical));
 for(const object of objects)frame.subscribe(d=>{object.x+=d.x;object.y+=d.y;object.z+=d.z;});
 for(const p of [{x:610000,y:6610000},{x:590000,y:6620000},{x:680000,y:6690000}]){assert.equal(frame.update(p),true);for(const object of objects)assert.deepEqual(frame.canonical(object),canonical);}assert.equal(frame.revision,3);
 const prior={...frame.origin},object={...objects[0]};frame.subscribe(()=>{throw Error('failed consumer')});assert.throws(()=>frame.update({x:800000,y:6700000}));assert.deepEqual(frame.origin,prior);assert.deepEqual(objects[0],object);
});
test('terrain interpolation and normals share the exact triangle diagonal and remain continuous at tile boundaries',()=>{
 const a=grid('a'),b=grid('b',10);for(let y=0;y<=10;y+=.25){assert.ok(Math.abs(sampleTile(a,{x:10,y}).height-sampleTile(b,{x:10,y}).height)<1e-8);}
 for(const p of [{x:1,y:2},{x:9,y:8},{x:5,y:5}]){const h=sampleTile(a,p);assert.ok(Math.abs(h.height-(p.x+2*p.y))<1e-8);assert.ok(Math.abs(h.normal.y-1/Math.sqrt(6))<1e-8);}assert.equal(sampleTile(a,{x:-.1,y:0}),null);
 assert.throws(()=>validateTile({...a,grid:{size:2,heights:[0,NaN,1,2]}},entry(a)));
});
test('tile checksum and length verification reject corrupted bytes before physical installation',async()=>{
 const tile=grid('safe'),bytes=new TextEncoder().encode(JSON.stringify(tile)),e={...entry(tile),url:'safe.json',bytes:bytes.length,decodedBytes:bytes.length,sha256:await sha256(bytes)};
 const good=tileLoader('https://example.test/manifest.json',async()=>new Response(bytes));assert.deepEqual(await good(e),tile);
 const bad=bytes.slice();bad[3]^=1;await assert.rejects(tileLoader('https://example.test/',async()=>new Response(bad))(e),/checksum/);
});
test('opaque gzip tile transport verifies compressed bytes and decodes exactly once',async()=>{const tile=grid('compressed'),raw=Buffer.from(JSON.stringify(tile)),compressed=gzipSync(raw),e={...entry(tile),url:'compressed.tile',bytes:compressed.length,decodedBytes:raw.length,sha256:await sha256(compressed)};const loader=tileLoader('https://example.test/',async()=>new Response(compressed));assert.deepEqual(await loader(e),tile);await assert.rejects(loader({...e,decodedBytes:raw.length-10}),/budget|length/);});
test('tile streaming bounds concurrency/residency, survives cancellation and never installs stale requests',async()=>{
 const tiles=[grid('a'),grid('b',10),grid('c',20)],pending=[],installed=[],removed=[];
 const manager=new WorldTileManager({tiles:tiles.map(entry)},{capacity:2,concurrency:1,byteBudget:200,load(e,signal){return new Promise(resolve=>pending.push({id:e.id,resolve,signal}));},onLoad:t=>installed.push(t.id),onUnload:t=>removed.push(t.id)});
 manager.demand([{id:'a',priority:0},{id:'b',priority:1}]);await tick();assert.equal(pending.length,1);manager.demand([{id:'c',priority:0}]);assert.equal(pending[0].signal.aborted,true);pending[0].resolve(tiles[0]);await tick();await tick();assert.equal(pending[1].id,'c');pending[1].resolve(tiles[2]);await tick();assert.deepEqual(installed,['c']);assert.equal(manager.metrics.failures,0);manager.dispose();assert.deepEqual(removed,['c']);assert.equal(manager.metrics.residentBytes,0);
});
test('demand selection fits the declared byte budget without evicting and reloading demanded tiles forever',async()=>{
 const tiles=[grid('a'),grid('b',10),grid('c',20)];let loads=0;const manager=new WorldTileManager({tiles:tiles.map(entry)},{capacity:3,byteBudget:150,load:async e=>{loads++;return tiles.find(t=>t.id===e.id)}});manager.demand(tiles.map((t,i)=>({id:t.id,priority:i})));for(let i=0;i<5;i++)await tick();assert.equal(manager.resident.size,1);assert.equal(loads,1);manager.dispose();
});
test('metric tile demand covers the horizon and preloads the direction of travel without fetching a distant square',()=>{const tiles=[];for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)tiles.push({id:`${x}:${y}`,x,y,bounds:[x*4096,y*4096,(x+1)*4096,(y+1)*4096]});const m={tileSize:4096,tiles},p={x:2048,y:2048},walking=tileDemand(m,p,{x:0,y:0}),driving=tileDemand(m,p,{x:40,y:0});assert.deepEqual(walking.map(t=>t.id),['0:0']);assert.ok(driving.some(t=>t.id==='1:0'));assert.ok(driving.every(t=>!t.id.startsWith('-2:')));const border=tileDemand(m,{x:4050,y:2048},{x:0,y:0});assert.ok(border.some(t=>t.id==='0:0')&&border.some(t=>t.id==='1:0'));});
const road=(id,nodes,points,tags={})=>({id,kind:'road',nodes,points,tags:{highway:'residential',...tags}});
test('directed source topology crosses tiles once, retains shared owners and never connects grade-separated crossings',()=>{
 const network=new TiledNetwork('car'),a=road('a',['1','2'],[[0,0],[10,0]],{oneway:'yes'}),b=road('b',['2','3'],[[10,0],[20,0]]),flyover=road('flyover',['4','5'],[[10,-10],[10,10]],{bridge:'yes',layer:'1'});
 network.add({id:'left',features:[a,b,flyover]});network.add({id:'right',features:[b]});assert.equal(network.route('osm:1:0','osm:3:0').distance,20);assert.equal(network.route('osm:3:0','osm:1:0'),null);assert.equal(network.nodes.has('osm:4:1'),false);network.remove('left');assert.ok(network.route('osm:2:0','osm:3:0'));network.remove('right');assert.equal(network.nodes.size,0);
});
test('transport admission keeps motorway pedestrians, private tracks, uncertain bridges and water clearance closed',()=>{
 for(const [tags,mode]of [[{highway:'motorway'},'foot'],[{highway:'track',access:'private'},'car'],[{highway:'service'},'car'],[{highway:'secondary',bridge:'yes'},'car'],[{waterway:'river'},'boat']])assert.equal(admitFeature(tags,mode).ok,false);
 assert.equal(admitFeature({highway:'motorway'},'car').ok,true);assert.equal(admitFeature({highway:'footway'},'foot').ok,true);
});
test('mapped water/buildings and missing support block travel instead of receiving an invisible fallback floor',()=>{
 const surface=new PlanetSurface({tileSize:10,accessDefaults:{publicRoadClasses:true}}),tile=grid('0:0');tile.features=[road('road',['1','2'],[[0,5],[10,5]]),{id:'water',kind:'hydro',polygon:true,points:[[4,4],[6,4],[6,6],[4,6],[4,4]],tags:{natural:'water'}}];surface.add(tile);assert.equal(surface.admission({x:5,y:5}).ok,false);assert.equal(surface.admission({x:20,y:5}).reason,'tile-loading');surface.remove(tile);assert.equal(surface.sample({x:2,y:2}),null);
});
test('car hull sweeps stop before walls, missing tiles and vertical road discontinuities across irregular frame rates',()=>{
 for(const dt of [1/30,1/60,.17]){const car=new CarController();car.active=true;car.place({x:0,y:0,z:0});const world=(x,z)=>({height:0,drivable:z<20&&Math.abs(x)<4,speedLimit:25,reason:z>=20?'tile-loading':undefined});for(let t=0;t<12;t+=dt)car.update(dt,{forward:1,strafe:0},world);assert.ok(car.position.z<18.5&&car.position.z>10);assert.equal(car.speed,0);assert.ok(car.metrics.refusals>0);assert.equal(car.clearAt(0,25,0,world).ok,false);}
});
test('right-hand car steering remains right from the following camera rather than mirroring the keyboard',()=>{const car=new CarController();car.active=true;car.place({x:0,y:0,z:0});for(let t=0;t<2;t+=1/60)car.update(1/60,{forward:1,strafe:1},()=>({height:0,drivable:true,speedLimit:30}));assert.ok(car.heading<0&&car.position.x<0);});
test('save/resume validates canonical state and refuses unavailable support without replacing the saved position',async()=>{
 const memory=new Map(),store=new JourneyStorage({setItem:(k,v)=>memory.set(k,v),getItem:k=>memory.get(k)}),value={schema:'planet-journey-v1',region:'test',activity:'walking',heading:0,position:{lat:47,lon:-71,height:10,datum:'WGS84-ellipsoid'}};assert.equal(store.write(value),true);const result=await store.resume(async()=>{},()=>false);assert.equal(result.ok,false);assert.equal(store.read().schema,'planet-journey-v2');assert.deepEqual(store.read().migration.original,value);assert.throws(()=>validateJourney({...value,position:{...value.position,lon:300}}));
});
test('analytic flock samples and identity phases survive a CPU cadence/LOD change without a phase reset',()=>{
 const conditions={habitat:'wood',day:1,rain:0,wind:.3},flock=flockAt(0,15,conditions);const t=flock.start+8,a=flockAt(t,15,conditions),p=birdPosition(a,2,{x:0,z:0},80);for(const dt of [1/30,1/60,1/120,.17]){const next=birdPosition(flockAt(t+dt,15,conditions),2,{x:0,z:0},80);assert.ok(Math.hypot(next.x-p.x,next.z-p.z)<20*dt);assert.ok(Number.isFinite(next.heading));}assert.equal(birdPhase('stable-id'),birdPhase('stable-id'));assert.notEqual(birdPhase('stable-id'),birdPhase('other-id'));
});
test('paddle force only exists while the shared blade pose enters water; wakes come in stern pairs and fade when stopped',()=>{
 for(let i=0;i<360;i++){const p=paddlePose(i*Math.PI/180);if(p.contact>0)assert.ok(p.tipY<0);else assert.ok(p.tipY>=-1e-10);}
 const contacts=new WaterContacts(),provider={sample:()=>({reliable:true,surfaceY:0})};contacts.update('boating',{x:0,z:0},[],null,provider,[],{heading:0,speed:1});const events=contacts.update('boating',{x:0,z:.5},[],null,provider,[],{heading:0,speed:1});assert.equal(events.filter(e=>e.kind==='wake').length,2);assert.ok(events[0].position.x*events[1].position.x<0);assert.equal(contacts.update('boating',{x:0,z:.5},[],null,provider,[],{heading:0,speed:0}).length,0);
});
test('river following supplies input to physics, preserves manual takeover and does not impose spline positions',()=>{
 const activity=new PlayerActivity();activity.state='boating';const boat=new PackraftController(activity);boat.visible=true;const provider={network:{metrics:{ready:true},follow:()=>({ok:true,points:[{x:0,z:0},{x:0,z:20},{x:4,z:40}]})},sample:()=>({reliable:true,depth:2,surfaceY:0}),contains:()=>true,returnRouteVerified:()=>true};assert.equal(boat.toggleFollow(provider).ok,true);const p={x:0,y:.1,z:0};for(let t=0;t<5;t+=1/60)boat.update(1/60,p,{forward:0,strafe:0},provider,()=>true);assert.ok(p.z>1&&p.z<10);assert.equal(boat.followMetrics.plans,1);boat.update(1/60,p,{forward:0,strafe:.2},provider,()=>true);assert.equal(boat.following,false);assert.equal(activity.message,'river-manual-control');
});
test('packraft checks the full visible hull and the water under its blade instead of assuming a flat infinite surface',()=>{const activity=new PlayerActivity();activity.state='boating';const boat=new PackraftController(activity),base={sample:()=>({reliable:true,depth:2,surfaceY:0}),contains:()=>true,returnRouteVerified:()=>true};assert.equal(boat.clearAt(base,x=>Math.abs(x)<.6,0,0,0),false);const provider={...base,sample:(x,z)=>({reliable:true,depth:2,surfaceY:x*x/(.70*.70)+z*z/(1.13*1.13)>1.001?-5:0})},p={x:0,y:.1,z:0};let maxThrust=0;for(let i=0;i<180;i++){boat.update(1/60,p,{forward:1,strafe:0},provider,()=>true);maxThrust=Math.max(maxThrust,Math.abs(boat.paddleState.thrust??0));}assert.equal(maxThrust,0);assert.equal(p.x,0);assert.equal(p.z,0);});
test('rail acceleration and braking keep the whole leading vehicle before an unverified corridor end',()=>{const train=new RailMotion([{x:0,y:0},{x:0,y:400},{x:200,y:500}]);for(let t=0;t<160;t+=1/60)train.update(1/60);assert.ok(train.distance<=train.line.length-12);assert.equal(train.speed,0);assert.equal(train.stopped,true);});
test('synthetic airport flight stays continuous through takeoff, airborne turns and landing, then remains parked',()=>{const a={x:500000,y:6600000},b={x:500000,y:6601800};for(const t of [65,272.5,480,545]){const before=airportCircuit(t-.001,a,b,120),after=airportCircuit(t+.001,a,b,120);assert.ok(Math.hypot(before.x-after.x,before.y-after.y, before.height-after.height)<.2);}const end=airportCircuit(545,a,b,120);assert.deepEqual(airportCircuit(900,a,b,120),end);assert.equal(end.phase,'parked');});
