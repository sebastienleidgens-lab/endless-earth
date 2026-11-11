"""Inspect the native session without retaining a large decoded waveform."""
from pathlib import Path
import subprocess,json,math
import numpy as np
p=Path('docs/mission-11-evidence/optimization');source=p/'session-15min.webm'
media=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_name,sample_rate,channels','-of','json',str(source)],text=True));(p/'media.json').write_text(json.dumps(media,indent=2)+'\n')
process=subprocess.Popen(['ffmpeg','-v','error','-i',str(source),'-vn','-f','f32le','-ar','32000','-ac','2','pipe:1'],stdout=subprocess.PIPE)
count=clipped=0;power=peak=0.
while block:=process.stdout.read(262144):
 a=np.frombuffer(block,dtype=np.float32);count+=len(a);peak=max(peak,float(abs(a).max()));clipped+=int(np.count_nonzero(abs(a)>=1));power+=float(np.dot(a.astype(np.float64),a.astype(np.float64)))
assert process.wait()==0
rms=math.sqrt(power/count);levels={'method':'Decode the canonical realtime Opus capture to float stereo at 32 kHz solely for analysis. No gain filter or normalization; channel samples accumulated in bounded blocks. Playback file unchanged. Lossy codec/resampling may slightly change individual sample peaks.','seconds':count/64000,'peak':peak,'rms':rms,'rmsDbFS':20*math.log10(max(rms,1e-12)),'clippedSamples':clipped};(p/'levels.json').write_text(json.dumps(levels,indent=2)+'\n')
session=json.loads((p/'session-15min.json').read_text())
for phase,name in [(3,'river'),(4,'wind'),(5,'storm')]:
 start=next(c['seconds'] for c in session['chapters'] if c['phase']==phase)+12
 subprocess.run(['ffmpeg','-v','error','-y','-ss',str(start),'-i',str(source),'-t','45','-vn','-c:a','copy',str(p/f'excerpt-{name}.webm')],check=True)
print(json.dumps(levels))
