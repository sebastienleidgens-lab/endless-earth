import pathlib,json,subprocess,hashlib,os,numpy as np
r=pathlib.Path(__file__).resolve().parents[1];d=r/'docs/mission-21-evidence';rows=[]
def probe(path,args):return json.loads(subprocess.check_output(['ffprobe','-v','error',*args,'-of','json',str(path)]))
for p in sorted((d/'audio').glob('*.webm') if os.environ.get('MEDIA_SCOPE')=='audio' else d.rglob('*.webm')):
 meta=probe(p,['-show_streams','-show_format']);audio=[s for s in meta['streams'] if s['codec_type']=='audio'];video=[s for s in meta['streams'] if s['codec_type']=='video'];assert audio and video,p
 pcm=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-vn','-ar','16000','-ac','1','-f','f32le','-']),dtype='<f4');peak=float(np.max(np.abs(pcm))) if len(pcm) else 0;rms=float(np.sqrt(np.mean(pcm*pcm))) if len(pcm) else 0
 frames=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-an','-vf','scale=96:64','-f','rawvideo','-pix_fmt','rgb24','-']),dtype='uint8').reshape(-1,64,96,3);lum=np.dot(frames,np.array([.2126,.7152,.0722]))/255;means=lum.mean(axis=(1,2));white=(lum>.94).mean(axis=(1,2));suspects=np.where((means>.88)&(white>.70))[0].tolist()
 raw=r/'work/mission-21'/((p.stem+'-raw.webm') if not p.stem.startswith('walk-') else p.stem+'-raw.webm');packetProof=None
 if raw.exists():
  packetArgs=['-show_packets','-show_entries','packet=pts_time,dts_time,size,data_hash','-show_data_hash','sha256'];counts={}
  for kind in ['a:0','v:0']:
   keys=['pts_time','dts_time','size','data_hash'];a=[{k:x.get(k) for k in keys} for x in probe(raw,['-select_streams',kind,*packetArgs])['packets']];b=[{k:x.get(k) for k in keys} for x in probe(p,['-select_streams',kind,*packetArgs])['packets']];assert a==b,'Native '+kind+' packet payload or timestamp changed: '+str(p);counts[kind]=len(a)
  packetProof=dict(audioVideoPacketPayloadsAndPTSIdentical=True,packetsByMediaType=counts,streamOrderingMayChange=True,rawSha256=hashlib.sha256(raw.read_bytes()).hexdigest())
 row=dict(file=str(p.relative_to(d)),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),durationSeconds=float(meta['format']['duration']),videoFrames=len(frames),audioCodec=audio[0]['codec_name'],videoCodec=video[0]['codec_name'],audioSamplePeak=peak,audioRmsDbFS=20*np.log10(max(rms,1e-12)),clippedSamples=int(np.count_nonzero(np.abs(pcm)>=.999)),maxFrameMean=float(means.max()),maxWhiteFraction=float(white.max()),globalOverexposureFrames=suspects,nativePacketProof=packetProof);rows.append(row);print(p.name,round(row['durationSeconds'],2),'s, peak',round(peak,4),'clipped',row['clippedSamples'],'suspects',suspects)
 assert peak<.999 and row['clippedSamples']==0,p
 assert not suspects,p
 assert packetProof,p
(d/('media-audio.json' if os.environ.get('MEDIA_SCOPE')=='audio' else 'media.json')).write_text(json.dumps(dict(method='Decode the supplied native films. Measure mono 16 kHz sample peak, RMS and clipping without changing files. Decode every video frame downscaled to 96×64 for broad luminance screening. Compare EVERY encoded audio/video packet payload hash and PTS/DTS to the preserved native raw capture after codec-copy WebM indexing. Signal tests do not certify subjective sonic quality.',rows=rows),indent=2)+'\n')
