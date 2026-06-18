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

export const onRequest = async (context) => {
  const { request, next, env } = context;

  // Przełącznik wyłączony → przepuszczamy ruch bez logowania.
  if (!isAuthEnabled(env)) {
    return next();
  }

  const pass = env && env.BASIC_AUTH_PASS;

  if (!pass) {
    return new Response(
      'Strona w budowie. Basic auth nieskonfigurowany — ustaw zmienną BASIC_AUTH_PASS w Cloudflare Pages (albo wyłącz ochronę: BASIC_AUTH_ENABLED=false).',
      { status: 503, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  const expected = 'Basic ' + btoa(`${USER}:${pass}`);
  const got = request.headers.get('Authorization') || '';
  if (got !== expected) {
    return new Response('Strona w budowie — wymagane logowanie.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="zarobkilekarzy (wersja robocza)", charset="UTF-8"',
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
  return next();
};
