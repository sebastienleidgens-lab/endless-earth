"""Offline CC0 tone/relief preparation. No download during a game session."""
import argparse, hashlib, json, pathlib, urllib.request
from PIL import Image, ImageEnhance

p=argparse.ArgumentParser()
p.add_argument('--cache',default='work/mission-12/assets')
a=p.parse_args()
root=pathlib.Path(a.cache);root.mkdir(parents=True,exist_ok=True)
base='https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_face_03/'
expected={'diff':'ea48e0e47ad42c8bd312476178b1248ec66f0eb19156a26a1c222f2a40caaf2d','disp':'fb053bfd46cef976da9cfee67f045367469cddd69469dcacd67d3fca4bd41545'}
records=[];images=[]
for kind in ['diff','disp']:
    name=f'rock_face_03_{kind}_1k.jpg';path=root/name
    if not path.exists():
        with urllib.request.urlopen(base+name,timeout=30) as response:path.write_bytes(response.read())
    content=path.read_bytes()
    if hashlib.sha256(content).hexdigest()!=expected[kind]:raise ValueError(f"Pinned CC0 source changed: {name}")
    records.append({'source':base+name,'sha256':hashlib.sha256(content).hexdigest(),'bytes':len(content),'dimensions':[1024,1024]})
    im=Image.open(path).convert('L').resize((256,256),Image.Resampling.LANCZOS)
    # Tone is deliberately restrained and recoloured by the regional palette.
    # Relief comes from the scanned displacement, never the photographed shadows.
    if kind=='diff':im=ImageEnhance.Contrast(im).enhance(.75)
    images.append(im)
packed=bytearray()
for tone,height in zip(images[0].get_flattened_data(),images[1].get_flattened_data()):packed.extend((tone,height))
(root/'rock-rg.bin').write_bytes(packed)
(root/'source.json').write_text(json.dumps({'name':'Rock Face 03','authors':['Dario Barresi — photography','Rico Cilliers — processing'],'source':'https://polyhaven.com/a/rock_face_03','license':'CC0-1.0','licenseURL':'https://polyhaven.com/license','checked':'2026-11-11','sourceTileMetres':[27,27],'files':records,'transformations':['1024² JPEG to 256² tone/displacement','diffuse greyscale, contrast ×0.75; regional tint in shader','packed RG; wrapped gutters added by prepare-surface-art.mjs','no vertex displacement; small shading relief only']},ensure_ascii=False,indent=2)+'\n')
print('Prepared CC0 rock:',len(packed),'bytes')
