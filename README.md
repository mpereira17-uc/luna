# Luna

Juego móvil para Android: eres la luna. Mueves la luna por el cielo para apuntar tus armas y levantar el mar, y la marea sube y baja sola cada vez más rápido. Con marea baja los barcos se destrozan contra el arrecife y con marea alta los piratas se ahogan. Es un roguelite de partidas cortas con campaña y progreso permanente.

## Qué tiene el juego

- **Campaña de 20 misiones** en 4 islas, con hasta 3 estrellas por misión, un mapa con caminos que se bifurcan y un jefe por isla: el Kraken, la Armada Negra, el Leviatán y el Demonio del Eclipse.
- **Expediciones** de 20 oleadas y 2 jefes en cada isla, con **5 niveles de peligro** (más monedas, enemigos más duros), y el modo **Marea sin fin**.
- **10 armas con niveles 1, 2 y 3**, 11 pasivas, **10 fusiones** (arma a nivel 3 + su pasiva) y **8 uniones** de dos armas a nivel 3.
- **Monedas** que sueltan los enemigos y se recogen con la luna. Con ellas compras en el **taller** 12 mejoras permanentes, **5 diseños de arrecife** y 5 defensas para el castillo.
- **6 lunas** jugables con su arma inicial y su habilidad especial, y 4 guardianes que acompañan en la batalla.
- **Eventos sorpresa** (la gran ballena, la lluvia de estrellas, la flota fantasma, el cofre maldito y el mercante en apuros), **rutas** que se bifurcan, 4 **cámaras ocultas**, 4 **capitanes rivales** que vuelven más fuertes y un **mercader** que atraca tras cada jefe.
- **Reto diario** (12 reglas que cambian cada día), **reto semanal** con la misma partida para todos, 12 **desafíos de marea**, 4 **ecos** de leyenda que dan reliquias, misiones diarias y 34 logros.
- Un **cómic de inicio** de 6 viñetas que cuenta por qué la Luna defiende la isla. Sale antes de la primera partida y se puede volver a ver con «Ver la historia».
- En el móvil: la partida se puede **continuar** si la app se cierra, la **calidad gráfica** se ajusta sola para ir fluida y gastar menos batería, y en Ajustes se eligen la calidad, el movimiento reducido y la velocidad de la luna.

Funciona sin internet, sin anuncios y sin recoger datos. El progreso se guarda en el teléfono. La rama `anuncios` es la misma versión con anuncios con recompensa de AdMob.

## Estructura del repositorio

| Carpeta | Qué hay |
| --- | --- |
| `web/` | El juego: `luna.html` (código, estilos y pantallas en un solo archivo) y las hojas de sprites `sprites.webp`, `world.webp`, `icons.webp` y `comic.webp` (las viñetas del cómic) con su tabla `atlas.js`. |
| `art/` | Los dibujos en SVG, escritos como módulos de JavaScript (`units`, `bosses`, `fx`, `world`, `icons` y `comic`). `build.js` los convierte en las hojas de sprites. |
| `app/` | La app de Android: una actividad en Java con un WebView a pantalla completa. |
| `tools/` | `build_assets.py` copia el juego a la app; `play-test.js` juega partidas con un bot para medir la dificultad; `store-shots.js` saca las 8 capturas de Google Play. |
| `google-play/` | Ficha de la tienda, políticas de privacidad (sin anuncios y con anuncios), la lista de pasos para publicar (`lanzamiento.md`), icono, gráfico destacado y capturas. En `desarrollador/` están el icono y la cabecera de la página de IA Games. |

## Probar el juego en el ordenador

Abre `web/luna.html` en Chrome. Las hojas de sprites se cargan desde la misma carpeta, así que deben estar al lado del HTML.

## Cambiar el arte

1. Edita el sprite en `art/*.js`. Cada sprite es un SVG en "unidades de diseño" con su tamaño (`w`, `h`) y su punto de anclaje (`ax`, `ay`).
2. Para ver un grupo de sprites: `node art/build.js preview world 2` genera `art/out/preview-world.png`.
3. Para regenerar las hojas: `node art/build.js atlas`. Escribe los PNG de revisión en `art/out/` y copia `atlas.js` y los `.webp` a `web/`.

Hace falta Node 18 o más reciente y Playwright (`npm i playwright` y `npx playwright install chromium`).

## Compilar la app con GitHub (recomendado)

Cada vez que se sube un cambio a la rama `main`, el flujo `.github/workflows/android.yml` genera:

- `luna-apk-prueba`: un APK que se instala directamente en el móvil para probar.
- `luna-google-play`: el paquete `.aab` que se sube a Google Play Console.

El `.aab` sale sin firmar si el repositorio no tiene los secretos de la clave de subida. Se puede firmar después con `jarsigner`, o añadir estos secretos en Settings → Secrets and variables → Actions: `LUNA_KEYSTORE_B64` (el archivo .jks en base64), `LUNA_KEYSTORE_PASSWORD`, `LUNA_KEY_ALIAS` y `LUNA_KEY_PASSWORD`.

## Compilar en tu PC

1. Instala Android Studio.
2. Ejecuta `python3 tools/build_assets.py` si cambiaste algo en `web/`.
3. Abre esta carpeta en Android Studio y usa Build → Generate Signed App Bundle / APK.

Identificador de la app: `io.github.mpereira17uc.luna`. Se puede cambiar en `app/build.gradle.kts` antes de la primera subida a Google Play; después ya no se puede cambiar.

## Mantener la clave de subida a salvo

La clave de subida (`.jks`) y sus contraseñas nunca deben subirse al repositorio. Google Play guarda la clave de firma final de la app (Play App Signing); si se pierde la clave de subida, se puede pedir a Google que la restablezca.
