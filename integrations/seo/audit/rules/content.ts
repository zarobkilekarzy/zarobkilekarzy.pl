/** Treść strony: dokładnie jeden <h1>, obrazki z alt i istniejącym plikiem. */
import { contentPages, internalPath, type Finding, type Rule } from '../context';

export const content: Rule = (ctx) => {
  const out: Finding[] = [];
  for (const p of contentPages(ctx)) {
    if (p.h1 !== 1) out.push({ rule: 'content', level: 'error', message: `liczba <h1>: ${p.h1} (ma być 1)`, pages: [p.path] });

    const noAlt = p.images.filter((img) => img.alt === undefined).length;
    if (noAlt) out.push({ rule: 'content', level: 'warn', message: `${noAlt} obrazków bez atrybutu alt (dekoracyjne: alt="")`, pages: [p.path] });

    for (const img of p.images) {
      const path = img.src && internalPath(img.src, p.path, ctx.site);
      if (path && !ctx.files.has(path)) out.push({ rule: 'content', level: 'error', message: `obrazek nie istnieje w buildzie: ${path}`, pages: [p.path] });
    }
  }
  return out;
};
