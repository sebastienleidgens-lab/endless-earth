"""Assemble captured evidence; requires Pillow. Run after both capture phases."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path('docs/mission-07-1-captures')
for name in ['village', 'carrefour', 'trois-voies', 'pente', 'rural', 'rasante', 'aerienne', 'raccord']:
    sheet = Image.new('RGB', (1000, 400), '#f4f1e7')
    draw = ImageDraw.Draw(sheet)
    for column, phase in enumerate(['before', 'after']):
        with Image.open(root / f'{phase}-{name}.png') as source:
            source.thumbnail((500, 375))
            sheet.paste(source, (column * 500, 25))
        draw.text((column * 500 + 12, 7), f'{name} / {phase}', fill='#183c30')
    sheet.save(root / f'compare-{name}.jpg', quality=88)

for phase in ['before', 'after']:
    for mode in ['fixe', 'lent', 'rapide', 'rotation', 'aerienne']:
        frames = [Image.open(root / f'motion-{phase}-{mode}-{i}.png').convert('RGB') for i in range(6)]
        sheet = Image.new('RGB', (1200, 625), '#f4f1e7')
        draw = ImageDraw.Draw(sheet)
        for i, frame in enumerate(frames):
            reduced = frame.copy()
            reduced.thumbnail((400, 300))
            x, y = i % 3 * 400, i // 3 * 312 + 13
            sheet.paste(reduced, (x, y))
            draw.text((x + 8, y - 12), f'{phase} / {mode} / {i}', fill='#183c30')
        sheet.save(root / f'sequence-{phase}-{mode}.jpg', quality=90)
        frames[0].save(root / f'motion-{phase}-{mode}.webp', save_all=True, append_images=frames[1:], duration=180, loop=0, quality=85)
        for frame in frames:
            frame.close()
