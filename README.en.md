<div align="center">

<img src="public/favicon.svg" width="92" height="92" alt="Trazo">

# Trazo

### Free, private image tools that run directly in your browser

Compress, convert, resize, crop, remove backgrounds, vectorize and edit images without uploading them to a Trazo server.

[**Open Trazo**](https://trazo-estudio-imagen.jonathanleonelmaldon.chatgpt.site/) · [Report an issue](../../issues) · [Suggest an improvement](../../issues)

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20the%20project-688947?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/silverpsycho)

[Español](README.md) · **English**

</div>

---

## About Trazo

**Trazo** is a small browser-based image studio for everyday tasks without installing heavy desktop software or uploading files to external processing services.

The original file stays untouched, every tool includes a preview, and processing happens locally whenever the browser supports it. Trazo works on desktop and mobile and can be deployed as a static GitHub Pages site.

> [!NOTE]
> Trazo prioritizes privacy and local processing. User images are not sent to a Trazo backend.

---

## Tools

| Tool | What it does |
|---|---|
| **Compress image** | Reduces file size with modern codecs and shows the real savings before download. |
| **Convert format** | Converts between JPG, PNG, WebP and AVIF while preserving transparency when supported. |
| **Resize image** | Changes dimensions using high-quality resampling with optional aspect-ratio locking. |
| **Crop image** | Free or fixed-ratio crop with zoom, rotation and touch controls. |
| **Remove background** | Local U2NetP segmentation through ONNX Runtime, using WebGPU when available and WASM as fallback. |
| **Vectorize image** | Converts raster images to SVG using VTracer WASM with color, poster, line-art, outline and silhouette modes. |
| **Adjust image** | Brightness, contrast, saturation, exposure, temperature, shadows, highlights and sepia. |
| **Rotate & flip** | Rotates and mirrors images without changing the original file. |
| **Text & watermark** | Interactive text that can be moved, scaled and rotated with mouse or touch. |
| **Redact image** | Solid block, pixelation or strong blur baked into the final raster image. |

---

## Local processing

Heavy processing runs in a **Web Worker** so the interface remains responsive.

```text
Interface
   │
   └── Web Worker
         ├── ONNX Runtime Web ── U2NetP
         ├── WebAssembly ─────── VTracer / codecs
         ├── Pica ────────────── resampling
         └── Canvas / OffscreenCanvas
```

Background removal uses **WebGPU** when supported by the browser and device, and automatically falls back to **WebAssembly** otherwise.

Models, WASM engines and fonts are served with the application. The AI model can be cached by the browser to avoid downloading it on every use.

---

## Privacy

- Images are processed on the device.
- No Trazo account is required.
- The original file is never overwritten.
- Exports are generated as new files.
- The **Redact** tool bakes solid blocks, pixelation and blur into the output instead of leaving removable layers.
- Exports are re-encoded, so original EXIF metadata is not preserved.

Trazo does not claim forensic anonymization or perfect background extraction for every image. Quality depends on image content, browser capabilities and available device memory.

---

## Technology

- **React + Vite** — interface and static build.
- **ONNX Runtime Web + U2NetP** — background segmentation.
- **VTracer WASM** — raster-to-SVG vectorization.
- **Pica** — high-quality resizing.
- **jSquash / MozJPEG / WebP / AVIF / Oxipng** — compression and conversion.
- **Cropper.js** — interactive crop controls.
- **Konva** — text and watermark manipulation.
- **SVGO** — SVG optimization.

See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) for the dependency, model and license inventory.

---

## Compatibility

Trazo targets modern browsers with Web Workers, WebAssembly and OffscreenCanvas. WebGPU is optional.

Main input formats:

```text
PNG · JPG/JPEG · WebP · AVIF
```

Processing limits are enforced to avoid locking up devices with extremely large files. Low-memory phones may need smaller images even when a file is technically within the accepted limits.

---

## Repository structure

```text
Trazo/
├── .github/              Repository metadata and Ko-fi funding
├── app/                  Pages, styles and metadata
├── components/           Interface and editors
├── lib/engine/           Image engine and Web Worker
├── public/               Models, WASM, icons and licenses
├── scripts/              Build, packaging and static routes
├── tests/                Tests and fixtures
├── docs/                 Compiled GitHub Pages site
├── README.md
└── README.en.md
```

`docs/` contains the static site ready for GitHub Pages while the source stays at the repository root.

For development, builds and tests, see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Validation

The project includes tests for all ten modules, transparency, large images, privacy modes, vectorization and background-removal cases with people, objects and fur/hair.

Known limits and validation notes are documented in [VALIDATION.md](VALIDATION.md).

---

## ☕ Support the project

Trazo is free and open source.

If Trazo is useful to you, or you simply like what I am building, you can support its development on Ko-fi. Support helps improve the processing engines, compatibility and future tools.

**[☕ Support Trazo on Ko-fi](https://ko-fi.com/silverpsycho)**

Using Trazo, sharing it and reporting issues are also great ways to help the project. 💚

---

## License

Trazo is distributed under **GNU AGPL-3.0-or-later**. See [LICENSE.md](LICENSE.md).

Third-party libraries, codecs, models and fonts retain their own licenses and notices. They are included under `public/licenses/` and documented in [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

---

## Author

Developed by **SilverPsycho**

GitHub: [@SilverPsychoo](https://github.com/SilverPsychoo)  
Ko-fi: [ko-fi.com/silverpsycho](https://ko-fi.com/silverpsycho)
