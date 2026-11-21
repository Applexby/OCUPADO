# OCUPADO

Página del cortometraje animado **OCUPADO** (2D, tinta y acuarela).

Sitio estático: `index.html` y la carpeta `assets/`. No necesita compilación; en Vercel basta con importar el repositorio.

## Narración

La historia se cuenta en primera persona y se puede escuchar en la web, narrada con ElevenLabs (voz Kate - Serene Narrator Pro, Eleven v4). El texto de `index.html` (`STORY`) es el mismo que se escucha.

- `audio/ocupado-narracion.mp3`: la narración (5:06, 7 capítulos) con la música de fondo ya mezclada. La música va en bucle con fundidos de 5 s (sin la intro ni el final propios de la pista en las repeticiones), a −28 LUFS bajo la voz (−18 LUFS), con fade in al inicio y fade out al final.
- `audio/guion/OCUPADO_narracion_pegar_en_ElevenLabs.txt`: el texto con las etiquetas de emoción que se pegó en ElevenLabs.
- Los tiempos de cada palabra (alineación forzada de ElevenLabs) están en `index.html` (`SYNC`, un bloque por párrafo) y hacen que el texto se resalte mientras suena. Si se regenera el audio o se cambia el texto, hay que volver a alinearlo.
