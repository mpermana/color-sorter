export function ensureAdScriptLoaded(clientId: string) {
  if (document.querySelector('script[data-adsbygoogle]')) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
  s.crossOrigin = 'anonymous';
  s.setAttribute('data-adsbygoogle','1');
  document.head.appendChild(s);
}
