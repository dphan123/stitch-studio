# Stitch Studio

A browser-based crochet design tool with a real-time 3D simulation.

**Shapes mode**
- Build amigurumi-style designs from parts (sphere, ellipsoid, egg, capsule, cup, bowl, beanie, cone, disc).
- Set each part's size, position, rotation, colour and stripes, and mirror parts into pairs.
- Choose a US stitch type (sc, hdc, dc, tr) and your gauge.
- Get a written, round-by-round pattern with stitch counts, yarn estimates and assembly notes.

**Tapestry mode**
- Turn an uploaded picture into a colour chart (k-means colour reduction, optional dithering), or paint one by hand.
- Get a row-by-row tapestry crochet pattern with colour runs.

**Simulation**
- Watch the piece being worked stitch by stitch in 3D, step through stitches or rounds, scrub, and play at any speed.

Projects can be saved to the browser (localStorage).

## Run locally
Open `index.html` in a browser. No build step. It loads three.js (r128) from cdnjs and fonts from Google Fonts, so it needs an internet connection.

## Tech
Plain HTML, CSS and JavaScript in a single file, with three.js for rendering.
