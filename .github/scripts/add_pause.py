from pathlib import Path

repo = Path('.')
game = repo/'game.js'
index = repo/'index.html'
style = repo/'style.css'

s = game.read_text(encoding='utf-8')

def rep(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'missing target: {label}')
    s = s.replace(old, new, 1)

rep(
"""  const muteBtn = document.getElementById('mute');
""",
"""  const muteBtn = document.getElementById('mute');
  const pauseBtn = document.getElementById('pauseBtn');
  const pausePanel = document.getElementById('pausePanel');
  const resumeBtn = document.getElementById('resumeBtn');
""",
'pause refs')

rep(
"""    if (state !== 'playing') player.y = groundY - player.h;
""",
"""    if (state !== 'playing' && state !== 'paused') player.y = groundY - player.h;
""",
'resize paused preservation')

rep(
"""    overlay.style.display = 'none';
    resultEl.style.display = 'none';
    updateHud();
  }

  function finishGame() {
""",
"""    overlay.style.display = 'none';
    pausePanel.hidden = true;
    pauseBtn.hidden = false;
    resultEl.style.display = 'none';
    updateHud();
  }

  function pauseGame() {
    if (state !== 'playing') return;
    state = 'paused';
    pausePanel.hidden = false;
    pauseBtn.hidden = true;
    if (audioCtx && audioCtx.state === 'running') audioCtx.suspend().catch(() => {});
  }

  function resumeGame() {
    if (state !== 'paused') return;
    state = 'playing';
    last = performance.now();
    pausePanel.hidden = true;
    pauseBtn.hidden = false;
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  }

  function finishGame() {
""",
'pause functions')

rep(
"""    state = 'over';
    shake = 10;
""",
"""    state = 'over';
    pausePanel.hidden = true;
    pauseBtn.hidden = true;
    shake = 10;
""",
'finish hides pause')

rep(
"""  canvas.addEventListener('pointerdown', input, {passive:false});
""",
"""  canvas.addEventListener('pointerdown', input, {passive:false});
  pauseBtn.addEventListener('pointerdown', e => e.stopPropagation());
  pauseBtn.addEventListener('click', e => { e.stopPropagation(); pauseGame(); });
  resumeBtn.addEventListener('pointerdown', e => e.stopPropagation());
  resumeBtn.addEventListener('click', e => { e.stopPropagation(); resumeGame(); });
  pausePanel.addEventListener('pointerdown', e => e.stopPropagation());
""",
'pause listeners')

rep(
"""  addEventListener('keydown', input, {passive:false});
  muteBtn.addEventListener('pointerdown', e => e.stopPropagation());
""",
"""  addEventListener('keydown', input, {passive:false});
  addEventListener('keydown', e => {
    if (!['Escape','KeyP'].includes(e.code)) return;
    e.preventDefault();
    if (state === 'playing') pauseGame();
    else if (state === 'paused') resumeGame();
  }, {passive:false});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') pauseGame();
  });
  muteBtn.addEventListener('pointerdown', e => e.stopPropagation());
""",
'pause keyboard visibility')

game.write_text(s, encoding='utf-8')

h = index.read_text(encoding='utf-8')
old = """    <div id=\"rightHud\">\n      <div id=\"letters\">T I R A K U R I</div>\n      <button id=\"mute\" aria-label=\"サウンド切替\">🔊</button>\n    </div>\n"""
new = """    <div id=\"rightHud\">\n      <div id=\"letters\">T I R A K U R I</div>\n      <button id=\"pauseBtn\" aria-label=\"一時停止\" hidden>⏸️</button>\n      <button id=\"mute\" aria-label=\"サウンド切替\">🔊</button>\n    </div>\n"""
if old not in h: raise SystemExit('missing rightHud')
h = h.replace(old, new, 1)
anchor = """  <div id=\"overlay\">\n"""
panel = """  <div id=\"pausePanel\" hidden>\n    <div class=\"pauseCard\">\n      <div class=\"pauseIcon\">⏸️</div>\n      <strong>いったん休憩だノン</strong>\n      <small>スコアもアイテム時間も止まっているよ</small>\n      <button id=\"resumeBtn\">▶ 続ける</button>\n    </div>\n  </div>\n\n"""
if anchor not in h: raise SystemExit('missing overlay anchor')
h = h.replace(anchor, panel + anchor, 1)
h = h.replace('20260913-2140','20260913-2155')
index.write_text(h, encoding='utf-8')

css = style.read_text(encoding='utf-8')
css += """
/* pause-v1 */
#pauseBtn{pointer-events:auto;border:0;background:#ffffffd9;border-radius:50%;width:42px;height:42px;font-size:18px;box-shadow:0 4px 14px #3b6f5d22;display:grid;place-items:center;padding:0}#pauseBtn[hidden]{display:none}#pausePanel[hidden]{display:none}#pausePanel{position:absolute;inset:0;z-index:8;display:grid;place-items:center;padding:24px;background:#18342e42;backdrop-filter:blur(3px);pointer-events:auto}.pauseCard{width:min(86%,320px);background:#fffdf3;border:3px solid #fff;border-radius:26px;padding:24px 22px;text-align:center;box-shadow:0 16px 48px #18342e45}.pauseIcon{font-size:36px;margin-bottom:8px}.pauseCard strong{display:block;font-size:21px;color:#2e6f5e}.pauseCard small{display:block;margin:8px 0 18px;color:#6a7c75;line-height:1.5}.pauseCard button{width:100%;border:0;border-radius:16px;background:#ffb648;color:#4f3210;font:inherit;font-weight:900;font-size:18px;padding:13px 16px;box-shadow:0 4px 0 #d98d24}.pauseCard button:active{transform:translateY(2px);box-shadow:0 2px 0 #d98d24}@media(max-width:430px){#rightHud{gap:5px}#pauseBtn,#mute{width:38px;height:38px}#letters{font-size:12px;padding:8px 8px;letter-spacing:1px}}
"""
style.write_text(css, encoding='utf-8')
