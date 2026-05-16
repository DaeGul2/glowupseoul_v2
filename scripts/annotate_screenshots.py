"""
Read docs/screenshots/positions.json + the raw page screenshots, then
produce annotated images (boxes + labels) for use in the PPT.

Output: docs/screenshots/annotated/*.png
"""
from PIL import Image, ImageDraw, ImageFont
import json
import os

OUT_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'docs', 'screenshots'))
ANN_DIR = os.path.join(OUT_DIR, 'annotated')
os.makedirs(ANN_DIR, exist_ok=True)

# Brand colors
GOLD       = (201, 160, 99, 255)
GOLD_FILL  = (201, 160, 99, 230)
GOLD_DARK  = (154, 119, 68, 255)
WHITE      = (255, 255, 255, 255)
SHADOW     = (0, 0, 0, 100)

# Fonts
F_BADGE = ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf', 48)
F_TITLE = ImageFont.truetype('C:/Windows/Fonts/georgiai.ttf', 28)
F_KO    = ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf', 18)

PAGE_TITLES = {
    '01_home':      ('Home', '/',                     '홈 — BentoCategories'),
    '02_category':  ('Category', '/category/face',    '카테고리 페이지 — 시술 그리드'),
    '03_treatment': ('Treatment', '/treatment/...',   '시술 상세 — Hero'),
    '04_hospital':  ('Clinic', '/clinic/...',         '병원 상세 — Hero'),
}

with open(os.path.join(OUT_DIR, 'positions.json'), encoding='utf8') as f:
    positions = json.load(f)

def annotate(name, info):
    src = os.path.join(OUT_DIR, info['file'])
    img = Image.open(src).convert('RGBA')

    slots = info.get('slots', [])
    if not slots:
        print(f'[skip] {name}: no slots')
        return None

    # Crop: cover all slots with comfortable padding.
    pad_top, pad_bot = 200, 220
    min_y = min(s['rect'][1] for s in slots)
    max_y = max(s['rect'][1] + s['rect'][3] for s in slots)
    crop_top = max(0, int(min_y) - pad_top)
    crop_bot = min(img.height, int(max_y) + pad_bot)

    # If page is short, just keep the whole thing
    if img.height <= 1700:
        crop_top, crop_bot = 0, img.height

    cropped = img.crop((0, crop_top, img.width, crop_bot)).convert('RGBA')
    overlay = Image.new('RGBA', cropped.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, 'RGBA')

    # Title strip at the top of the cropped image
    title_h = 64
    title_bg = Image.new('RGBA', (cropped.width, title_h), (250, 250, 247, 235))
    cropped.paste(title_bg, (0, 0), title_bg)
    page_en, page_route, page_ko = PAGE_TITLES.get(name, (name, '', name))
    draw.text((36, 8),  f'{page_en}', font=F_TITLE, fill=GOLD_DARK)
    draw.text((36, 38), page_route,   font=F_KO,    fill=GOLD_DARK)

    # Boxes + badges
    for s in slots:
        x, y, w, h = s['rect']
        y_adj = y - crop_top
        # Skip slots clipped out of view
        if y_adj + h < 0 or y_adj > cropped.height: continue

        # rect outline (double for visibility)
        rect_xy = [x, y_adj, x + w, y_adj + h]
        for inset, line_w, alpha in [(0, 6, 255), (2, 2, 130)]:
            draw.rectangle(
                [rect_xy[0] - inset, rect_xy[1] - inset,
                 rect_xy[2] + inset, rect_xy[3] + inset],
                outline=(GOLD[0], GOLD[1], GOLD[2], alpha), width=line_w
            )

        # badge — circle with letter
        badge_d = 64
        bx = max(0, int(x))
        by = max(0, int(y_adj) - badge_d - 8)
        draw.ellipse([bx, by, bx + badge_d, by + badge_d], fill=GOLD_FILL)
        # letter center
        letter = s['label']
        tw = draw.textlength(letter, font=F_BADGE)
        draw.text((bx + (badge_d - tw) / 2, by - 4), letter, font=F_BADGE, fill=WHITE)

    out_img = Image.alpha_composite(cropped, overlay).convert('RGB')
    out_path = os.path.join(ANN_DIR, f'{name}.png')
    out_img.save(out_path, optimize=True)
    print(f'[OK] {name} -> {out_path}  ({out_img.width}x{out_img.height})  {len(slots)} slots')
    return out_path

for name, info in positions.items():
    annotate(name, info)

print('[done]')
