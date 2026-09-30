'use client';
import { useState } from 'react';

import {
  Search,
  X,
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
          <h1>{t('Herramientas de imagen', 'Image tools')}</h1>
        </div>
        <div className="catalog-search" role="search">
          <Search size={21} />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              'Buscar por herramienta o formato',
              'Search by tool or format',
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
        <span className="sr-only" aria-live="polite">
          {filtered.length} {t('herramientas', 'tools')}
        </span>
        {filtered.length ? (
          <div className="tool-grid">
            {filtered.map((tool) => {
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
                  </div>
                  <h3>{phrase(tool.name, lang)}</h3>
                  <p>{phrase(tool.description, lang)}</p>
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
      </main>
      <Footer lang={lang} />
    </div>
  );
}
