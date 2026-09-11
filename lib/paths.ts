/** Public URLs resolve against the generated base tag on Pages, including /repo/. */
export function publicPath(path: string) {
  if (typeof document === 'undefined') return '/' + path.replace(/^\//, '');
  return new URL(path.replace(/^\//, ''), document.baseURI).pathname;
}
export function assetURL(path: string) {
  return new URL(path.replace(/^\//, ''), document.baseURI).href;
}
