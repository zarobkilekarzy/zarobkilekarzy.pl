// Tymczasowy basic auth — strona w budowie, niewidoczna publicznie.
// Login: "zarobki". Hasło NIE jest w repo — pochodzi ze zmiennej środowiskowej
// Cloudflare Pages: BASIC_AUTH_PASS (ustaw w Settings → Variables and Secrets).
// Fail-closed: dopóki hasło nie jest ustawione, nikt nie wchodzi.
const USER = 'zarobki';

export const onRequest = async (context) => {
  const { request, next, env } = context;
  const pass = env && env.BASIC_AUTH_PASS;

  if (!pass) {
    return new Response(
      'Strona w budowie. Basic auth nieskonfigurowany — ustaw zmienną BASIC_AUTH_PASS w Cloudflare Pages.',
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
