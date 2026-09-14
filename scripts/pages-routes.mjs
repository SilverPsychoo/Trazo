import { mkdirSync,readFileSync,writeFileSync,rmSync } from 'node:fs';
const catalog=readFileSync('lib/catalog.ts','utf8');
const tools=[...catalog.matchAll(/slug: '([^']+)'[\s\S]*?name: \['([^']+)', '([^']+)'\],[\s\S]*?description: \[\s*'([^']+)',\s*'([^']+)'/g)].map(m=>({slug:m[1],names:[m[2],m[3]],descriptions:[m[4],m[5]]}));
if(tools.length!==10)throw Error('Expected all ten tools in static route generation');
const html=readFileSync('dist/index.html','utf8');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const origin=process.env.TRAZO_SITE_URL?.replace(/\/?$/,'/');
const urls=[];
for(const [i,lang] of ['es','en'].entries())for(const tool of [null,...tools]){
  const slug=tool?.slug||'',path=[lang,slug].filter(Boolean).join('/');mkdirSync('dist/'+path,{recursive:true});
  const base=slug?'../../':'../',title=tool?tool.names[i]+' — Trazo':'Trazo — '+(i?'Image studio':'Estudio de imagen');
  const description=tool?tool.descriptions[i]:i?'Local image tools. Edit, preview and download while keeping your original.':'Herramientas de imagen locales. Ajusta, revisa y descarga conservando el original.';
  let page=html.replace('<base href="./"','<base href="'+base+'"').replace('<html lang="es"','<html lang="'+lang+'"').replace(/<title>.*?<\/title>/,`<title>${escape(title)}</title>`).replace(/<meta name="description" content="[^"]*"\/>/,`<meta name="description" content="${escape(description)}"/>`);
  const alternates=['es','en'].map(l=>`<link rel="alternate" hreflang="${l}" href="${l}/${slug?slug+'/':''}"/>`).join('');
  const canonical=origin?`<link rel="canonical" href="${escape(new URL(path+'/',origin).href)}"/>`:'';
  page=page.replace('</head>',`${alternates}${canonical}</head>`);writeFileSync('dist/'+path+'/index.html',page);urls.push(path+'/');
}
writeFileSync('dist/.nojekyll','');
writeFileSync('dist/404.html',html);
writeFileSync('dist/robots.txt','User-agent: *\nAllow: /\n'+(origin?'Sitemap: '+new URL('sitemap.xml',origin).href+'\n':''));
if(origin)writeFileSync('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['',...urls].map(u=>'<url><loc>'+escape(new URL(u,origin).href)+'</loc></url>').join('')+'</urlset>');
console.log(`Static routes: ${1+2*(1+tools.length)}, all with relative asset bases.`);

// Remove obsolete runtime files when rebuilding over an older output directory.
for(const name of ['ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.wasm'])rmSync('dist/vendor/onnx/'+name,{force:true});
