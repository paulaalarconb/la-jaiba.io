# La Jaiba · Capítulo 1: La casa de los Carrera

Juego táctil para Android (teléfonos y tablets), hecho en HTML5. La carpeta `www/` es el juego completo.

## Cómo se juega

- **Tocar el suelo:** Javiera camina hasta ahí (si está lejos, corre).
- **Tocar un objeto:** Javiera va y lo revisa.
- **Tocar a Pancho o el botón «Pista»:** el perro da una pista. Cada vez que se pide, la pista es más clara; la tercera lo lleva directo al lugar.
- **Botón «Nota»:** vuelve a mostrar el acertijo actual.
- **Botón «Diario»:** las páginas de historia que se van desbloqueando.
- El progreso se guarda solo; si se cierra el juego aparece «Continuar».

**Fácil:** los objetos brillan de vez en cuando. **Difícil:** nada brilla.

## Probarlo en un Android sin instalar nada

1. Sube la carpeta `www/` a cualquier hosting con HTTPS (GitHub Pages, Netlify, Vercel…).
2. Abre la dirección en Chrome del teléfono o tablet.
3. En el menú de Chrome elige **«Instalar app»** o **«Agregar a la pantalla principal»**. Queda como una app a pantalla completa, en horizontal, y funciona sin internet después de la primera carga.

Para probar en tu computador: `npm run servir` y abre `http://localhost:8080`.

## Generar el APK (Android Studio)

Necesitas Node.js 18+ y Android Studio instalados.

```bash
npm install
npm run android:agregar     # crea la carpeta android/ (solo la primera vez)
npm run android:copiar      # copia www/ dentro del proyecto Android
npm run android:abrir       # abre Android Studio
```

Antes de compilar, fija la orientación horizontal: en `android/app/src/main/AndroidManifest.xml`, dentro de la etiqueta `<activity ...>`, agrega:

```xml
android:screenOrientation="sensorLandscape"
```

Luego en Android Studio: **Build › Build Bundle(s) / APK(s) › Build APK(s)**. Para publicar en Google Play usa **Generate Signed Bundle**.

Cada vez que cambies algo en `www/`, repite `npm run android:copiar`.

**Tipografías:** el juego usa Pixelify Sans y Nunito desde Google Fonts. Si el primer arranque es sin internet, usa una fuente del sistema. Para el APK definitivo conviene descargar los archivos `.woff2` y ponerlos en `www/assets/`.

## Archivos

| Ruta | Qué es |
| --- | --- |
| `www/index.html`, `style.css`, `game.js` | El juego |
| `www/assets/` | Fondo de la casona, sprites y objetos |
| `www/manifest.webmanifest`, `sw.js` | Instalación como app y modo sin conexión |
| `tools/build_assets.py` | Regenera el fondo y los íconos (Python + Pillow) |
| `tools/playtest.py` | Prueba automática: juega el capítulo completo en tablet y teléfono |
