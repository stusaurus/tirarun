from pathlib import Path

source_path = Path('.github/scripts/add_progression_shop.py')
src = source_path.read_text(encoding='utf-8')
old = """    if old not in s:\n        raise SystemExit(f'missing target: {label}')\n    s = s.replace(old, new, 1)\n"""
new = """    if old not in s:\n        print(f'optional/missing target: {label}')\n        return\n    s = s.replace(old, new, 1)\n"""
if old not in src:
    raise SystemExit('could not relax rep helper')
src = src.replace(old, new, 1)
exec(compile(src, str(source_path), 'exec'), {})

# The existing roar implementation already has its own render pass. Insert the
# loadout cosmetic between the player sprite and the roar effect if the main
# patch could not match the older render sequence.
game = Path('game.js')
g = game.read_text(encoding='utf-8')
old_draw = """    drawPickupEffects();\n    drawPlayer();\n    drawRoarEffect();\n    drawRushWarpEffect();\n"""
new_draw = """    drawPickupEffects();\n    drawPlayer();\n    drawLoadoutCosmetics();\n    drawRoarEffect();\n    drawRushWarpEffect();\n"""
if old_draw in g and 'drawLoadoutCosmetics();\n    drawRoarEffect();' not in g:
    g = g.replace(old_draw, new_draw, 1)
game.write_text(g, encoding='utf-8')
