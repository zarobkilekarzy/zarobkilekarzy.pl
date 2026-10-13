import { active } from '../lib/historie/contract.mjs';
import { database } from '../lib/historie/store.mjs';
import { purge } from '../lib/historie/retention.mjs';

/** Cron jest aktywowany osobno, dopiero po pomiarze CPU i przygotowaniu bindingów. */
export default {
  async scheduled(_controller, env) {
    if (!active(env.HISTORIE_RETENCJA_AKTYWNA)) return;
    const now = new Date().toISOString();
    for (const queue of ['moderacja', 'prywatne']) {
      const result = await purge(database(env, queue), { moderation: queue === 'moderacja', now });
      // Wyłącznie zbiorcze liczby; błąd kończy wywołanie i jest widoczny w Cron.
      console.log(JSON.stringify({ queue, ...result }));
    }
  },
};
