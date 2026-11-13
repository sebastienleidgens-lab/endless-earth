import json,subprocess,pathlib
root=pathlib.Path('docs/mission-16-evidence');rows=[]
for p in sorted(root.glob('*.webm')):
 x=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_entries','format=duration,size:stream=codec_type,codec_name,nb_read_frames,width,height','-of','json',str(p)]))
 subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],check=True,capture_output=True)
 rows.append({'file':p.name,'probe':x,'decoded':True})
(root/'media.json').write_text(json.dumps({'method':'Full ffmpeg decode, ffprobe counted frames and streams; original live canvas/WebAudio WebM files, no retiming, replacement audio or generated frames.', 'rows':rows},indent=2)+'\n');print('Decoded',len(rows),'native engine films')
