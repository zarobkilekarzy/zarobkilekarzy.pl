import { IMPORT_PROFILES } from '../../../lib/historie/import-profiles.mjs';
import { active } from '../../../lib/historie/contract.mjs';
import { json } from '../../../lib/historie/http.mjs';
export function onRequestGet({ env }) {
  const available = active(env.HISTORIE_API_AKTYWNE) && !!env.HISTORIE_MODERACJA_DB && !!env.HISTORIE_PRYWATNE_DB &&
    !!env.TURNSTILE_HISTORIE_SITE_KEY && !!env.TURNSTILE_HISTORIE_SECRET_KEY;
  return json({ available, turnstileSiteKey: available ? env.TURNSTILE_HISTORIE_SITE_KEY : null,
    importAvailable: available && active(env.HISTORIE_IMPORT_AKTYWNY),
    importHosts: available && active(env.HISTORIE_IMPORT_AKTYWNY) ? Object.keys(IMPORT_PROFILES) : [] });
}
