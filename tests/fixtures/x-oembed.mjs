/** Syntetyczne odpowiedzi oEmbed. Żaden test regresyjny nie łączy się z X. */
const mainPost = '<blockquote class="twitter-tweet"><p lang="pl">Syntetyczny wpis X &amp; tylko jego treść.</p>&mdash; Autor testowy <a href="#">DATA_TESTOWA</a></blockquote>';
export const xFixtures = {
  single: {
    url: 'https://x.com/HistorieTest/status/123',
    excerpt: 'Syntetyczny wpis X & tylko jego treść.',
    html: mainPost + '<section id="comments"><p>KOMENTARZ_INNEJ_OSOBY</p></section>',
  },
  multiple: {
    url: 'https://x.com/HistorieTest/status/124',
    html: mainPost + '<blockquote class="twitter-tweet"><p>ODPOWIEDŹ_INNEJ_OSOBY</p></blockquote>',
  },
  quoted: {
    url: 'https://x.com/HistorieTest/status/125',
    html: '<blockquote class="twitter-tweet"><p>GŁÓWNY_WPIS</p><blockquote class="twitter-tweet"><p>CYTOWANY_CUDZY_WPIS</p></blockquote></blockquote>',
  },
};
