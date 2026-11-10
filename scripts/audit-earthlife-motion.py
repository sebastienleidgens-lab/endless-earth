"""Review actual rendered motion; no image synthesis or frame interpolation."""
from PIL import Image,ImageChops,ImageStat,ImageDraw
from pathlib import Path
import json
root=Path('docs/mission-09-captures');result={}
names=['foret-calme','foret-rafale','arbres','herbes','oiseau-isole','oiseaux-groupe','riviere','berge','ciel','ombres','aerienne','mobile']
for phase in ['before','after']:
 result[phase]={}
 for name in names:
  im=Image.open(root/f'{phase}-{name}.webp');frames=[]
  for i in range(im.n_frames):
   im.seek(i);frames.append(im.convert('RGB').crop((0,105,im.width,im.height)))
  changes=[]
  for a,b in zip(frames,frames[1:]):
   diff=ImageChops.difference(a,b);st=ImageStat.Stat(diff);hist=diff.convert('L').histogram();changes.append({'meanAbsoluteRGB':sum(st.mean)/3,'fractionChanged':1-hist[0]/(a.width*a.height)})
  result[phase][name]={'decodedFrames':len(frames),'differences':changes}
review=['foret-rafale','herbes','oiseaux-groupe','riviere','ciel','ombres'];sheet=Image.new('RGB',(720,6*270),'#17271f');draw=ImageDraw.Draw(sheet)
for row,name in enumerate(review):
 draw.text((8,row*270+3),name,fill='white')
 for pi,phase in enumerate(['before','after']):
  im=Image.open(root/f'{phase}-{name}.webp')
  for ci,i in enumerate([0,3,7]):
   im.seek(min(i,im.n_frames-1));p=im.convert('RGB');p.thumbnail((240,120));sheet.paste(p,(ci*240,row*270+20+pi*125))
sheet.save(root/'revue-mouvements.jpg',quality=85)
(root/'motion-pixels.json').write_text(json.dumps({'method':'Decoded animated WebP, successive-frame RGB differences excluding top 105 px build badge. Encoders may coalesce identical frames. Counts motion only, not visual quality or realtime FPS.', 'results':result},indent=2))
print('PASS decoded rendered motion:',{p:len(d) for p,d in result.items()})
