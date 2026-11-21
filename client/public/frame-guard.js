/**
 * GitHub Pages cannot send X-Frame-Options or a frame-ancestors CSP header, so
 * this small guard refuses to render inside a third-party frame (clickjacking).
 * A cross-origin top window cannot be navigated from here; in that case the
 * page is hidden instead of being clickable.
 */
(function frameGuard() {
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.replace(window.self.location.href);
    }
  } catch {
    document.documentElement.style.display = 'none';
  }
})();
