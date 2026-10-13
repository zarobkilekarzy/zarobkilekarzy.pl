import { appendFile } from 'node:fs/promises';
// Stub wyłącznie testowy; nie importuje go żaden workflow ani kod produkcyjny.
globalThis.fetch = async (url, options) => {
  if (process.env.TEST_FEED_FAILURE) throw new Error('unavailable');
  if (String(url).endsWith('/wydanie')) {
    const payload = JSON.parse(options.body);
    if (process.env.TEST_TRACE) await appendFile(process.env.TEST_TRACE, JSON.stringify(payload) + '\n');
    return Response.json({ releaseId: payload.releaseId, count: 1 });
  }
  return Response.json({ version: 1, releaseId: process.env.TEST_FEED_RELEASE || null,
    items: process.env.TEST_FEED_RELEASE ? [{}] : [], nextCursor: null });
};
