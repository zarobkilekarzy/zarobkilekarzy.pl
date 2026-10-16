/**
 * Kontrakt starych adresów (src/data/seo/legacy-urls.ts): każdy adres dotychczasowej strony ma
 * stronę, przekierowanie albo świadome usunięcie. W trybie roboczym ostrzeżenie, w wydaniu błąd.
 */
import { exists, redirectFrom, type Finding, type Rule } from '../context';

export const legacy: Rule = (ctx) => {
  const unresolved = ctx.legacy.urls.filter((url) => !exists(ctx, url) && !redirectFrom(ctx, url) && !(url in ctx.legacy.removed));
  if (!unresolved.length) return [];
  const finding: Finding = {
    rule: 'legacy',
    level: ctx.strict ? 'error' : 'warn',
    message: `${unresolved.length} z ${ctx.legacy.urls.length} starych adresów bez strony, przekierowania ani decyzji o usunięciu`,
    pages: unresolved,
  };
  return [finding];
};
