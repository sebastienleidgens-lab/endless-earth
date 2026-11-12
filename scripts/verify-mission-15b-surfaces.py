import json, pathlib
from PIL import Image,ImageStat
p=pathlib.Path('docs/mission-15-evidence/snow-sky')
rows=[]
for scene,name,box,lo,hi in [('toitures','water',(120,470,240,590),0,1),('rue','vertical facade',(500,310,525,335),0,18),('toitures','roof',(760,270,830,290),35,100),('rue','exposed ground',(600,400,625,425),45,100)]:
 a=Image.open(p/f'{scene}-bare-balanced.jpg');b=Image.open(p/f'{scene}-covered-balanced.jpg')
 before=ImageStat.Stat(a.crop(box)).mean;after=ImageStat.Stat(b.crop(box)).mean;change=sum(after)/3-sum(before)/3
 assert lo<=change<=hi,(scene,name,change)
 rows.append(dict(scene=scene,surface=name,box=list(box),beforeRGB=before,afterRGB=after,meanChannelIncrease=change))
(p/'surface-samples.json').write_text(json.dumps(dict(method='Representative pixel regions in actual paired January captures, identical pose/time/weather and .0/.85 diagnostic cover. Water region unchanged; facade can brighten gently from the snow ground-bounce light. Roof and exposed ground must brighten substantially. These four regions complement shader/collision tests and manual images; they are not a whole-scene semantic segmentation.',rows=rows),indent=2)+'\n')
print('PASS representative real surface samples')
