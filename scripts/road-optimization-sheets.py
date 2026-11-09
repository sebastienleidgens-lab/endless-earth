"""Fresh 07.1 / 07.2 / 07.3 visual and temporal evidence."""
from pathlib import Path
from PIL import Image, ImageDraw
root=Path('docs/mission-07-3-captures')
for path in sorted(root.glob('071-*.png')):
 name=path.stem[4:]
 if not all((root/f'{phase}-{name}.png').exists() for phase in ['071','072','073']): continue
 sheet=Image.new('RGB',(1800,480),'#f4f1e7');draw=ImageDraw.Draw(sheet)
 for col,phase in enumerate(['071','072','073']):
  with Image.open(root/f'{phase}-{name}.png') as im:
   im.thumbnail((600,450));sheet.paste(im,(col*600,30))
  draw.text((col*600+12,10),f'Mission {phase[:2]}.{phase[2:]} / {name}',fill='#183c30')
 sheet.save(root/f'compare-{name}.jpg',quality=91)
for phase in ['071','072','073']:
 for mode in ['fixe','lent','rapide','rotation','aerienne','zoom','lod','paves']:
  paths=[root/f'motion-{phase}-{mode}-{i}.png' for i in range(6)]
  if not all(p.exists() for p in paths): continue
  frames=[Image.open(p).convert('RGB') for p in paths]
  sheet=Image.new('RGB',(1200,630),'#f4f1e7');draw=ImageDraw.Draw(sheet)
  for i,frame in enumerate(frames):
   small=frame.copy();small.thumbnail((400,300));x,y=i%3*400,i//3*315+15
   sheet.paste(small,(x,y));draw.text((x+8,y-13),f'{phase} / {mode} / {i}',fill='#183c30')
  sheet.save(root/f'sequence-{phase}-{mode}.jpg',quality=90)
  frames[0].save(root/f'motion-{phase}-{mode}.webp',save_all=True,append_images=frames[1:],duration=180,loop=0,quality=88)
  for frame in frames: frame.close()
