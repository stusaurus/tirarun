from pathlib import Path
p=Path('game.js')
s=p.read_text()
old="""  function releaseGlide(e) {
    if (e && e.cancelable) e.preventDefault();
    player.glideHeld = false;
    player.glideActive = false;
  }
"""
new="""  function releaseGlide() {
    player.glideHeld = false;
    player.glideActive = false;
  }
"""
assert old in s
p.write_text(s.replace(old,new,1))
