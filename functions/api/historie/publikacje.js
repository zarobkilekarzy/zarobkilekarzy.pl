import { database } from '../../../lib/historie/store.mjs';
import { publicPage } from '../../../lib/historie/publication.mjs';
import { enabled, errorResponse, json } from '../../../lib/historie/http.mjs';
export async function onRequestGet({ request, env }) {
  try {
    enabled(env);
    const url = new URL(request.url);
    return json(await publicPage(database(env, 'moderacja'), {
      cursor: url.searchParams.get('cursor') ?? '',
      releaseId: url.searchParams.has('wydanie') ? url.searchParams.get('wydanie') : undefined,
    }));
  } catch (error) { return errorResponse(error); }
}
