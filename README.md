# Yuye Nails · sitio demo

Sitio de demostración para Andreina Soto (@yuye_nailss.es, Sevilla). Hecho con React, Tailwind CSS y Framer Motion.

## Cómo verlo

Desde esta carpeta:

```bash
npm run dev
```

Luego abre http://localhost:5173 en el navegador.

Para generar la versión lista para subir a internet (queda en `dist/`):

```bash
npm run build
```

## Qué cambiar antes de mostrarlo como real

| Qué | Dónde |
| --- | --- |
| Número de WhatsApp de Andreina (su enlace w.app está pausado) | `src/config.js` → `whatsapp` |
| Horario, días cerrados, días que se pueden reservar | `src/config.js` → `SCHEDULE` |
| Servicios, precios y duraciones (precios de referencia de Sevilla) | `src/data/services.js` |
| Fotos, nombres y etiquetas del carrusel (Nail Diary) | `public/galeria/` y `src/data/gallery.js` |
| Política de retrasos y cancelación (texto de ejemplo) | `src/components/Faq.jsx` |

## Cómo funcionan las reservas en la demo

El flujo va por pasos dentro de la sección de reserva: **Servicios → Día y hora → Tus datos → ¡Cita reservada! → Ver, cambiar o cancelar mi cita.** Se pueden elegir varios servicios; los extras (nail art, retirada) se suman a uno de manos o pies. Los turnos son cada 15 minutos y se puede cambiar o cancelar hasta 24 horas antes (`SCHEDULE` en `src/config.js`).

Para la versión real falta: un servidor o agenda donde se guarden las citas (hoy solo se guardan en el navegador), enviar el email de confirmación, la política de privacidad enlazada, y un control anti-spam (como Cloudflare Turnstile) en el paso «Tus datos».


- Las horas ocupadas son de ejemplo: se generan igual cada día para que la agenda se vea real.
- Al reservar, la cita se guarda solo en ese navegador y esas horas dejan de aparecer.
- Solo se muestran las horas en las que cabe el servicio completo (incluida la decoración y la retirada).
- Para una versión real habría que conectar una agenda de verdad (por ejemplo una base de datos o Google Calendar).

## Estilo Liquid Glass

- El vidrio se usa solo en lo que flota: menú, botones, controles, panel de reserva, visor de fotos y ventanas. La carta y los textos largos van sobre color sólido para que se lean bien.
- Los estilos están en `src/index.css` (clases `glass`, `glass-dark`, `glass-thick`, `glass-gold`) y el reflejo que sigue al ratón en `src/lib/glass.js`.
- La distorsión líquida (refracción) solo se ve en Chrome y Edge. En Safari y Firefox queda el desenfoque, que también se ve bien.
- Si alguien tiene activado "reducir transparencia" en su equipo, el vidrio se vuelve sólido automáticamente.

## Fotos

Las 8 fotos de trabajos de `public/galeria/` son de su Instagram. El retrato (`andreina-retrato.jpg`) lo pasó el cliente y está recortado en cuadrado 1:1. Las fotos que ya no se usan están en `descartadas/` (no se suben al repositorio).

**Foto de portada (`public/decor/hero-tortuga.jpg`): no es de Andreina.** Es de @nail_inspo_daily (lleva su marca de agua) y se usa solo como referencia en la demo, con su crédito visible en el pie de página. Antes de publicar el sitio hay que cambiarla por una foto propia de Andreina. El sitio lleva `noindex` en `index.html` para que los buscadores no lo muestren mientras sea demo; hay que quitarlo al publicar.
