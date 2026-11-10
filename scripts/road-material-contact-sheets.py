"""Mission 07.2 comparison and movement evidence; requires Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw
root=Path('docs/mission-07-2-captures')
for path in sorted(root.glob('before-*.png')):
    name=path.stem[7:]
    after=root/f'after-{name}.png'
    if not after.exists(): continue
    sheet=Image.new('RGB',(1200,480),'#f4f1e7');draw=ImageDraw.Draw(sheet)
    for col,phase in enumerate(['before','after']):
        with Image.open(root/f'{phase}-{name}.png') as src:
            src.thumbnail((600,450));sheet.paste(src,(col*600,30))
        draw.text((col*600+12,9),f'{name} / {phase} / same camera, time and quality',fill='#183c30')
    sheet.save(root/f'compare-{name}.jpg',quality=91)
for phase in ['before','after']:
    for mode in ['fixe','lent','rapide','rotation','aerienne','zoom','lod','paves']:
        paths=[root/f'motion-{phase}-{mode}-{i}.png' for i in range(6)]
        if not all(p.exists() for p in paths): continue
        frames=[Image.open(p).convert('RGB') for p in paths]
        sheet=Image.new('RGB',(1200,630),'#f4f1e7');draw=ImageDraw.Draw(sheet)
        for i,frame in enumerate(frames):
            reduced=frame.copy();reduced.thumbnail((400,300));x,y=i%3*400,i//3*315+15
            sheet.paste(reduced,(x,y));draw.text((x+8,y-13),f'{phase} / {mode} / {i}',fill='#183c30')
        sheet.save(root/f'sequence-{phase}-{mode}.jpg',quality=90)
        frames[0].save(root/f'motion-{phase}-{mode}.webp',save_all=True,append_images=frames[1:],duration=180,loop=0,quality=88)
        for frame in frames: frame.close()
