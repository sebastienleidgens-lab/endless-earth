import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const out='docs/mission-26-2-evidence';
await mkdir(out,{recursive:true});
const git=(...args)=>execFileSync('git',args).toString().trim();
const ref='d6a906cd7546a4cd8e85226efff64436e53ea200';
const ancestor=(a,b)=>{try{git('merge-base','--is-ancestor',a,b);return true;}catch{return false;}};
const m=JSON.parse(await readFile('public/planet/fr-86/manifest.json'));
const features=new Map();
for(const t of m.tiles){const d=JSON.parse(gunzipSync(await readFile('public/planet/fr-86/'+t.url)));for(const f of d.features)features.set(f.id,f);}
const allowed=[],unknown={},restrictions={},accessSamples={private:[],unknown:[],rail:[],motorway:[],structure:[]};
for(const f of features.values()){
 const k=f.kind+':'+(f.tags.access??'unknown');unknown[k]=(unknown[k]??0)+1;
 const sample=key=>{if(accessSamples[key].length<5)accessSamples[key].push(f);};
 if(['private','no'].includes(f.tags.access))sample('private');
 if(f.kind==='landcover'&&!f.tags.access&&!f.tags.foot)sample('unknown');
 if(f.kind==='rail'&&!['razed','dismantled'].includes(f.tags.railway))sample('rail');
 if(f.tags.highway==='motorway')sample('motorway');
 if((f.tags.bridge&&f.tags.bridge!=='no')||(f.tags.tunnel&&f.tags.tunnel!=='no'))sample('structure');
 if(f.polygon&&['yes','permissive','designated'].includes(f.tags.foot??f.tags.access))allowed.push(f);
 for(const k of ['foot','access','barrier','bridge','tunnel','layer'])if(f.tags[k])restrictions[k+':'+f.tags[k]]=(restrictions[k+':'+f.tags[k]]??0)+1;
}
const paths=git('ls-tree','-r','--name-only',ref,'public','src/world','src/living','.github/workflows').split('\n');
const changed=[],missing=[];let identical=0;
for(const p of paths){const original=execFileSync('git',['show',ref+':'+p],{maxBuffer:64*1024*1024});try{const data=await readFile(p);if(data.equals(original))identical++;else changed.push({path:p,before:createHash('sha256').update(original).digest('hex'),after:createHash('sha256').update(data).digest('hex')});}catch{missing.push(p);}}
const report={gitObservationPhase:'Pre-delivery commit/push. candidateSHA is the measured program HEAD; remote is the PR head observed before publishing this delivery.',referenceSHA:ref,candidateSHA:git('rev-parse','HEAD'),main:git('rev-parse','origin/main'),branch:git('branch','--show-current'),remote:git('rev-parse','origin/mission/26-vienne-planet-engine'),m252HeadAncestor:ancestor('110b4548aa32297e837874cb6a9a6353c4d1f94b','HEAD'),m252MergeAncestor:ancestor('5fe6e792f34369926854b649a5b631426b7037c4','HEAD'),m252AlreadyInMain:ancestor('110b4548aa32297e837874cb6a9a6353c4d1f94b','origin/main'),preservation:{checked:paths.length,identical,changed,missing},tiles:m.tiles.length,features:features.size,tagCounts:restrictions,accessCounts:unknown,explicitAreaCandidates:allowed,accessSamples,method:'Immutable source inventory and access candidates only. No area is certified physically walkable by this inventory; unknown stays unknown.'};
await writeFile(out+'/audit.json',JSON.stringify(report,null,2));
console.log({tiles:m.tiles.length,features:features.size,explicitAreas:allowed.length,areaKinds:allowed.map(f=>({id:f.id,kind:f.kind,tags:f.tags})).slice(0,25),preservation:report.preservation});
