import {readFile,writeFile} from 'node:fs/promises';
const dir='docs/mission-08-captures',read=async p=>JSON.parse(await readFile(`${dir}/${p}`,'utf8'));
const quant=(v,p)=>[...v].sort((a,b)=>a-b)[Math.min(v.length-1,Math.floor((v.length-1)*p))];
const b=await read('benchmark.json'),comparison={};
for(const n of Object.keys(b.runs[0].results)){
 const row={};for(const phase of ['before','after']){const runs=b.runs.filter(r=>r.phase===phase),values=runs.flatMap(r=>r.results[n].samples.map(s=>s.completeMs)),sub=runs.flatMap(r=>r.results[n].samples.map(s=>s.cpuSubmitMs)),v=runs.at(-1).results[n];row[phase]={medianMs:quant(values,.5),p95Ms:quant(values,.95),maxMs:Math.max(...values),cpuSubmitMedianMs:quant(sub,.5),roundMedians:runs.map(r=>quant(r.results[n].samples.map(s=>s.completeMs),.5)),calls:v.samples[0].calls,triangles:v.samples[0].triangles,memory:v.memory,lodP95Ms:quant(runs.flatMap(r=>r.results[n].lod),.95)}}row.percent=(row.after.medianMs/row.before.medianMs-1)*100;comparison[n]=row;
}
const load={};for(const phase of ['before','after']){const r=b.runs.filter(r=>r.phase===phase);load[phase]={samplesMs:r.map(r=>r.loadMs),medianMs:quant(r.map(r=>r.loadMs),.5),terrainPreparationSamplesMs:r.flatMap(r=>r.terrainCpuMs)}}
const summary={environment:b.runs[0].environment,load,comparison};
try{const walk=await read('walk.json'),frames=walk.cpuFrames.filter(f=>f.autoWalk);summary.walk={metres:walk.frameMeasuredMetres,seconds:walk.frameMeasuredSeconds,frames:walk.frames,message:walk.message,cpuMs:{median:quant(frames.map(f=>f.cpuMs),.5),p95:quant(frames.map(f=>f.cpuMs),.95),max:Math.max(...frames.map(f=>f.cpuMs))},submitMs:{median:quant(frames.map(f=>f.submitMs),.5),p95:quant(frames.map(f=>f.submitMs),.95),max:Math.max(...frames.map(f=>f.submitMs))},intervalMs:{median:quant(frames.map(f=>f.intervalMs),.5),p95:quant(frames.map(f=>f.intervalMs),.95),max:Math.max(...frames.map(f=>f.intervalMs))},preparation:frames.at(-1)?.nature.preparation,traceCapped:walk.cpuTraceCapped};}catch{}
await writeFile(`${dir}/summary.json`,JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
