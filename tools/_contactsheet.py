import os, glob, sys
from PIL import Image, ImageDraw, ImageFont

SRC = os.path.join(os.path.dirname(__file__), 'screenshots', 'mapsweep')
OUT = os.path.join(SRC, '_contactsheet.png')
suffix = sys.argv[1] if len(sys.argv) > 1 else 'a'   # 'a' = gameplay, 'b' = weapon switch

shots = sorted(glob.glob(os.path.join(SRC, 'st*-%s-*.png' % suffix)) + glob.glob(os.path.join(SRC, 'st*-%s.png' % suffix)))
if not shots:
    print('no screenshots found for suffix', suffix); sys.exit(1)

cols = 4
tw, th = 320, 146           # thumb size
pad, labelh = 8, 18
rows = (len(shots) + cols - 1) // cols
W = cols * tw + (cols + 1) * pad
H = rows * (th + labelh) + (rows + 1) * pad
sheet = Image.new('RGB', (W, H), (18, 20, 26))
draw = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('arialbd.ttf', 13)
except Exception:
    try: font = ImageFont.truetype('DejaVuSans-Bold.ttf', 13)
    except Exception: font = ImageFont.load_default()

for i, path in enumerate(shots):
    r, c = divmod(i, cols)
    x = pad + c * (tw + pad)
    y = pad + r * (th + labelh + pad)
    try:
        im = Image.open(path).convert('RGB').resize((tw, th), Image.LANCZOS)
        sheet.paste(im, (x, y + labelh))
    except Exception as e:
        draw.rectangle([x, y + labelh, x + tw, y + th + labelh], fill=(40, 40, 40))
    base = os.path.basename(path)
    # st07-a-MOSCOW_FINALE.png -> "07 MOSCOW FINALE"
    name = base.replace('.png', '').split('-', 2)
    label = name[0].replace('st', 'Map ') + ('  ' + name[2].replace('_', ' ') if len(name) > 2 else '')
    draw.text((x + 2, y + 2), label, fill=(150, 220, 255), font=font)

sheet.save(OUT)
print('contact sheet:', OUT, sheet.size, '(%d maps)' % len(shots))
