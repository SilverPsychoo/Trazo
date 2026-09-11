'use client';
import { useState } from 'react';

import {
  ArrowUpRight,
  Search,
  X,
  ScanLine,
  Scaling,
  Crop,
  WandSparkles,
  MousePointer2,
  SlidersHorizontal,
  RotateCw,
  Type,
  Shield,
  Minimize2,
  RefreshCw,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { Empty } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  catalog,
  categories,
  phrase,
  matchesTool,
  toolPath,
  type Locale,
} from '@/lib/catalog';
import { Header, Footer } from './chrome';
const icons = {
  compress: Minimize2,
  convert: RefreshCw,
  resize: Scaling,
  crop: Crop,
  background: WandSparkles,
  vector: MousePointer2,
  adjust: SlidersHorizontal,
  rotate: RotateCw,
  watermark: Type,
  redact: Shield,
};
export default function Catalog({ lang }: { lang: Locale }) {
  const [query, setQuery] = useState(''),
    [category, setCategory] = useState('all');
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  const filtered = catalog.filter(
    (tool) =>
      (category === 'all' || tool.category === category) &&
      matchesTool(tool, query),
  );
  return (
    <div className="studio" lang={lang}>
      <Header lang={lang} />
      <main className="catalog-main">
        <div className="catalog-heading">
          <div>
            <span className="eyebrow">
              {t(
                'PEQUEÑOS CAMBIOS. GRANDES POSIBILIDADES.',
                'SMALL CHANGES. MORE POSSIBILITIES.',
              )}
            </span>
            <h1>
              {t(
                'Tus imágenes, como las necesitas.',
                'Your images. Just how you need them.',
              )}
              <span className="title-dot">*</span>
            </h1>
            <p>
              {t(
                'Elige una herramienta. Ajusta, revisa y descarga.',
                'Choose a tool. Adjust, preview and download.',
              )}
            </p>
          </div>
          <span className="catalog-stamp">
            <ScanLine size={23} />
            {t('Tu pequeño estudio', 'Your little studio')}
            <small>
              {t('Gratis · Sin registro en la app', 'Free · No in-app account')}
            </small>
          </span>
        </div>
        <div className="catalog-search" role="search">
          <Search size={21} />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              '¿Qué quieres hacer? Prueba “comprimir”, “fondo” o “SVG”…',
              'What would you like to do? Try “compress”, “background” or “SVG”…',
            )}
            aria-label={t('Buscar herramientas', 'Search tools')}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label={t('Borrar búsqueda', 'Clear search')}
            >
              <X size={18} />
            </button>
          )}
          <kbd>
            {catalog.length} {t('herramientas', 'tools')}
          </kbd>
        </div>
        <RadioGroup
          className="category-filters"
          aria-label={t('Categoría de herramientas', 'Tool category')}
          value={category}
          onValueChange={(v) => setCategory(String(v))}
        >
          {Object.entries(categories).map(([key, value]) => (
            <label
              className={`category-pill ${category === key ? 'active' : ''}`}
              key={key}
            >
              <RadioGroupItem
                value={key}
                className="category-radio"
                aria-label={phrase(value, lang)}
              />
              {phrase(value, lang)}
            </label>
          ))}
        </RadioGroup>
        <div className="catalog-section-label">
          <h2>
            {query
              ? t('Resultados de búsqueda', 'Search results')
              : phrase(categories[category as keyof typeof categories], lang)}
          </h2>
          <span aria-live="polite">
            {filtered.length} {t('disponibles', 'available')}
          </span>
        </div>
        {filtered.length ? (
          <div className="tool-grid">
            {filtered.map((tool, i) => {
              const Icon = icons[tool.id];
              return (
                <a
                  className={`tool-card tone-${tool.color}`}
                  href={toolPath(lang, tool.slug)}
                  key={tool.id}
                >
                  <div className="tool-card-top">
                    <span className="tool-icon">
                      <Icon size={23} strokeWidth={1.6} />
                    </span>
                    <ArrowUpRight size={19} />
                  </div>
                  <h3>{phrase(tool.name, lang)}</h3>
                  <p>{phrase(tool.description, lang)}</p>
                  <span className="card-foot">
                    <Eye size={14} />
                    {t('Con vista previa', 'Preview included')}
                    <span>{String(i + 1).padStart(2, '0')}</span>
                  </span>
                </a>
              );
            })}
          </div>
        ) : (
          <Empty className="search-empty">
            <Search size={27} />
            <h3>
              {t('No encontramos esa herramienta.', 'No matching tools found.')}
            </h3>
            <p>
              {t(
                'Prueba otra palabra o cambia la categoría.',
                'Try another word or change the category.',
              )}
            </p>
            <button
              className="secondary-button"
              onClick={() => {
                setQuery('');
                setCategory('all');
              }}
            >
              {t('Ver todas', 'View all tools')}
            </button>
          </Empty>
        )}
        <div className="catalog-bottom">
          <span>
            <Eye size={17} />
            {t(
              'Revisa el resultado antes de descargar.',
              'Check your result before downloading.',
            )}
          </span>
          <span>
            <ShieldCheck size={17} />
            {t(
              'El archivo original se conserva.',
              'Your original file stays unchanged.',
            )}
          </span>
        </div>
      </main>
      <Footer lang={lang} />
    </div>
  );
}
