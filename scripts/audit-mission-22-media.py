import pathlib,json,subprocess,hashlib,re
out=pathlib.Path('docs/mission-22-evidence');work=pathlib.Path('work/mission-22');rows=[]
for file in sorted(out.rglob('*.webm')):
 raw=work/(file.stem+'-raw.webm');assert raw.exists(),str(raw)
 def packets(path):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_packets','-show_entries','packet=stream_index,pts_time,dts_time,size,data_hash','-show_data_hash','sha256','-of','json',str(path)]))['packets']
 original,indexed=packets(raw),packets(file)
 originalInfo=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(raw)]));indexedInfo=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(file)]))
 kinds=[(s['codec_type'],s['codec_name']) for s in originalInfo['streams']];assert sorted(kinds)==sorted((s['codec_type'],s['codec_name']) for s in indexedInfo['streams'])
 for kind,codec in kinds:
  originalIndex=next(s['index'] for s in originalInfo['streams'] if (s['codec_type'],s['codec_name'])==(kind,codec));indexedIndex=next(s['index'] for s in indexedInfo['streams'] if (s['codec_type'],s['codec_name'])==(kind,codec))
  a=[{k:v for k,v in p.items() if k!='stream_index'} for p in original if p['stream_index']==originalIndex];b=[{k:v for k,v in p.items() if k!='stream_index'} for p in indexed if p['stream_index']==indexedIndex];assert a==b,f'Encoded payload/PTS mismatch: {file}, {kind}/{codec}'

 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(file)]));audio=[s for s in info['streams'] if s['codec_type']=='audio'];assert audio,'Native audio required: '+str(file)
 probe=subprocess.run(['ffmpeg','-v','info','-i',str(file),'-map','0:a:0','-af','astats=metadata=0:reset=0','-f','null','-'],capture_output=True,text=True,check=True)
 peaks=[float(x) for x in re.findall(r'Peak level dB:\s*(-?[\d.]+)',probe.stderr)];rms=[float(x) for x in re.findall(r'RMS level dB:\s*(-?[\d.]+)',probe.stderr)];peak=max(peaks) if peaks else None
 assert peak is not None and peak<-.1, str(file)+' must not clip'
 row={'file':str(file.relative_to(out)),'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'rawSha256':hashlib.sha256(raw.read_bytes()).hexdigest(),'streamPacketPayloadsAndPTSIdentical':True,'packets':len(indexed),'durationSeconds':float(info['format']['duration']),'streams':[{'type':s['codec_type'],'codec':s['codec_name'],'sampleRate':s.get('sample_rate')} for s in info['streams']],'peakDbFS':peak,'rmsDbFS':rms[-1] if rms else None};rows.append(row);print(file.name,round(row['durationSeconds'],1),peak)
(out/'media.json').write_text(json.dumps({'method':'Every audio and video stream matched by type/codec (container track order may change), then compared to the raw native MediaRecorder capture by packet SHA-256, PTS, DTS and size. Container indexing only, no codec change or post soundtrack. Decoded full-length ffmpeg astats signal levels; no digital clipping threshold crossed. This does not certify perceptual quality.','rows':rows},indent=2)+'\n')
