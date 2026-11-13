// Audit real MediaRecorder streams after metadata-only remuxing.
import {readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const dir='docs/mission-19-evidence',work='work/mission-19';
async function walk(path){const all=[];for(const n of await readdir(path)){const f=path+'/'+n;if((await stat(f)).isDirectory())all.push(...await walk(f));else all.push(f)}return all}
const sha=b=>createHash('sha256').update(b).digest('hex');
const probe=f=>JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',f],{maxBuffer:4e6}));
const packets=(f,stream)=>JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams',stream,'-show_packets','-show_entries','packet=pts_time,dts_time,size,data_hash','-show_data_hash','sha256','-of','json',f],{maxBuffer:8e6})).packets;
const rows=[];
for(const file of (await walk(dir)).filter(f=>f.endsWith('.webm')).sort()){
 const base=file.split('/').at(-1).replace('.webm',''),category=file.split('/').at(-2);
 const rawName=category==='audio'?'audio-'+base:category==='tours'?'tour-'+base:base==='after-run-walk-turn'?'run':base==='after-run-forest-trail'?'forest-trail':base;
 const raw=work+'/'+rawName+'-raw.webm',p=probe(file),original=probe(raw);const streams=[];
 for(const type of ['video','audio']){const letter=type==='video'?'v:0':'a:0',s=p.streams.find(s=>s.codec_type===type),a=packets(raw,letter),b=packets(file,letter);assert.deepEqual(b,a,file+' '+type+' payloads and timestamps');if(s){assert.ok(b.length>0);streams.push({type,codec:s.codec_name,packets:b.length,firstPTS:b[0].pts_time,lastPTS:b.at(-1).pts_time,identicalPayloadsAndPTS:true})}}
 assert.equal(p.streams.length,original.streams.length);
 // Decode every packet, including the actual game audio, without producing media.
 execFileSync('ffmpeg',['-v','error','-xerror','-i',file,'-fps_mode','passthrough','-enc_time_base:v','1:1000','-f','null','-'],{maxBuffer:2e6});
 rows.push({file:file.slice(dir.length+1),bytes:(await stat(file)).size,durationSeconds:Number(p.format.duration),width:p.streams.find(s=>s.codec_type==='video').width,height:p.streams.find(s=>s.codec_type==='video').height,streams,decodeAllPackets:'pass',rawSha256:sha(await readFile(raw)),indexedSha256:sha(await readFile(file))});console.log('PASS MEDIA',base,streams.map(s=>s.type+':'+s.packets).join(' '));
}
assert.ok(rows.length>=20,'all native campaigns must be present');
await writeFile(dir+'/media.json',JSON.stringify({protocol:'Full ffmpeg decode of every delivered native WebM, preserving variable frame timestamps in a millisecond validation sink (no CFR quantization). Encoded video AND audio packet SHA256 payloads, PTS, DTS and sizes compared with the corresponding untouched MediaRecorder output. Metadata-only -c copy remux. No frame reconstruction, speed-up, substituted or normalized soundtrack.',files:rows.length,rows},null,2)+'\n');
