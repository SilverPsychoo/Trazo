<div align="center">

<img src="public/favicon.svg" width="92" height="92" alt="Trazo">

# Trazo

### Herramientas de imagen privadas y gratuitas, directamente en tu navegador

Comprime, convierte, redimensiona, recorta, elimina fondos, vectoriza y edita imágenes sin enviarlas a un servidor.

[**Abrir Trazo**](https://trazo-estudio-imagen.jonathanleonelmaldon.chatgpt.site/) · [Reportar un problema](../../issues) · [Proponer una mejora](../../issues)

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Apoyar%20el%20proyecto-688947?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/silverpsycho)

**Español** · [English](README.en.md)

</div>

---

## Acerca de Trazo

**Trazo** es un pequeño estudio de imagen web pensado para resolver tareas comunes sin instalar software pesado ni subir archivos a servicios externos.

El archivo original se conserva intacto, cada herramienta incluye vista previa y el procesamiento se realiza localmente en el dispositivo siempre que el navegador lo permite. La aplicación funciona en escritorio y móvil y puede publicarse como un sitio estático en GitHub Pages.

> [!NOTE]
> Trazo prioriza privacidad y procesamiento local. Las imágenes del usuario no se envían a un backend de Trazo.

---

## Herramientas

| Herramienta | Función |
|---|---|
| **Comprimir imagen** | Reduce el peso con codecs modernos y muestra el ahorro real antes de descargar. |
| **Convertir formato** | Convierte entre JPG, PNG, WebP y AVIF respetando transparencias cuando el formato lo permite. |
| **Redimensionar** | Cambia dimensiones con remuestreo de alta calidad y opción de mantener proporción. |
| **Recortar** | Recorte libre o por proporción, con zoom, giro y controles táctiles. |
| **Quitar fondo** | Segmentación local con U2NetP mediante ONNX Runtime, WebGPU cuando está disponible y WASM como respaldo. |
| **Vectorizar** | Convierte raster a SVG con VTracer WASM en modos color, póster, firma, contorno y silueta. |
| **Ajustar imagen** | Brillo, contraste, saturación, exposición, temperatura, sombras, luces y sepia. |
| **Girar y voltear** | Rotación y reflejo sin modificar el archivo original. |
| **Texto y marca de agua** | Texto interactivo que puede moverse, escalarse y rotarse con ratón o touch. |
| **Ocultar datos** | Bloque sólido, pixelado o desenfoque fuerte rasterizado en la imagen final. |

---

## Procesamiento local

Trazo separa la interfaz del motor de imagen. Las operaciones pesadas se ejecutan en **Web Workers** para mantener la aplicación fluida.

```text
Interfaz
   │
   └── Web Worker
         ├── ONNX Runtime Web ── U2NetP
         ├── WebAssembly ─────── VTracer / codecs
         ├── Pica ────────────── remuestreo
         └── Canvas / OffscreenCanvas
```

El motor utiliza **WebGPU** para la eliminación de fondo cuando el navegador y el dispositivo lo soportan; si no, cambia automáticamente a **WebAssembly**.

Los modelos, motores WASM y fuentes forman parte del propio sitio. El modelo de IA puede quedar almacenado en la caché del navegador para evitar descargarlo en cada uso.

---

## Privacidad

- Las imágenes se procesan en el dispositivo.
- No se requiere cuenta dentro de Trazo.
- El archivo original no se sobrescribe.
- Las exportaciones se generan como archivos nuevos.
- La herramienta **Ocultar datos** rasteriza el resultado; el bloque, pixelado o blur no queda como una capa removible.
- Las imágenes exportadas se vuelven a codificar, por lo que no se conserva el EXIF del archivo original.

Trazo no promete anonimización forense de una imagen ni eliminación perfecta de fondos en todos los casos. La calidad depende del contenido, el navegador y los recursos del dispositivo.

---

## Tecnología

Trazo combina herramientas maduras en lugar de depender de filtros caseros para las operaciones complejas:

- **React + Vite** — interfaz y build estático.
- **ONNX Runtime Web + U2NetP** — segmentación para quitar fondos.
- **VTracer WASM** — vectorización raster → SVG.
- **Pica** — redimensionado de alta calidad.
- **jSquash / MozJPEG / WebP / AVIF / Oxipng** — compresión y conversión.
- **Cropper.js** — recorte interactivo.
- **Konva** — manipulación de texto y marcas de agua.
- **SVGO** — optimización de SVG.

El inventario de dependencias, modelos y licencias está documentado en [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

---

## Compatibilidad

Trazo está orientado a navegadores modernos con soporte para Web Workers, WebAssembly y OffscreenCanvas. WebGPU es opcional.

Formatos de entrada principales:

```text
PNG · JPG/JPEG · WebP · AVIF
```

El procesamiento está limitado para evitar bloquear dispositivos con imágenes extremadamente grandes. Algunos móviles con poca memoria pueden necesitar trabajar con imágenes más pequeñas incluso dentro de los límites admitidos.

---

## Estructura del repositorio

```text
Trazo/
├── .github/              Configuración del repositorio y Ko-fi
├── app/                  Páginas, estilos y metadatos
├── components/           Interfaz y editores
├── lib/engine/           Motor de imagen y Web Worker
├── public/               Modelos, WASM, iconos y licencias
├── scripts/              Build, empaquetado y rutas estáticas
├── tests/                Pruebas y fixtures
├── docs/                 Sitio compilado para GitHub Pages
├── README.md
└── README.en.md
```

La carpeta `docs/` contiene la versión estática lista para GitHub Pages; el código fuente permanece en la raíz del repositorio.

Para desarrollar, compilar o ejecutar las pruebas consulta [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Validación

El proyecto incluye pruebas para los diez módulos, formatos con transparencia, imágenes grandes, modos de privacidad, vectorización y casos de eliminación de fondo con personas, objetos y pelo/pelaje.

Los resultados y límites conocidos están documentados en [VALIDATION.md](VALIDATION.md).

---

## ☕ Apoya el proyecto

Trazo es gratuito y de código abierto.

Si la herramienta te resulta útil o simplemente te gusta lo que estoy construyendo, puedes apoyar el desarrollo en Ko-fi. El apoyo ayuda a seguir mejorando los motores de procesamiento, compatibilidad y nuevas herramientas.

**[☕ Apoyar Trazo en Ko-fi](https://ko-fi.com/silverpsycho)**

Usar Trazo, compartirlo y reportar problemas también ayuda muchísimo al proyecto. 💚

---

## Licencia

Trazo se distribuye bajo **GNU AGPL-3.0-or-later**. Consulta [LICENSE.md](LICENSE.md).

Las bibliotecas, codecs, modelos y fuentes de terceros conservan sus propias licencias y avisos, incluidos en `public/licenses/` y documentados en [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

---

## Autor

Desarrollado por **SilverPsycho**

GitHub: [@SilverPsychoo](https://github.com/SilverPsychoo)  
Ko-fi: [ko-fi.com/silverpsycho](https://ko-fi.com/silverpsycho)
