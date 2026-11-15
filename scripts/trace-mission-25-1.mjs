import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {windAtWorld,windTemporal} from '../src/earthlife/wind.mjs';
import {SoundDirector} from '../src/audio/director.mjs';
import {acousticContext} from '../src/audio/context.mjs';
import {emitterCandidates} from '../src/audio/emitters.mjs';
const out='docs/mission-25-1-evidence',wind=[];
for(let seconds=0;seconds<=10800;seconds++)wind.push({seconds,...windAtWorld(128,256,seconds,.55,9),temporal:windTemporal(seconds)});
const audio=[];
for(const [habitat,influences]of [['wood',{forest:1,vegetation:1}],['built',{built:1,vegetation:.2}],['riparian',{vegetation:.7,water:1}]]){
 const c=acousticContext({geo:{lat:46.7,lon:.9},worldTimeMs:Date.parse('2026-06-15T06:00:00Z'),timeZone:'Europe/Paris',altitudeM:100,position:{x:0,y:0,z:0},habitat,solarAltitude:.4,weather:{wind:.25,rain:0},influences,provenance:{geography:'synthetic classification fixture, NOT native walk evidence',weather:'simulated',region:'temperate-europe'}});
 c.emitters=emitterCandidates(c,()=>habitat,()=>100);const d=new SoundDirector({seed:20}),events=[];
 for(let seconds=0;seconds<=600;seconds+=.5){d.preload(c,seconds);for(const event of d.tick(c,seconds))events.push({seconds,...event});}
 let last=0,maxSilence=0;for(const event of events){maxSilence=Math.max(maxSilence,event.seconds-last);last=event.seconds;}maxSilence=Math.max(maxSilence,600-last);
 audio.push({habitat,events,maxSilenceSeconds:maxSilence,uniqueAssets:new Set(events.map(e=>e.asset)).size,emitters:c.emitters});
}
const hashes={};for(const path of ['src/earthlife/wind.mjs','src/audio/director.mjs','src/character/clips.mjs','src/audio/water-synthesis.mjs'])hashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');
await writeFile(out+'/determinism.json',JSON.stringify({method:'Pure simulation traces at native simulated seconds; not accelerated native video. Synthetic habitat fixtures explicitly separated from real pilot media.',wind,audio,hashes},null,2));
console.log(JSON.stringify({wind:{min:Math.min(...wind.map(w=>w.speed)),max:Math.max(...wind.map(w=>w.speed))},audio:audio.map(a=>({habitat:a.habitat,calls:a.events.length,assets:a.uniqueAssets,silence:a.maxSilenceSeconds}))}));
