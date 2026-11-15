from pathlib import Path
import json, subprocess, hashlib
import numpy as np

root=Path('docs/mission-25-1-evidence')
rows=[]
for path in sorted(root.glob('*.webm')):
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))
    streams=probe['streams'];audio=next((s for s in streams if s['codec_type']=='audio'),None)
    row={'file':path.name,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'durationSeconds':float(probe['format'].get('duration',0)),'streams':[{'codec':s['codec_name'],'type':s['codec_type'],'channels':s.get('channels')} for s in streams]}
    if audio:
        raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-vn','-ac','2','-ar','16000','-f','f32le','pipe:1'])
        pcm=np.frombuffer(raw,dtype='<f4').reshape(-1,2)
        rms=np.sqrt(np.mean(pcm.astype(np.float64)**2,axis=0));diff=np.sqrt(np.mean((pcm[:,0]-pcm[:,1])**2))
        row['audio']={'channels':audio.get('channels'),'rmsDbFS':[float(20*np.log10(max(1e-12,x))) for x in rms],'peak':float(np.max(np.abs(pcm))),'leftRightDifferenceRms':float(diff),'nonSilent':bool(np.max(rms)>1e-5),'method':'Decoded native captured complete mix. L/R difference proves channel differences, not by itself source identity or artistic quality.'}
    trace=root/(path.stem+'.json')
    if trace.exists():
        data=json.loads(trace.read_text());frames=data.get('frames',[])
        dt=[f['ms'] for f in frames if f.get('ms',0)>0]
        if dt:row['nativeFrameMs']={'median':float(np.median(dt)),'p95':float(np.percentile(dt,95)),'frames':len(dt)}
    rows.append(row)
(root/'media-audit.json').write_text(json.dumps({'method':'ffprobe codec/channel/duration inspection and decoded native PCM levels; no audio/video re-encoding.', 'rows':rows},ensure_ascii=False,indent=2))
print(json.dumps([{'file':r['file'],'seconds':round(r['durationSeconds'],1),'audio':r.get('audio',{}).get('nonSilent',False)} for r in rows],ensure_ascii=False))
