import { active, HistoryError, object } from '../../../lib/historie/contract.mjs';
import { importSource, importUrl } from '../../../lib/historie/import.mjs';
import { enabled, errorResponse, json, requestJson, turnstile } from '../../../lib/historie/http.mjs';
export async function onRequestPost({ request, env }) {
  try {
    enabled(env);
    if (!active(env.HISTORIE_IMPORT_AKTYWNY)) throw new HistoryError(503, 'import-disabled');
    const body = object(await requestJson(request), ['url', 'turnstileToken']);
    importUrl(body.url); // odrzucenie hosta przed siecią i Siteverify
    await turnstile(body.turnstileToken, env);
    return json(await importSource(body.url));
  } catch (error) { return errorResponse(error); }
}
