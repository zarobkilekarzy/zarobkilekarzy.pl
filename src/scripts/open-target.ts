/**
 * Link do miejsca w zwiniętym <details> rozwija je przed przewinięciem: numer przypisu — listę „Przypisy”,
 * powrót z przypisu — zwiniętą odpowiedź w FAQ, `#zrodla` — listę źródeł (SourceList).
 * Rozwija też wszystkie zwinięte <details> wyżej, gdy cel leży głębiej.
 */
import { hashId } from '@/scripts/anchors';

const openTarget = (hash: string) => {
  if (!hash) return;
  let node = document.getElementById(hashId(hash))?.closest('details');
  while (node) {
    node.open = true;
    node = node.parentElement?.closest('details');
  }
};

// Rozwijamy przed domyślnym przewinięciem do kotwicy
document.addEventListener('click', (e) => {
  const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (link) openTarget(link.hash);
});
openTarget(location.hash);
