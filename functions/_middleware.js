// Tymczasowy basic auth — strona w budowie, niewidoczna publicznie.
// Login: "zarobki". Hasło NIE jest w repo — pochodzi ze zmiennej środowiskowej
// Cloudflare Pages: BASIC_AUTH_PASS (ustaw w Settings → Variables and Secrets).
//
// Przełącznik: BASIC_AUTH_ENABLED steruje ochroną.
//   • "false" / "0" / "off" / "no"  → auth WYŁĄCZONY (strona otwarta),
//   • dowolna inna wartość lub brak   → auth WŁĄCZONY (domyślnie, fail-safe).
// Dzięki temu literówka lub brak zmiennej NIE odsłania strony — wyłączenie
// ochrony musi być świadomą decyzją.
//
// Fail-closed: gdy auth jest włączony, a hasło nieustawione — nikt nie wchodzi.
const USER = 'zarobki';

// Domyślnie chronimy. Wyłączyć ochronę można tylko JAWNĄ wartością "fałszywą".
const isAuthEnabled = (env) => {
  const raw = String((env && env.BASIC_AUTH_ENABLED) ?? '').trim().toLowerCase();
  return !['false', '0', 'off', 'no'].includes(raw);
};

// Nagłówki bezpieczeństwa dodawane do KAŻDEJ odpowiedzi (także auth i /api).
// Dobrane pod realne zasoby strony, żeby nic nie łamać:
//   • script-src 'unsafe-inline' — Astro inline'uje małe skrypty modułowe (widżet Sonda,
//     licznik przejść do źródeł); ich hash zmienia się co build, a CSP siedzi tu, poza
//     buildem — hash na sztywno cicho zepsułby te skrypty. JSON-LD (application/ld+json)
//     CSP i tak nie dotyczy. + host Cloudflare Turnstile (zewnętrzny skrypt widżetu).
//   • style-src  'unsafe-inline' — Astro inline'uje małe arkusze i mamy atrybuty style="",
//   • img-src    img.youtube.com — miniatury filmów; data: — favicony/inline SVG,
//   • frame/connect Turnstile    — widżet antybotowy.
// XFO: DENY (starsze skanery) DUBLUJE frame-ancestors 'none' z CSP (nowocześni klienci).
// HSTS: 1 rok + subdomeny, bez `preload` — wdrożenie odwracalne (patrz hstspreload.org).
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: https://img.youtube.com",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Response z fetch()/next() ma niemutowalne nagłówki — klonujemy, by je dopisać.
const withSecurityHeaders = (response) => {
  const res = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(name, value);
  }
  return res;
};

export const onRequest = async (context) => {
  const { request, next, env } = context;

  // Przełącznik wyłączony → przepuszczamy ruch bez logowania.
  if (!isAuthEnabled(env)) {
    return withSecurityHeaders(await next());
  }

  const pass = env && env.BASIC_AUTH_PASS;

  if (!pass) {
    return withSecurityHeaders(new Response(
      'Strona w budowie. Basic auth nieskonfigurowany — ustaw zmienną BASIC_AUTH_PASS w Cloudflare Pages (albo wyłącz ochronę: BASIC_AUTH_ENABLED=false).',
      { status: 503, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' } }
    ));
  }

  const expected = 'Basic ' + btoa(`${USER}:${pass}`);
  const got = request.headers.get('Authorization') || '';
  if (got !== expected) {
    return withSecurityHeaders(new Response('Strona w budowie — wymagane logowanie.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="zarobkilekarzy (wersja robocza)", charset="UTF-8"',
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    }));
  }
  return withSecurityHeaders(await next());
};
