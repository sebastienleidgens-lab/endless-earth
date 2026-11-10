"""Reproduce only legally documented audio derivatives. ffmpeg required.
No network or synthesis runs in the game. --download fetches the four originals.
"""
import argparse,json,pathlib,subprocess,hashlib,math,random,wave,struct
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'public/audio/legacy'; WORK=ROOT/'work/mission-10'; OUT.mkdir(parents=True,exist_ok=True);WORK.mkdir(parents=True,exist_ok=True)
def ff(source,target,filters,seconds=None,offset=0,stereo=False):
 args=['ffmpeg','-y','-v','error','-ss',str(offset),'-i',str(source)]
 if seconds:args+=['-t',str(seconds)]
 subprocess.run(args+['-af',filters,'-ar','24000','-ac','2' if stereo else '1','-c:a','libvorbis','-q:a','4',str(OUT/target)],check=True)
def generate(name,duration,seed,kind):
 rng=random.Random(seed);rate=24000;data=bytearray();brown=0
 for i in range(int(rate*duration)):
  t=i/rate;white=rng.uniform(-1,1);brown=.97*brown+.03*white
  v=brown*(.45+.15*math.sin(t*.31)+.10*math.sin(t*.77))
  if kind=='rain':v+=white*.045
  if kind=='human':v+=.018*math.sin(2*math.pi*(160+20*math.sin(t*.2))*t)*(.5+.5*math.sin(t*.43))
  if kind=='traffic':v+=.025*math.sin(2*math.pi*75*t)*math.sin(t*.11)**4
  if kind=='step':v=(brown*.6+white*.08)*math.exp(-t*30)*(1-math.exp(-t*800))
  data+=struct.pack('<h',int(max(-.8,min(.8,v))*32767))
 p=WORK/(name+'.wav')
 with wave.open(str(p),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(data)
 return p
parser=argparse.ArgumentParser();parser.add_argument('--download',action='store_true');args=parser.parse_args()
sources=json.load(open(OUT/'sources.json'))
for s in sources:
 path=WORK/s['originalFile']
 if args.download:subprocess.run(['curl','-fLsS','--max-time','90',s['url'],'-o',str(path)],check=True)
 if hashlib.sha256(path.read_bytes()).hexdigest()!=s['originalSha256']:raise ValueError('Original checksum differs: '+s['id'])
ff(WORK/'woodland.mp3','woodland.ogg','highpass=f=85,lowpass=f=6500,loudnorm=I=-23:TP=-6:LRA=7,afade=t=in:d=2,afade=t=out:st=49:d=3',52,2,True)
ff(WORK/'water.wav','water.ogg','highpass=f=50,lowpass=f=6500,loudnorm=I=-23:TP=-6:LRA=7,afade=t=in:d=2,afade=t=out:st=55:d=3',58,3)
for i,rate in enumerate([.96,1,1.04]):
 ff(WORK/'bird.mp3',f'bird-{chr(97+i)}.ogg',f'asetrate={44100*rate},aresample=24000,highpass=f=600,lowpass=f=6200,loudnorm=I=-30:TP=-9:LRA=7,afade=t=in:d=0.02,afade=t=out:st=0.85:d=0.2')
 ff(WORK/'gravel.mp3',f'step-gravel-{chr(97+i)}.ogg',f'atempo={rate},highpass=f=100,lowpass=f=6500,alimiter=limit=0.7:level=false,afade=t=in:d=0.004,afade=t=out:st=0.3:d=0.2')
for name,duration,seed,kind in [('air',37,14,'air'),('rain',41,20,'rain'),('human-placeholder',39,31,'human'),('traffic-placeholder',43,33,'traffic'),('rustle-a',2.8,61,'rain'),('rustle-b',3.5,64,'rain'),('gust',9,72,'air'),('human-event-placeholder',4,91,'human')]+[(f'step-soft-{c}',.24,45+i,'step') for i,c in enumerate('abc')]:
 src=generate(name,duration,seed,kind);fade=min(2,duration*.25);ff(src,name+'.ogg',f'highpass=f=70,lowpass=f=4500,loudnorm=I=-23:TP=-6:LRA=7,afade=t=in:d={fade},afade=t=out:st={duration-fade}:d={fade}')
manifest={}
for p in sorted(OUT.glob('*.ogg')):
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=channels,sample_rate','-of','json',str(p)]));duration=float(info['format']['duration']);channels=info['streams'][0]['channels']
 source='woodland' if p.stem=='woodland' else 'water' if p.stem=='water' else 'bird' if p.stem.startswith('bird-') else 'gravel' if p.stem.startswith('step-gravel') else 'original-procedural'
 manifest[p.stem]=dict(file=p.name,bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),duration=duration,channels=channels,sampleRate=24000,source=source,provisional=source=='original-procedural',license=next((s['license'] for s in sources if s['id']==source),'CC0-1.0'))
(OUT/'manifest.json').write_text(json.dumps(dict(version=1,assets=manifest),indent=2)+'\n')
print('Prepared',len(manifest),'assets,',sum(a['bytes'] for a in manifest.values()),'bytes compressed')
