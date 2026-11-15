import json,pathlib,subprocess,numpy as np
folder=pathlib.Path('docs/mission-25-2-evidence'); rows=[]
for f in sorted(folder.glob('*.webm')):
 meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','a:0','-show_streams','-of','json',str(f)]))['streams']
 if not meta:continue
 m=meta[0];channels=m['channels'];raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(f),'-vn','-f','f32le','-acodec','pcm_f32le','-'])
 values=np.frombuffer(raw,dtype='<f4').reshape(-1,channels);finite=np.isfinite(values)
 peak=np.max(np.abs(values),axis=0);rms=np.sqrt(np.mean(values.astype(np.float64)**2,axis=0));clips=np.sum(np.abs(values)>=.999969,axis=0);corr=float(np.corrcoef(values.T)[0,1]) if channels==2 and np.all(rms>0) else None
 rows.append({'file':f.name,'channels':channels,'sampleRate':int(m['sample_rate']),'samplesPerChannel':len(values),'peakLinear':peak.tolist(),'rmsLinear':rms.tolist(),'samplesAtFullScale':clips.tolist(),'nonFiniteSamples':int(np.size(finite)-np.sum(finite)),'leftRightCorrelation':corr})
 print(f.name,channels,peak.tolist(),clips.tolist(),flush=True)
 del raw,values,finite
(folder/'audio-checks.json').write_text(json.dumps({'method':'Decoded native MediaRecorder AudioContext mix, channel statistics on encoded output; not human listening or perceptual validation. No audio normalization or replacement.', 'humanHeadphoneListening':'not validated','humanLoudspeakerListening':'not validated','rows':rows},indent=2))
