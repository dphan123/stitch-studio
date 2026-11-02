// Vercel serverless function: searches the Harvard Art Museums collection.
// The API key stays on the server as the HARVARD_API_KEY environment variable.
const BASE = 'https://api.harvardartmuseums.com/object';
const FIELDS = 'id,title,people,dated,classification,primaryimageurl,url,objectnumber,medium,dimensions,culture,division,imagecount';

module.exports = async function handler(req, res) {
  const key = process.env.HARVARD_API_KEY;
  if (!key) return res.status(500).json({ error: 'missing_key' });

  const q = req.query || {};
  const params = new URLSearchParams();
  params.set('apikey', key);
  params.set('hasimage', '1');
  params.set('fields', FIELDS);
  params.set('size', String(Math.min(Math.max(parseInt(q.size, 10) || 24, 1), 48)));
  params.set('page', String(Math.max(parseInt(q.page, 10) || 1, 1)));
  if (q.classification) params.set('classification', String(q.classification).slice(0, 60));
  if (q.q) params.set('q', String(q.q).slice(0, 120));

  const call = (withSort) => {
    const p = new URLSearchParams(params);
    if (withSort) { p.set('sort', 'rank'); p.set('sortorder', 'desc'); }
    return fetch(BASE + '?' + p.toString());
  };

  try {
    // Popular items first when browsing; relevance order when searching.
    let r = await call(!q.q);
    if (!r.ok && !q.q) r = await call(false);
    if (!r.ok) return res.status(502).json({ error: 'upstream_' + r.status });
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: 'fetch_failed' });
  }
};
