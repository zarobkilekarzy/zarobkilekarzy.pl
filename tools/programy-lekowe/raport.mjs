// Zgłaszanie problemów archiwum w GitHub Issues: node tools/programy-lekowe/raport.mjs <raport.json>
// (zmienne GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_RUN_ID).
// Repozytorium jest publiczne, więc zgłoszenia są techniczne: raport nie zawiera nazw szpitali.
//   - błąd: otwiera zgłoszenie albo dopisuje komentarz, a następny udany przebieg je zamyka;
//   - ostrzeżenia: osobne zgłoszenie, które zamyka człowiek, bo wymaga przeczytania danych.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const TYTUL_BLAD = 'Dane NFZ: błąd archiwum list oczekujących';
export const TYTUL_OSTRZEZENIA = 'Dane NFZ: do sprawdzenia w archiwum list oczekujących';

export function trescRaportu(r, linkPrzebiegu) {
  const linie = [`Okres: ${r.okres ?? 'nieznany'}. Surowe pliki zapisane: ${r.zapisanoSurowe ? 'tak' : 'nie'}. Dane zapisane: ${r.zapisanoDane ? 'tak' : 'nie'}.`, ''];
  for (const b of r.bledy ?? []) linie.push(`- ${b}`);
  for (const o of r.ostrzezenia ?? []) linie.push(`- ${o.opis}`);
  if (linkPrzebiegu) linie.push('', `Przebieg: ${linkPrzebiegu}`);
  return linie.join('\n');
}

export async function zglos(r, { repo, token, runId, fetchFn = fetch }) {
  const api = async (sciezka, metoda = 'GET', tresc) => {
    const odp = await fetchFn(`https://api.github.com/repos/${repo}${sciezka}`, {
      method: metoda,
      headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', 'user-agent': 'archiwum-nfz' },
      body: tresc ? JSON.stringify(tresc) : undefined,
    });
    if (!odp.ok) throw new Error(`GitHub ${metoda} ${sciezka}: HTTP ${odp.status}`);
    return odp.json();
  };
  const otwarte = await api('/issues?state=open&per_page=100');
  const znajdz = (tytul) => otwarte.find((i) => i.title === tytul && !i.pull_request);
  const link = runId ? `https://github.com/${repo}/actions/runs/${runId}` : '';
  const tresc = trescRaportu(r, link);
  const dzialania = [];

  const otworzLubDopisz = async (tytul) => {
    const i = znajdz(tytul);
    if (i) await api(`/issues/${i.number}/comments`, 'POST', { body: tresc });
    else await api('/issues', 'POST', { title: tytul, body: tresc });
    dzialania.push(i ? `komentarz w #${i.number}` : `nowe zgłoszenie: ${tytul}`);
  };

  if (r.status === 'blad') {
    await otworzLubDopisz(TYTUL_BLAD);
  } else {
    const i = znajdz(TYTUL_BLAD);
    if (i) {
      await api(`/issues/${i.number}/comments`, 'POST', { body: `Kolejny przebieg przeszedł poprawnie (${r.status}).${link ? ` ${link}` : ''}` });
      await api(`/issues/${i.number}`, 'PATCH', { state: 'closed' });
      dzialania.push(`zamknięto #${i.number}`);
    }
  }
  if (r.ostrzezenia?.length) await otworzLubDopisz(TYTUL_OSTRZEZENIA);
  return dzialania;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const plik = process.argv[2] ?? 'raport.json';
  // Brak raportu znaczy, że przebieg padł wcześniej (np. token albo testy), i to też trzeba zgłosić.
  const r = existsSync(plik) ? JSON.parse(readFileSync(plik, 'utf8')) : { status: 'blad', bledy: ['Przebieg zakończył się bez raportu. Szczegóły w logu.'], ostrzezenia: [] };
  const { GITHUB_TOKEN: token, GITHUB_REPOSITORY: repo, GITHUB_RUN_ID: runId, STAN_ZADANIA: stan } = process.env;
  // Np. nieudany push: raport mówi o dobrych danych, ale nie zostały zapisane.
  if (stan && stan !== 'success' && r.status !== 'blad') {
    r.status = 'blad';
    r.bledy = [...(r.bledy ?? []), 'Któryś krok przebiegu się nie powiódł, dane mogły się nie zapisać. Szczegóły w logu.'];
  }
  console.log(await zglos(r, { repo, token, runId }));
}
