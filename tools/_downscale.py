import sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
maxdim = int(sys.argv[3]) if len(sys.argv) > 3 else 1280
im = Image.open(src)
w, h = im.size
scale = min(1.0, maxdim / float(max(w, h)))
if scale < 1.0:
    im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
im.save(dst)
print("%s -> %s  (%dx%d -> %dx%d)" % (src, dst, w, h, im.size[0], im.size[1]))
