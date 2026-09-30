import { publicPath } from './paths';
export type Locale = 'es' | 'en';
export const SITE_URL =
  'https://trazo-estudio-imagen.jonathanleonelmaldon.chatgpt.site';
export const categories = {
  all: ['Todas', 'All tools'],
  optimize: ['Peso y formato', 'Size & format'],
  edit: ['Editar imagen', 'Edit images'],
  design: ['Diseño', 'Design'],
  privacy: ['Privacidad', 'Privacy'],
} as const;
export const catalog = [
  {
    id: 'compress',
    slug: 'compress-image',
    category: 'optimize',
    name: ['Comprimir imagen', 'Compress image'],
    description: [
      'Reduce el peso de la imagen manteniendo la calidad.',
      'Reduce image size while preserving quality.',
    ],
    keywords:
      'comprimir reducir peso tamaño kb mb optimizar compress reduce file size jpg jpeg png webp',
    color: 'green',
  },
  {
    id: 'convert',
    slug: 'convert-image',
    category: 'optimize',
    name: ['Convertir formato', 'Convert format'],
    description: [
      'Cambia entre JPG, PNG, WebP y AVIF.',
      'Convert between JPG, PNG, WebP and AVIF.',
    ],
    keywords: 'convertir png jpg jpeg webp formato convertir convert format',
    color: 'blue',
  },
  {
    id: 'resize',
    slug: 'resize-image',
    category: 'edit',
    name: ['Redimensionar imagen', 'Resize image'],
    description: [
      'Elige las medidas exactas y conserva la proporción.',
      'Set exact dimensions and keep the original proportions.',
    ],
    keywords:
      'redimensionar cambiar tamaño dimensiones pixeles resize dimensions pixels image resizer',
    color: 'blue',
  },
  {
    id: 'crop',
    slug: 'crop-image',
    category: 'edit',
    name: ['Recortar imagen', 'Crop image'],
    description: [
      'Recorta con medidas o proporciones exactas.',
      'Crop with exact dimensions or aspect ratios.',
    ],
    keywords: 'recortar encuadrar cuadrado crop trim square aspect ratio',
    color: 'orange',
  },
  {
    id: 'background',
    slug: 'remove-background',
    category: 'design',
    name: ['Quitar fondo', 'Remove background'],
    description: [
      'Separa el sujeto y exporta un fondo transparente.',
      'Isolate the subject and export a transparent background.',
    ],
    keywords:
      'quitar eliminar borrar cambiar fondo blanco transparente remove bg background transparent white',
    color: 'purple',
  },
  {
    id: 'vector',
    slug: 'vectorize-image',
    category: 'design',
    name: ['Vectorizar imagen', 'Vectorize image'],
    description: [
      'Crea un SVG a color, en contorno o en silueta negra.',
      'Create an SVG in color, outline or black silhouette.',
    ],
    keywords:
      'vectorizar vector svg contorno silueta negro vectorize outline silhouette tracing logo',
    color: 'green',
  },
  {
    id: 'adjust',
    slug: 'adjust-image',
    category: 'edit',
    name: ['Ajustar imagen', 'Adjust image'],
    description: [
      'Corrige brillo, contraste, color y exposición.',
      'Correct brightness, contrast, color and exposure.',
    ],
    keywords:
      'ajustar brillo contraste saturacion color blanco negro editar adjust brightness contrast saturation grayscale edit',
    color: 'purple',
  },
  {
    id: 'rotate',
    slug: 'rotate-image',
    category: 'edit',
    name: ['Girar y voltear', 'Rotate & flip'],
    description: [
      'Corrige la orientación o crea un efecto espejo.',
      'Fix the orientation or mirror your image.',
    ],
    keywords:
      'girar rotar voltear reflejar espejo orientacion rotate flip mirror orientation',
    color: 'orange',
  },
  {
    id: 'watermark',
    slug: 'add-watermark',
    category: 'design',
    name: ['Texto y marca de agua', 'Text & watermark'],
    description: [
      'Añade y coloca texto sobre la imagen.',
      'Add and position text over the image.',
    ],
    keywords:
      'texto escribir marca agua firma proteger text watermark caption label signature',
    color: 'blue',
  },
  {
    id: 'redact',
    slug: 'redact-image',
    category: 'privacy',
    name: ['Ocultar datos', 'Hide private details'],
    description: [
      'Oculta datos con bloque, desenfoque o pixelado.',
      'Hide details with a block, blur or pixelation.',
    ],
    keywords:
      'ocultar censurar tapar datos privacidad caras matricula redact privacy hide cover censor',
    color: 'purple',
  },
] as const;
export type ToolId = (typeof catalog)[number]['id'];
export type ToolInfo = (typeof catalog)[number];
export function phrase(value: readonly [string, string], lang: Locale) {
  return value[lang === 'es' ? 0 : 1];
}
export function toolPath(lang: Locale, slug: string) {
  return publicPath(`${lang}/${slug}/`);
}
export function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
export function matchesTool(tool: ToolInfo, query: string) {
  const haystack = normalize(
    `${tool.name.join(' ')} ${tool.description.join(' ')} ${tool.keywords}`,
  );
  return normalize(query)
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}
