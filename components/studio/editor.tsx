'use client';
import { publicPath } from '@/lib/paths';
import { useState } from 'react';

import {
  ArrowLeft,
  Upload,
  Leaf,
  X,
  Download,
  Eye,
  HelpCircle,
  RotateCcw,
  SlidersHorizontal,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react';
import { Empty } from '@/components/ui/empty';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { phrase, type Locale, type ToolId } from '@/lib/catalog';
import { formatBytes } from '@/lib/editor-math.mjs';
import { Header, Footer } from './chrome';
import { SettingsPanel } from './settings-panel';
import { Preview } from './preview';
import { useEditor } from './use-editor';
export default function Editor({
  lang,
  toolId,
}: {
  lang: Locale;
  toolId: ToolId;
}) {
  const {
    ready,
    t,
    tool,
    source,
    settings,
    result,
    busy,
    loading,
    error,
    message,
    progress,notice,
    view,
    setView,
    zoom,
    setZoom,
    backdrop,
    setBackdrop,
    input,
    demoIcon,
    analysis, sample, live, exporting, exportFile, exact, downloadUrl, optimizedUrl,
    fresh,
    canDownload,
    set,
    accept,
    clear,
    demo,
    cancel,
    reset,
  } = useEditor(lang, toolId);
  const [dragging, setDragging] = useState(false);
  return (
    <div className="studio" lang={lang}>
      <Header lang={lang} slug={tool.slug} />
      <main className="editor-main">
        <a className="back-link" href={publicPath(`${lang}/`)}>
          <ArrowLeft />
          {t('Todas las herramientas', 'All tools')}
        </a>
        <div className="page-heading">
          <div>
            <h1>{phrase(tool.name, lang)}</h1>
            <p>{phrase(tool.description, lang)}</p>
          </div>
          <Dialog>
            <DialogTrigger className="help-trigger">
              <HelpCircle />
              {t('Cómo usar', 'How to use')}
            </DialogTrigger>
            <DialogContent className="help-dialog" showCloseButton={false}>
              <DialogTitle>
                {t('Revisa antes de descargar', 'Check before downloading')}
              </DialogTitle>
              <DialogDescription>
                {t(
                  'El original se conserva intacto. Puedes cambiar los ajustes tantas veces como quieras.',
                  'Your original stays unchanged. You can change the settings as many times as you like.',
                )}
              </DialogDescription>
              <ol className="guide-copy">
                <li>
                  {t(
                    'Elige una imagen PNG, JPG, WebP o AVIF de hasta 60 MB y 48 megapíxeles.',
                    'Choose a PNG, JPG, WebP or AVIF up to 60 MB and 48 megapixels.',
                  )}
                </li>
                <li>
                  {t(
                    'Ajusta el resultado y compáralo con el original. Usa el zoom para revisar los detalles.',
                    'Adjust the result and compare it with the original. Zoom in to check details.',
                  )}
                </li>
                <li>
                  {t(
                    'Trazo analiza tu imagen y prepara el resultado automáticamente. Los ajustes avanzados son opcionales.',
                    'Trazo analyzes your image and prepares the result automatically. Advanced settings are optional.',
                  )}
                </li>
                <li>
                  {t(
                    'Descarga cuando estés conforme. Se aplican tus ajustes a la resolución original.',
                    'Download when you are happy. Your settings are applied at original resolution.',
                  )}
                </li>
              </ol>
              <p className="control-note">
                {t(
                  'La preview es ligera para editar con fluidez. La descarga usa el original completo, salvo las medidas que elijas al redimensionar o recortar.',
                  'The lightweight preview keeps editing responsive. Download uses the full original, except dimensions you choose when resizing or cropping.',
                )}
              </p>
              <DialogClose className="primary">
                {t('Entendido', 'Got it')}
              </DialogClose>
            </DialogContent>
          </Dialog>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          hidden
          onChange={(e) => void accept(e.target.files?.[0])}
        />
        <div className="editor-workspace">
          <section
            className={`editor-canvas ${dragging ? 'dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node))
                setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void accept(e.dataTransfer.files[0]);
            }}
          >
            <div className="canvas-toolbar">
              <span>{source?.name || t('Tu imagen', 'Your image')}</span>
              {source && (
                <div className="toolbar-actions">
                  <button
                    className="text-button"
                    disabled={!ready || loading}
                    onClick={() => input.current?.click()}
                  >
                    {t('Cambiar imagen', 'Change image')}
                  </button>
                  <button
                    className="icon-button"
                    onClick={clear}
                    aria-label={t('Quitar imagen', 'Remove image')}
                  >
                    <X />
                  </button>
                </div>
              )}
            </div>
            {!source ? (
              <Empty className="drop-zone">
                <div className="upload-icon">
                  <Upload />
                </div>
                <h2>
                  {loading
                    ? t('Abriendo imagen…', 'Opening image…')
                    : t('Arrastra tu imagen aquí', 'Drop your image here')}
                </h2>
                <p>
                  {t(
                    'PNG, JPG, WebP o AVIF · Hasta 60 MB',
                    'PNG, JPG, WebP or AVIF · Up to 60 MB',
                  )}
                </p>
                <button
                  className="primary"
                  disabled={!ready || loading}
                  onClick={() => input.current?.click()}
                >
                  <Upload />
                  {t('Elegir imagen', 'Choose image')}
                </button>
                <button
                  className="text-button demo-button"
                  disabled={!ready || loading}
                  onClick={() => void demo()}
                >
                  <Leaf ref={demoIcon} />
                  {t('Probar con un ejemplo', 'Try an example')}
                </button>
                <span className="privacy-caption">
                  <ShieldCheck />
                  {t(
                    'Tu imagen se procesa en tu dispositivo',
                    'Your image is processed on your device',
                  )}
                </span>
              </Empty>
            ) : (
              <Preview
                lang={lang}
                sample={sample} live={live}
                progress={progress}
                settings={settings}
                setSettings={set}
                toolId={toolId}
                source={source}
                resultUrl={result?.url}
                fresh={fresh}
                busy={busy || loading}
                message={
                  loading ? t('Abriendo imagen…', 'Opening image…') : message
                }
                view={view}
                setView={setView}
                zoom={zoom}
                setZoom={setZoom}
                backdrop={backdrop}
                setBackdrop={setBackdrop}
                rect={settings.rect}
                setRect={(rect) => set({ rect })}
                cancel={loading ? clear : cancel}
              />
            )}
            <div className="canvas-footer">
              {source ? (
                <span>
                  {source.width} × {source.height} px <i>·</i>{' '}
                  {formatBytes(source.blob.size)}
                </span>
              ) : (
                <span>
                  {t(
                    'Sin registro en la app. Sin marcas de agua añadidas.',
                    'No app registration. No added watermarks.',
                  )}
                </span>
              )}
              <span>
                {t(
                  'El original siempre se conserva',
                  'Your original is always preserved',
                )}
              </span>
            </div>
          </section>
          <aside className="settings editor-settings">
            <div className="settings-title"><span><SlidersHorizontal/>{t('Tu resultado','Your result')}</span><button className="text-button" disabled={!source||loading} onClick={()=>void reset()} title={t('Volver a analizar esta imagen','Analyze this image again')}><RotateCcw/>✨ Auto</button></div>
            <div className="settings-body">
              {notice&&<p className="export-warning" role="status">{notice}</p>}
              {error&&<div className="message error" role="alert"><p>{error}</p>{source&&<button className="text-button" disabled={loading} onClick={()=>void reset()}>{t('Reintentar con Auto','Try Auto again')}</button>}</div>}
              <div className="export-panel auto-export">
                <div className="export-heading">{t('Tu archivo de salida','Your output file')}</div>
                {source&&toolId==='resize'&&<p className="control-note">{t('Original','Original')}: {source.width} × {source.height} px · {analysis?.orientation==='portrait'?t('Vertical','Portrait'):analysis?.orientation==='landscape'?t('Horizontal','Landscape'):t('Cuadrada','Square')}</p>}
                {result&&<>
                  <div className="output-stats"><strong>{result.extension.toUpperCase()}</strong><span>{exact?formatBytes(result.blob.size):result.estimatedBytes?`≈ ${formatBytes(result.estimatedBytes)}`:''}</span><span>{result.width} × {result.height} px</span></div>
                  {toolId==='compress'&&source&&<>
                    <p className="control-note">{t('Original','Original')}: {formatBytes(source.blob.size)}<br/>{exact?t('Optimizada','Optimized'):t('Optimizada · estimación','Optimized · estimate')}: {exact?formatBytes(result.blob.size):`≈ ${formatBytes(result.estimatedBytes||result.blob.size)}`}</p>
                    <p className="compression-saving">{!exact?'≈ ':''}{((1-(exact?result.blob.size:result.estimatedBytes||result.blob.size)/source.blob.size)*100).toFixed(1)}% {t('reducción','reduction')}</p>
                  </>}
                  {result.paths!==undefined&&<p className="control-note">{result.paths} {t('trazados en preview','paths in preview')}</p>}
                </>}
                {downloadUrl&&canDownload?<a className="primary download-button" href={downloadUrl} download={`${source?.name.replace(/\.[^.]+$/, '')}-${tool.slug}.${result?.extension}`}><Download/>{t('Descargar','Download')} {result?.extension.toUpperCase()}</a>:<button className="primary download-button" disabled={!canDownload} onClick={()=>void exportFile()}>{exporting?<LoaderCircle className="spin"/>:<Download/>}{exporting?t('Exportando…','Exporting…'):t('Descargar','Download')}{result&&!exporting?` ${result.extension.toUpperCase()}`:''}</button>}
                {toolId==='vector'&&result&&(optimizedUrl&&canDownload?<a className="secondary-button" href={optimizedUrl} download={`${source?.name.replace(/\.[^.]+$/, '')}-optimized.svg`}>{t('Descargar SVG optimizado','Download optimized SVG')}</a>:<button className="secondary-button" disabled={!canDownload} onClick={()=>void exportFile(true)}>{t('Descargar SVG optimizado','Download optimized SVG')}</button>)}
                <p className="export-hint">{source?t('Preview ligera · Descarga a resolución completa.','Lightweight preview · Full resolution download.'):t('Elige una imagen. Trazo prepara el resultado.','Choose an image. Trazo prepares the result.')}</p>
              </div>
              <details className="advanced-settings">
                <summary>{t('Ajustes avanzados','Advanced settings')}</summary>
                <p className="auto-preview"><Eye/>{t('Los cambios se muestran automáticamente','Changes preview automatically')}</p>
                <fieldset disabled={!source||loading}><SettingsPanel lang={lang} toolId={toolId} s={settings} set={set} width={source?.width||1200} height={source?.height||1200} hasAlpha={analysis?.hasAlpha??false}/></fieldset>
              </details>
            </div>
          </aside>
        </div>
      </main>
      <Footer lang={lang} />
    </div>
  );
}
