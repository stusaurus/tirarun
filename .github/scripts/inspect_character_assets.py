from PIL import Image
from pathlib import Path

FILES = [
'13E57C5F-73B3-4919-AEAD-F456E8A57EB3.png',
'304EEA32-1229-4F79-B3FD-BF2B49632167.png',
'8730184C-FBB1-4BDA-BF85-FF4F24AED3C7.png',
'8E0967A2-6213-4014-AD0F-204E1BB3A89F.png',
'8EF97C48-064E-4EDC-95DA-7EB00DA5F1D1.png',
'D1D9FF27-0E76-4D9C-8F0E-862356577F01.png',
'D364C13F-1755-481F-9D5B-0D980AEBD7A1.png',
'DCB091BC-7A59-435A-9F19-78285C56A4BF.png',
'DE557F47-D307-4934-B684-BE560F5B52D6.png',
]

CHARS = ' .:-=+*#%@'

def fg_score(px):
    r,g,b,a = px
    if a < 24:
        return 0.0
    # white/very light backgrounds should fade out; outlines and colored subject stay.
    whiteness = min(r,g,b) / 255.0
    chroma = (max(r,g,b)-min(r,g,b))/255.0
    darkness = 1.0 - (r+g+b)/(3*255.0)
    return max(darkness, chroma*0.9, (a/255.0)*(1.0-whiteness)*0.8)

for fn in FILES:
    im = Image.open(fn).convert('RGBA')
    w,h = im.size
    # foreground bbox using alpha + nonwhite threshold
    pix = im.load()
    xs=[]; ys=[]
    for y in range(0,h,4):
        for x in range(0,w,4):
            if fg_score(pix[x,y]) > 0.10:
                xs.append(x); ys.append(y)
    if xs:
        bbox=(min(xs),min(ys),max(xs),max(ys))
        bw=bbox[2]-bbox[0]+1; bh=bbox[3]-bbox[1]+1
    else:
        bbox=(0,0,w-1,h-1); bw=w; bh=h
    print('\n===', fn, '===')
    print('size', w,h, 'bbox', bbox, 'bbox_aspect', round(bw/bh,3))

    crop = im.crop((bbox[0], bbox[1], bbox[2]+1, bbox[3]+1))
    # preserve aspect: 42 cols, around 24 rows scaled for terminal glyph aspect
    tw=42
    th=max(10, min(30, round(crop.height/crop.width*tw*0.48)))
    small=crop.resize((tw,th))
    for y in range(th):
        line=''
        for x in range(tw):
            s=fg_score(small.getpixel((x,y)))
            idx=min(len(CHARS)-1, max(0, int(s*(len(CHARS)-1)*1.35)))
            line+=CHARS[idx]
        print(line.rstrip())
