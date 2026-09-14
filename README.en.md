<div align="center">

<img src="public/favicon.svg" width="92" height="92" alt="Trazo">

# Trazo

### A private, free image studio that runs in your browser

Compress, convert, resize, crop, remove backgrounds, vectorize, and edit images without uploading them to a server.

[**Open Trazo**](https://silverpsychoo.github.io/Trazo/) · [**Español**](README.md) · [**Ko-fi**](https://ko-fi.com/silverpsycho)

</div>

## What is Trazo?

Trazo brings ten image tools together in a fast, bilingual web app for desktop and mobile. Processing happens locally on the device: the original file stays untouched and every download is created as a new file.

The app analyzes each image when it is loaded and prepares suitable initial settings. Advanced controls are optional, and the preview updates automatically whenever a setting changes. Editing uses a smaller preview for responsiveness, while downloads apply the same settings to the original resolution.

## Tools

| Tool | Function |
|---|---|
| **Compress image** | Reduces file size and displays the estimated savings before export. |
| **Convert format** | Converts between JPEG, PNG, WebP, and AVIF. |
| **Resize** | Changes dimensions with optional aspect locking and quality resampling. |
| **Crop** | Free or fixed-ratio cropping with zoom, rotation, flipping, and exact dimensions. |
| **Remove background** | Automatically separates the subject with AI running in the browser. |
| **Vectorize** | Converts raster images into color, logo, signature, outline, or silhouette SVG. |
| **Adjust image** | Controls brightness, contrast, exposure, saturation, temperature, shadows, and highlights. |
| **Rotate and flip** | Fixes orientation or creates a mirrored image. |
| **Text and watermark** | Adds, moves, scales, and rotates text with mouse or touch input. |
| **Hide data** | Rasterizes a solid block, pixelation, or blur over sensitive information. |

## Privacy

- Images are never sent to a processing API or server.
- The original file is never modified.
- Raster exports are re-encoded without copying the original EXIF metadata.
- Redactions are permanently baked into the exported pixels.
- Models and codecs are static app resources that the browser can cache locally.

## Technology

- **ISNet General**, with **U2NetP** as a lightweight alternative, for background removal.
- **ONNX Runtime Web**, using WebGPU when available and WebAssembly as a fallback.
- **VTracer WASM** and **SVGO** for SVG creation and optimization.
- **Pica** for high-quality resizing.
- **jSquash**, MozJPEG, WebP, AVIF, and Oxipng for compression and conversion.
- **Cropper.js** for cropping and **Konva** for text and watermarks.
- **Web Workers**, stale-result cancellation, and mask caching to keep the interface responsive.

The first build downloads and verifies the official ISNet weights. The first use of Remove background downloads approximately 179 MB, which the browser may cache for later sessions.

## Development

Node.js 22.13 or newer is required.

```bash
npm ci
npm run dev
```

Create the static site with:

```bash
npm run build
```

The result is written to `dist/` and requires no backend.

## GitHub Pages

The repository includes a ready-to-use Pages workflow. After pushing the files to the `main` branch, open **Settings → Pages** and select **GitHub Actions** as the source. Every push will build and publish Trazo automatically.

Routes and assets use relative paths, so the app works at an address such as `https://username.github.io/repository/`.

## License

Trazo is released under **GNU AGPL-3.0-or-later**. Libraries, codecs, fonts, and models retain their respective licenses, included in `public/licenses/` and summarized in [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

## Support the project

If you enjoy Trazo and want to support the development of my projects, you can do so on [Ko-fi](https://ko-fi.com/silverpsycho).

<div align="center">

Made by **SilverPsycho** · [GitHub](https://github.com/SilverPsychoo) · [Ko-fi](https://ko-fi.com/silverpsycho)

</div>
