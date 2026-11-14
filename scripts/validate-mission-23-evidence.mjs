import {readFile,writeFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {launch} from './lib/mission-22-1-browser.mjs';
const out='docs/mission-23-evidence',json=async name=>JSON.parse(await readFile(out+'/'+name+'.json'));
const before=await json('before'),after=await json('after'),gallery=await json('gallery-scenes'),owner=await json('owner-cases/cases');
assert.equal(before.rows.length,24);assert.equal(after.rows.length,24);assert.equal(owner.cases.length,7);
assert.ok(owner.cases.every(c=>!c.fixed&&!c.reproduced&&c.coordinates===null));
for(const a of after.rows){const b=before.rows.find(b=>b.name===a.name);assert.deepEqual(a.state.camera,b.state.camera);assert.deepEqual(a.station,b.station);assert.equal(a.snow,b.snow);assert.equal(a.state.profile,b.state.profile);assert.equal(a.state.climate.worldTimeMs,b.state.climate.worldTimeMs);assert.deepEqual(a.state.climate.weather,b.state.climate.weather)}
assert.deepEqual(before.errors,[]);assert.deepEqual(after.errors,[]);
const html=await readFile(out+'/index.html','utf8'),links=[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1]);
for(const link of links)await stat(out+'/'+link);
const media=[];
for(const file of gallery.videos){const path=out+'/'+file,rawPath='work/mission-23/'+file.replace('.webm','-raw.webm'),probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',path],{encoding:'utf8'})),video=probe.streams.find(s=>s.codec_type==='video');assert.ok(video?.width>0&&video?.height>0);assert.ok(Number(probe.format.duration)>0);
 const packets=p=>JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_packets','-show_entries','packet=pts_time,dts_time,size,data_hash','-show_data_hash','sha256','-of','json',p],{maxBuffer:8*1024*1024})).packets;
 const original=packets(rawPath),indexed=packets(path);assert.deepEqual(indexed,original,'Native video payload and timestamps changed: '+file);
 const data=await readFile(path),raw=await readFile(rawPath);media.push({file,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),rawSha256:createHash('sha256').update(raw).digest('hex'),nativeVideoPacketsUnchanged:true,packets:indexed.length,durationSeconds:Number(probe.format.duration),streams:probe.streams.map(s=>({type:s.codec_type,codec:s.codec_name,width:s.width,height:s.height,sampleRate:s.sample_rate}))})}
const browser=await launch(),layouts=[],errors=[];
try{const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>errors.push(String(e)));await page.goto('http://localhost:5373/endless-earth/docs/mission-23-evidence/index.html');
 for(let i=0;i<24;i++){await page.locator('#scene').selectOption(String(i));await page.waitForFunction(()=>['before','after'].every(id=>{const img=document.getElementById(id);return img.complete&&img.naturalWidth===960&&img.naturalHeight===600}));}
 for(const viewport of [{width:1280,height:800},{width:390,height:844},{width:320,height:568}]){await page.setViewportSize(viewport);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);layouts.push({viewport,overflow});}
 assert.deepEqual(errors,[]);
}finally{await browser.close()}
await writeFile(out+'/evidence-validation.json',JSON.stringify({method:'Actual gallery UI and 24 decoded image pairs, camera/date/weather/profile equality, local link existence, indexed native media streams/durations/hashes. Original owner cases remain unverifiable. This checks evidence integrity, not geographic survey accuracy.',runtimeCandidate:after.sourceCommit,pairs:24,links:links.length,media,layouts,errors},null,2)+'\n');
console.log('PASS evidence gallery, matched cameras/climate, local links, native media',media.length);
