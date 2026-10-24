"""Builds the game (game/build.sh) and puts it in app/src/main/assets/: index.html with the fonts bundled for
offline play (no Google Fonts, no network), PixiJS, and the sprite atlases (the original Luna's and this game's own)."""
import pathlib, re, shutil, subprocess

root = pathlib.Path(__file__).resolve().parent.parent
game = root / "game"
subprocess.run(["sh", str(game / "build.sh")], check=True)
src = (game / "out" / "index.html").read_text(encoding="utf-8")

src = re.sub(r'<link rel="preconnect"[^>]*>\s*', "", src)
src = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>\s*', "", src)
src = re.sub(r'<meta name="claude:[^>]*>\s*', "", src)
src = src.replace('content="width=device-width,initial-scale=1,viewport-fit=cover"', 'content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no"')
fonts = (
    "<style>"
    "@font-face{font-family:'Young Serif';src:url(fonts/youngserif.woff2) format('woff2');font-display:swap}"
    "@font-face{font-family:'Figtree';src:url(fonts/figtree.woff2) format('woff2');font-weight:100 900;font-display:swap}"
    "@font-face{font-family:'Lilita One';src:url(fonts/lilitaone.woff2) format('woff2');font-display:swap}"
    "</style>\n"
)
src = src.replace("<style>", fonts + "<style>", 1)
assets = root / "app" / "src" / "main" / "assets"
assets.mkdir(parents=True, exist_ok=True)
(assets / "index.html").write_text(src, encoding="utf-8")
print(f"wrote app/src/main/assets/index.html ({len(src):,} bytes)")
for name in ["pixi.bundle.js", "atlas.js", "mar.js", "sprites.webp", "world.webp", "icons.webp", "mar.webp"]:
    shutil.copyfile(game / "out" / name, assets / name)
    print(f"copied {name}")
