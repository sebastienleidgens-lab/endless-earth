from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
root=Path('docs/mission-08-5-captures');font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
names=['village','chateau','vallee','riviere','pont','boisement-reel','chemin-rural','aerienne','foret','eco','mobile']
thumbs=[]
for name in names:
 a=Image.open(root/f'before-{name}.png').convert('RGB');b=Image.open(root/f'after-{name}.png').convert('RGB');w,h=a.size
 canvas=Image.new('RGB',(w*2,h+36),'#f2efe4');canvas.paste(a,(0,36));canvas.paste(b,(w,36));d=ImageDraw.Draw(canvas);d.text((12,8),'Mission 08 — '+name,font=font,fill='#193b2f');d.text((w+12,8),'Mission 08.5 — '+name,font=font,fill='#193b2f');canvas.save(root/f'compare-{name}.jpg',quality=88)
 canvas.thumbnail((800,340));thumbs.append(canvas)
out=Image.new('RGB',(1600,sum(max(thumbs[i].height,thumbs[i+1].height if i+1<len(thumbs) else 0) for i in range(0,len(thumbs),2))),'#f2efe4');y=0
for i in range(0,len(thumbs),2):
 out.paste(thumbs[i],(0,y))
 if i+1<len(thumbs):out.paste(thumbs[i+1],(800,y))
 y+=max(thumbs[i].height,thumbs[i+1].height if i+1<len(thumbs) else 0)
out.save(root/'overview.jpg',quality=88)
html='<!doctype html><meta charset="utf-8"><title>ENDLESS EARTH — Mission 08.5</title><style>body{background:#f2efe4;color:#193b2f;font:18px system-ui;margin:2rem}img{width:100%;height:auto}figure{margin:2rem 0}</style><h1>Mission 08 → Mission 08.5</h1><p>Caméras géographiques identiques (position, altitude absolue IGN69, orientation), éclairage figé. Les arbres et matériaux restent procéduraux. La station « foret » historique est désormais identifiée comme terrain agricole ; « boisement-reel » montre un boisement OCS GE 2023.</p>'
for n in names:html+=f'<figure><figcaption>{n}</figcaption><img src="compare-{n}.jpg" loading="lazy"></figure>'
(root/'comparaisons.html').write_text(html)
