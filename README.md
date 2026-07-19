# SGVC — Landing page

Sitio estático (HTML + CSS + JS), sin build step, sin imágenes en base64: todos los
assets viven como archivos reales en `assets/img/`.

## Estructura
```
index.html
css/style.css
js/main.js          # escena 3D del isotipo + tilt cards + scroll reveal
assets/img/          # logo, íconos e imágenes de casos (archivos reales)
```

## Ver en local
```bash
npx serve .
# o
python3 -m http.server 8080
```

## Desplegar en Vercel
Opción rápida, sin Git:
```bash
npm i -g vercel
cd sgvc-landing
vercel --prod
```
Vercel detecta que es un sitio estático (no hay `package.json` con build), así que
sirve `index.html` directamente — no hace falta configurar nada más.

Opción con Git: sube esta carpeta a un repo (GitHub/GitLab/Bitbucket) e impórtalo
en vercel.com → "Add New Project". Framework Preset: **Other**.

## Después de desplegar — 2 pasos pendientes
1. **Open Graph**: en `index.html`, reemplaza `REEMPLAZA_CON_TU_DOMINIO` (4 apariciones)
   por tu dominio real. Sin esto, el link se ve bien en el navegador pero sin preview
   al compartirlo en WhatsApp/IG.
2. **Tracking**: `js/main.js` ya empuja eventos (`whatsapp_click`, `contact_channel_click`,
   `case_study_view`) a `window.dataLayer`. Para que se registren en algún lado, agrega
   tu snippet de Google Analytics 4 o Google Tag Manager en el `<head>` — el código no
   necesita ningún cambio adicional.

## Notas
- El WhatsApp de contacto está fijado a `51997090722` (el primer número del
  portafolio). Si prefieres el segundo (`995726924`) o quieres repartir el tráfico,
  avísame y cambio el enlace `wa.me` en `index.html`.
- Tipografías (Space Grotesk + Inter) y Three.js se cargan desde CDN público
  (Google Fonts y cdnjs). Si vas a desplegar en una red corporativa restringida,
  puede que necesites auto-alojar esos archivos.
