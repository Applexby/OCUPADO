# OCUPADO

Página del cortometraje animado **OCUPADO** (2D, tinta y acuarela).

Sitio estático: `index.html` y la carpeta `assets/`. No necesita compilación; en Vercel basta con importar el repositorio.

## Narración

La historia se cuenta en primera persona, con la voz de Leo. El texto está en `index.html` (`STORY`).

- `audio/guion/OCUPADO_narracion_pegar_en_ElevenLabs.txt`: el texto con las etiquetas de emoción para generar la voz en ElevenLabs (voz Kate - Serene Narrator Pro, Eleven v4). Tiene unos 6 100 caracteres.
- Mientras no exista el audio de esta versión, `SYNC` queda vacío y la web oculta el reproductor y los botones «Escuchar». Para activarlo: generar el MP3, guardarlo como `audio/ocupado-narracion.mp3`, alinearlo y pegar los tiempos por palabra en `SYNC` (un bloque por párrafo, en orden) y la duración en `dur` de `TRACKS`.
- `audio/ocupado-narracion.mp3` es la narración de la versión anterior y ya no coincide con el texto.
