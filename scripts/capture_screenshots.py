"""
Capture screenshots + element bounding boxes for the admin guidebook.

For each page we:
  1. screenshot the whole page (full_page=True)
  2. for each known image-slot selector, record bounding boxes (page coords)
  3. dump everything to docs/screenshots/positions.json so the annotation
     step can draw boxes + crop intelligently.

Assumes:
  - vite client at http://localhost:5173
  - express api at http://localhost:3001
  - DB has data (dev `glowupseoul`)
"""
from playwright.sync_api import sync_playwright
from urllib.request import urlopen
import json
import os
import sys

CLIENT = 'http://localhost:5173'
API    = 'http://localhost:3001'
OUT    = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'docs', 'screenshots'))
os.makedirs(OUT, exist_ok=True)

# Each entry = (filename, route, slot_selectors)
# slot_selectors = list of (css_selector, label, human_description)

def build_targets(proc_slug, host_slug):
    return [
        ('01_home', '/', [
            ('.gs-bento-bg', 'A', '카테고리 hero_image_url / thumbnail_url'),
        ]),
        ('02_category', '/category/face', [
            ('.gs-cat-hero', 'A', '카테고리 hero_image_url'),
            ('.gs-treatment-card .thumb, .gs-treatment-card-thumb',
             'B', '시술 thumbnail_url'),
        ]),
        ('03_treatment', f'/treatment/{proc_slug}', [
            ('.gs-detail-hero', 'A', '시술 thumbnail_url'),
        ]),
        ('04_hospital',  f'/clinic/{host_slug}', [
            ('.gs-clinic-hero', 'A', '병원 hero_image_url'),
        ]),
    ]

try:
    data = json.loads(urlopen(f'{API}/api/catalog/bootstrap').read())
except Exception as e:
    print(f'[err] bootstrap fetch failed: {e}', file=sys.stderr); sys.exit(2)

procedures = data.get('procedures', [])
hospitals  = data.get('hospitals', [])
if not procedures or not hospitals:
    print('[err] empty catalog', file=sys.stderr); sys.exit(2)

face_cat_id = next((c['id'] for c in data['categories'] if c['slug'] == 'face'), None)
proc = next((p for p in procedures if p.get('category_id') == face_cat_id), procedures[0])
host = hospitals[0]

pages = build_targets(proc['slug'], host['slug'])
print(f"[capture] procedure={proc['slug']!r} hospital={host['slug']!r}")

positions = {}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={'width': 1440, 'height': 900},
        device_scale_factor=1,
    )
    page = context.new_page()
    for name, route, slot_specs in pages:
        url = CLIENT + route
        print(f'[capture] -> {name}  {url}')
        try:
            page.goto(url, wait_until='networkidle', timeout=45000)
        except Exception as e:
            print(f'   [warn] networkidle timeout: {e}')
        page.wait_for_timeout(3500)
        page.evaluate('window.scrollTo(0, 0)')
        page.wait_for_timeout(500)

        # Save full-page screenshot
        out_path = os.path.join(OUT, f'{name}.png')
        page.screenshot(path=out_path, full_page=True)

        # Collect bounding boxes for slot elements (page coords)
        slots = []
        page_height = page.evaluate('document.body.scrollHeight')
        for sel, label, desc in slot_specs:
            locs = page.locator(sel).all()
            for i, loc in enumerate(locs[:8]):
                try:
                    box = loc.bounding_box()
                except Exception:
                    continue
                if not box or box['width'] < 30 or box['height'] < 30:
                    continue
                slots.append({
                    'selector': sel,
                    'label': label,
                    'desc': desc,
                    'rect': [round(box['x'], 1), round(box['y'], 1),
                             round(box['width'], 1), round(box['height'], 1)],
                    'index': i,
                })
        positions[name] = {
            'file': f'{name}.png',
            'page_height': page_height,
            'slots': slots,
        }
        from PIL import Image
        with Image.open(out_path) as img:
            print(f'   saved {name}.png  ({img.width}x{img.height})  {len(slots)} slots')

    browser.close()

with open(os.path.join(OUT, 'positions.json'), 'w', encoding='utf8') as f:
    json.dump(positions, f, indent=2, ensure_ascii=False)

print(f'[capture] positions saved')
