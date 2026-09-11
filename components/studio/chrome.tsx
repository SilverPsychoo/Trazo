'use client';
import { publicPath } from '@/lib/paths';

import { ArrowUpRight, Coffee, ShieldCheck } from 'lucide-react';
import { type Locale } from '@/lib/catalog';
export function Header({ lang, slug }: { lang: Locale; slug?: string }) {
  return (
    <header className="topbar">
      <a className="brand" href={publicPath(`${lang}/`)} aria-label="Trazo">
        <span className="brand-icon">
          <img src={publicPath("favicon.svg")} alt="" width="34" height="34" />
        </span>
        trazo<span className="brand-dot">.</span>
      </a>
      <span className="header-note">
        {lang === 'es' ? 'HERRAMIENTAS DE IMAGEN' : 'IMAGE TOOLS'}
      </span>
      <nav
        className="header-actions"
        aria-label={lang === 'es' ? 'Navegación principal' : 'Main navigation'}
      >
        <a className="all-tools-link" href={publicPath(`${lang}/`)}>
          {lang === 'es' ? 'Todas las herramientas' : 'All tools'}
        </a>
        <a
          className="support-link"
          href="https://ko-fi.com/silverpsycho"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={lang === 'es' ? 'Apoyar Trazo en Ko-fi' : 'Support Trazo on Ko-fi'}
        >
          <Coffee size={16} />
          <span>{lang === 'es' ? 'Apoyar' : 'Support'}</span>
        </a>
        <div
          className="language-switch"
          aria-label={lang === 'es' ? 'Idioma' : 'Language'}
        >
          <a
            lang="es"
            href={publicPath(`es/${slug ? `${slug}/` : ''}`)}
            aria-current={lang === 'es' ? 'page' : undefined}
          >
            ES
          </a>
          <a
            lang="en"
            href={publicPath(`en/${slug ? `${slug}/` : ''}`)}
            aria-current={lang === 'en' ? 'page' : undefined}
          >
            EN
          </a>
        </div>
      </nav>
    </header>
  );
}
export function Footer({ lang }: { lang: Locale }) {
  return (
    <footer className="site-footer">
      <span>
        trazo.{' '}
        <span>
          {lang === 'es' ? 'Hecho para crear.' : 'Made for creating.'}
        </span>
      </span>
      <span>
        <ShieldCheck size={14} />
        {lang === 'es'
          ? 'Tus imágenes se procesan en tu dispositivo.'
          : 'Your images are processed on your device.'}
      </span>
      <span className="footer-links">
        <a href="https://ko-fi.com/silverpsycho" target="_blank" rel="noopener noreferrer">
          <Coffee size={13} />
          {lang === 'es' ? 'Apoyar en Ko-fi' : 'Support on Ko-fi'}
        </a>
        <a href={publicPath("trazo-source.zip")} download>
          {lang === 'es' ? 'Código abierto' : 'Open source'}
          <ArrowUpRight size={13} />
        </a>
      </span>
    </footer>
  );
}
