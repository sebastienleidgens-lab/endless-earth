from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json
p=Path('docs/mission-08-captures')
a=json.loads((p/'before.json').read_text());b=json.loads((p/'after.json').read_text())
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
for name in a['results']:
 assert a['results'][name]['station']==b['results'][name]['station']
 images=[Image.open(p/f'{phase}-{name}.png').convert('RGB') for phase in ['before','after']]
 w=800 if name!='mobile' else 390;h=600 if name!='mobile' else 844
 out=Image.new('RGB',(w*2,h+42),'#142c27');d=ImageDraw.Draw(out)
 d.text((12,10),f'07.3 · {name} · avant',font=font,fill='white');d.text((w+12,10),f'08 · {name} · après',font=font,fill='white')
 for i,im in enumerate(images):out.paste(im,(i*w,42))
 out.save(p/f'compare-{name}.jpg',quality=90)
# A compact linked index makes fifteen pairs easy to inspect without downloading.
rows='\n'.join(f'<section id="{n}"><h2>{n}</h2><a href="compare-{n}.jpg"><img src="compare-{n}.jpg" loading="lazy" alt="Comparaison {n}, avant à gauche et après à droite"></a></section>' for n in a['results'])
(p/'comparaisons.html').write_text('''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ENDLESS EARTH — Mission 08</title><style>body{background:#142c27;color:#e6e4d2;font:16px/1.5 system-ui;max-width:1640px;margin:24px auto;padding:0 16px}img{max-width:100%;height:auto}a{color:#c9deaa}section{margin:40px 0}nav{display:flex;gap:16px;flex-wrap:wrap}h2{font-size:20px}</style><h1>Le paysage authentique</h1><p>Avant : main après PR #13. Après : Mission 08. Même caméra, même éclairage du 21 juin 2026 à midi UTC, même profil et même viewport. Eau drapée sur le DEM : niveau non mesuré. Couronnes, litière et teintes procédurales. Captures diagnostiques, parfois hors des zones navigables ; elles ne représentent pas une promenade autorisée dans l’eau. SwiftShader logiciel.</p><nav>'''+''.join(f'<a href="#{n}">{n}</a>' for n in a['results'])+'</nav>'+rows+'</html>')
