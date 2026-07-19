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

## Notas
- El WhatsApp de contacto está fijado a `51997090722` (el primer número del
  portafolio). Si prefieres el segundo (`995726924`) o quieres repartir el tráfico,
  avísame y cambio el enlace `wa.me` en `index.html`.
- Tipografías (Space Grotesk + Inter) y Three.js se cargan desde CDN público
  (Google Fonts y cdnjs). Si vas a desplegar en una red corporativa restringida,
  puede que necesites auto-alojar esos archivos.
