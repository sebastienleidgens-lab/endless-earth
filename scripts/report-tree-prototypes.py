"""Assemble labelled engine screenshots and compact measured evidence only."""
from pathlib import Path
import json,gzip,hashlib,re
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[1];out=root/'docs/mission-17-evidence'
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
def sheet(rows,path,width=600):
 cells=[]
 for row in rows:
  line=[]
  for file,label in row:
   im=Image.open(out/file).convert('RGB');h=round(im.height*width/im.width);im=im.resize((width,h))
   cell=Image.new('RGB',(width,h+38),'#18382c');cell.paste(im,(0,38));ImageDraw.Draw(cell).text((12,9),label,font=font,fill='#eeeeda');line.append(cell)
  cells.append(line)
 canvas=Image.new('RGB',(max(sum(i.width for i in row)for row in cells),sum(max(i.height for i in row)for row in cells)),'#18382c');y=0
 for row in cells:
  x=0
  for im in row:canvas.paste(im,(x,y));x+=im.width
  y+=max(i.height for i in row)
 canvas.save(out/path,quality=85,optimize=True)
sheet([[('game/spreading-'+s+'-40m-before.jpg','Mission 16 / '+label),('game/spreading-'+s+'-40m-after.jpg','Prototype 17A / '+label)]for s,label in [('summer','ete'),('autumn','automne'),('winter','hiver')]],'comparison.jpg')
sheet([[('prototypes/'+id+'-summer-three-quarter.jpg',label),('prototypes/'+id+'-winter-three-quarter.jpg','Ramure hivernale')]for id,label in [('spreading','Feuillu etale'),('slender','Feuillu elance'),('riverside','Arbre de berge'),('young','Jeune sujet')]],'references.jpg',500)
sheet([[('methods/original-slender.jpg','Generateur original'),('methods/sapling.jpg','Sapling / meme moteur')]],'methods-comparison.jpg')
perf=out/'performance.json'
if perf.exists():
 p=json.loads(perf.read_text());(out/'performance.json.gz').write_bytes(gzip.compress(perf.read_bytes(),mtime=0));
 summary={k:v for k,v in p.items()if k!='rows'};summary['sampleCount']=len(p['rows']);(out/'performance-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
 table='| Profil | Reference | Mission 16 (ms) | Prototype (ms) | Ecart | P95 prototype (ms) |\n| --- | --- | ---: | ---: | ---: | ---: |\n'
 labels={'spreading':'Etale','slender':'Elance','riverside':'Berge','young':'Jeune'}
 for r in p['summary']:table+=f"| {r['profile']} | {labels[r['id']]} | {r['before']['median']:.1f} | {r['after']['median']:.1f} | +{r['deltaPercent']:.1f} % | {r['after']['p95']:.1f} |\n"
 report=root/'docs/mission-17.md';text=report.read_text();text=text.replace('@PERFORMANCE_TABLE@',table.strip());text=re.sub(r'<!-- PERFORMANCE_TABLE_START -->[\s\S]*?<!-- PERFORMANCE_TABLE_END -->','<!-- PERFORMANCE_TABLE_START -->\n'+table.strip()+'\n<!-- PERFORMANCE_TABLE_END -->',text);report.write_text(text)
 # Raw redundant rows have a compact lossless archive; retain no second dump.
 perf.unlink()
preservation=out/'preservation.json';s=json.loads(preservation.read_text());s['sourceFiles']={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest()for p in [root/'src/nature/tree-prototype.mjs',root/'src/nature/tree-prototype-material.ts',root/'src/fixtures/trees.ts']};frozen=root/'work/mission-17/frozen/src';s['individualCaptureSourceFiles']={str(p.relative_to(frozen)):hashlib.sha256(p.read_bytes()).hexdigest()for p in [frozen/'nature/tree-prototype.mjs',frozen/'nature/tree-prototype-material.ts',frozen/'fixtures/trees.ts']};s['reviewSourceNote']='Final workshop changes improve the all-tree frontal camera and expose diagnostic advance/profile; reference mesh arrays and individual camera logic are unchanged. Generator difference after frozen copy is a comment only.';preservation.write_text(json.dumps(s,indent=2)+'\n')
print('Report images and compact measurements written.')
