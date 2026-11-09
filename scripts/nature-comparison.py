"""Evidence sheets only. Requires Pillow; no game assets are modified."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
root=Path('docs/mission-06-1');root.mkdir(exist_ok=True)
old=Path('docs/mission-06-captures')
ref=json.loads((old/'final.json').read_text())['results'];opt=json.loads((root/'optimized.json').read_text())['results']
for name,r in opt.items():
 a=ref[name]['state'];b=r['state'];assert a['position']==b['position'] and a['mode']==b['mode']
 assert sum((x-y)**2 for x,y in zip(a['camera'],b['camera']))**.5<.025
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
names=['rue','riviere','bois','prairie','aerienne','sol','aurore','nuit','eco','mobile']
labels=['Rue du village','Anglin et berges','Forêt cartographiée','Espace ouvert non caractérisé','Vue aérienne','Sol forestier','Aurore','Nuit','Profil Éco','Mobile 390 × 844']
for page in range(2):
 sheet=Image.new('RGB',(1440,1840),'#eef0e9');d=ImageDraw.Draw(sheet)
 for col,title in enumerate(['Mission 05 · 60a8f10','Mission 06 initiale · cf85270','Mission 06 optimisée']):d.text((col*480+15,15),title,font=font,fill='#243b30')
 for row in range(5):
  i=page*5+row;n=names[i];y=55+row*345;d.text((15,y),labels[i],font=font,fill='#243b30')
  for col,path in enumerate([old/f'before-{n}.png',old/f'final-{n}.png',root/f'optimized-{n}.png']):
   im=Image.open(path).convert('RGB');im.thumbnail((470,310));x=col*480+(480-im.width)//2;sheet.paste(im,(x,y+30));
 d.text((15,1790),'Caméras identiques. Mission 05 : cycle historique, sans véritable nuit. Ouvrir les PNG pour le détail.',font=small,fill='#243b30')
 sheet.save(root/f'planche-{page+1}.jpg',quality=90,subsampling=0,optimize=True)
parts=['<!doctype html><html lang="fr"><meta charset="utf-8"><title>ENDLESS EARTH — comparaison Mission 06.1</title><style>body{font:16px system-ui;background:#eef0e9;color:#243b30;margin:20px}section{overflow:auto;margin-bottom:30px}table{table-layout:fixed;width:1440px}td,th{width:480px}img{width:470px;height:350px;object-fit:contain;background:#d5dbd0}a{color:inherit}</style><h1>Dernière optimisation avant fusion</h1><p>Caméras identiques. La Mission 05 conserve son cycle historique ; elle ne possède pas de vraie nuit. Cliquer une image ouvre le PNG original.</p>']
for n,label in zip(names,labels):
 parts.append(f'<section><h2>{label}</h2><table><tr><th>Mission 05</th><th>Mission 06 initiale</th><th>Mission 06 optimisée</th></tr><tr>')
 for path in [f'../mission-06-captures/before-{n}.png',f'../mission-06-captures/final-{n}.png',f'optimized-{n}.png']:parts.append(f'<td><a href="{path}"><img src="{path}" alt="{label}"></a></td>')
 parts.append('</tr></table></section>')
parts.append('</html>');(root/'comparaison.html').write_text(''.join(parts))
print('PASS 10 matching camera stations; two comparison sheets and original-image gallery')
