"""13D: context packs from pinned CC0 sources, two useful Lambert channels.
Run from repository root with Pillow. The 13B library stays immutable.
"""
import argparse, hashlib, json, math, urllib.request
from pathlib import Path
from PIL import Image, ImageFilter

parser=argparse.ArgumentParser()
parser.add_argument('--output', default='public/materials/france')
args=parser.parse_args()
out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
base=Path('public/materials/authentic')
catalog=json.loads((base/'catalog.json').read_text())
source=json.loads(Path('public/materials/france/granite-source.json').read_text())
image=Image.open(base/'hybrid.png')
tile,gutter,columns=128,8,3
stride=tile+gutter*2

def periodic(im):
    n=im.width;v=[list(x) for x in im.get_flattened_data()]
    for horizontal in [True,False]:
        for line in range(n):
            for i in range(4):
                a=line*n+i if horizontal else i*n+line
                b=line*n+n-1-i if horizontal else (n-1-i)*n+line
                w=(1-i/4)**2
                for c in range(3):
                    x,y=v[a][c],v[b][c];m=(x+y)/2
                    v[a][c]=round(x*(1-w)+m*w);v[b][c]=round(y*(1-w)+m*w)
    im=Image.new('RGB',(n,n));im.putdata([tuple(x) for x in v]);return im

def wrapped(im):
    result=Image.new('RGB',(stride,stride))
    for y in [-tile,0,tile]:
        for x in [-tile,0,tile]:result.paste(im,(gutter+x,gutter+y))
    return result

def mipbytes(w,h):
    total=0
    while True:
        total+=w*h*2
        if w==1 and h==1:return total
        w,h=max(1,w//2),max(1,h//2)

def original(entry):
    i=entry['slot'];x,y=(i%4)*288+16,(i//4)*288+16
    im=image.crop((x,y,x+256,y+256)).resize((tile,tile),Image.Resampling.LANCZOS)
    data=Image.new('RGB',im.size);data.putdata([(r,g,0) for r,g,b,a in im.get_flattened_data()])
    return periodic(data)

cache=Path('work/mission-13D');cache.mkdir(parents=True,exist_ok=True)
maps={}
for m in source['maps']:
    path=cache/('granite-'+m['role']+'.jpg')
    if not path.exists():
        req=urllib.request.Request(m['url'],headers={'User-Agent':'EndlessEarth-Mission13/1.0'})
        path.write_bytes(urllib.request.urlopen(req,timeout=60).read())
    assert sha(path.read_bytes())==m['sha256']
    maps[m['role']]=Image.open(path).convert('L').resize((256,256),Image.Resampling.LANCZOS)
gray=maps['Diffuse'];low=gray.filter(ImageFilter.GaussianBlur(24));tones=list(gray.get_flattened_data());mean=sum(tones)/len(tones)
granite=Image.new('RGB',(256,256));granite.putdata([(round(max(0,min(255,128+((t-mean)-.45*(l-mean))*1.2))),h,0) for t,l,h in zip(tones,low.get_flattened_data(),maps['Displacement'].get_flattened_data())]);granite=periodic(granite.resize((tile,tile),Image.Resampling.LANCZOS))
granite_entry={'id':'granite-regional','sourceId':source['id'],'source':source['source'],'author':source['author'],'license':'CC0-1.0','metres':source['metres'],'reliefM':.009,'scaleStatus':'provider; regional demonstration, not local geology'}
byid={e['id']:e for e in catalog['entries']}
packs=[]
for region,ids in [
    ('poitou',['stone-rubble','plaster-worn','roof-flat','earth-dry','bank-soil','rock-existing']),
    ('atlantic',['stone-rubble','plaster-fine','roof-flat','earth-dry','bank-soil','rock-existing','granite-regional']),
    ('mediterranean',['stone-rubble','plaster-fine','roof-flat','earth-dry','bank-soil','rock-layered']),
]:
    rows=math.ceil(len(ids)/columns);width,height=columns*stride,rows*stride
    atlas=Image.new('RGB',(width,height),(128,128,0));entries=[]
    for slot,identifier in enumerate(ids):
        e=granite_entry if identifier=='granite-regional' else byid[identifier]
        atlas.paste(wrapped(granite if identifier=='granite-regional' else original(e)),((slot%columns)*stride,(slot//columns)*stride))
        entries.append({k:e[k] for k in ['id','sourceId','source','author','license','metres','reliefM','scaleStatus']}|{'slot':slot})
    file=region+'.png';atlas.save(out/file,optimize=True);data=(out/file).read_bytes()
    packs.append({'id':region,'file':file,'sha256':sha(data),'bytes':len(data),'dimensions':[width,height],'gpuBytesWithMipmapsEstimate':mipbytes(width,height),'entries':entries})
manifest={'schema':'endless-earth-france-materials-v1','checked':'2026-11-11','budgetEUR':0,'tilePixels':tile,'gutterPixels':gutter,'columns':columns,'gpuChannels':2,'encoding':'R mean-centered hybrid tone, G normalized provider height. PNG RGB B=0, decoded to GPU RG8. Neutral warmth; Lambert does not need the old roughness channel.','baseCatalogueSha256':sha((base/'catalog.json').read_bytes()),'graniteSourceSha256':sha(Path('public/materials/france/granite-source.json').read_bytes()),'pipelineSha256':sha(Path(__file__).read_bytes()),'packs':packs,'policy':'Only the selected context PNG is downloaded. At most two packs cached; no per-house textures. Main pilot uses Poitou. Other contexts are synthetic demonstrations only.','transformations':['13B periodic 256px tiles reduced to 128px with Lanczos','4px symmetric periodic seam belt, 8px wrapped gutters','Warmth and roughness omitted from retained Lambert pack; height is artistic shading, never geometry','Granite: pinned source diffuse and normalized displacement, restrained residual tone, no geological claim']}
(out/'catalog.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print([(p['id'],p['bytes'],p['gpuBytesWithMipmapsEstimate']) for p in packs])
