'use client';
import { useId } from 'react';
import { Leaf, Palette, RotateCcw, RotateCw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  boundedRect,
  cropPixels,
  resizeProportional,
} from '@/lib/editor-math.mjs';
import type { Locale, ToolId } from '@/lib/catalog';
import type { Settings } from '@/lib/processing';
type Props = {
  lang: Locale;
  toolId: ToolId;
  s: Settings;
  set: (v: Partial<Settings>) => void;
  width: number;
  height: number;
};
function Range({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = '',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="setting-group">
      <div className="label-row">
        <span>{label}</span>
        <output>
          {value}
          {suffix}
        </output>
      </div>
      <Slider
        aria-label={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
    </div>
  );
}
function NumberField({
  label,
  value,
  onChange,
  min = 1,
  max = 16384,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const id = useId();
  return (
    <div className="numeric-field">
      <label htmlFor={id}>{label}</label>
      <Input
        id={id}
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
      />
    </div>
  );
}
function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="toggle-field">
      <label htmlFor={id}>{label}</label>
      <Switch id={id} checked={value} onCheckedChange={onChange} />
    </div>
  );
}
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div className="color-field">
      <label htmlFor={id}>{label}</label>
      <input
        type="color"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
export function SettingsPanel({ lang, toolId, s, set, width, height }: Props) {
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  const size = (axis: 'width' | 'height', value: number) =>
    set(
      s.locked
        ? resizeProportional(value, axis, width, height)
        : { [axis]: value },
    );
  const region = (key: 'x' | 'y' | 'w' | 'h', value: number) =>
    set({ rect: boundedRect({ ...s.rect, [key]: value }) });
  function preset(ratio: number | null) {
    if (!ratio) return set({ rect: { x: 5, y: 5, w: 90, h: 90 } });
    let w = 90,
      h = (w * width) / height / ratio;
    if (h > 90) {
      h = 90;
      w = ((h * height) / width) * ratio;
    }
    set({ rect: { x: (100 - w) / 2, y: (100 - h) / 2, w, h } });
  }
  const crop = cropPixels(s.rect, width, height);
  return (
    <div className="tool-controls">
      {toolId === 'vector' && (
        <>
          <div className="field-title">
            {t('Estilo del vector', 'Vector style')}
          </div>
          <RadioGroup
            value={s.mode}
            onValueChange={(v) => set({ mode: String(v) })}
            className="mode-grid"
            aria-label={t('Estilo', 'Style')}
          >
            {[
              ['color', t('A color', 'Color')],
              ['poster', t('Logo / Póster', 'Logo / Poster')],
              ['lineart', t('Firma / Line art', 'Signature / Line art')],
              ['outline', t('Contorno', 'Outline')],
              ['silhouette', t('Silueta', 'Silhouette')],
            ].map(([value, label]) => (
              <label
                key={value}
                className={`mode-card ${s.mode === value ? 'selected' : ''}`}
              >
                <RadioGroupItem className="mode-radio" value={value} />
                {value === 'color' ? (
                  <Palette />
                ) : (
                  <Leaf
                    fill={value === 'silhouette' ? 'currentColor' : 'none'}
                  />
                )}
                <span>{label}</span>
              </label>
            ))}
          </RadioGroup>
          <Range
            label={t('Detalle', 'Detail')}
            value={s.detail}
            min={10}
            onChange={(detail) => set({ detail })}
          />
          {['color','poster'].includes(s.mode) ? (
            <>
              <Range
                label={t('Número de colores', 'Number of colors')}
                value={s.colors}
                min={2}
                max={32}
                onChange={(colors) => set({ colors })}
              />
              <Toggle
                label={t('Omitir blanco', 'Omit white')}
                value={s.omitWhite}
                onChange={(omitWhite) => set({ omitWhite })}
              />
            </>
          ) : (
            <>
              <Range
                label={t('Umbral de negro', 'Black threshold')}
                value={s.threshold}
                min={1}
                max={254}
                onChange={(threshold) => set({ threshold })}
              />
              {s.mode === 'outline' && (
                <Range
                  label={t('Grosor del contorno', 'Outline width')}
                  value={s.stroke}
                  min={0.5}
                  max={10}
                  step={0.5}
                  onChange={(stroke) => set({ stroke })}
                />
              )}
              <Toggle
                label={t('Invertir negro y blanco', 'Invert black and white')}
                value={s.invert}
                onChange={(invert) => set({ invert })}
              />
            </>
          )}
          <Range label={t('Suavizado','Smoothing')} value={s.vectorSmooth} onChange={vectorSmooth=>set({vectorSmooth})}/>
          <Range label={t('Simplificación','Simplification')} value={s.simplify} onChange={simplify=>set({simplify})}/>
          <Range label={t('Precisión de curvas','Curve precision')} value={s.precision} min={1} max={4} onChange={precision=>set({precision})}/>
          <Range label={t('Eliminar ruido pequeño','Remove small specks')} value={s.despeckle} max={32} suffix=" px" onChange={despeckle=>set({despeckle})}/>
          <p className="control-note">
            {t(
              'Logos e ilustraciones sencillas dan los mejores resultados. Acerca la vista para revisar los bordes.',
              'Simple logos and illustrations give the best results. Zoom in to check the edges.',
            )}
          </p>
        </>
      )}
      {toolId === 'background' && <>
        <div className="field-title">{t('Calidad de separación','Segmentation quality')}</div>
        <RadioGroup className="choice-list" value={s.bgQuality} onValueChange={v=>set({bgQuality:String(v) as Settings['bgQuality']})} aria-label={t('Calidad de separación','Segmentation quality')}>
          {([['fast',t('Rápida','Fast')],['balanced',t('Equilibrada','Balanced')],['maximum',t('Máxima','Maximum')]]).map(([value,label])=><label key={value}><RadioGroupItem value={value}/><strong>{label}</strong></label>)}
        </RadioGroup>
        <p className="control-note">{t('La IA se prepara la primera vez. La foto se procesa en tu dispositivo y conserva su resolución original. Máxima comprueba la máscara con una segunda pasada.','AI prepares on first use. Your photo is processed on your device at its original resolution. Maximum checks the mask with a second pass.')}</p>
        <Range label={t('Refinar borde','Refine edges')} value={s.edgeRefine} onChange={edgeRefine=>set({edgeRefine})}/>
        <Range label={t('Suavizado','Smoothing')} value={s.smoothing} onChange={smoothing=>set({smoothing})}/>
        <Range label={t('Borde suave','Feather')} value={s.feather} max={20} step={.5} suffix=" px" onChange={feather=>set({feather})}/>
        <div className="field-title">{t('Formato de salida','Output format')}</div>
        <div className="preset-row">{['png','webp'].map(format=><button key={format} aria-pressed={s.format===format} className="secondary-button" onClick={()=>set({format})}>{format.toUpperCase()}</button>)}</div>
        <Toggle label={t('Añadir un color de fondo','Add a background color')} value={s.addBackground} onChange={addBackground=>set({addBackground})}/>
        {s.addBackground&&<ColorField label={t('Color de fondo','Background color')} value={s.backgroundColor} onChange={backgroundColor=>set({backgroundColor})}/>}
      </>}
      {(toolId === 'compress' || toolId === 'convert') && (
        <>
          <div className="field-title">
            {t('Formato de salida', 'Output format')}
          </div>
          <Select
            value={s.format}
            onValueChange={(v) => v && set({ format: v })}
          >
            <SelectTrigger
              className="format-select"
              aria-label={t('Formato de salida', 'Output format')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                ['webp', 'WebP'],
                ['jpeg', 'JPG'],
                ['png', 'PNG'],
                ['avif', 'AVIF'],
              ].map(([value, label]) => (
                <SelectItem value={value} key={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {s.format !== 'png' && (
            <Range
              label={t('Calidad', 'Quality')}
              value={s.quality}
              min={5}
              onChange={(quality) => set({ quality })}
              suffix="%"
            />
          )}
          <p className="control-note">
            {s.format === 'jpeg'
              ? t(
                  'JPG sustituye la transparencia por el color de fondo elegido.',
                  'JPG replaces transparency with your selected background color.',
                )
              : s.format === 'png'
                ? t(
                    'PNG conserva transparencia y no pierde calidad al comprimir. Puede pesar más.',
                    'PNG preserves transparency and uses lossless compression. Files may be larger.',
                  )
                : t(
                    'WebP permite archivos pequeños y transparencia.',
                    'WebP supports small files and transparency.',
                  )}
          </p>
          {s.format==='jpeg'&&<ColorField label={t('Fondo para transparencia','Transparency background')} value={s.backgroundColor} onChange={backgroundColor=>set({backgroundColor})}/>}
          {s.format==='avif'&&<p className="control-note">{t('AVIF puede tardar más, especialmente con fotos grandes.','AVIF can take longer, especially for large photos.')}</p>}
          {toolId === 'compress' && (
            <>
              <Toggle
                label={t('Fijar un peso máximo', 'Set a maximum file size')}
                value={s.targetEnabled}
                onChange={(targetEnabled) => set({ targetEnabled })}
              />
              {s.targetEnabled && (
                <>
                  <NumberField
                    label={t('Máximo en KB', 'Maximum KB')}
                    value={s.targetKB}
                    min={1}
                    max={20000}
                    onChange={(targetKB) => set({ targetKB })}
                  />
                  <p className="control-note">
                    {t(
                      'Se ajustará la calidad. Si no alcanza el peso, te avisaremos antes de descargar.',
                      'Quality will be adjusted. If the target cannot be met, we will tell you before downloading.',
                    )}
                  </p>
                </>
              )}
            </>
          )}
        </>
      )}
      {toolId === 'resize' && <>
        <div className="two-fields"><NumberField label={t('Ancho (px)','Width (px)')} value={s.width} onChange={v=>size('width',v)}/><NumberField label={t('Alto (px)','Height (px)')} value={s.height} onChange={v=>size('height',v)}/></div>
        <Toggle label={t('Mantener proporción','Keep proportions')} value={s.locked} onChange={locked=>set({locked,...(locked?resizeProportional(s.width,'width',width,height):{})})}/>
        <NumberField label={t('Porcentaje','Percentage')} value={Math.round(s.width/width*100)} max={800} onChange={v=>set({width:Math.max(1,Math.round(width*v/100)),height:Math.max(1,Math.round(height*v/100))})}/>
        <div className="preset-row">{[25,50,100,200].map(v=><button key={v} className="secondary-button" onClick={()=>set({width:Math.max(1,Math.round(width*v/100)),height:Math.max(1,Math.round(height*v/100))})}>{v}%</button>)}</div>
        <div className="preset-row">{[640,1280,1920].map(v=><button key={v} className="secondary-button" onClick={()=>size('width',v)}>{v} px</button>)}</div>
        <RadioGroup className="choice-list" value={s.resizeMethod} onValueChange={v=>set({resizeMethod:String(v) as Settings['resizeMethod']})} aria-label={t('Método','Method')}>
          <label><RadioGroupItem value="quality"/>{t('Alta calidad','High quality')}</label><label><RadioGroupItem value="fast"/>{t('Rápido','Fast')}</label>
        </RadioGroup>
        <p className="control-note">{t('Hasta 16384 px por lado y 48 megapíxeles. Ampliar no recupera detalles ausentes.','Up to 16384 px per side and 48 megapixels. Enlarging cannot recover missing detail.')}</p>
      </>}
      {toolId === 'redact' && (
        <>
          <p className="control-note">
            {t(
              'Mueve la selección sobre el original. Arrastra su esquina para cambiar el tamaño o usa estas medidas.',
              'Move the selection on the original. Drag its corner to resize, or use these dimensions.',
            )}
          </p>
          <div className="two-fields">
            <NumberField
              label={t('Izquierda (%)', 'Left (%)')}
              value={Math.round(s.rect.x)}
              min={0}
              max={98}
              onChange={(v) => region('x', v)}
            />
            <NumberField
              label={t('Arriba (%)', 'Top (%)')}
              value={Math.round(s.rect.y)}
              min={0}
              max={98}
              onChange={(v) => region('y', v)}
            />
            <NumberField
              label={t('Ancho (%)', 'Width (%)')}
              value={Math.round(s.rect.w)}
              min={2}
              max={100}
              onChange={(v) => region('w', v)}
            />
            <NumberField
              label={t('Alto (%)', 'Height (%)')}
              value={Math.round(s.rect.h)}
              min={2}
              max={100}
              onChange={(v) => region('h', v)}
            />
          </div>
            <>
              <ColorField
                label={t('Color del bloque opaco', 'Opaque block color')}
                value={s.blockColor}
                onChange={(blockColor) => set({ blockColor })}
              />
              <p className="control-note">
                {t(
                  'Revisa que el bloque cubra todos los datos. El archivo descargado tiene el bloque integrado.',
                  'Check that the block covers all private details. The downloaded file has the block baked in.',
                )}
              </p>
            </>
        </>
      )}
      {toolId === 'crop' && <>
        <p className="control-note">{t('Arrastra el área para recortar. Usa dos dedos para acercar la imagen o los controles de zoom.','Drag the crop area. Pinch to zoom the image or use the zoom controls.')}</p>
        <div className="preset-row">{[[0,t('Libre','Free')],[1,'1:1'],[4/3,'4:3'],[16/9,'16:9'],[9/16,'9:16']].map(([v,label])=><button className="secondary-button" key={String(label)} aria-pressed={s.cropAspect===v} onClick={()=>set({cropAspect:Number(v)})}>{label}</button>)}</div>
        <div className="two-fields">
        {(['width','height'] as const).map(key=><NumberField key={key} label={key==='width'?t('Ancho exacto (px)','Exact width (px)'):t('Alto exacto (px)','Exact height (px)')} value={Math.round(s.cropData?.[key]||(key==='width'?crop.width:crop.height))} onChange={value=>{const c=s.cropData||{x:crop.x,y:crop.y,width:crop.width,height:crop.height,rotate:0,scaleX:1,scaleY:1};set({cropData:{...c,[key]:value,...(s.cropAspect?key==='width'?{height:value/s.cropAspect}:{width:value*s.cropAspect}:{})}})}}/>)}
        </div>
        <Range label={t('Zoom de imagen','Image zoom')} value={Math.round(s.cropZoom*100)} min={10} max={300} suffix="%" onChange={v=>set({cropZoom:v/100})}/>
      </>}
      {toolId === 'redact' && <>
        <RadioGroup className="choice-list" value={s.redactMode} onValueChange={v=>set({redactMode:String(v) as Settings['redactMode']})} aria-label={t('Modo de ocultación','Redaction mode')}>
          {[['solid',t('Bloque sólido','Solid block')],['pixelate',t('Pixelado','Pixelate')],['blur',t('Desenfoque fuerte','Strong blur')]].map(([value,label])=><label key={value}><RadioGroupItem value={value}/>{label}</label>)}
        </RadioGroup>
        {s.redactMode!=='solid'&&<><Range label={t('Intensidad','Strength')} value={s.redactStrength} min={20} onChange={redactStrength=>set({redactStrength})}/><p className="control-note">{t('Para datos sensibles, usa el bloque sólido. Blur y pixelado pueden dejar información reconocible.','For sensitive details, use the solid block. Blur and pixelation may leave recognizable information.')}</p></>}
      </>}
      {toolId === 'adjust' && (
        <>
          <Range
            label={t('Brillo', 'Brightness')}
            value={s.brightness}
            min={20}
            max={200}
            suffix="%"
            onChange={(brightness) => set({ brightness })}
          />
          <Range
            label={t('Contraste', 'Contrast')}
            value={s.contrast}
            min={20}
            max={200}
            suffix="%"
            onChange={(contrast) => set({ contrast })}
          />
          <Range
            label={t('Saturación', 'Saturation')}
            value={s.saturation}
            min={0}
            max={200}
            suffix="%"
            onChange={(saturation) => set({ saturation })}
          />
          <Range label={t('Exposición','Exposure')} value={s.exposure} min={-3} max={3} step={.1} suffix=" EV" onChange={exposure=>set({exposure})}/>
          <Range label={t('Temperatura','Temperature')} value={s.temperature} min={-100} max={100} onChange={temperature=>set({temperature})}/>
          <Range label={t('Sombras','Shadows')} value={s.shadows} min={-100} max={100} onChange={shadows=>set({shadows})}/>
          <Range label={t('Luces','Highlights')} value={s.highlights} min={-100} max={100} onChange={highlights=>set({highlights})}/>
          <Range label={t('Sepia','Sepia')} value={s.sepia} onChange={sepia=>set({sepia})}/>
          <button
            className="secondary-button"
            onClick={() => set({ saturation: 0 })}
          >
            {t('Hacer blanco y negro', 'Make black and white')}
          </button>
        </>
      )}
      {(toolId === 'rotate'||toolId === 'crop') && (
        <>
          <div className="rotation-buttons">
            <button
              className="secondary-button"
              onClick={() => set({ rotation: (s.rotation + 270) % 360 })}
            >
              <RotateCcw />
              {t('90° izquierda', '90° left')}
            </button>
            <button
              className="secondary-button"
              onClick={() => set({ rotation: (s.rotation + 90) % 360 })}
            >
              <RotateCw />
              {t('90° derecha', '90° right')}
            </button>
          </div>
          <p className="control-note">
            {t('Rotación', 'Rotation')}: {s.rotation}°
          </p>
          <Toggle
            label={t('Voltear horizontalmente', 'Flip horizontally')}
            value={s.flipX}
            onChange={(flipX) => set({ flipX })}
          />
          <Toggle
            label={t('Voltear verticalmente', 'Flip vertically')}
            value={s.flipY}
            onChange={(flipY) => set({ flipY })}
          />
        </>
      )}
      {toolId === 'watermark' && (
        <>
          <label className="text-field">
            <span>{t('Tu texto', 'Your text')}</span>
            <Input
              value={s.text}
              maxLength={120}
              onChange={(e) => set({ text: e.target.value })}
            />
          </label>
          <Range
            label={t('Tamaño del texto', 'Text size')}
            value={s.fontSize}
            min={.5}
            max={80}
            step={.5}
            suffix="%"
            onChange={(fontSize) => set({ fontSize })}
          />
          <Range
            label={t('Opacidad', 'Opacity')}
            value={s.textOpacity}
            min={5}
            suffix="%"
            onChange={(textOpacity) => set({ textOpacity })}
          />
          <ColorField
            label={t('Color del texto', 'Text color')}
            value={s.textColor}
            onChange={(textColor) => set({ textColor })}
          />
          <Range
            label={t('Posición horizontal', 'Horizontal position')}
            value={s.textX}
            onChange={(textX) => set({ textX })}
          />
          <Range
            label={t('Posición vertical', 'Vertical position')}
            value={s.textY}
            onChange={(textY) => set({ textY })}
          />
          <Range label={t('Rotación del texto','Text rotation')} value={s.textRotation} min={-180} max={180} suffix="°" onChange={textRotation=>set({textRotation})}/>
          <div className="preset-row">{[['left',t('Izquierda','Left')],['center',t('Centro','Center')],['right',t('Derecha','Right')]].map(([value,label])=><button key={value} className="secondary-button" aria-pressed={s.textAlign===value} onClick={()=>set({textAlign:value as Settings['textAlign']})}>{label}</button>)}</div>
          <p className="control-note">{t('Mueve, gira o cambia el tamaño del texto directamente sobre la imagen.','Move, rotate or resize text directly on the image.')}</p>
          <button className="secondary-button" disabled={s.watermarks.length>=7||!s.text.trim()} onClick={()=>set({watermarks:[...s.watermarks,{text:s.text,fontSize:s.fontSize,textColor:s.textColor,textOpacity:s.textOpacity,textX:s.textX,textY:s.textY,textRotation:s.textRotation,textAlign:s.textAlign}],text:t('Nuevo texto','New text'),textX:10,textY:10})}>{t('Añadir otra marca','Add another watermark')}</button>
          {s.watermarks.length>0&&<button className="text-button" onClick={()=>set({watermarks:s.watermarks.slice(0,-1)})}>{t('Quitar marca anterior','Remove previous watermark')}</button>}
        </>
      )}
    </div>
  );
}
