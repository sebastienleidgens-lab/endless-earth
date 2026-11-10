"""Objective audio measurements, never a claim of human listening/relaxation."""
import pathlib,subprocess,json,math
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1];D=ROOT/'docs/mission-10-1-evidence';rows=[]
for folder in ['before','after']:
 for path in sorted((D/folder).glob('*.flac')):
  rate=16000;a=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-ar',str(rate),'-ac','1','-f','f32le','-']),dtype='<f4').astype(np.float64)
  power=float(np.mean(a*a));peak=float(np.max(np.abs(a)));seconds=[float(np.sqrt(np.mean(a[i:i+rate]**2))) for i in range(0,len(a),rate)]
  # Averaged 1 s spectra, without phase-sensitive stereo downmix comparisons.
  bins=np.zeros(rate//2+1)
  for i in range(0,len(a)-rate+1,rate):bins+=np.abs(np.fft.rfft(a[i:i+rate]*np.hanning(rate)))**2
  total=float(np.sum(bins));low=float(np.sum(bins[:201]))/total if total else 0
  # Report repeated adjacent 1 s sample blocks; natural silence is a separate category.
  repeated=0;active=0
  for i in range(rate,len(a)-rate+1,rate):
   x=a[i-rate:i];y=a[i:i+rate]
   if np.mean(x*x)>1e-10 and np.mean(y*y)>1e-10:
    active+=1;repeated+=int(abs(float(np.dot(x,y)/(np.linalg.norm(x)*np.linalg.norm(y))))>.98)
  rows.append(dict(file=str(path.relative_to(D)),seconds=len(a)/rate,peak=peak,rms=math.sqrt(power),rmsDbFS=10*math.log10(power) if power else None,lowFrequencyFractionBelow200Hz=low,clipped=int(np.sum(np.abs(a)>=.999)),adjacentSampleDelta=float(np.max(np.abs(np.diff(a)))),quietSecondsBelowMinus70Db=sum(v<10**(-70/20) for v in seconds),repeatedAdjacentActiveOneSecondBlocks=repeated,activeBlockComparisons=active,rmsBySecond=seconds))
(D/'acoustic-analysis.json').write_text(json.dumps({'method':'FLAC decoded to mono 16 kHz for consistent spectra/RMS and adjacent-block correlation. Original PCM clipping/transition checks also retained in demonstrations.json. No perceptual or species-identification claim. Silence repetitions are not counted as loops.', 'results':rows},indent=2)+'\n')
print('Measured',len(rows),'real rendered recordings')
