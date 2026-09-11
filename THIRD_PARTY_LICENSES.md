# Trazo — dependencias y modelos

La licencia existente de Trazo se conserva: **AGPL-3.0-or-later**, en `LICENSE.md`. Las nuevas bibliotecas y el modelo no incluyen una restricción exclusivamente no comercial. Sus avisos se conservan en `public/licenses/`. Las versiones transitivas exactas están fijadas en `package-lock.json`.

| Componente | Versión | Licencia | Uso |
|---|---|---|---|
| [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) | 1.21.0 | MIT | Inferencia local: WebGPU si funciona, WASM SIMD como fallback |
| [U²-Net / U2NetP](https://github.com/xuebinqin/U-2-Net) | pesos U2NetP, conversión ONNX | Apache-2.0 | Segmentación de objetos salientes y personas |
| [VTracer oficial](https://github.com/visioncortex/vtracer) | @visioncortex/vtracer 1.0.0-alpha.4 | MIT OR Apache-2.0 según paquete; aviso upstream MIT incluido | Color, paleta reducida, firmas, contorno y silueta; WASM |
| [Pica](https://github.com/nodeca/pica) | 9.0.1 | MIT | Remuestreo mks2013 y filtro rápido; WASM/JS |
| [jSquash JPEG](https://github.com/jamsinclair/jSquash) | 1.6.0 | Apache-2.0; MozJPEG BSD/IJG/zlib y avisos incluidos | JPEG WASM |
| jSquash WebP | 1.5.0 | Apache-2.0; libwebp BSD-3-Clause | WebP WASM / SIMD |
| jSquash AVIF | 2.1.1 | Apache-2.0; libavif BSD-2-Clause; libaom BSD-2-Clause y licencia de patentes AOM | AVIF WASM |
| jSquash Oxipng | 2.3.0 | Apache-2.0; Oxipng MIT | PNG sin pérdida, WASM de un hilo |
| [Cropper.js](https://github.com/fengyuanchen/cropperjs) | 1.6.2 | MIT | Recorte, zoom, giro y gestos táctiles |
| [Konva](https://github.com/konvajs/konva) | 9.3.22 | MIT | Texto manipulable con ratón/touch |
| [SVGO](https://github.com/svg/svgo) | 4.0.0 | MIT | Exportación SVG optimizada |
| Geist / Geist Mono, Fontsource | 5.2.8 | SIL OFL-1.1 | Fuentes servidas desde el propio sitio |
| React / React DOM | 19.2.6 | MIT | Interfaz existente |
| Lucide | 1.31.0 | ISC | Iconos; aviso en `public/licenses/lucide-LICENSE` |

## Modelo incluido y procedencia

- Arquitectura y pesos originales: https://github.com/xuebinqin/U-2-Net (Xuebin Qin y colaboradores).
- ONNX distribuido por rembg: https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx
- Archivo local: `public/models/u2netp.onnx`, **4 574 861 bytes**.
- SHA-256: `309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8`.
- Entrada: RGB NCHW 1×3×320×320, normalización ImageNet. Primera salida de saliencia normalizada a alfa.
- No se usa un modelo restringido a investigación o uso no comercial.

El código WASM de VTracer es el distribuido por el paquete oficial, sin modificar. `scripts/prepare-engines.mjs` adapta únicamente su cargador Node a un módulo ESM para navegador, con `fetch` y `WebAssembly.instantiate`.

## Sustituciones

Se retiraron IMG.LY Background Removal, ImageTracer.js y los trazadores caseros. No se añadió Potrace: los wrappers evaluados, entre ellos [esm-potrace-wasm](https://github.com/tomayac/esm-potrace-wasm), declaran GPL-2.0; se eligió el modo binario de VTracer para evitar introducir otra obligación copyleft y su revisión de compatibilidad. Firma/Line art produce curvas vectoriales reales, pero no es Potrace ni un trazado de línea central.

Los assets y avisos de terceros utilizados por el pipeline se conservan en `public/licenses`.
