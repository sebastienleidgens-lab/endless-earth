"""Native mix analysis, without a listening/perceptual claim. Run after captures."""
from pathlib import Path
import json, subprocess, hashlib
import sys
sys.path.insert(0,str(Path('work/mission-26-2/python').resolve()))
import numpy as np
E=Path('docs/mission-26-2-evidence')
def packets(path):
 p=subprocess.check_output(['ffprobe','-v','error','-select_streams','a:0','-show_packets','-show_entries','packet=pts_time,dts_time,size,data_hash','-show_data_hash','sha256','-of','json',str(path)])
 return json.loads(p).get('packets',[])
rows=[]
for label in ['reference','candidate']:
 p=E/(label+'-native.json')
 if not p.exists():continue
 for c in json.loads(p.read_text())['cases']:
  row={'label':label,'scene':c['name'],'sourceSHA':c.get('sourceSHA'),'humanListeningPerformed':False}
  if not c.get('video'):
   row['failure']=c.get('failure','No native media');rows.append(row);continue
  f=E/c['video'];raw=E/c['original']
  try:
   original,indexed=packets(raw),packets(f)
   row.update(nativeFile=c['video'],originalFile=c['original'],audioPackets=len(indexed),originalAudioPackets=len(original),audioPacketPTSAndPayloadsIdentical=indexed==original,originalPacketsSHA256=hashlib.sha256(json.dumps(original,sort_keys=True).encode()).hexdigest(),indexedPacketsSHA256=hashlib.sha256(json.dumps(indexed,sort_keys=True).encode()).hexdigest())
   probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','a:0','-show_streams','-of','json',str(f)]));row['streams']=probe['streams']
   if not indexed:raise ValueError('No audio packets in native recording')
   pcm=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(f),'-map','0:a:0','-ac','2','-ar','48000','-f','f32le','pipe:1']),dtype='<f4').reshape(-1,2)
   if not np.isfinite(pcm).all():raise ValueError('Non-finite decoded PCM')
   rms=np.sqrt(np.mean(pcm.astype(np.float64)**2,axis=0));peak=np.max(np.abs(pcm),axis=0)
   row.update(sampleRateHz=48000,channels=2,decodedSeconds=len(pcm)/48000,rms=rms.tolist(),peak=peak.tolist(),clippedSampleFraction=float(np.mean(np.abs(pcm)>=.999)),stereoCorrelation=float(np.corrcoef(pcm[::16].T)[0,1]) if len(pcm)>16 and rms.min()>0 else None,sha256=hashlib.sha256(f.read_bytes()).hexdigest())
   row['functionalAudioPresent']=bool(rms.max()>1e-7)
  except Exception as exc:row['failure']=str(exc)
  rows.append(row)
(E/'audio-analysis.json').write_text(json.dumps({'method':'Original game stereo AudioContext. No added soundtrack, no listening review. Packet hashes/PTS compare codec-copy indexed media with raw native originals. PCM RMS/peaks/correlation establish measurable signal only, not pleasantness, spatial accuracy or naturalness.','licenses':['../../public/audio/sources.json','../../public/audio/legacy/sources.json'],'cases':rows},ensure_ascii=False,indent=2)+'\n')
