from pathlib import Path

STYLE = Path('style.css')
INDEX = Path('index.html')

css = STYLE.read_text()
old = '#pauseBtn{pointer-events:auto;border:0;background:#ffffffd9;border-radius:50%;width:42px;height:42px;font-size:18px;box-shadow:0 4px 14px #3b6f5d22;display:grid;place-items:center;padding:0}'
new = '#pauseBtn{pointer-events:auto;position:absolute;left:max(14px,env(safe-area-inset-left));bottom:max(14px,env(safe-area-inset-bottom));z-index:6;border:0;background:#ffffffd9;border-radius:50%;width:42px;height:42px;font-size:18px;box-shadow:0 4px 14px #3b6f5d22;display:grid;place-items:center;padding:0}'
assert old in css, 'pause button CSS not found'
css = css.replace(old, new, 1)
STYLE.write_text(css)

html = INDEX.read_text()
assert '20260915-2110' in html, 'cache token not found'
html = html.replace('20260915-2110', '20260915-2120')
INDEX.write_text(html)
