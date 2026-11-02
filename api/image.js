// Vercel serverless function: fetches a Harvard Art Museums image and serves it
// from this site, so the browser can read its pixels. Only harvard.edu hosts are allowed.
const ALLOWED = /(^|\.)harvard\.edu$/i;

function withSize(url, size) {
  if (!url.searchParams.has('width')) url.searchParams.set('width', String(size));
  if (!url.searchParams.has('height')) url.searchParams.set('height', String(size));
  return url;
}

module.exports = async function handler(req, res) {
  const { u, w } = req.query || {};
  if (!u) return res.status(400).send('missing url');
  let url;
  try { url = new URL(String(u)); } catch (e) { return res.status(400).send('bad url'); }
  if (url.protocol !== 'https:' || !ALLOWED.test(url.hostname)) return res.status(400).send('host not allowed');
  const size = Math.min(Math.max(parseInt(w, 10) || 600, 64), 1000);

  try {
    let target = withSize(url, size).toString();
    let r;
    for (let i = 0; i < 4; i++) {
      r = await fetch(target, { redirect: 'manual' });
      const loc = r.headers.get('location');
      if (r.status >= 300 && r.status < 400 && loc) {
        const next = new URL(loc, target);
        if (next.protocol !== 'https:' || !ALLOWED.test(next.hostname)) return res.status(400).send('redirect blocked');
        target = withSize(next, size).toString();
        continue;
      }
      break;
    }
    if (!r.ok) return res.status(502).send('upstream ' + r.status);
    const type = r.headers.get('content-type') || 'image/jpeg';
    if (!/^image\//.test(type)) return res.status(502).send('not an image');
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(502).send('fetch failed');
  }
};
