export async function GET(
  request: Request,
  { params }: { params: Promise<{ animeId: string; episode: string }> }
) {
  const { animeId, episode } = await params;
  const { searchParams } = new URL(request.url);
  const subOrDub = searchParams.get("subOrDub") || "sub";

  const targetUrl = `https://vidnest.fun/anime/${animeId}/${episode}/${subOrDub}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return new Response(`Vidnest returned status ${response.status}`, { status: response.status });
    }

    const originalHtml = await response.text();

    // 1. Rewrite relative Next.js static asset URLs to absolute Vidnest URLs
    let modifiedHtml = originalHtml
      .replace(/href="\/_next\//g, 'href="https://vidnest.fun/_next/')
      .replace(/src="\/_next\//g, 'src="https://vidnest.fun/_next/');

    // 2. Inject comprehensive Anti-Popup & Anti-Redirect shield script
    // - Overrides window.open, top.open, parent.open permanently
    // - Intercepts EventTarget.prototype.addEventListener to kill ad click handlers before registration
    // - Intercepts Node.prototype.appendChild & insertBefore to block ad script/iframe injection
    // - Intercepts capture-phase clicks on any target="_blank" or external ad overlays
    const antiPopupScript = `
<script>
  (function() {
    try {
      // 1. Matikan window.open secara permanen di semua scope (window, top, parent)
      const noop = function() {
        console.warn("[KinoHarth Shield] Blocked window.open popup attempt.");
        return null;
      };
      window.open = noop;
      try {
        Object.defineProperty(window, 'open', {
          configurable: false,
          writable: false,
          value: noop
        });
      } catch(e) {}
      try { if (window.top) window.top.open = noop; } catch(e) {}
      try { if (window.parent) window.parent.open = noop; } catch(e) {}

      // 1b. Server video Vidnest hanya menerima origin vidnest.fun.
      //     Alihkan request ke host tersebut lewat relay KinoHarth.
      var RELAY_ORIGIN = window.location.origin;
      var needsRelay = function(url) {
        try {
          var u = new URL(String(url), document.baseURI);
          if (u.origin === RELAY_ORIGIN) return null;
          var h = u.hostname;
          if (h.indexOf('falling-term') !== -1) return null;
          if (
            /\\.workers\\.dev$/.test(h) ||
            /animanga\\.fun$/.test(h) ||
            /echovideo\\.to$/.test(h) ||
            /shiora\\.top$/.test(h) ||
            /stellarfrontier\\.world$/.test(h) ||
            /tiktokcdn\\.com$/.test(h) ||
            /vidnest\\.fun$/.test(h)
          ) {
            return u.href;
          }
        } catch (e) {}
        return null;
      };
      var toRelay = function(url) {
        var abs = needsRelay(url);
        return abs ? RELAY_ORIGIN + '/api/embed/relay?url=' + encodeURIComponent(abs) : url;
      };

      var origFetch = window.fetch;
      window.fetch = function(input, init) {
        try {
          if (typeof input === 'string' || input instanceof URL) {
            input = toRelay(String(input));
          } else if (input && input.url && needsRelay(input.url)) {
            input = new Request(toRelay(input.url), input);
          }
        } catch (e) {}
        return origFetch.call(this, input, init);
      };

      var origXhrOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url) {
        var args = Array.prototype.slice.call(arguments);
        try { args[1] = toRelay(url); } catch (e) {}
        return origXhrOpen.apply(this, args);
      };

      [HTMLMediaElement.prototype, HTMLSourceElement.prototype, HTMLTrackElement.prototype].forEach(function(proto) {
        var desc = Object.getOwnPropertyDescriptor(proto, 'src');
        if (!desc || !desc.set) return;
        Object.defineProperty(proto, 'src', {
          configurable: true,
          enumerable: desc.enumerable,
          get: desc.get,
          set: function(v) { return desc.set.call(this, toRelay(v)); }
        });
      });
      var origSetAttr = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function(name, value) {
        if (typeof name === 'string' && name.toLowerCase() === 'src' &&
            (this instanceof HTMLMediaElement || this instanceof HTMLSourceElement || this instanceof HTMLTrackElement)) {
          value = toRelay(value);
        }
        return origSetAttr.call(this, name, value);
      };

      // 2. Cegah registrasi event click listener yang berisi kode iklan (hai8g, popup, falling-term)
      const origAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'click' || type === 'pointerdown' || type === 'mousedown' || type === 'touchstart') {
          if (typeof listener === 'function') {
            try {
              const fnStr = Function.prototype.toString.call(listener);
              if (
                fnStr.includes('hai8g') ||
                fnStr.includes('chiripaethenes') ||
                fnStr.includes('falling-term') ||
                (fnStr.includes('window.open') && fnStr.includes('_blank'))
              ) {
                console.warn('[KinoHarth Shield] Blocked ad click listener registration.');
                return;
              }
            } catch (err) {}
          }
        }
        return origAddEventListener.call(this, type, listener, options);
      };
      
      const origClick = HTMLElement.prototype.click;
      HTMLElement.prototype.click = function() {
        if (this.tagName === 'A') {
          const href = this.getAttribute('href') || this.href || '';
          if (this.target === '_blank' || (href.startsWith('http') && !href.includes('vidnest.fun'))) {
            console.warn('[KinoHarth Shield] Blocked synthesized click:', href);
            return;
          }
        }
        return origClick.apply(this, arguments);
      };

      // 3. Blokir DOM appendChild & insertBefore untuk script/iframe iklan
      const isBlockedUrl = function(url) {
        if (!url || typeof url !== 'string') return false;
        return (
          url.includes('chiripaethenes') ||
          url.includes('falling-term') ||
          url.includes('hai8g') ||
          url.includes('popunder') ||
          url.includes('adsterra') ||
          url.includes('exoclick')
        );
      };

      const origAppendChild = Node.prototype.appendChild;
      Node.prototype.appendChild = function(node) {
        if (node && node.nodeType === 1) {
          const src = node.src || (node.getAttribute && node.getAttribute('src')) || '';
          if (isBlockedUrl(src)) {
            console.warn('[KinoHarth Shield] Blocked ad script appendChild:', src);
            return node;
          }
        }
        return origAppendChild.call(this, node);
      };

      const origInsertBefore = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function(node, ref) {
        if (node && node.nodeType === 1) {
          const src = node.src || (node.getAttribute && node.getAttribute('src')) || '';
          if (isBlockedUrl(src)) {
            console.warn('[KinoHarth Shield] Blocked ad script insertBefore:', src);
            return node;
          }
        }
        return origInsertBefore.call(this, node, ref);
      };

      // 4. Tangkap dan blokir klik pada link target=_blank atau link eksternal (capture phase)
      window.addEventListener('click', function(e) {
        const path = (e.composedPath && e.composedPath()) || [];
        for (let i = 0; i < path.length; i++) {
          const el = path[i];
          if (el && el.tagName === 'A') {
            const href = el.getAttribute('href') || el.href || '';
            const target = el.getAttribute('target') || el.target || '';
            if (
              target === '_blank' ||
              (href.startsWith('http') && !href.includes(window.location.hostname) && !href.includes('vidnest.fun'))
            ) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              console.warn('[KinoHarth Shield] Blocked external ad link click:', href);
              return false;
            }
          }
        }
      }, true);

      // 5. Tangkap event keyboard untuk kontrol video
      window.addEventListener('keydown', function(e) {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
        
        const findVideo = function(doc) {
          let v = doc.querySelector('video');
          if (v) return v;
          const frames = doc.querySelectorAll('iframe');
          for (let i = 0; i < frames.length; i++) {
            try { if (frames[i].contentDocument) { v = findVideo(frames[i].contentDocument); if (v) return v; } } catch(err) {}
          }
          return null;
        };

        const video = findVideo(document);
        if (!video) return;

        switch (e.key.toLowerCase()) {
          case 'f':
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(()=>{});
            } else {
              const playerContainer = video.closest('.art-video-player') || video.closest('.plyr') || video.parentElement;
              if (playerContainer && playerContainer.requestFullscreen) {
                playerContainer.requestFullscreen().catch(()=>{});
              } else {
                video.requestFullscreen().catch(()=>{});
              }
            }
            break;
          case ' ':
            e.preventDefault();
            if (video.paused) video.play();
            else video.pause();
            break;
          case 'arrowleft':
            video.currentTime = Math.max(0, video.currentTime - 5);
            break;
          case 'arrowright':
            video.currentTime = Math.min(video.duration, video.currentTime + 5);
            break;
        }
      });

    } catch(err) {
      console.error("[KinoHarth Shield Error]:", err);
    }
  })();
</script>
<base href="https://vidnest.fun/">
`;

    modifiedHtml = modifiedHtml.replace("<head>", `<head>${antiPopupScript}`);

    return new Response(modifiedHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    return new Response(
      `Failed to proxy Vidnest embed: ${error instanceof Error ? error.message : "unknown error"}`,
      { status: 500 }
    );
  }
}
