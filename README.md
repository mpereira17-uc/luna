# Luna: Mar abierto

Juego nuevo de IA Games, aparte del Luna original: eres la luna y navegas por un océano enorme visto desde arriba,
estilo Vampire Survivors. Ataques automáticos, oleadas, experiencia, cartas de mejora y evoluciones; seis lunas con su
propio poder; cuatro mares (Mar de las Mareas, Archipiélago Maldito, Océano Congelado, Mar de Sangre); cuatro capitanes,
el Kraken (minuto 5), el Holandés Errante (minuto 10) y el amanecer (minuto 15) para ganar la noche.

Esta rama (`mar-abierto`) es un proyecto independiente: no comparte historia con `main` y no toca el Luna original.

- App: `io.github.mpereira17uc.lunamar`, versión 0.1.0. El APK de prueba se instala como `...lunamar.prueba`.
- Sin permiso de internet, sin anuncios, sin publicar en Google Play.

## Carpetas

- `game/`: el juego (HTML + PixiJS 8). `src/00_head.html` y `src/NN_*.js` se unen con `game/build.sh` en `game/out/`.
  - `game/lib/`: PixiJS empaquetado (receta en `game/tools/pixibundle/`) y los atlas de sprites.
  - `game/art/`: el arte propio de este juego (SVG → `lib/mar.webp` con `node game/art/build.js atlas`).
  - `game/qa/`: pruebas automáticas con Playwright (servir `game/` en el puerto 8765).
- `app/`: la app Android (un WebView a pantalla completa que sirve el juego desde sus propios archivos).
- `tools/build_assets.py`: compila el juego y lo copia a `app/src/main/assets/` con las fuentes incluidas.
- `tools/make_icon.js`: dibuja el icono de la app con los sprites del juego.

## Compilar

GitHub Actions compila el APK de prueba en cada push a esta rama (artefacto `luna-mar-abierto-apk-prueba`).
En local: `python3 tools/build_assets.py && ./gradlew assembleDebug` (necesita el SDK de Android).
