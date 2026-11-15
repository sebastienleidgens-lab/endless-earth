import {readdir,readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='docs/mission-25-1-evidence',hash=b=>createHash('sha256').update(b).digest('hex');
const videos=(await readdir(root)).filter(p=>p.endsWith('.webm'));
const receipts=new Map(),superseded=[];
for(const name of (await readdir(root)).filter(p=>p.startsWith('captures-')&&p.endsWith('.json'))){
 const doc=JSON.parse(await readFile(root+'/'+name,'utf8'));let changed=false;
 for(const row of doc.videos??[]){const file=row.file??row.name+'.webm';if(!videos.includes(file))continue;const current=hash(await readFile(root+'/'+file));
  if(row.media?.indexedSha256===current){receipts.set(file,{...row.media,receipt:name});}
  else if(row.media){row.superseded=true;row.note='Earlier take replaced by the separately listed current receipt; not proof of the current file.';superseded.push({receipt:name,file});changed=true;}
 }
 if(changed)await writeFile(root+'/'+name,JSON.stringify(doc,null,2));
}
for(const name of ['voyage-3','voyage-5','failed-voyage-3','mobile-touch']){
 const path=name==='mobile-touch'?'mobile.json':name+'.json',doc=JSON.parse(await readFile(root+'/'+path,'utf8'));
 if(doc.media)receipts.set(name+'.webm',{...doc.media,receipt:path});
}
await mkdir(root+'/raw',{recursive:true});const rows=[];
for(const file of videos){
 const receipt=receipts.get(file);assert.ok(receipt,'Missing native receipt '+file);
 const encoded=await readFile(root+'/'+file),raw=await readFile('work/mission-25-1/raw/'+file);
 assert.equal(hash(encoded),receipt.indexedSha256,file+' indexed checksum');assert.equal(hash(raw),receipt.rawSha256,file+' original checksum');assert.equal(receipt.packetPTSAndPayloadsIdentical,true);
 await copyFile('work/mission-25-1/raw/'+file,root+'/raw/'+file);rows.push({file,raw:'raw/'+file,bytes:encoded.length,rawBytes:raw.length,...receipt});
}
await writeFile(root+'/native-integrity.json',JSON.stringify({method:'Every indexed media file and delivered original matches its native capture receipt. Codec packets and timestamps were compared during indexing. Superseded takes are explicitly excluded.',rows,superseded},null,2));
const trips=[];for(const name of ['voyage-3','voyage-5']){const d=JSON.parse(await readFile(root+'/'+name+'.json','utf8'));trips.push({name,distance:d.distance,docking:d.docking,jobWallSeconds:d.seconds,media:d.media});}
await writeFile(root+'/voyages.json',JSON.stringify(trips,null,2));
// Formatting only: retain every numeric value and event while avoiding enormous
// whitespace diffs in long native traces. Media bytes remain untouched.
for(const name of (await readdir(root)).filter(p=>p.endsWith('.json'))){const raw=await readFile(root+'/'+name,'utf8');if(raw.length>500000){const doc=JSON.parse(raw);await writeFile(root+'/'+name,JSON.stringify(doc)+'\n');}}
console.log('PASS',rows.length,'native files + originals; trace values retained');
