"""Audit the encoded audio streams without rewriting the native recordings."""
import hashlib, json, pathlib, subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/mission-26-1-evidence'
def probe(path):
    return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))
def packets(path):
    return json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','a:0','-show_packets','-show_entries','packet=pts_time,dts_time,size,data_hash','-show_data_hash','sha256','-of','json',str(path)]))['packets']
rows=[]
for meta in sorted(OUT.glob('*.json')):
    d=json.loads(meta.read_text())
    if not isinstance(d,dict) or d.get('type') not in ['native-video','native-journey']:continue
    video=OUT/d.get('file','-');raw=OUT/d.get('original','-')
    if not video.is_file() or not raw.is_file():continue
    info=probe(video);streams=[s for s in info['streams'] if s['codec_type']=='audio']
    a,b=packets(raw),packets(video)
    rows.append({'metadata':meta.name,'video':video.name,'raw':raw.relative_to(OUT).as_posix(),'sourceSHA':d['before']['source'],'streams':[{'codec':s['codec_name'],'sampleRate':s.get('sample_rate'),'channels':s.get('channels'),'layout':s.get('channel_layout')} for s in streams],'audioPackets':len(b),'audioPacketPTSAndPayloadsIdentical':a==b,'rawSha256':hashlib.sha256(raw.read_bytes()).hexdigest(),'indexedSha256':hashlib.sha256(video.read_bytes()).hexdigest(),'containerDurationSeconds':float(info['format'].get('duration',0))})
report={'method':'ffprobe checks the actual encoded audio packets, payload SHA and PTS/DTS of native raw versus codec-copy indexed WebM. No audio normalized, stretched, interpolated or replaced. Stereo/channel presence is a transport check, not perceptual validation.', 'cases':rows,'allAudioPacketCopiesIdentical':all(r['audioPacketPTSAndPayloadsIdentical'] for r in rows),'allStereo':all(r['streams'] and all(s['channels']==2 for s in r['streams']) for r in rows)}
(OUT/'audio-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(len(rows),'native audio streams; exact copies:',report['allAudioPacketCopiesIdentical'],'stereo:',report['allStereo'])
