#!/bin/sh
# Builds Luna: Mar abierto into out/: index.html (the page) next to the PixiJS files, atlas.js and the art sheets.
set -e
cd "$(dirname "$0")"
mkdir -p out
{
  cat src/00_head.html
  for f in src/[0-9]*.js; do cat "$f"; echo; done
  printf '</script>\n</body>\n</html>\n'
} > out/index.html
# PixiJS, the original Luna's art (atlas.js and the WebP sheets) and this game's own art (mar.js, mar.webp) go next to the page
cp lib/pixi.bundle.js lib/atlas.js lib/sprites.webp lib/world.webp lib/icons.webp lib/mar.js lib/mar.webp out/
# the page loads the libraries before atlas.js
grep -q 'src="pixi.bundle.js"' out/index.html
# the same page for an Artifact: the host adds its own doctype, html, head and body
sed -e '/^<!doctype html>$/d' -e '/^<html lang="es">$/d' -e '/^<head>$/d' -e '/^<\/head>$/d' -e '/^<body>$/d' -e '/^<\/body>$/d' -e '/^<\/html>$/d' out/index.html > out/artifact.html
node -e "const s=require('fs').readFileSync('out/index.html','utf8');const js=s.split('<script>').pop().split('</script>')[0];new Function(js);console.log('ok', (s.length/1024).toFixed(0)+' KB')"
