"""Bounded offline 13B pipeline: pinned CC0 inputs -> 10 shared material slots.
Pillow only. No AI, vertex displacement or runtime third-party downloads.
"""
import argparse
import hashlib
import io
import json
import math
import pathlib
import urllib.request
import zipfile
from PIL import Image, ImageFilter

p = argparse.ArgumentParser()
p.add_argument('--cache', default='work/mission-13B/sources')
p.add_argument('--output', default='public/materials/authentic')
a = p.parse_args()
cache, out = pathlib.Path(a.cache), pathlib.Path(a.output)
cache.mkdir(parents=True, exist_ok=True)
out.mkdir(parents=True, exist_ok=True)
(out / 'previews').mkdir(exist_ok=True)
sources = json.loads(pathlib.Path('public/materials/authentic/sources.json').read_text())
config = json.loads(pathlib.Path('scripts/mission-13-materials.json').read_text())
by_id = {r['id']: r for r in sources['entries']}
size, gutter, cols = config['tilePixels'], config['gutterPixels'], config['columns']
rows = math.ceil(len(config['entries']) / cols)
stride = size + gutter * 2
width, height = cols * stride, rows * stride
atlases = [Image.new('RGB', (width, height)), Image.new('RGB', (width, height)), Image.new('RGBA', (width, height))]

def digest(b):
    return hashlib.sha256(b).hexdigest()

def source_image(m):
    file = cache / m['file']
    if not file.exists():
        req = urllib.request.Request(m['url'], headers={'User-Agent': 'EndlessEarth-Mission13/1.0'})
        with urllib.request.urlopen(req, timeout=90) as response:
            data = response.read()
        if m.get('archiveMember'):
            if digest(data) != m['archiveSha256']:
                raise ValueError('Source archive changed: ' + m['url'])
            data = zipfile.ZipFile(io.BytesIO(data)).read(m['archiveMember'])
        if digest(data) != m['sha256']:
            raise ValueError('Pinned source changed: ' + m['file'])
        file.write_bytes(data)
    data = file.read_bytes()
    if digest(data) != m['sha256']:
        raise ValueError('Cache checksum: ' + str(file))
    return Image.open(io.BytesIO(data))

def periodic(image):
    """Symmetric eight-pixel edge belt; first/last samples match exactly."""
    n = image.width
    pixels = [list(pixel) for pixel in image.get_flattened_data()]
    channels = len(pixels[0])
    for horizontal in (True, False):
        for line in range(n):
            for i in range(8):
                left = line * n + i if horizontal else i * n + line
                right = line * n + n - 1 - i if horizontal else (n - 1 - i) * n + line
                weight = (1 - i / 8) ** 2
                for c in range(channels):
                    x, y = pixels[left][c], pixels[right][c]
                    mean = (x + y) * .5
                    pixels[left][c] = round(x * (1 - weight) + mean * weight)
                    pixels[right][c] = round(y * (1 - weight) + mean * weight)
    result = Image.new(image.mode, image.size)
    result.putdata([tuple(v) for v in pixels])
    return result

def wrap(image):
    # All atlas cells have periodic gutters; no interpolation into adjacent slots.
    band = Image.new(image.mode, (stride, stride))
    for dy in (-size, 0, size):
        for dx in (-size, 0, size):
            band.paste(image, (gutter + dx, gutter + dy))
    return band

def seam(image):
    d = list(image.convert('RGB').get_flattened_data()); n = image.width
    values = [abs(d[y*n][c] - d[y*n+n-1][c]) for y in range(n) for c in range(3)]
    values += [abs(d[x][c] - d[(n-1)*n+x][c]) for x in range(n) for c in range(3)]
    return {'meanEdgeDifference255': round(sum(values)/len(values), 4), 'maxEdgeDifference255': max(values)}

def linear(c):
    c /= 255
    return c / 12.92 if c <= .04045 else ((c+.055)/1.055)**2.4

def srgb(c):
    c = max(0, min(1, c))
    return round(255 * (c*12.92 if c <= .0031308 else 1.055*c**(1/2.4)-.055))

def memory(w, h, channels):
    total = 0
    while True:
        total += w*h*channels
        if w == 1 and h == 1:
            return total
        w, h = max(1,w//2), max(1,h//2)

entries = []
for slot, definition in enumerate(config['entries']):
    source = by_id[definition['sourceId']]
    maps = {m['role']: m for m in source['maps']}
    # Normal map remains pinned and available in source provenance, not shipped:
    # one scanned-height channel is sufficient for the retained shading relief.
    images = {role: source_image(maps[role]).convert('RGB').resize((size,size),Image.Resampling.LANCZOS) for role in ['Diffuse','Displacement','Rough']}
    color = periodic(images['Diffuse'])
    displacement = periodic(images['Displacement']).convert('L')
    roughness = periodic(images['Rough']).convert('L')
    h, r = list(displacement.get_flattened_data()), list(roughness.get_flattened_data())
    data = Image.new('RGB', (size,size))
    data.putdata([(v,max(115,w),0) for v,w in zip(h,r)])
    gray = color.convert('L'); low = gray.filter(ImageFilter.GaussianBlur(24))
    colors = list(color.get_flattened_data()); tones = list(gray.get_flattened_data()); large = list(low.get_flattened_data())
    average = sum(tones)/len(tones)
    warmth_mean = sum(px[0]-px[2] for px in colors)/len(colors)
    packed = []
    for px, tone, broad, hh, rr in zip(colors, tones, large, h, r):
        # Remove part of photographed broad illumination; no exact de-lighting claim.
        value = 128 + ((tone-average)-.45*(broad-average))*definition['contrast']
        warmth = 128 + ((px[0]-px[2])-warmth_mean)*.65
        packed.append((round(max(0,min(255,value))),hh,round(max(0,min(255,warmth))),max(160,rr)))
    hybrid = Image.new('RGBA',(size,size))
    hybrid.putdata(packed); hybrid = periodic(hybrid)
    for atlas, tile in zip(atlases,[color,data,hybrid]):
        atlas.paste(wrap(tile),((slot%cols)*stride,(slot//cols)*stride))
    color.save(out/'previews'/(definition['id']+'-photo.jpg'),quality=86,optimize=True)
    palette = tuple(int(definition['palette'][i:i+2],16) for i in [1,3,5])
    rgb = []
    for t,hh,w,rr in hybrid.get_flattened_data():
        gain=.70+(t/255)*.36
        rgb.append(tuple(srgb(linear(c)*gain*(1+(w/255-.5)*factor)) for c,factor in zip(palette,[.06,0,-.045])))
    preview=Image.new('RGB',(size,size));preview.putdata(rgb)
    preview.save(out/'previews'/(definition['id']+'-hybrid.jpg'),quality=86,optimize=True)
    entry={**definition,'slot':slot,'license':'CC0-1.0','author':source['author'],'source':source['source'],'licenseURL':source['licenseURL'],'heightInterpretation':'Provider displacement normalized; reliefM is an artistic shading amplitude, not measured geometry','pixelDensityPerMetre':[size/m for m in definition['metres']],'seamBefore':seam(images['Diffuse']),'seamPrepared':seam(color),'previews':{'photographic':'previews/'+definition['id']+'-photo.jpg','hybrid':'previews/'+definition['id']+'-hybrid.jpg'}}
    entries.append(entry)

atlases[0].save(out/'photographic-color.jpg',quality=90,subsampling=0,optimize=True)
atlases[1].save(out/'photographic-data.png',optimize=True)
atlases[2].save(out/'hybrid.png',optimize=True)
files=[]
for name,channels,space in [('photographic-color.jpg',4,'sRGB'),('photographic-data.png',2,'linear data RG8'),('hybrid.png',4,'linear data RGBA8')]:
    data=(out/name).read_bytes()
    files.append({'file':name,'sha256':digest(data),'bytes':len(data),'dimensions':[width,height],'gpuChannels':channels,'colorSpace':space,'gpuBytesWithMipmapsEstimate':memory(width,height,channels)})
manifest={'schema':config['version'],'budgetEUR':0,'checked':'2026-11-11','tilePixels':size,'gutterPixels':gutter,'columns':cols,'rows':rows,'dimensions':[width,height],'entries':entries,'files':files,'sourceManifest':'sources.json','sourceManifestSha256':digest(pathlib.Path('public/materials/authentic/sources.json').read_bytes()),'pipelineSha256':digest(pathlib.Path(__file__).read_bytes()),'sourceMaps':'CC0 source diffuse, normalized displacement and roughness; source normals retained outside game assets','encoding':{'photographic-color.jpg':'RGB base color, sRGB; periodic gutters; JPEG may introduce tiny edge error','photographic-data.png':'R scanned normalized height, G roughness, B unused; decoded to GPU RG8','hybrid.png':'R restrained mean-centered tone, G scanned normalized height, B restrained relative warmth, A dry roughness'},'transformations':['Pinned 1K sources reduced to 256 pixels per material','8px symmetric periodic seam belt and 16px wrapped atlas gutters','Hybrid broad luminance reduced by Gaussian radius 24px ×0.45; residual photographic lighting possible','Deterministic world-scale macro tint and object offset in the retained shader; tile courses never randomized','No AI-derived physical height; no vertex displacement; no geometry or map class changes'],'formats':'Existing WebGL2: JPEG/PNG, mipmaps, derivative-aware sampling, anisotropy <=4. KTX2/Basis deferred until demonstrated runtime benefit; no conversion dependency added.','usage':'Development material library, not imported by the walking game before 13C approval','scaleCorrection':'Rock Face 03 provider scale is 2.7m (official page/API). Existing Mission 12 art/shader stays at 27m as the unchanged reference, not a provider measurement.'}
(out/'catalog.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Prepared',len(entries),'materials,',sum(f['bytes'] for f in files),'atlas bytes')
print('GPU estimates:',{f['file']:f['gpuBytesWithMipmapsEstimate'] for f in files})
