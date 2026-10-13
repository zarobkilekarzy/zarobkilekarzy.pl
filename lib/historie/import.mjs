import { fail, HistoryError, httpsUrl, LIMITS, normalize } from './contract.mjs';
import { IMPORT_PROFILES, OMIT_SELECTOR } from './import-profiles.mjs';
import { decodeHTML } from 'entities';

export const FETCH_LIMITS = Object.freeze({ bytes: 1024 * 1024, redirects: 3, timeout: 8000, jsonldBytes: 64 * 1024, jsonldTotal: 128 * 1024 });

export function importUrl(value) {
  const url = new URL(httpsUrl(value, 'url') ?? fail('required', 'url'));
  // URL normalizuje także alternatywne zapisy IPv4. Tylko dokładne nazwy hostów.
  if (!Object.hasOwn(IMPORT_PROFILES, url.hostname)) fail('host-not-allowed', 'url', 403);
  url.hash = '';
  const profile = IMPORT_PROFILES[url.hostname];
  if (profile.adapter === 'x' && !/^\/[A-Za-z0-9_]{1,15}\/status\/\d+\/?$/.test(url.pathname)) fail('invalid-post-url', 'url');
  return url;
}

/** Ogranicza rozpakowany strumień także przy brakującym/fałszywym Content-Length. */
export async function boundedText(response, max = FETCH_LIMITS.bytes) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0; let result = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > max) { await reader.cancel(); fail('source-too-large', 'url', 413); }
      result += decoder.decode(value, { stream: true });
    }
    return result + decoder.decode();
  } finally { reader.releaseLock(); }
}

async function fetchSource(url, signal, fetcher) {
  for (let redirects = 0; ; redirects++) {
    const response = await fetcher(url.href, { redirect: 'manual', signal,
      headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': 'zarobkilekarzy-historie/1.0' } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location || redirects >= FETCH_LIMITS.redirects) fail('redirect-limit', 'url');
      url = importUrl(new URL(location, url).href);
      continue;
    }
    if (!response.ok) { await response.body?.cancel(); throw new HistoryError(503, 'source-unavailable', 'url', true); }
    if (!/^(text\/html|application\/xhtml\+xml)(;|$)/i.test(response.headers.get('content-type') ?? '')) {
      await response.body?.cancel(); fail('unsupported-source-type', 'url');
    }
    return { html: await boundedText(response), url };
  }
}

function capped(value) {
  const characters = [...normalize(value)];
  return { excerpt: characters.slice(0, LIMITS.excerpt).join(''), truncated: characters.length > LIMITS.excerpt };
}
function addText(collector, value) {
  // Limit wejściowego HTML jest już egzekwowany; nie obcinamy przed dekodowaniem encji.
  const remaining = FETCH_LIMITS.bytes - collector.value.length;
  collector.value += value.slice(0, remaining);
  if (value.length > remaining) collector.overflow = true;
}

/** Native HTMLRewriter. Konkatenacja fragmentów węzłów, bez dodawania spacji między chunkami. */
async function selectedText(html, selector) {
  const roots = [];
  const stack = [];
  let omitted = 0;
  const rewriter = new HTMLRewriter()
    .on(selector, { element(element) {
      const collector = { value: '', overflow: false };
      roots.push(collector); stack.push(collector);
      element.onEndTag(() => { stack.splice(stack.indexOf(collector), 1); });
    }, text(chunk) {
      if (!omitted && roots.length === 1) for (const collector of stack) addText(collector, chunk.text);
    } })
    .on(OMIT_SELECTOR, { element(element) {
      omitted++;
      element.onEndTag(() => { omitted--; });
      // Wszystkie wykluczone elementy w profilu mają znacznik końcowy lub są puste.
      if (['input', 'img', 'br', 'hr', 'meta', 'link'].includes(element.tagName)) omitted--;
    } })
    .on('p,div,section,h1,h2,h3,h4,li,blockquote,br', { element(element) {
      if (!omitted) for (const collector of stack) addText(collector, '\n');
      element.onEndTag(() => { if (!omitted) for (const collector of stack) addText(collector, '\n'); });
    } });
  await rewriter.transform(new Response(html)).arrayBuffer();
  if (roots.length !== 1) return null;
  const result = capped(decodeHTML(roots[0].value).replace(/[\t\f\v ]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n'));
  return { ...result, truncated: result.truncated || roots[0].overflow };
}

function samePage(value, url) {
  if (typeof value !== 'string') return false;
  try {
    const candidate = new URL(value, url); candidate.hash = '';
    return candidate.origin === url.origin && candidate.pathname.replace(/\/$/, '') === url.pathname.replace(/\/$/, '');
  } catch { return false; }
}
function articleBodies(data, url) {
  const bodies = [];
  const stack = [data]; let nodes = 0;
  while (stack.length) {
    const node = stack.pop();
    if (++nodes > 256) return [];
    if (Array.isArray(node)) { stack.push(...node); continue; }
    if (!node || typeof node !== 'object') continue;
    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
    if (types.some((type) => ['Article', 'NewsArticle', 'BlogPosting'].includes(type)) && typeof node.articleBody === 'string') {
      const page = node.mainEntityOfPage;
      const identity = typeof page === 'object' ? page?.['@id'] : page;
      if (samePage(identity ?? node.url ?? node['@id'], url)) bodies.push(node.articleBody);
    }
    // Nie zagłębiamy się w komentarze i rekomendacje z dowolnych właściwości.
    if (node['@graph']) stack.push(node['@graph']);
    if (node.mainEntity) stack.push(node.mainEntity);
  }
  return bodies;
}

export async function extractHtml(html, url) {
  const scripts = []; let total = 0;
  await new HTMLRewriter().on('script[type="application/ld+json"]', {
    element(element) {
      const collector = { value: '', bytes: 0, oversized: scripts.length >= 32 };
      scripts.push(collector);
      element.onEndTag(() => {});
    }, text(chunk) {
      const collector = scripts.at(-1);
      if (!collector) return;
      const size = new TextEncoder().encode(chunk.text).byteLength;
      total += size;
      collector.bytes += size;
      if (total > FETCH_LIMITS.jsonldTotal || collector.bytes > FETCH_LIMITS.jsonldBytes) collector.oversized = true;
      if (!collector.oversized) collector.value += chunk.text;
    },
  }).transform(new Response(html)).arrayBuffer();
  const bodies = [];
  for (const script of scripts) {
    if (script.oversized) continue;
    try { bodies.push(...articleBodies(JSON.parse(script.value), url)); } catch { /* Niepoprawny JSON-LD: profil HTML. */ }
  }
  if (bodies.length === 1) {
    const cleaned = await selectedText(`<article>${bodies[0]}</article>`, 'article');
    if (cleaned?.excerpt) return { ...cleaned, extractor: 'jsonld' };
  }
  const selector = IMPORT_PROFILES[url.hostname]?.selector;
  if (selector) {
    const cleaned = await selectedText(html, selector);
    if (cleaned?.excerpt) return { ...cleaned, extractor: 'html-rewriter' };
  }
  fail('main-content-not-found', 'url');
}

async function xPost(url, signal, fetcher) {
  const post = new URL(url.href); post.hostname = 'x.com'; post.search = '';
  const endpoint = new URL('https://publish.x.com/oembed');
  endpoint.search = new URLSearchParams({ url: post.href, omit_script: '1', hide_thread: 'true' }).toString();
  const response = await fetcher(endpoint.href, { redirect: 'manual', signal, headers: { Accept: 'application/json' } });
  if (!response.ok || (response.headers.get('content-type') ?? '').split(';')[0] !== 'application/json') {
    await response.body?.cancel(); throw new HistoryError(503, 'post-unavailable', 'url', true);
  }
  let data;
  try { data = JSON.parse(await boundedText(response, 128 * 1024)); } catch (error) {
    if (error instanceof HistoryError) throw error;
    throw new HistoryError(503, 'post-unavailable', 'url', true);
  }
  if (typeof data.html !== 'string') fail('post-content-not-found', 'url');
  // Główny paragraf; stopka autora, media i cytowane/osadzone wpisy zostają poza wyborem.
  const cleaned = await selectedText(data.html, 'blockquote.twitter-tweet > p');
  if (!cleaned?.excerpt) fail('post-content-not-found', 'url');
  return { ...cleaned, extractor: 'x-oembed', url: post.href,
    providerLimited: /(?:…|\.\.\.)\s*(?:https?:\/\/\S+)?$/.test(cleaned.excerpt) };
}

export async function importSource(value, fetcher = fetch) {
  const url = importUrl(value);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_LIMITS.timeout);
  try {
    let result; let finalUrl;
    if (IMPORT_PROFILES[url.hostname].adapter === 'x') {
      result = await xPost(url, controller.signal, fetcher); finalUrl = result.url;
    } else {
      const fetched = await fetchSource(url, controller.signal, fetcher);
      result = await extractHtml(fetched.html, fetched.url); finalUrl = fetched.url.href;
    }
    return { source: { url: finalUrl, description: new URL(finalUrl).hostname,
      excerpt: result.excerpt, extractor: result.extractor, truncated: result.truncated || !!result.providerLimited },
      providerLimited: !!result.providerLimited };
  } catch (error) {
    if (error instanceof HistoryError) throw error;
    throw new HistoryError(503, 'import-unavailable', 'url', true);
  } finally { clearTimeout(timer); }
}
