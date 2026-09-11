import { createRoot } from 'react-dom/client';
import Catalog from '../components/studio/catalog';
import Editor from '../components/studio/editor';
import { catalog, phrase, type Locale } from '../lib/catalog';
import './globals.css';
import '@fontsource/geist/latin-400.css';
import '@fontsource/geist/latin-500.css';
import '@fontsource/geist/latin-600.css';
import '@fontsource/geist/latin-700.css';
import '@fontsource/geist-mono/latin-400.css';
const parts=location.pathname.split('/').filter(Boolean);
const index=parts.findIndex(x=>x==='es'||x==='en');
const lang:Locale=index>=0?parts[index] as Locale:'es';
const slug=index>=0?parts[index+1]:undefined;
const tool=catalog.find(t=>t.slug===slug);
document.documentElement.lang=lang;
document.title=tool?`${phrase(tool.name,lang)} — Trazo`:'Trazo — Estudio de imagen';
createRoot(document.getElementById('root')!).render(tool?<Editor lang={lang} toolId={tool.id}/>:<Catalog lang={lang}/>);
if('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register(new URL('sw.js',document.baseURI),{scope:new URL('./',document.baseURI).pathname}).catch(()=>{});
}
