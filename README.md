# OCUPADO

Página del cortometraje animado **OCUPADO** (2D, tinta y acuarela).

Sitio estático: `index.html` y la carpeta `assets/`. No necesita compilación; en Vercel basta con importar el repositorio.

## Narración

La historia completa (con el final) se puede escuchar en la web, narrada con ElevenLabs (voz Kate - Serene Narrator Pro, Eleven v4). El audio es lo principal de la página: botón en la portada y en la barra superior, reproductor justo después de la portada y mini-reproductor flotante.

- `audio/ocupado-narracion.mp3`: la narración completa (5:59, 9 capítulos) con la música de fondo ya mezclada: en bucle con fundidos de 4 s, a −28 LUFS bajo la voz (−18 LUFS), con fade in al inicio y fade out al final.
- `audio/guion/`: los textos con las etiquetas de emoción que se pegaron en ElevenLabs.
- Los tiempos de cada palabra (alineación forzada de ElevenLabs) están en `index.html` (`SYNC`) y hacen que el texto se resalte mientras suena. Si se regenera el audio, hay que volver a alinearlo.
