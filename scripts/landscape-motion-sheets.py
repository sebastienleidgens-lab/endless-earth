from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json
p=Path('docs/mission-08-captures');font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
items=[]
for phase in ['before','after']:
 data=json.loads((p/f'motion-{phase}.json').read_text())
 for name,frames in data['results'].items():
  if not (p/f'motion-{phase}-{name}-0.png').exists():continue
  images=[Image.open(p/f'motion-{phase}-{name}-{i}.png').convert('RGB') for i in range(len(frames))]
  sheet=Image.new('RGB',(1200,940),'#142c27');d=ImageDraw.Draw(sheet)
  for i,im in enumerate(images):
   x=(i%3)*400;y=(i//3)*320;d.text((x+10,y+7),f'{phase} · {name} · {i+1}',font=font,fill='white');sheet.paste(im.resize((400,300)),(x,y+26))
  sheet=sheet.crop((0,0,1200,646));sheet.save(p/f'sequence-{phase}-{name}.jpg',quality=88)
  resized=[im.resize((640,480)) for im in images];resized[0].save(p/f'motion-{phase}-{name}.webp',save_all=True,append_images=resized[1:],duration=250,loop=0,quality=85)
  items.append((phase,name))
rows=''.join(f'<section><h2>{n}</h2><div>'+''.join(f'<a href="sequence-{ph}-{n}.jpg"><img src="motion-{ph}-{n}.webp" alt="{ph} {n}" loading="lazy"></a>' for ph in ['before','after'])+'</div></section>' for n in data['results'])
(p/'mouvement.html').write_text('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Mission 08 — Mouvement</title><style>body{background:#142c27;color:#e5eadb;font:16px system-ui;max-width:1320px;margin:24px auto;padding:0 12px}div{display:flex;flex-wrap:wrap}img{width:640px;max-width:100%;height:auto}a{max-width:100%}</style><h1>Neuf trajectoires · avant / après</h1><p>Avant à gauche, après à droite. Six poses successives à atmosphère figée ; cliquer pour la planche. Ces animations inspectent les transitions, sans constituer une mesure de FPS.</p>'+rows+'</html>')
for phase,name in items:
 for i in range(6):(p/f'motion-{phase}-{name}-{i}.png').unlink()
