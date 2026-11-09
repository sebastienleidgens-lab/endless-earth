"""Unretouched screenshot contact sheets; requires Pillow, no generated art."""
import json
import pathlib
from PIL import Image, ImageDraw, ImageFont

root = pathlib.Path('docs/mission-07-captures')
data = json.loads((root / 'after.json').read_text())
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 22)
small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
names = list(data['results'])
labels = {'village': 'Village', 'vallee': 'Vallée', 'riviere': 'Rivière', 'foret': 'Forêt cartographiée',
          'ouvert': 'Espace ouvert non classé', 'chemin-rural': 'Chemin rural OSM', 'pente': 'Rue en pente OSM',
          'sol': 'Terrain proche / sous-bois', 'aerienne': 'Panorama aérien et ruines',
          'lointaine': 'Vue lointaine', 'eco': 'Profil Éco', 'mobile': 'Éco · 390 × 844',
          'repere-photo': 'Repère EXIF obstrué — diagnostic'}
for page in range((len(names)+3)//4):
    rows = names[page*4:page*4+4]
    board = Image.new('RGB', (1232, 96+len(rows)*500+38), '#edf0e8')
    draw = ImageDraw.Draw(board)
    draw.text((20, 12), 'ENDLESS EARTH — Mission 07 · mêmes caméras, profils et date', font=font, fill='#24372e')
    draw.text((20, 51), 'AVANT · cc7cf2c', font=font, fill='#24372e')
    draw.text((632, 51), 'APRÈS · terrain IGN conservé, restitution améliorée', font=font, fill='#24372e')
    for row, name in enumerate(rows):
        y = 96+row*500
        station = data['results'][name]['station']
        draw.text((20, y), labels[name], font=font, fill='#24372e')
        draw.text((632, y+5), f'X {station[1]:.2f} m · Z {station[2]:.2f} m · {station[-1]}', font=small, fill='#43594a')
        for col, phase in enumerate(['before', 'after']):
            source = Image.open(root / f'{phase}-{name}.png').convert('RGB')
            source.thumbnail((600, 450), Image.Resampling.LANCZOS)
            board.paste(source, (20+col*612+(600-source.width)//2, y+35+(450-source.height)//2))
    draw.text((20, board.height-26), 'Relief : IGN RGE ALTI · © OpenStreetMap contributors (ODbL) · Captures non retouchées, échelle d’affichage réduite.', font=small, fill='#43594a')
    board.save(root / f'planche-{page+1}.jpg', quality=90, optimize=True)
