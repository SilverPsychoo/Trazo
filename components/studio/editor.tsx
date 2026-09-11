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
                    'En vectorización y borrado de fondo, pulsa Crear vista previa. Las demás se actualizan automáticamente.',
                    'For vectorization and background removal, press Create preview. Other tools update automatically.',
                  )}
                </li>
                <li>
                  {t(
                    'Descarga cuando estés conforme. Guardarás el mismo archivo de la vista previa.',
                    'Download when you are happy. You will save the exact file shown in the preview.',
                  )}
                </li>
              </ol>
              <p className="control-note">
                {t(
                  'El resultado conserva la resolución original salvo al redimensionar o recortar. Los vectores se analizan a hasta 1800 px y conservan las medidas de salida originales.',
                  'Results keep the original resolution except when resizing or cropping. Vectors are analyzed at up to 1800 px and retain original output dimensions.',
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
            <div className="settings-title">
              <span>
                <SlidersHorizontal />
                {t('Ajustes', 'Settings')}
              </span>
              <button
                className="text-button"
                disabled={!source || loading}
                onClick={reset}
              >
                <RotateCcw />
                {t('Restablecer', 'Reset')}
              </button>
            </div>
            <div className="settings-body">
              <fieldset disabled={!source || loading}>
                <SettingsPanel
                  lang={lang}
                  toolId={toolId}
                  s={settings}
                  set={set}
                  width={source?.width || 1200}
                  height={source?.height || 1200}
                />
              </fieldset>
              {expensive ? (
                <button
                  className="primary process-button"
                  disabled={!source || busy || loading}
                  onClick={() => void generate()}
                >
                  {busy ? <LoaderCircle className="spin" /> : <Eye />}
                  {result
                    ? t('Actualizar vista previa', 'Update preview')
                    : t('Crear vista previa', 'Create preview')}
                </button>
              ) : (
                <p className="auto-preview">
                  <Eye />
                  {t('Vista previa automática', 'Automatic preview')}
                  {source && !fresh && !busy && !loading && (
                    <button
                      className="text-button"
                      onClick={() => void generate()}
                    >
                      {t('Actualizar', 'Update')}
                    </button>
                  )}
                </p>
              )}
              {notice&&<p className="export-warning" role="status">{notice}</p>}
              {error && (
                <div className="message error" role="alert">
                  <p>{error}</p>
                  {source && (
                    <button
                      className="text-button"
                      disabled={busy || loading}
                      onClick={() => void generate()}
                    >
                      {t('Reintentar', 'Try again')}
                    </button>
                  )}
                </div>
              )}
              <div className="export-panel">
                <div className="export-heading">
                  {t('Tu archivo de salida', 'Your output file')}
                </div>
                {result && (
                  <>
                    <div className={`output-stats ${!fresh ? 'muted' : ''}`}>
                      <strong>{result.extension.toUpperCase()}</strong>
                      <span>{formatBytes(result.blob.size)}</span>
                      <span>
                        {result.width} × {result.height} px
                      </span>
                    </div>
                    {result.paths !== undefined && (
                      <p className="control-note">
                        {result.paths}{' '}
                        {t('trazados vectoriales', 'vector paths')}
                      </p>
                    )}
                    {fresh && toolId === 'compress' && source && (
                      <p className="compression-saving">
                        {result.blob.size <= source.blob.size
                          ? `${((1 - result.blob.size / source.blob.size) * 100).toFixed(1)}% ${t('menos peso', 'smaller')}`
                          : t(
                              'Este resultado pesa más que el original.',
                              'This result is larger than the original.',
                            )}
                      </p>
                    )}
                    {fresh && !result.goalMet && (
                      <p className="export-warning" role="alert">
                        {t(
                          'No se alcanzó el peso máximo. Sube el límite o cambia el formato para poder descargar.',
                          'The maximum file size was not reached. Increase the limit or change the format to download.',
                        )}
                      </p>
                    )}
                    {fresh && result.note === 'already_optimized' && (
                      <p className="control-note">
                        {t(
                          'El original ya pesaba menos; lo conservamos para evitar perder calidad.',
                          'The original was already smaller; we kept it to avoid losing quality.',
                        )}
                      </p>
                    )}
                    {fresh && result.note === 'format_fallback' && (
                      <p className="export-warning">
                        {t(
                          'Tu navegador no admite ese formato. Revisa el formato real indicado arriba.',
                          'Your browser does not support that format. Check the actual output format above.',
                        )}
                      </p>
                    )}
                    {fresh &&
                      source &&
                      toolId !== 'crop' &&
                      toolId !== 'resize' &&
                      toolId !== 'rotate' &&
                      (result.width < source.width ||
                        result.height < source.height) && (
                        <p className="control-note">
                          {t(
                            'Se adaptaron las dimensiones para procesar esta imagen en tu dispositivo.',
                            'Dimensions were fitted to process this image on your device.',
                          )}
                        </p>
                      )}
                  </>
                )}
                {result&&source&&toolId==='compress'&&<p className="control-note">{t('Original','Original')}: {formatBytes(source.blob.size)}<br/>{t('Resultado','Result')}: {formatBytes(result.blob.size)}</p>}
                {canDownload&&result?.optimizedUrl&&source&&<a className="secondary-button" href={result.optimizedUrl} download={`${source.name.replace(/\.[^.]+$/, '')}-optimized.svg`}>{t('Descargar SVG optimizado','Download optimized SVG')} · {formatBytes(result.optimizedBlob!.size)}</a>}
                {canDownload && result && source ? (
                  <a
                    className="primary download-button"
                    href={result.url}
                    download={`${source.name.replace(/\.[^.]+$/, '')}-${tool.slug}.${result.extension}`}
                  >
                    <Download />
                    {t('Descargar', 'Download')}{' '}
                    {result.extension.toUpperCase()}
                  </a>
                ) : (
                  <button className="primary download-button" disabled>
                    <Download />
                    {t('Descargar', 'Download')}
                    {result && ` ${result.extension.toUpperCase()}`}
                  </button>
                )}
                <p className="export-hint">
                  {canDownload
                    ? t(
                        'Descargarás exactamente la vista previa actual.',
                        'You will download exactly the current preview.',
                      )
                    : t(
                        'Primero revisa una vista previa actualizada.',
                        'First review an up-to-date preview.',
                      )}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer lang={lang} />
    </div>
  );
}
