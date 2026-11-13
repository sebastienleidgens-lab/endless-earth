import json,math
from PIL import Image,ImageDraw,ImageFont
root='docs/mission-17-evidence/forest';cells=json.load(open('work/mission-17b/density-cells.json'));density=json.load(open(root+'/density.json'));mnh=json.load(open(root+'/mnh-study.json'));features=json.load(open('work/mission-17b/local-features.json'))
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';f=lambda s:ImageFont.truetype(font,s)
im=Image.new('RGB',(1440,1620),'#f4f1e6');d=ImageDraw.Draw(im);d.text((40,22),'ENDLESS EARTH · 17B · Couverture et structure des bois',font=f(27),fill='#203e30')
titles=['Mission 16 · 2 500 sujets','17B · couronnes seules · 2 500 sujets',f'17B · couronnes + regarnissage · {density["counts"][2]} sujets','Observation IGN · MNH acquis au printemps 2023']
for panel in range(4):
 ox=40+(panel%2)*710;oy=100+(panel//2)*730;scale=640/2000;xy=lambda x,z:((x+1000)*scale,(z+1000)*scale)
 layer=Image.new('RGB',(640,640),'#e7e2d3');pd=ImageDraw.Draw(layer);
 for p in cells:
  x,y=xy(p['x'],p['z']);v=p['cover'][panel] if panel<3 else p['mnh'];col=('#477756' if v else '#bdcaa7') if panel<3 else '#bdcaa7' if v is None else (int(185-min(1,v/24)*145),int(199-min(1,v/24)*90),int(155-min(1,v/24)*105));pd.rectangle((x,y,x+8*scale+1,y+8*scale+1),fill=col)
 for feat in features:
  tags=feat.get('tags',{});rings=feat.get('rings');line=feat.get('line')
  if rings and (tags.get('natural')=='water' or tags.get('water')):pd.polygon([xy(p['x'],p['z']) for p in rings[0]],fill='#8bb7c1')
  if line and tags.get('highway'):pd.line([xy(p['x'],p['z']) for p in line],fill='#eee8d2',width=2)
 im.paste(layer,(ox,oy))
 # Source geometry is clipped to each panel.
 d.rectangle((ox-1,oy-1,ox+641,oy+641),outline='#63725b',width=2);d.text((ox,oy-36),titles[panel],font=f(20),fill='#203e30');d.text((ox,oy+650),(f'Projection potentielle : {100*density["coverFraction"][panel]:.1f} % des échantillons de bois' if panel<3 else f'MNH > 2 m : {100*mnh["woodAbove2mFraction"]:.1f} % · tons foncés = plus haut'),font=f(16),fill='#203e30')
 d.line((ox+16,oy+610,ox+16+500*scale,oy+610),fill='#203e30',width=4);d.text((ox+16,oy+582),'500 m · nord en haut',font=f(14),fill='#203e30')
d.rectangle((0,1530,1440,1620),fill='#f4f1e6');d.text((40,1545),'Bois cartographiés seulement · grille 8 m · vert foncé : projection de couronne / hauteur MNH',font=f(18),fill='#203e30');d.text((40,1575),'Les ellipses de couronne ignorent les trouées du feuillage. Le MNH ne désigne ni une espèce ni chaque arbre.',font=f(17),fill='#203e30');im.save(root+'/density-maps.jpg',quality=89)
