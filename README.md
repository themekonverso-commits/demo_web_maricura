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
| Servicios, precios, duraciones, horario y plazos | **En el panel de reservas** (Configuración), no aquí: la web los lee de la API |
| Fotos, nombres y etiquetas del carrusel (Nail Diary) | `public/galeria/` y `src/data/gallery.js` |
| Política de retrasos y cancelación (texto de ejemplo) | `src/components/Faq.jsx` |

## Cómo funcionan las reservas

La web está conectada al sistema de **Reservas Konverso** (negocio `yuye-nails`) por su API pública, sin widget: el
diseño es el de esta web. El flujo va por pasos dentro de la sección de reserva: **Servicios → Día y hora → Tus datos →
¡Cita reservada! → Ver, cambiar o cancelar mi cita.**

- **Carta** (`src/lib/catalog.js`): servicios, precios y duraciones salen del panel. Las categorías «Decoración» y
  «Retirada» son extras que se suman a un servicio de manos o pies. Mientras carga, se ve la carta de
  `src/data/services.js` (la misma con la que se dio de alta el negocio).
- **Día y hora**: los días con hueco y las horas libres reales de la agenda de Andreina.
- **Tus datos**: antibots de Cloudflare (Turnstile) y casillas de privacidad y promociones (versión del texto en
  `RESERVAS.consentimientos`, `src/config.js`).
- **Ver, cambiar o cancelar**: en el navegador solo se guarda el enlace privado de la última cita, nunca sus datos. El
  email de confirmación lleva a `https://yuye-nails.vercel.app/#cita=…`, que abre la cita aquí mismo.
- El cliente de la API está en `src/lib/api.js`. La guía completa es `docs/API.md` del sistema de reservas.

En local, la web usa la API de producción. Para probar contra el sistema en local y con un negocio de pruebas:

```bash
VITE_RESERVAS_API=http://localhost:3030 VITE_RESERVAS_NEGOCIO=test-web-yuye npx vite --port 5173
```
