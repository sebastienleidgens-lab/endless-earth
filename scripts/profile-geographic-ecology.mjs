// CPU-only detail recipe comparison, no rendering or hardware-GPU inference.
import {readFile,writeFile,mkdir} from 'node:fs/promises';import {execFileSync} from 'node:child_process';import {mergeEnvironment} from '../src/world/environment.mjs';import {sampleGrid} from '../src/world/terrain-grid.mjs';
const root='work/mission-08-5/cpu';await mkdir(root,{recursive:true});await writeFile(`${root}/before.mjs`,execFileSync('git',['show','b440dd7:src/nature/ecology.mjs'],{encoding:'utf8'}).replace("'../world/landcover.mjs'","'./before-landcover.mjs'"));
await writeFile(`${root}/before-landcover.mjs`,execFileSync('git',['show','b440dd7:src/world/landcover.mjs'],{encoding:'utf8'}));
const old=await import(`../${root}/before.mjs`),current=await import('../src/nature/ecology.mjs');const read=async root=>JSON.parse(await readFile(`${root}/angles-terrain.json`));const data=JSON.parse(await readFile('public/data/angles-osm.geojson')),environment=JSON.parse(await readFile('public/data/angles-environment.json'));
const local=([lon,lat])=>({x:(lon-.8844)*111320*Math.cos(46.6953*Math.PI/180),z:-(lat-46.6953)*111320});
const normalize=features=>features.map(f=>{const g=f.geometry;return {tags:f.properties??{},...g.type==='Polygon'?{rings:g.coordinates.map(r=>r.map(local))}:g.type==='LineString'?{line:g.coordinates.map(local)}:g.type==='Point'?{point:local(g.coordinates)}:{}}});
const all=[];
for(let round=0;round<3;round++)for(const phase of round%2?['after','before']:['before','after']){
 const m=phase==='before'?old:current,g=await read(phase==='before'?'work/mission-08-5/baseline/public/data':'public/data'),features=normalize(phase==='before'?data.features:mergeEnvironment(data.features,environment)),start=performance.now(),e=m.createEcology(features,(x,z)=>sampleGrid(g,x,z)),generationMs=performance.now()-start,samples=[];
 for(const [cx,cz] of [[-1,-1],[-2,-2],[-3,-3],[1,4]])for(let i=0;i<100;i++){const start=performance.now();m.detailRecipe(cx,cz,e,i*32,(i+1)*32);samples.push(performance.now()-start)}
 all.push({round,phase,generationMs,trees:e.trees.length,slice32Ms:samples});
}
const q=(a,p)=>[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*p)];const summary=Object.fromEntries(['before','after'].map(phase=>{const r=all.filter(r=>r.phase===phase),s=r.flatMap(r=>r.slice32Ms);return [phase,{generationMedianMs:q(r.map(r=>r.generationMs),.5),sliceMedianMs:q(s,.5),sliceP95Ms:q(s,.95),sliceMaxMs:Math.max(...s)}]}));await writeFile('docs/mission-08-5-captures/ecology-cpu.json',JSON.stringify({protocol:'Node CPU only, three alternating rounds, 400 batches of 32 candidates per version per round at four declared cells; no rendering. This does not explain or cancel browser/SwiftShader stalls.',results:all,summary},null,2));console.log(summary);
