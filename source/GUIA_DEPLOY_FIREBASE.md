# Guía: publicar el Tarifario en Firebase Hosting y conectarlo al Asistente

Esta guía te lleva paso a paso para publicar el Tarifario en el mismo proyecto Firebase que ya usás para los datos (`respuestas-de-whatsapp`), y después conectar el botón "Ingresar al panel" del Asistente a esa dirección. Firebase Hosting tiene un nivel gratuito muy amplio (10 GB de almacenamiento, 360 MB/día de transferencia) que alcanza de sobra para esta app, y publicar no consume minutos de build ni nada parecido: subís los archivos ya construidos y listo.

Vas a necesitar tener instalado [Node.js](https://nodejs.org) en la computadora desde la que hagas esto (para correr `npm` y `firebase`), y acceso a la cuenta de Google/Firebase que administra el proyecto `respuestas-de-whatsapp`.

## 1. Instalar la herramienta de línea de comandos de Firebase

Abrí una terminal y corré:

```
npm install -g firebase-tools
```

Esto instala el comando `firebase`, que vas a usar para conectar y publicar.

## 2. Iniciar sesión

```
firebase login
```

Se va a abrir el navegador para que inicies sesión con la cuenta de Google que tiene acceso al proyecto `respuestas-de-whatsapp` (la misma que usa el Asistente para Firestore).

## 3. Ubicarte en la carpeta del proyecto Tarifario

Descomprimí el `tarifario-copahue-source.zip` que te pasé (si todavía no lo hiciste) y entrá a esa carpeta desde la terminal:

```
cd ruta/a/tarifario-copahue
npm install
```

(`npm install` solo hace falta la primera vez, para bajar las dependencias.)

## 4. Conectar la carpeta a Firebase Hosting

Corré:

```
firebase init hosting
```

Te va a hacer una serie de preguntas. Contestá así:

- **"Please select an option"** → elegí **"Use an existing project"**
- **Elegí el proyecto** → `respuestas-de-whatsapp`
- **"What do you want to use as your public directory?"** → escribí `dist`
- **"Configure as a single-page app (rewrite all urls to /index.html)?"** → **Yes**
- **"Set up automatic builds and deploys with GitHub?"** → **No** (no hace falta)
- **"File dist/index.html already exists. Overwrite?"** → si te pregunta esto, contestá **No** (para no pisar el build)

Esto crea dos archivos nuevos en la carpeta: `firebase.json` y `.firebaserc`. No hace falta tocarlos.

## 5. Construir la app

```
npm run build
```

Esto genera (o actualiza) la carpeta `dist/` con la versión lista para producción.

## 6. Publicar

```
firebase deploy --only hosting
```

Al terminar, la terminal te va a mostrar algo como:

```
✔  Deploy complete!

Hosting URL: https://respuestas-de-whatsapp.web.app
```

Esa es la dirección pública y definitiva del Tarifario — no depende de ninguna cuenta de Claude ni de créditos de Netlify, y cualquiera de recepción puede abrirla directamente. Es la URL que necesitás para el paso siguiente.

> Nota: si Firebase Hosting ya tenía otro sitio publicado en ese mismo proyecto (por ejemplo si `respuestas-de-whatsapp.web.app` ya está usado para otra cosa), el asistente de `firebase init hosting` te va a dejar crear un "hosting site" adicional con otro nombre — en ese caso la URL final va a ser la que te muestre el sitio que elijas o crees ahí.

## 7. Conectar el botón "Ingresar al panel" del Asistente a esa URL

Abrí el archivo `index.html` del Asistente (el que ya tenés) con cualquier editor de texto, buscá esta línea (usá Ctrl+F / Cmd+F y buscá `TARIFARIO_URL`):

```js
var TARIFARIO_URL = 'https://claude.ai/code/artifact/cef60cf8-7718-43ef-97ec-7ce739f089b2';
```

Y reemplazá la URL entre comillas por la que te dio Firebase en el paso 6, por ejemplo:

```js
var TARIFARIO_URL = 'https://respuestas-de-whatsapp.web.app';
```

Guardá el archivo. Con eso, el botón "Ingresar al panel" va a llevar directo al Tarifario real, sin pasar por Claude ni por Netlify.

## Para actualizar el Tarifario más adelante

Cada vez que quieras publicar cambios nuevos del Tarifario, desde esa misma carpeta corré de nuevo:

```
npm run build
firebase deploy --only hosting
```

La URL no cambia — siempre es la misma, solo se actualiza el contenido.

---

Si en algún momento querés que yo mismo actualice el archivo del Asistente con la URL final (en vez de editarlo vos a mano), pasámela y lo hago.
