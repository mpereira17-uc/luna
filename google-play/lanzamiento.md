# Luna: pasos para publicar en Google Play

Lista para seguir en orden en Play Console. Nada de esto está hecho todavía: no se ha subido nada a Google Play.

## 0. Antes de empezar
- [ ] **Elegir la versión:** sin anuncios (rama `main`) o con anuncios (rama `anuncios`). Cambia la ficha, la política de privacidad y las respuestas de Seguridad de los datos (ver `ficha-google-play.md`).
- [ ] **Cuenta de desarrollador** de IA Games verificada (identidad y, en cuentas personales, el teléfono con la app de Play Console).
- [ ] **Copia de la clave de subida** (`clave-de-subida`, el `.jks` y sus contraseñas) en un sitio seguro fuera del ordenador. Nunca en el repositorio.
- [ ] **El AAB:** en GitHub, pestaña Actions, la última ejecución verde de `main` (o de `anuncios`), artefacto `luna-google-play`. Ya sale firmado con la clave de subida.
  - Versión 1.0.0. El código de versión es el número de la ejecución de GitHub (la última revisada fue la 35), así que cada AAB nuevo tiene un código mayor y Google lo acepta.
  - Revisado en CI: Android 7.0 (API 24) a Android 16 (API 36), 2,9 MB, solo pide la vibración, sin librerías nativas (no le afecta el requisito de páginas de 16 KB).
  - La versión con anuncios añade internet, el estado de la red y el ID de publicidad.

## 1. Crear la app
- [ ] Play Console > Crear aplicación.
  - Nombre: `Luna: Señora de las Mareas`. Idioma predeterminado: Español (España) – es-ES.
  - Tipo: Juego. Gratis o de pago: **Gratis** (después no se puede pasar a de pago).
  - Aceptar las declaraciones (políticas del programa y leyes de exportación de EE. UU.).

## 2. Configurar la app (Panel > «Configura tu app»)
Todas las respuestas están en `ficha-google-play.md`.
- [ ] Política de privacidad: el enlace de GitHub a `politica-de-privacidad.md` (o la versión con anuncios).
- [ ] Acceso a la app: todo disponible sin restricciones.
- [ ] Anuncios: No (o Sí en la versión con anuncios).
- [ ] Clasificación de contenido: cuestionario IARC, con el correo de contacto.
- [ ] Público objetivo: 13 años o más.
- [ ] Seguridad de los datos.
- [ ] ID de publicidad: «No» (o «Sí, para publicidad» en la versión con anuncios).
- [ ] Apps gubernamentales, funciones financieras, salud y noticias: No.
- [ ] Categoría (Juegos > Acción), correo de contacto y etiquetas.

## 3. Ficha principal de la tienda
- [ ] Descripción breve y completa (`ficha-google-play.md`).
- [ ] Icono 512×512, gráfico destacado 1024×500 y las 8 capturas de `capturas/` en orden.

## 4. Prueba interna (opcional, recomendable)
Sirve para comprobar en unos minutos que el AAB que llega desde Google Play se instala y funciona.
- [ ] Probar y publicar > Pruebas > Prueba interna > Crear versión.
- [ ] La primera vez, aceptar la **firma de apps de Google Play** (Google guarda la clave de firma final; la tuya es solo la de subida).
- [ ] Subir el AAB, añadir tu correo como tester, abrir el enlace de participación en el móvil e instalar desde Play.

## 5. Prueba cerrada (obligatoria en cuentas personales nuevas)
En las cuentas personales creadas después de noviembre de 2023, Google exige **al menos 12 testers apuntados durante 14 días seguidos** antes de dejar publicar en producción.
- [ ] Probar y publicar > Pruebas > Prueba cerrada > Alfa > Crear versión y subir el AAB.
- [ ] Notas de la versión (es-ES):
  > Primera prueba de Luna. Juega la campaña, las expediciones, la marea sin fin y los retos, y cuéntanos qué falla o qué se hace difícil. Gracias por ayudarnos.
- [ ] Países: España y los países de tus testers.
- [ ] Testers: una lista de correos (cuentas de Google) o un grupo de Google. Mejor apuntar a 15 o más, por si alguno se borra: si bajan de 12, los 14 días no cuentan.
- [ ] Enviar a revisión. Cuando esté aprobada, mandar a los testers el enlace de participación. Cada uno tiene que aceptar desde ese enlace e instalar el juego desde Play, y no darse de baja en los 14 días.
- [ ] Mensaje para los testers:
  > ¡Hola! Estoy a punto de publicar mi juego Luna en Google Play y necesito testers durante 2 semanas. Entra en este enlace con tu cuenta de Google, pulsa «Convertirse en tester» e instálalo desde Play: [enlace]. Juega cuando quieras y no lo desinstales hasta que te avise. Si algo falla, cuéntamelo o deja un comentario privado en la ficha. ¡Gracias!
- [ ] Qué pedir que prueben:
  - La primera partida desde cero (cómic, mapa y misión de tutorial).
  - Varias misiones de la campaña y una expedición entera.
  - Cerrar la app en mitad de una expedición y continuarla al volver.
  - Botón atrás y pausa, una llamada o una notificación en mitad de la partida.
  - Que la partida vaya fluida y que el móvil no se caliente; probar las calidades de Ajustes.
- [ ] Revisar el **informe previo al lanzamiento** (Google prueba el juego en móviles reales al subir a la prueba cerrada) y los comentarios de los testers.
- [ ] Si hay que corregir algo: subir a `main`, esperar el AAB nuevo y subirlo a la misma prueba cerrada. No hace falta volver a empezar los 14 días.

## 6. Pedir acceso a producción
- [ ] Pasados los 14 días, Panel > «Solicitar acceso a producción». Google pregunta cómo encontraste a los testers, qué te dijeron y qué cambiaste. Contesta con detalle: los cambios hechos por los comentarios ayudan a que lo aprueben.
- [ ] La revisión puede tardar varios días.

## 7. Lanzamiento
- [ ] Producción > Crear versión con el último AAB de la prueba cerrada.
- [ ] Países: todos o los que quieras.
- [ ] Lanzamiento progresivo recomendado: empezar con el 20 % y subir al 100 % si en Android vitals no hay fallos.
- [ ] Después: mirar Android vitals (cierres y bloqueos) y las reseñas los primeros días.
