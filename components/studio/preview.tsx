'use client';
import { useState } from 'react';
import { CropEditor } from './crop-editor';
import { TextEditor } from './text-editor';
import type { Settings } from '@/lib/processing';
import type { Progress } from '@/lib/engine/types';
import { Eye, Minus, Plus, Check, LoaderCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Empty } from '@/components/ui/empty';
import { RegionEditor } from './region-editor';
import type { SourceImage } from '@/lib/images';
import type { Rect } from '@/lib/processing';
import type { Locale, ToolId } from '@/lib/catalog';
export function Preview({
  lang,
  toolId,
  source,
  resultUrl,
  fresh,
  busy,
  message,
  view,
  setView,
  zoom,
  setZoom,
  backdrop,
  setBackdrop,
  rect,
  setRect,
  cancel, progress, settings, setSettings,
}: {
  lang: Locale;
  toolId: ToolId;
  source: SourceImage;
  resultUrl?: string;
  fresh: boolean;
  busy: boolean;
  message: string;
  view: string;
  setView: (v: string) => void;
  zoom: number;
  setZoom: (v: number) => void;
  backdrop: string;
  setBackdrop: (v: string) => void;
  rect: Rect;
  setRect: (v: Rect) => void;
  cancel: () => void;
  progress: Progress; settings:Settings; setSettings:(p:Partial<Settings>)=>void;
}) {
  const [customColor,setCustomColor]=useState("#b4d8ee");
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  return (
    <div className="preview-shell">
      <div className="preview-toolbar">
        <RadioGroup
          className="segment-control"
          value={view}
          onValueChange={(v) => setView(String(v))}
          aria-label={t('Vista', 'View')}
        >
          {[
            ['compare', t('Comparar', 'Compare')],
            ['original', t('Original', 'Original')],
            ['result', t('Resultado', 'Result')],
          ].map(([value, label]) => (
            <label key={value} data-active={view === value}>
              <RadioGroupItem value={value} />
              <span>{label}</span>
            </label>
          ))}
        </RadioGroup>
        <div className="zoom-controls">
          <button
            aria-label={t('Alejar', 'Zoom out')}
            disabled={zoom <= 50}
            onClick={() => setZoom(zoom - 25)}
          >
            <Minus />
          </button>
          <button
            onClick={() => setZoom(100)}
            aria-label={t('Restablecer zoom', 'Reset zoom')}
          >
            {zoom}%
          </button>
          <button
            aria-label={t('Acercar', 'Zoom in')}
            disabled={zoom >= 400}
            onClick={() => setZoom(zoom + 25)}
          >
            <Plus />
          </button>
        </div>
      </div>
      <div className={`preview-panes ${view === 'compare' ? 'split' : ''}`}>
        {view !== 'result' && (
          <section className="preview-pane">
            <div className="pane-label">
              {t('Original', 'Original')}
              <span>{t('Se conserva intacto', 'Kept unchanged')}</span>
            </div>
            <div className={`image-viewport backdrop-${backdrop}`} style={backdrop==='custom'?{background:customColor}:undefined}>
              <div className="zoom-surface" style={{ width: `${zoom}%` }}>
                {toolId==='crop'?<CropEditor source={source} s={settings} set={setSettings} label={t('Área de recorte','Crop area')}/>:toolId==='watermark'?<TextEditor source={source} s={settings} set={setSettings} label={t('Editar marcas de agua','Edit watermarks')}/>:toolId === 'redact' ? (
                  <RegionEditor
                    url={source.url}
                    rect={rect}
                    onChange={setRect}
                    kind={toolId}
                    label={t(
                      'Selección: usa las flechas para moverla',
                      'Selection: use arrow keys to move',
                    )}
                  />
                ) : (
                  <img
                    src={source.url}
                    alt={t('Imagen original', 'Original image')}
                    draggable={false}
                  />
                )}
              </div>
            </div>
          </section>
        )}
        {view !== 'original' && (
          <section className="preview-pane">
            <div className="pane-label">
              {t('Resultado', 'Result')}
              <span>
                {fresh
                  ? t('Listo para revisar', 'Ready to review')
                  : t('Pendiente de actualizar', 'Preview needs updating')}
              </span>
            </div>
            <div
              className={`image-viewport backdrop-${backdrop} ${!fresh && resultUrl ? 'outdated' : ''}`}
              style={backdrop==='custom'?{background:customColor}:undefined}
              aria-busy={busy}
            >
              {resultUrl ? (
                <div className="zoom-surface" style={{ width: `${zoom}%` }}>
                  <img
                    src={resultUrl}
                    alt={t(
                      'Vista previa del archivo de salida',
                      'Preview of the output file',
                    )}
                    draggable={false}
                  />
                </div>
              ) : (
                <Empty className="preview-empty">
                  <Eye />
                  <p>
                    {t(
                      'El resultado aparecerá aquí',
                      'Your result will appear here',
                    )}
                  </p>
                  <small>
                    {toolId === 'vector' || toolId === 'background'
                      ? t(
                          'Elige los ajustes y crea tu vista previa.',
                          'Choose your settings and create a preview.',
                        )
                      : t(
                          'Se actualiza al cambiar los ajustes.',
                          'It updates when you change a setting.',
                        )}
                  </small>
                </Empty>
              )}
            </div>
          </section>
        )}
      </div>
      <div className="preview-bottom">
        {busy&&<div className="engine-progress"><progress max={100} value={progress.percent} aria-label={t('Progreso','Progress')}/>{progress.percent!==undefined&&<span>{Math.round(progress.percent)}%</span>}</div>}
        <div className="preview-status" aria-live="polite">
          {busy ? (
            <>
              <LoaderCircle className="spin" />
              <span>
                {message ||
                  t('Actualizando vista previa…', 'Updating preview…')}
              </span>
              <button className="text-button" onClick={cancel}>
                {t('Cancelar', 'Cancel')}
              </button>
            </>
          ) : fresh ? (
            <>
              <Check />
              <span>
                {t(
                  'Estás viendo el archivo que se descargará.',
                  'You are viewing the file that will be downloaded.',
                )}
              </span>
            </>
          ) : (
            <>
              <Eye />
              <span>
                {message ||
                  t(
                    'Actualiza la vista previa antes de descargar.',
                    'Update the preview before downloading.',
                  )}
              </span>
            </>
          )}
        </div>
        <RadioGroup
          className="backdrop-options"
          value={backdrop}
          onValueChange={(v) => setBackdrop(String(v))}
          aria-label={t(
            'Fondo de la vista previa; no cambia el archivo',
            'Preview background; does not change the file',
          )}
        >
          <span>{t('Fondo de vista', 'Preview background')}</span>
          {[
            ['checker', t('Transparencia', 'Transparency')],
            ['white', t('Blanco', 'White')],
            ['dark', t('Negro', 'Black')],
            ['custom', t('Personalizado', 'Custom')],
          ].map(([value, label]) => (
            <label
              key={value}
              title={label}
              className={`swatch backdrop-${value}`}
              data-active={backdrop === value}
            >
              <RadioGroupItem value={value} aria-label={label} />
            </label>
          ))}
        </RadioGroup>
        {backdrop==='custom'&&<label className="custom-backdrop">{t('Color de previsualización','Preview color')}<input type="color" value={customColor} onChange={e=>setCustomColor(e.target.value)}/></label>}
      </div>
    </div>
  );
}
