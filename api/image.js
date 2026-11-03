// Vercel serverless function: fetches a Harvard Art Museums image and serves it
// from this site, so the browser can read its pixels. Only harvard.edu hosts are allowed.
const ALLOWED = /(^|\.)harvard\.edu$/i;

// Harvard's image server blocks requests that don't look like a browser.
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 StitchStudio',
  'Accept': 'image/avif,image/webp,image/jpeg,image/png,image/*;q=0.8,*/*;q=0.5',
  'Referer': 'https://harvardartmuseums.org/'
};

// IIIF image URLs (ids.lib.harvard.edu/.../full/full/0/default.jpg) are resized in the path.
function withSize(url, size) {
  const iiif = url.pathname.match(/^(.*)\/full\/(full|max|[^/]+)\/(\d+)\/(default|color|gray)\.(jpg|png|webp)$/);
  if (iiif) {
    url.pathname = iiif[1] + '/full/!' + size + ',' + size + '/' + iiif[3] + '/' + iiif[4] + '.' + iiif[5];
    url.search = '';
  } else if (/ids\.lib\.harvard\.edu$/i.test(url.hostname) || /nrs\.harvard\.edu$/i.test(url.hostname)) {
    if (!url.searchParams.has('width')) url.searchParams.set('width', String(size));
    if (!url.searchParams.has('height')) url.searchParams.set('height', String(size));
  }
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
    let target = url.toString(); // resolve nrs.harvard.edu links first, then size the final image
    let r;
    for (let i = 0; i < 5; i++) {
      r = await fetch(target, { redirect: 'manual', headers: HEADERS });
      const loc = r.headers.get('location');
      if (r.status >= 300 && r.status < 400 && loc) {
        const next = new URL(loc, target);
        if (next.protocol !== 'https:' || !ALLOWED.test(next.hostname)) return res.status(400).send('redirect blocked');
        target = next.toString();
        continue;
      }
      break;
    }
    // Ask for a smaller copy of the final image; fall back to the full one if that fails.
    const sized = withSize(new URL(target), size).toString();
    if (sized !== target) {
      const r2 = await fetch(sized, { headers: HEADERS });
      if (r2.ok) r = r2;
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
