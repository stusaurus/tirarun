from pathlib import Path
from collections import deque
from PIL import Image

FILES = [
    Path('8730184C-FBB1-4BDA-BF85-FF4F24AED3C7.png'),
    Path('DCB091BC-7A59-435A-9F19-78285C56A4BF.png'),
]

def is_bg(px):
    r,g,b,a = px
    return a > 0 and r >= 242 and g >= 242 and b >= 242 and max(r,g,b)-min(r,g,b) <= 8

for path in FILES:
    im = Image.open(path).convert('RGBA')
    w,h = im.size
    pix = im.load()
    q = deque()
    seen = bytearray(w*h)
    def push(x,y):
        i=y*w+x
        if seen[i] or not is_bg(pix[x,y]): return
        seen[i]=1; q.append((x,y))
    for x in range(w):
        push(x,0); push(x,h-1)
    for y in range(h):
        push(0,y); push(w-1,y)
    cleared=0
    while q:
        x,y=q.popleft()
        r,g,b,a=pix[x,y]
        pix[x,y]=(r,g,b,0)
        cleared += 1
        if x: push(x-1,y)
        if x+1<w: push(x+1,y)
        if y: push(x,y-1)
        if y+1<h: push(x,y+1)
    print(path.name, 'cleared', cleared)
    if cleared:
        im.save(path)

index = Path('index.html')
text = index.read_text()
text = text.replace('20260915-2120', '20260915-2135')
index.write_text(text)
