<div align="center">

<img src="public/favicon.svg" width="92" height="92" alt="Trazo">

# Trazo

### Estudio de imagen privado y gratuito en el navegador

Comprime, convierte, redimensiona, recorta, elimina fondos, vectoriza y edita imágenes sin subirlas a un servidor.

[**Abrir Trazo**](https://silverpsychoo.github.io/Trazo/) · [**English**](README.en.md) · [**Ko-fi**](https://ko-fi.com/silverpsycho)

</div>

## ¿Qué es Trazo?

Trazo reúne diez herramientas de imagen en una aplicación web rápida, bilingüe y compatible con escritorio y móvil. Todo el procesamiento ocurre localmente en el dispositivo: el archivo original permanece intacto y cada descarga se crea como un archivo nuevo.

La aplicación analiza cada imagen al cargarla y prepara una configuración inicial adecuada. Los ajustes avanzados son opcionales y la vista previa cambia automáticamente al mover un control. Para conservar la fluidez, la edición usa una preview reducida; la descarga aplica los mismos parámetros sobre la resolución original.

## Herramientas

| Herramienta | Función |
|---|---|
| **Comprimir imagen** | Reduce el peso y muestra el ahorro estimado antes de exportar. |
| **Convertir formato** | Convierte entre JPEG, PNG, WebP y AVIF. |
| **Redimensionar** | Cambia las dimensiones con proporción bloqueable y remuestreo de calidad. |
| **Recortar** | Recorte libre o proporcional con zoom, giro, volteo y medidas exactas. |
| **Quitar fondo** | Separa automáticamente el sujeto mediante IA ejecutada en el navegador. |
| **Vectorizar** | Convierte imágenes raster en SVG a color, logo, firma, contorno o silueta. |
| **Ajustar imagen** | Controla brillo, contraste, exposición, saturación, temperatura, sombras y luces. |
| **Girar y voltear** | Corrige la orientación o crea un efecto espejo. |
| **Texto y marca de agua** | Añade, mueve, escala y gira texto con mouse o pantalla táctil. |
| **Ocultar datos** | Rasteriza bloque sólido, pixelado o desenfoque para ocultar información. |

## Privacidad

- Las imágenes no se envían a una API ni a un servidor de procesamiento.
- El archivo original nunca se modifica.
- Las exportaciones raster se recodifican sin copiar los metadatos EXIF originales.
- Las censuras se integran definitivamente en los píxeles exportados.
- Los modelos y codecs se descargan como recursos estáticos y se pueden guardar en la caché del navegador.

## Tecnología

- **ISNet General** con **U2NetP** como alternativa ligera para eliminar fondos.
- **ONNX Runtime Web**, con WebGPU cuando está disponible y WebAssembly como respaldo.
- **VTracer WASM** y **SVGO** para crear y optimizar SVG.
- **Pica** para redimensionado de alta calidad.
- **jSquash**, MozJPEG, WebP, AVIF y Oxipng para compresión y conversión.
- **Cropper.js** para recorte y **Konva** para texto y marcas de agua.
- **Web Workers**, cancelación de resultados obsoletos y caché de máscaras para mantener la interfaz fluida.

La primera compilación descarga y verifica los pesos oficiales de ISNet. Al usar Quitar fondo por primera vez, el navegador descarga aproximadamente 179 MB y puede conservarlos en caché para los siguientes usos.

## Desarrollo

Requiere Node.js 22.13 o posterior.

```bash
npm ci
npm run dev
```

Para crear el sitio estático:

```bash
npm run build
```

El resultado queda en `dist/` y funciona sin backend.

## Publicar en GitHub Pages

El repositorio incluye un workflow listo para Pages. Después de subir los archivos a la rama `main`, abre **Settings → Pages** y elige **GitHub Actions** como origen. Cada push compilará y publicará Trazo automáticamente.

Las rutas y los recursos son relativos, por lo que la aplicación funciona en una dirección como `https://usuario.github.io/repositorio/`.

## Licencia

Trazo se distribuye bajo **GNU AGPL-3.0-or-later**. Las bibliotecas, codecs, fuentes y modelos conservan sus respectivas licencias, incluidas en `public/licenses/` y resumidas en [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

## Apoya el proyecto

Si disfrutas Trazo y quieres apoyar el desarrollo de mis proyectos, puedes hacerlo en [Ko-fi](https://ko-fi.com/silverpsycho).

<div align="center">

Hecho por **SilverPsycho** · [GitHub](https://github.com/SilverPsychoo) · [Ko-fi](https://ko-fi.com/silverpsycho)

</div>
