"""Builds app/src/main/assets/ from web/: index.html with the fonts bundled for offline play, plus the sprite atlases."""
import pathlib, re, shutil

root = pathlib.Path(__file__).resolve().parent.parent
src = (root / "web" / "luna.html").read_text(encoding="utf-8")

src = re.sub(r'<link rel="preconnect"[^>]*>\s*', "", src)
src = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>\s*', "", src)
src = re.sub(r'<meta name="claude:[^>]*>\s*', "", src)
fonts = (
    "<style>"
    "@font-face{font-family:'Young Serif';src:url(fonts/youngserif.woff2) format('woff2');font-display:swap}"
    "@font-face{font-family:'Figtree';src:url(fonts/figtree.woff2) format('woff2');font-weight:100 900;font-display:swap}"
    "@font-face{font-family:'Lilita One';src:url(fonts/lilitaone.woff2) format('woff2');font-display:swap}"
    "</style>\n"
)
head = (
    '<!doctype html>\n<html lang="es"><head><meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">\n'
)
out = head + fonts + src
if "</html>" not in out:
    out += "\n</html>\n"
assets = root / "app" / "src" / "main" / "assets"
dst = assets / "index.html"
dst.write_text(out, encoding="utf-8")
print(f"wrote {dst.relative_to(root)} ({len(out):,} bytes)")
# sprite atlases drawn by art/build.js: the frame table (atlas.js) and the WebP sheets (comic.webp holds the intro comic)
for name in ["atlas.js", "sprites.webp", "world.webp", "icons.webp", "comic.webp"]:
    shutil.copyfile(root / "web" / name, assets / name)
    print(f"copied web/{name}")
