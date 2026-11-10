import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {acousticContext,geographicKey,temporalContext,proximityIndex,habitatInfluences} from '../src/audio/context.mjs';
import {layerMix,eventAffinity,EVENTS,AUDIO_BUDGETS} from '../src/audio/profiles.mjs';
import {SoundDirector,seededRandom} from '../src/audio/director.mjs';import {AUDIO_FIXTURES,blendFixture} from '../src/audio/fixtures.mjs';
const forest=AUDIO_FIXTURES[0].context;
test('audio unknowns remain unknown; geographic identity survives rebasing and longitude wrapping',()=>{
 const c=acousticContext();assert.equal(c.key,'unknown');for(const k of ['worldTimeMs','altitudeM','season','localHour','weather','solarAltitude'])assert.equal(c[k],null);
 const g={lat:46.7,lon:.9};assert.equal(geographicKey(g),acousticContext({geo:g,position:{x:10000,y:0,z:-9000}}).key);assert.equal(geographicKey({lat:0,lon:180}),geographicKey({lat:0,lon:-180}));assert.equal(geographicKey({lat:91,lon:0}),'unknown');
});
test('audio civil time, dateline, hemispheres and invalid timezone are explicit',()=>{
 const date=Date.parse('2026-01-10T12:00:00Z');assert.equal(temporalContext(date,{lat:45,lon:0}).season,'winter');assert.equal(temporalContext(date,{lat:-45,lon:0}).season,'summer');
 assert.equal(temporalContext(date,{lat:0,lon:180}).localHour,0);assert.equal(temporalContext(date,{lat:0,lon:0},'Asia/Tokyo').localHour,21);assert.equal(temporalContext(date,{lat:0,lon:0},'bad').timeBasis,'mean-solar-estimate');assert.equal(temporalContext(date,null).timeBasis,'unknown');
 for(const [m,n,s] of [[4,'spring','autumn'],[7,'summer','winter'],[10,'autumn','spring']]){const t=Date.parse(`2026-${String(m).padStart(2,'0')}-10`);assert.equal(temporalContext(t,{lat:1,lon:0}).season,n);assert.equal(temporalContext(t,{lat:-1,lon:0}).season,s)}
});
test('indexed proximity matches exhaustive geometry, long segments and boundaries without world scans',()=>{
 const lines=Array.from({length:500},(_,i)=>[{x:i*300,z:-500},{x:i*300+600,z:500}]);lines.push([{x:-5000,z:0},{x:5000,z:0}]);const idx=proximityIndex(lines),rng=seededRandom(23);
 for(let i=0;i<100;i++){const p={x:rng()*500,z:rng()*400-200};const q=idx.query(p,120);let min=Infinity;for(const [a,b] of lines){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz))),d=Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);if(d<=120)min=Math.min(min,d)}assert.ok(Math.abs(q.distance-min)<1e-7||(min===Infinity&&q.distance===Infinity));assert.ok(q.checked<30)}
 assert.equal(idx.query({x:1000000,z:1000000}).checked,0);assert.equal(proximityIndex([]).query({x:0,z:0}).point,null);
});
test('habitat mixing shares classifications and preserves missing observations',()=>{
 assert.deepEqual(habitatInfluences({x:0,z:0},null),{});const f=habitatInfluences({x:0,z:0},x=>x<0?'wood':'built');assert.ok(f.forest>0&&f.settlement>0);assert.ok(f.forest+f.settlement<=1);
});
test('single engine blends seven declared fixtures; weather and boundaries have continuous mix',()=>{
 for(const f of AUDIO_FIXTURES){assert.equal(f.context.fixture,true);for(const l of layerMix(f.context))assert.ok(l.weight>=0&&l.weight<=.8)}
 const transitions=[[0,2],[4,3],[5,6]];for(const [a,b] of transitions){let previous=null;for(let i=0;i<=100;i++){const mix=Object.fromEntries(layerMix(blendFixture(AUDIO_FIXTURES[a].context,AUDIO_FIXTURES[b].context,i/100)).map(l=>[l.id,l.weight]));if(previous)for(const key of new Set([...Object.keys(mix),...Object.keys(previous)]))assert.ok(Math.abs((mix[key]??0)-(previous[key]??0))<.025);previous=mix}}
 const rain={...forest,weather:{wind:.7,rain:.45}};assert.ok(layerMix(rain).find(l=>l.id==='rain'));assert.equal(eventAffinity(EVENTS[0],rain),0);assert.equal(eventAffinity(EVENTS[0],{...forest,solarAltitude:-.1}),0);assert.equal(eventAffinity(EVENTS[0],{...forest,provenance:{region:'unknown'}}),0);
});
test('bounded local memory, variant avoidance, deterministic seed and varying revisits',()=>{
 const a=new SoundDirector({seed:19,maxCells:8}),b=new SoundDirector({seed:19,maxCells:8});const seq=[];for(let i=0;i<100;i++){const x=a.variant('x',['a','b','c'],forest.key,i);assert.equal(x,b.variant('x',['a','b','c'],forest.key,i));if(i)assert.notEqual(x,seq.at(-1));seq.push(x)}assert.ok(new Set(seq).size===3);
 for(let i=0;i<40;i++)a.visit('cell'+i,i);assert.equal(a.memory.size,8);assert.equal(a.memory.has(forest.key),false);a.visit('cell39',99);assert.equal(a.memory.get('cell39').visits,1);a.visit('new',100);a.visit('cell39',101);assert.equal(a.memory.get('cell39').visits,2);
});
test('rare events remain probabilistic, region gated and cannot burst after sleep or cell crossing',()=>{
 const event={id:'test',assets:['a','b','c'],affinity:'forest',perMinute:.05,cooldown:600,rare:true,priority:1,gain:.1};const a=new SoundDirector({seed:100,events:[event]}),b=new SoundDirector({seed:100,events:[event]});let count=0,last=-Infinity;
 for(let i=0;i<86400;i++){const c={...forest,key:'region'+Math.floor(i/1000)};const x=a.tick(c,i*.5),y=b.tick(c,i*.5);assert.deepEqual(x,y);if(x.length){assert.ok(i*.5-last>=600);last=i*.5;count++}}
 assert.ok(count>0&&count<50);assert.deepEqual(a.tick(forest,999999),[]);a.resetClock();assert.deepEqual(a.tick(forest,1000000),[]);
});
test('all declared assets exist, retain checksums/licences and provisional status',()=>{
 const m=JSON.parse(readFileSync('public/audio/manifest.json'));const sources=JSON.parse(readFileSync('public/audio/sources.json'));assert.equal(sources.length,4);
 for(const [id,a] of Object.entries(m.assets)){const data=readFileSync('public/audio/'+a.file);assert.equal(data.length,a.bytes);assert.equal(createHash('sha256').update(data).digest('hex'),a.sha256);assert.ok(a.license);assert.equal(a.provisional,a.source==='original-procedural');assert.ok(a.duration>0);assert.equal(a.sampleRate,24000)}
 for(const e of EVENTS)for(const a of e.assets)assert.ok(m.assets[a]);for(const p of Object.values(AUDIO_BUDGETS))assert.ok(p.hrtf<=3&&p.voices<=12);
});
