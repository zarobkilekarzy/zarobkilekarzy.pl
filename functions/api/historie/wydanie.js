import { object } from '../../../lib/historie/contract.mjs';
import { database } from '../../../lib/historie/store.mjs';
import { release } from '../../../lib/historie/publication.mjs';
import { enabled, authorizeRelease, errorResponse, json, requestJson } from '../../../lib/historie/http.mjs';
export async function onRequestPost({ request, env }) {
  try {
    enabled(env); authorizeRelease(request, env);
    const body = object(await requestJson(request), ['releaseId']);
    return json(await release(database(env, 'moderacja'), body.releaseId));
  } catch (error) { return errorResponse(error); }
}
