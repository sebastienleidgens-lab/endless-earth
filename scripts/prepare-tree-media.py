"""Index native workshop films without changing packets or their timestamps."""
from pathlib import Path
import subprocess,json,hashlib,shutil
root=Path(__file__).resolve().parents[1];out=root/'docs/mission-17-evidence';work=root/'work/mission-17';work.mkdir(parents=True,exist_ok=True)
def packets(path):
 data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_packets','-show_data_hash','sha256','-show_entries','packet=pts_time,dts_time,data_hash','-of','json',str(path)]))['packets']
 return [{k:p.get(k)for k in ['pts_time','dts_time','data_hash']}for p in data]
rows=[]
for name in ['light-wind','moderate-wind']:
 file=out/(name+'.webm');raw=work/(name+'-native.webm');indexed=work/(name+'-indexed.webm');shutil.copyfile(file,raw)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(raw),'-map','0','-c','copy',str(indexed)],check=True)
 before,after=packets(raw),packets(indexed);assert before==after
 meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_name,width,height','-of','json',str(indexed)]));assert float(meta['format']['duration'])>0
 subprocess.run(['ffmpeg','-v','error','-i',str(indexed),'-f','null','-'],check=True);shutil.copyfile(indexed,file)
 rows.append({'file':file.name,'duration':float(meta['format']['duration']),'packets':len(after),'firstPTS':after[0]['pts_time'],'lastPTS':after[-1]['pts_time'],'samePacketDataAndPTS':True,'codec':meta['streams'][0],'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'method':'Native MediaRecorder; lossless remux with identical packet hashes and PTS/DTS; fully decoded. Silent workshop, software cadence, no natural-motion certification.'})
subprocess.run(['ffmpeg','-v','error','-y','-ss','3','-i',str(out/'moderate-wind.webm'),'-frames:v','1',str(out/'wind-poster.jpg')],check=True)
(out/'media.json').write_text(json.dumps({'rows':rows},indent=2)+'\n');print(json.dumps(rows,indent=2))
