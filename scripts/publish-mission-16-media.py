"""Write seekable duration/index metadata, preserving every native packet/PTS."""
import json,pathlib,subprocess,hashlib,shutil,gzip
root=pathlib.Path('docs/mission-16-evidence');raw=root.parent.parent/'work/mission-16/native-originals';raw.mkdir(parents=True,exist_ok=True);rows=[]
def packets(p):
 return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_packets','-show_entries','packet=stream_index,pts_time,dts_time,duration_time,data_hash','-show_data_hash','sha256','-of','json',str(p)]))['packets']
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for p in sorted(root.glob('*.webm')):
 original=raw/p.name
 if not original.exists():shutil.copy2(p,original)
 target=raw/(p.stem+'-indexed.webm')
 subprocess.run(['ffmpeg','-v','error','-y','-copyts','-i',str(original),'-map','0','-c','copy','-avoid_negative_ts','disabled',str(target)],check=True)
 before0=packets(original);after0=packets(target)
 streams=sorted(set(p['stream_index'] for p in before0))
 before=[p for stream in streams for p in before0 if p['stream_index']==stream];after=[p for stream in streams for p in after0 if p['stream_index']==stream]
 assert len(before)==len(after),(p.name,'packet count')
 assert all(all(a.get(k)==b.get(k) for k in ['stream_index','pts_time','dts_time','data_hash']) for a,b in zip(before,after)),(p.name,'encoded packet/timestamp mismatch')
 assert all('duration_time' not in a or a['duration_time']==b.get('duration_time') for a,b in zip(before,after)),(p.name,'known duration mismatch')
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_type,codec_name,width,height','-of','json',str(target)]));duration=float(probe['format']['duration']);assert duration>0
 shutil.copy2(target,p);rows.append({'file':p.name,'nativeSha256':sha(original),'indexedSha256':sha(p),'packets':len(before),'encodedPacketsAndPtsIdentical':True,'knownPacketDurationsPreserved':True,'missingDurationMetadataAdded':sum('duration_time' not in a and 'duration_time' in b for a,b in zip(before,after)),'duration':duration,'bytes':p.stat().st_size})
 meta=root/(p.stem+'.json')
 if meta.exists():
  x=json.loads(meta.read_text());x['recordedSeconds']=duration
  if 'seconds' in x:x.setdefault('controllerAndExportSeconds',x['seconds']);x['seconds']=duration
  trace=root/(p.stem.replace('-native','-trace')+'.json.gz')
  if trace.exists():
   f=json.loads(gzip.decompress(trace.read_bytes()));x['frameTraceSeconds']=(f[-1]['t']-f[0]['t'])/1000
  x['containerPublication']='Copy-only remux adds duration/seek index; encoded packets and PTS/DTS identical; existing duration metadata preserved, missing duration/index metadata added.';meta.write_text(json.dumps(x,indent=2)+'\n')
(root/'media-publication.json').write_text(json.dumps({'method':'Native live canvas/WebAudio originals retained in ignored work/. ffmpeg copy-only remux writes seekable duration metadata; every encoded video/audio packet and PTS/DTS exactly identical; every previously known duration preserved. Missing packet-duration metadata may be added by the muxer. Interleaving can change, stream-local packet order stays identical. No encoding, acceleration, normalization or replacement soundtrack.','rows':rows},indent=2)+'\n');print([(r['file'],r['duration']) for r in rows])
