// Netlify Function: /.netlify/functions/maps
// Simple maps API backed by Netlify Blobs.
// Password gate via 'x-ps-pass' header. Not real auth — just casual friction.

import { getStore } from '@netlify/blobs';

const PASSWORD = 'lbi2027';
const STORE_NAME = 'plot-and-scheme-maps';

export default async (req) => {
  // Password check
  const pass = req.headers.get('x-ps-pass');
  if (pass !== PASSWORD) {
    return json({ error: 'unauthorized' }, 401);
  }

  const store = getStore(STORE_NAME);
  const url = new URL(req.url);
  const method = req.method;

  try {
    // GET /maps → return all maps as array
    if (method === 'GET') {
      const { blobs } = await store.list();
      const maps = [];
      for (const b of blobs) {
        const raw = await store.get(b.key, { type: 'json' });
        if (raw) maps.push(raw);
      }
      return json({ maps });
    }

    // POST /maps → save/update a single map. Body is the map object.
    if (method === 'POST') {
      const map = await req.json();
      if (!map || !map.id) return json({ error: 'missing id' }, 400);
      await store.setJSON(map.id, map);
      return json({ ok: true });
    }

    // DELETE /maps?id=... → remove a map
    if (method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) return json({ error: 'missing id' }, 400);
      await store.delete(id);
      return json({ ok: true });
    }

    return json({ error: 'method not allowed' }, 405);
  } catch (err) {
    console.error(err);
    return json({ error: String(err.message || err) }, 500);
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

export const config = { path: '/.netlify/functions/maps' };
