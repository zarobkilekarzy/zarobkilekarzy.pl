import { submission } from '../../../lib/historie/contract.mjs';
import { database, receive } from '../../../lib/historie/store.mjs';
import { enabled, errorResponse, json, requestJson, turnstile } from '../../../lib/historie/http.mjs';

export async function onRequestPost({ request, env }) {
  try {
    enabled(env);
    const { data, turnstileToken, warnings } = submission(await requestJson(request));
    await turnstile(turnstileToken, env);
    const result = await receive(database(env, data.publicationRequested ? 'moderacja' : 'prywatne'), data);
    return json({ ...result, warnings }, 201);
  } catch (error) { return errorResponse(error); }
}
