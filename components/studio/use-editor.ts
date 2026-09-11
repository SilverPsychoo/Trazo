'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  defaultSettings,
  processImage,
  releaseEngine,
  type Settings,
  type Output,
} from '@/lib/processing';
import { readImage, loadImage, toBlob, type SourceImage } from '@/lib/images';
import type { Progress } from '@/lib/engine/types';
import { catalog, type Locale, type ToolId } from '@/lib/catalog';
import { previewCanDownload } from '@/lib/editor-math.mjs';
type Result = Output & { url: string; optimizedUrl?: string; signature: string };
export function useEditor(lang: Locale, toolId: ToolId) {
  const [ready, setReady] = useState(false);
  const t = useCallback(
    (es: string, en: string) => (lang === 'es' ? es : en),
    [lang],
  );
  const tool = catalog.find((t) => t.id === toolId)!;
  const [source, setSource] = useState<SourceImage | null>(null),
    [settings, setSettings] = useState(defaultSettings),
    [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  const [fileError, setFileError] = useState('');
  const [progress,setProgress]=useState<Progress>({stage:'idle'});
  const [notice,setNotice]=useState('');
  const optimizedUrl=useRef<string|null>(null);
  const [view, setView] = useState('compare'),
    [zoom, setZoom] = useState(100),
    [backdrop, setBackdrop] = useState('checker');
  const input = useRef<HTMLInputElement>(null),
    demoIcon = useRef<SVGSVGElement>(null),
    controller = useRef<AbortController | null>(null),
    requestId = useRef(0),
    uploadId = useRef(0),
    sourceRef = useRef<SourceImage | null>(null),
    resultUrl = useRef<string | null>(null),
    mounted = useRef(true);
  const expensive = toolId === 'vector' || toolId === 'background';
  const signature = JSON.stringify({ toolId, settings, source: source?.url });
  const fresh = !!result && result.signature === signature;
  const canDownload = previewCanDownload(result, signature, busy, loading);
  const set = useCallback(
    (patch: Partial<Settings>) => setSettings((s) => { const next={...s,...patch};return JSON.stringify(next)===JSON.stringify(s)?s:next; }),
    [],
  );
  const initial = useCallback(
    (w: number, h: number) => ({
      ...defaultSettings(w, h),
      format: toolId === 'compress' ? 'webp' : 'png',
      text: t('Mi marca', 'My watermark'),
    }),
    [toolId, t],
  );
  useEffect(() => {
    mounted.current = true;
    setReady(true);
    return () => {
      mounted.current = false;
      controller.current?.abort();
      releaseEngine();
      if(optimizedUrl.current)URL.revokeObjectURL(optimizedUrl.current);
      requestId.current++;
      uploadId.current++;
      if (sourceRef.current) URL.revokeObjectURL(sourceRef.current.url);
      if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    };
  }, []);
  const errorText = useCallback(
    (e: unknown) => {
      const code = e instanceof Error ? e.message : String(e);
      const messages: Record<string, [string, string]> = {
        browser_unsupported: ['Actualiza tu navegador para procesar imágenes localmente. Se necesita soporte de Web Workers y OffscreenCanvas.','Update your browser to process images locally. Web Workers and OffscreenCanvas are required.'],
        model_load_failed: ['No se pudo cargar el modelo de IA. Revisa la conexión y pulsa Reintentar.','The AI model could not be loaded. Check your connection and retry.'],
        model_init_failed: ['No se pudo preparar la IA. Cierra otras pestañas y vuelve a intentarlo.','AI could not start. Close other tabs and try again.'],
        vector_load_failed: ['No se pudo cargar el vectorizador. Reintentar.','The vector engine could not load. Please retry.'],
        too_many_paths: ['Demasiadas formas. Reduce precisión o aumenta la eliminación de ruido.','Too many shapes. Lower detail or increase noise removal.'],
        unsupported_image: [
          'Elige un archivo PNG, JPG, WebP o AVIF.',
          'Choose a PNG, JPG, WebP or AVIF file.',
        ],
        too_large: [
          'La imagen debe pesar como máximo 60 MB.',
          'The image must be 60 MB or smaller.',
        ],
        too_many_pixels: [
          'Esta imagen supera los 48 megapíxeles. Usa una de menor tamaño.',
          'This image exceeds 48 megapixels. Use a smaller image.',
        ],
        invalid_image: [
          'No pudimos abrir la imagen. Prueba otro archivo.',
          'We could not open this image. Try a different file.',
        ],
        no_paths: [
          'No se encontraron formas. Cambia el umbral o prueba otra imagen.',
          'No shapes were found. Change the threshold or try another image.',
        ],
        invalid_dimensions: [
          'Revisa las medidas: de 1 a 16384 píxeles y hasta 48 megapíxeles.',
          'Check the dimensions: 1 to 16384 pixels, up to 48 megapixels.',
        ],
        invalid_target: [
          'El peso máximo debe ser de al menos 1 KB.',
          'The target must be at least 1 KB.',
        ],
        timeout: [
          'Está tardando demasiado. Prueba una imagen más pequeña o menos detalle.',
          'This is taking too long. Try a smaller image or less detail.',
        ],
      };
      return messages[code]
        ? t(...messages[code])
        : t(
            'No se pudo generar la vista previa. Prueba de nuevo; para IA revisa también tu conexión.',
            'The preview could not be generated. Please try again; for AI, also check your connection.',
          );
    },
    [t],
  );
  async function accept(file?: File) {
    if (!file) return;
    const ticket = ++uploadId.current;
    controller.current?.abort();
    requestId.current++;
    setBusy(false);
    setLoading(true);
    setError('');
    setFileError('');
    try {
      const next = await readImage(file, file.name);
      if (!mounted.current || ticket !== uploadId.current) {
        URL.revokeObjectURL(next.url);
        return;
      }
      if (sourceRef.current) URL.revokeObjectURL(sourceRef.current.url);
      sourceRef.current = next;
      setSource(next);
      setNotice(next.width*next.height>12000000?t("El archivo es grande y puede requerir bastante memoria en este dispositivo.","This large image may require significant memory on this device."):"");
      if(optimizedUrl.current)URL.revokeObjectURL(optimizedUrl.current);optimizedUrl.current=null;
      setSettings(initial(next.width, next.height));
      if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
      resultUrl.current = null;
      setResult(null);
      setZoom(100);
      setView('compare');
      setMessage('');
    } catch (e) {
      if (mounted.current && ticket === uploadId.current)
        setFileError(errorText(e));
    } finally {
      if (mounted.current && ticket === uploadId.current) setLoading(false);
      if (input.current) input.current.value = '';
    }
  }
  function clear() {
    uploadId.current++;
    requestId.current++;
    controller.current?.abort();
    if (sourceRef.current) URL.revokeObjectURL(sourceRef.current.url);
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    sourceRef.current = null;
    resultUrl.current = null;
    setSource(null);
    releaseEngine();
    if(optimizedUrl.current)URL.revokeObjectURL(optimizedUrl.current);optimizedUrl.current=null;setNotice('');
    setResult(null);
    setBusy(false);
    setLoading(false);
    setError('');
    setFileError('');
    setMessage('');
  }
  async function demo() {
    try {
      if (!demoIcon.current) return;
      const svg = demoIcon.current.cloneNode(true) as SVGSVGElement;
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('width', '480');
      svg.setAttribute('height', '480');
      svg.setAttribute('stroke', '#102b25');
      svg.setAttribute('stroke-width', '1.2');
      const url = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(svg)], {
          type: 'image/svg+xml',
        }),
      );
      try {
        const image = await loadImage(url);
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 640;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 640, 640);
        ctx.drawImage(image, 80, 80, 480, 480);
        await accept(
          new File([await toBlob(canvas)], 'trazo-ejemplo.png', {
            type: 'image/png',
          }),
        );
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      setError(errorText(e));
    }
  }
  const generate = useCallback(async () => {
    if (!source) return;
    controller.current?.abort();
    const task = new AbortController();
    controller.current = task;
    const ticket = ++requestId.current;
    setBusy(true);
    setError('');
    setMessage(t('Preparando la vista previa…', 'Preparing your preview…'));
    try {
      const output = await processImage(
        source,
        toolId,
        settings,
        task.signal,
        (p) => {
          if(task.signal.aborted||ticket!==requestId.current)return;
          setProgress(p);
          const stages:Record<string,[string,string]>={
            decoding:['Abriendo imagen…','Opening image…'],processing:['Procesando imagen…','Processing image…'],
            resizing:['Redimensionando con alta calidad…','Resizing with high quality…'],
            encoding:['Codificando el archivo…','Encoding your file…'],optimizing:['Buscando el peso solicitado…','Finding the requested size…'],
            preparing_ai:['Preparando IA. Esto solo ocurre la primera vez.','Preparing AI. This only happens the first time.'],
            model_cached:['Modelo disponible. Preparando IA…','Model cached. Preparing AI…'],loading_ai:['Preparando el motor de IA…','Preparing the AI engine…'],
            segmenting:['Separando el sujeto del fondo…','Separating the subject from the background…'],
            refining_ai:['Comprobando detalles con una segunda pasada…','Checking details with a second pass…'],
            refining_mask:['Refinando el borde…','Refining edges…'],applying_mask:['Aplicando la máscara a la imagen original…','Applying the mask to the original image…'],
            loading_vector:['Preparando el vectorizador…','Preparing the vector engine…'],tracing:['Trazando curvas y colores…','Tracing curves and colors…'],optimizing_svg:['Optimizando el SVG…','Optimizing the SVG…'],
            wasm_fallback:['Procesando con WebAssembly…','Processing with WebAssembly…'],done:['Listo','Done']
          };
          if(p.stage==='wasm_fallback')setNotice(t('WebGPU no está disponible para este procesamiento. Se utilizará WebAssembly.','WebGPU is unavailable for this operation. WebAssembly will be used.'));
          setMessage(t(...(stages[p.stage]||stages.processing)));
        },
      );
      if (
        task.signal.aborted ||
        ticket !== requestId.current ||
        !mounted.current
      )
        return;
      const url = URL.createObjectURL(output.blob);
      if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
      resultUrl.current = url;
      if(optimizedUrl.current)URL.revokeObjectURL(optimizedUrl.current);
      optimizedUrl.current=output.optimizedBlob?URL.createObjectURL(output.optimizedBlob):null;
      setResult({ ...output, url, optimizedUrl:optimizedUrl.current||undefined, signature });
      setMessage('');
    } catch (e) {
      if (
        !task.signal.aborted &&
        ticket === requestId.current &&
        mounted.current
      ) {
        setError(errorText(e));
        setMessage('');
      }
    } finally {
      if (ticket === requestId.current && mounted.current) setBusy(false);
    }
  }, [source, toolId, settings, signature, errorText, t]);
  useEffect(() => {
    controller.current?.abort();
    requestId.current++;
    setBusy(false);
    setMessage('');
    if (!source || loading || expensive) return;
    const timer = setTimeout(() => void generate(), 350);
    return () => {
      clearTimeout(timer);
      controller.current?.abort();
    };
  }, [generate, source, loading, expensive]);
  function cancel() {
    controller.current?.abort();
    requestId.current++;
    setBusy(false);
    setMessage(
      t(
        'Vista previa cancelada. Puedes volver a intentarlo.',
        'Preview cancelled. You can try again.',
      ),
    );
  }
  function reset() {
    if (source) setSettings(initial(source.width, source.height));
    setError('');
  }
  return {
    ready,
    t,
    tool,
    source,
    settings,
    result,
    busy,
    loading,
    error: fileError || error,
    message,
    progress, notice,
    view,
    setView,
    zoom,
    setZoom,
    backdrop,
    setBackdrop,
    input,
    demoIcon,
    expensive,
    fresh,
    canDownload,
    set,
    accept,
    clear,
    demo,
    generate,
    cancel,
    reset,
  };
}
