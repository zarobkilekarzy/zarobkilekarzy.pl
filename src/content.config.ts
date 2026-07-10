import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

// Baza artykułów = rdzeń serwisu. Każdy wpis to odnośnik do
// OGÓLNODOSTĘPNEGO materiału źródłowego (prasa, raport, dane publiczne).
// Wpisy oznaczone `example: true` to placeholdery do podmiany na realne źródła.
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    // Nazwa wydawcy/źródła, np. "Najwyższa Izba Kontroli", "dziennik ogólnopolski".
    source: z.string(),
    sourceType: z.enum(['prasa', 'raport', 'analiza', 'dane', 'wideo', 'social']),
    // Pełny adres do oryginalnego, ogólnodostępnego materiału.
    url: z.url(),
    date: z.coerce.date(),
    excerpt: z.string(),
    category: z.enum([
      'wieloetatowosc',
      'kontrakty',
      'kolejki',
      'wynagrodzenia',
      'system',
    ]),
    tags: z.array(z.string()).default([]),
    // Czy to materiał poglądowy (do zastąpienia realnym źródłem)?
    example: z.boolean().default(false),
  }),
});

// Warstwa danych o zarobkach = ustrukturyzowane, oźródłowane liczby.
// Każdy wpis to JEDNA liczba (lub jeden wiersz per specjalizacja) z linkiem do
// ogólnodostępnego źródła. Zasada „żadnej liczby bez źródła" jest WYMUSZONA przez
// schemat (pole `zrodloUrl` wymagane). Rozróżnienie exact/szacunek jest obowiązkowe —
// nie mieszamy pomiarów regulowanych (rozporządzenie) z ankietowymi/ogłoszeniowymi.

// Ogólne punkty danych: rozkład, rekordy, budżet, kolejki, stawki, porównania.
// Jeden plik JSON (obiekt kluczowany po id) — łatwy do masowej edycji i rozbudowy.
const zarobki = defineCollection({
  loader: file('./src/content/zarobki.json'),
  schema: z.object({
    etykieta: z.string(),
    grupa: z.enum([
      'rozklad',      // rozkład wynagrodzeń (rezydent → mediana → górny 1%)
      'rekord',       // udokumentowane rekordowe rozliczenia (bez nazwisk)
      'budzet',       // budżet NFZ, koszt ustawy płacowej
      'kolejki',      // czas oczekiwania
      'stawka',       // stawki rynkowe zł/h, dyżury
      'porownanie',   // Polska na tle UE/OECD, koszt hipotetyczny
      'rezydent',     // regulowane pensje rezydentów
      'zadluzenie',   // dług publicznych szpitali
      'personel',     // inni pracownicy OZ — drabina taryfowa ustawy (piel., ratownicy, diagności…)
    ]),
    kwota: z.number(),
    jednostka: z.enum(['zł/mies.', 'zł/h', 'zł/dzień', 'zł/rok', 'zł/dyżur', 'mies.', 'mld zł', 'lek./1000', '%', 'x']),
    // Współczynnik pracy z załącznika do ustawy o najniższym wynagrodzeniu (grupa 'personel').
    wspolczynnik: z.number().optional(),
    forma: z.enum(['etat', 'kontrakt', 'umowa cywilnoprawna', 'oświadczenie majątkowe', '—']).optional(),
    rola: z.string().optional(),
    specjalizacja: z.string().optional(),
    region: z.string().optional(),
    rok: z.number(),
    // Twarda zasada z research: nie mieszać liczby regulowanej ze szacunkiem.
    status: z.enum(['exact', 'szacunek']),
    // Fakt ≠ zarzut: rozliczenia w postępowaniu oznaczamy jako zarzut.
    statusFaktu: z.enum(['fakt', 'zarzut']).default('fakt'),
    zrodloUrl: z.url(),
    zrodloNazwa: z.string(),
    uwaga: z.string().optional(),
    kolejnosc: z.number().default(0),
  }),
});

// Per specjalizacja: złączone metryki (pensja rezydenta EXACT + stawka rynkowa
// SZACUNEK + miejsca + konkurencja + kolejka). Każda metryka ma własne źródło.
const specjalizacje = defineCollection({
  loader: file('./src/content/specjalizacje.json'),
  schema: z.object({
    nazwa: z.string(),
    // Priorytetowa = państwo płaci rezydentowi więcej i otwiera więcej miejsc.
    priorytetowa: z.boolean(),
    // Pensja rezydenta: regulowana, brutto, 1–2 rok, od 1 VII 2025 (EXACT).
    pensjaRezydent: z.number(),
    pensjaRezydentZrodlo: z.url(),
    // Stawka rynkowa zł/h: SZACUNEK (ogłoszenia, ~90% prywatne) — nie wypłata.
    stawkaRynkowa: z.number().optional(),
    stawkaRynkowaSesja: z.string().optional(),
    stawkaRynkowaZrodlo: z.url().optional(),
    stawkaRynkowaUwaga: z.string().optional(),
    miejscaRezydenckie: z.number().optional(),
    miejscaOgolem: z.number().optional(),
    miejscaSesja: z.string().optional(),
    miejscaZrodlo: z.url().optional(),
    // Chętnych na miejsce (konkurencja).
    konkurencja: z.number().optional(),
    konkurencjaSesja: z.string().optional(),
    konkurencjaZrodlo: z.url().optional(),
    kolejkaNFZ: z.string().optional(),
    kolejkaZrodlo: z.url().optional(),
    uwaga: z.string().optional(),
    kolejnosc: z.number().default(0),
  }),
});

export const collections = { articles, zarobki, specjalizacje };
