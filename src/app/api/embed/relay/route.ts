// Relay untuk request video Vidnest.
// Server proxy video Vidnest (*.workers.dev, upcloud.animanga.fun) hanya menerima
// Origin "https://vidnest.fun". Karena player kita jalankan dari origin KinoHarth
// (agar bisa memblokir pop-up), request video diteruskan lewat server ini.

const ALLOWED_HOST_SUFFIXES = [
  ".workers.dev",
  "animanga.fun",
  "vidnest.fun",
  "echovideo.to",
  "shiora.top",
  "stellarfrontier.world",
  "tiktokcdn.com",
];

function isAllowedHost(hostname: string) {
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => hostname === suffix.replace(/^\./, "") || hostname.endsWith(suffix)
  );
}

function relayUrl(absoluteUrl: string, origin: string) {
  return `${origin}/api/embed/relay?url=${encodeURIComponent(absoluteUrl)}`;
}

function rewriteUri(uri: string, base: string, origin: string) {
  try {
    const abs = new URL(uri, base);
    return isAllowedHost(abs.hostname) ? relayUrl(abs.href, origin) : abs.href;
  } catch {
    return uri;
  }
}

function rewritePlaylist(body: string, base: string, origin: string) {
  return body
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_, uri: string) => `URI="${rewriteUri(uri, base, origin)}"`);
      }
      return rewriteUri(trimmed, base, origin);
    })
    .join("\n");
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("url");

  if (!target) {
    return new Response("Missing url", { status: 400, headers: CORS_HEADERS });
  }

  let upstream: URL;
  try {
    upstream = new URL(target);
  } catch {
    return new Response("Invalid url", { status: 400, headers: CORS_HEADERS });
  }

  if (!/^https?:$/.test(upstream.protocol) || !isAllowedHost(upstream.hostname)) {
    return new Response("Host not allowed", { status: 403, headers: CORS_HEADERS });
  }

  const headers: Record<string, string> = {
    Origin: "https://vidnest.fun",
    Referer: "https://vidnest.fun/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: request.headers.get("accept") || "*/*",
  };
  const range = request.headers.get("range");
  if (range) headers.Range = range;

  let res: Response;
  try {
    res = await fetch(upstream, { headers, cache: "no-store", redirect: "follow" });
  } catch (error) {
    return new Response(
      `Relay failed: ${error instanceof Error ? error.message : "unknown error"}`,
      { status: 502, headers: CORS_HEADERS }
    );
  }

  const contentType = res.headers.get("content-type") || "";
  const looksLikePlaylist =
    contentType.includes("mpegurl") || upstream.href.toLowerCase().includes(".m3u8");

  if (looksLikePlaylist || contentType.startsWith("text/") || contentType === "") {
    const buf = await res.arrayBuffer();
    const head = new TextDecoder().decode(buf.slice(0, 16));

    if (head.trimStart().startsWith("#EXTM3U")) {
      const text = new TextDecoder().decode(buf);
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
      const proto = request.headers.get("x-forwarded-proto") || (request.url.startsWith("https") ? "https" : "http");
      const origin = host ? `${proto}://${host}` : new URL(request.url).origin;
      return new Response(rewritePlaylist(text, res.url || upstream.href, origin), {
        status: res.status,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "no-store",
        },
      });
    }

    return new Response(buf, {
      status: res.status,
      headers: { ...CORS_HEADERS, "Content-Type": contentType || "application/octet-stream" },
    });
  }

  const outHeaders: Record<string, string> = { ...CORS_HEADERS };
  for (const key of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const value = res.headers.get(key);
    if (value) outHeaders[key] = value;
  }

  return new Response(res.body, { status: res.status, headers: outHeaders });
}
