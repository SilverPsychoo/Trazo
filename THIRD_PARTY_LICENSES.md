# Third-party components

Trazo is licensed under AGPL-3.0-or-later. The following components retain their own licenses. Full notices are included in `public/licenses/`; exact package versions are locked in `package-lock.json`.

| Component | License | Use |
|---|---|---|
| ONNX Runtime Web | MIT | Local WebGPU/WebAssembly inference |
| ISNet General / DIS | Apache-2.0 | Primary background-removal model |
| U²-Net / U2NetP | Apache-2.0 | Lightweight background-removal model |
| VTracer | MIT or Apache-2.0 | WebAssembly vectorization |
| Pica | MIT | High-quality resizing |
| jSquash packages | Apache-2.0 | JPEG, PNG, WebP, and AVIF codecs |
| MozJPEG | BSD/IJG/zlib notices | JPEG codec |
| libwebp | BSD-3-Clause | WebP codec |
| libavif | BSD-2-Clause | AVIF codec |
| libaom | BSD-2-Clause and AOM patent license | AV1 codec used by AVIF |
| Oxipng | MIT | PNG optimization |
| Cropper.js | MIT | Interactive cropping |
| Konva | MIT | Text and watermark editing |
| SVGO | MIT | SVG optimization |
| React / React DOM | MIT | User interface |
| Base UI | MIT | Accessible controls |
| Lucide | ISC | Interface icons |
| Geist / Geist Mono | SIL OFL-1.1 | Locally served fonts |

## Model provenance

**ISNet General** comes from the [DIS project](https://github.com/xuebinqin/DIS). The ONNX file is distributed by [rembg](https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx). The build verifies the original SHA-256 `60920e99c45464f2ba57bee2ad08c919a52bbf852739e96947fbb4358c0d964a`, removes auxiliary graph outputs while retaining the original weights and primary output, and splits the result into static parts suitable for GitHub Pages.

**U2NetP** comes from the [U²-Net project](https://github.com/xuebinqin/U-2-Net). The build downloads its [ONNX weights](https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx) and verifies SHA-256 `309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8`.

Neither model is limited to research or non-commercial use.
