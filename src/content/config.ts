import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Baza artykułów = rdzeń serwisu. Każdy wpis to odnośnik do
// OGÓLNODOSTĘPNEGO materiału źródłowego (prasa, raport, dane publiczne).
// Wpisy oznaczone `example: true` to placeholdery do podmiany na realne źródła.
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    // Nazwa wydawcy/źródła, np. "Najwyższa Izba Kontroli", "dziennik ogólnopolski".
    source: z.string(),
    sourceType: z.enum(['prasa', 'raport', 'analiza', 'dane', 'wideo']),
    // Pełny adres do oryginalnego, ogólnodostępnego materiału.
    url: z.string().url(),
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

export const collections = { articles };
