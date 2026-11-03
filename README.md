# Stitch Studio: re-stitching the Harvard Art Museums

**Live site: https://stitch-studio-tau.vercel.app**

Stitch Studio lets you pick a work from the Harvard Art Museums collection, write down why you chose it, and have a machine-learning tool re-make it as a crochet pattern. Paintings, drawings, prints and photographs become tapestry colour charts. Vessels and sculpture are traced from their photographs and become 3D pieces crocheted in the round. You can watch either one being made stitch by stitch in 3D, adjust it, and take away a written pattern that credits both the original artist and your intent.

## The idea: art is participation, not the tool

The project started from a question raised by our visit to the Harvard Art Museums: if a machine does the making, is the result still art?

My answer is that art is defined by participation and intent, not by the instrument. A brush, a loom, a camera and a machine-learning model are all tools. A work becomes art when a person chooses, with intent, what to make and why. The tool can be very capable, and it is still a tool.

The interface is built around that position:

1. **You choose.** The app opens on the collection, not on a blank canvas. Nothing happens until you pick a work.
2. **You state your intent.** The "Re-stitch" button stays locked until you write at least a sentence about why you chose the work and what your version should keep, change or say. A few suggested sentences are there to help you start, and you can edit them.
3. **The tool works in the open.** After it runs, a "Your rendition" panel lists **what the tool did** (each computational step, in plain language) next to **what you decided** (the work, the reason, the form, and every adjustment from then on). The panel ends with: *The tool did the calculating. It did not choose the work, the reason or the form. You did.*
4. **The intent becomes part of the work.** The finished pattern carries a credit line for the original artwork and the maker's intent, quoted, so the reason travels with the object.

### Art-historical background

- **Tapestry has always been a translation of painting by another medium.** Raphael's full-size cartoons (1515–16) were designed to be woven into tapestries for the Sistine Chapel in Pieter van Aelst's Brussels workshop. Weavers, not Raphael, made the finished objects. From 1662, the Gobelins Manufactory in Paris wove tapestries after paintings by court artists such as Charles Le Brun. Turning a painting into a grid of coloured stitches continues that tradition, with an algorithm doing the cartoon-to-grid step that skilled workshop staff once did.
- **The loom is part of computing's family tree.** The Jacquard loom (1804) stored patterns on punched cards, and those cards inspired Charles Babbage's Analytical Engine. Ada Lovelace wrote in 1843 that the Engine "weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves." Using a computer to produce a textile pattern brings that connection full circle.
- **Reproduction and the "aura."** Walter Benjamin argued in 1935 that mechanical reproduction strips an artwork of its aura, the authority of the unique original in its place. Stitch Studio takes the other side of that argument. Each rendition is a new, unique, hand-made object, and what gives it meaning is the maker's stated relationship to the original, not the fidelity of the copy.
- **Craft and the hierarchy of the arts.** Museums have long ranked painting and sculpture above textile work such as crochet, which has mostly been domestic and often done by women. Re-making a museum painting as crochet questions where that line sits and who gets to be counted as the artist.

### What "AI" means here

The machine-learning part of this project is classic and transparent, not generative. The app does not invent images. It uses:

- **k-means clustering**, an unsupervised machine-learning algorithm, to find a small palette of yarn colours that best represents the image or object;
- **computer-vision segmentation** to separate an object from its photographic backdrop;
- **geometric modelling** to turn an object's silhouette into crochet rounds with correctly placed increases and decreases.

Every step is listed in the interface, so the viewer can see exactly what the tool contributed and what it didn't.

## How it works

### Architecture

```
index.html          The whole front end: one HTML file with CSS and JavaScript, using three.js for 3D
api/harvard.js      Vercel serverless function: searches the Harvard Art Museums API
api/image.js        Vercel serverless function: image proxy, kept as a fallback
```

- **Searching the collection:** the page calls `/api/harvard?classification=Paintings&q=…&page=…`. This serverless function adds the secret API key on the server, asks `https://api.harvardartmuseums.org/object` for objects that have images, and returns the results. It removes Harvard's paging links before replying, because those links contain the API key. The key never reaches the browser and is not in this repository.
- **Images:** Harvard's image server allows cross-origin requests, so the browser loads artwork images directly at the size it needs and reads their pixels on a canvas. `api/image.js` is a fallback proxy. In practice Harvard's image server currently refuses requests from cloud servers, so the direct route is the one that works.

### Painting to tapestry

1. The photograph is scaled to a grid 90 stitches wide, with the height set by the picture's proportions. Each cell is one stitch.
2. k-means clustering reduces the colours to 8 yarn colours. You can change this and turn on Floyd–Steinberg dithering.
3. The grid becomes a row-by-row tapestry crochet pattern, with colour runs, yarn estimates and a finished size based on your gauge.
4. The 3D view shows the tapestry being worked stitch by stitch.

### Object to 3D piece

1. **Segmentation:** the backdrop of a museum photograph is often graded, so the app estimates the background colour row by row from the left and right edges of the photo. Pixels far enough from that colour count as object. Small gaps are closed, the largest connected region is kept, and enclosed holes (such as the space inside a handle) are filled.
2. **Silhouette:** the app finds the object's central axis using the median midpoint of its rows, refined with the rows that agree. A handle shifts the midpoint of the rows it touches, so this step ignores them. It then measures the radius at 80 heights. If one side sticks out much further than the other, as with a handle or spout, it uses the shorter side, so the body stays symmetric. A median filter removes one-row spikes, and an adjustable smoothing pass follows.
3. **Crochet geometry:** the profile is treated as a surface of revolution and walked along its length. Each round gets the number of stitches that matches its circumference at your gauge. Increases and decreases are spread evenly, and the pattern is written in standard US notation.
4. **Colour:** k-means finds up to 4 yarn colours on the object. Each band of height takes its most common colour, so decorative bands on a vase become stripes in the right places.
5. **Adjusting:** the editor shows the outline the tool found in pink, with controls for smoothing, number of colours, colours and whether the top is closed.

On a test vase with a handle on one side, the traced profile matched the true shape to within about 5% of its widest point, with the handle correctly ignored.

### The 3D simulation

three.js (r128) draws each stitch as its own small mesh, placed on the surface of the piece. Playback works stitch by stitch or round by round, and the "now" card shows the instruction for the current stitch. Large pieces switch to simplified stitches to stay smooth.

## Running it yourself

1. **Get a Harvard Art Museums API key** (free): https://harvardartmuseums.org/collections/api
2. **Fork this repository and import it into Vercel.** No build step is needed.
3. **Add the key:** in Vercel, go to Settings → Environment Variables and add `HARVARD_API_KEY` with your key as the value.
4. **Redeploy:** in Deployments, open the "…" menu on the latest deployment and choose Redeploy.

Opening `index.html` directly from disk shows the interface, but the collection only loads on a deployment, because it needs the `/api` routes.

## Limitations

- Tracing works best on a single object photographed on a plain backdrop. Busy backgrounds, several objects in one photo, or very pale objects on a pale backdrop can confuse it. If that happens, the app says so and you can make a tapestry instead.
- A traced object is always a body of revolution: round in plan, like a vase or bowl. Figurative sculpture is simplified to its silhouette.
- Colours come from museum photographs, so lighting and photography affect them. You can change any colour by hand.

## Credits

- Collection data and images: [Harvard Art Museums API](https://harvardartmuseums.org/collections/api). Every pattern credits the original work, the artist, the date and a link to the object page.
- 3D rendering: [three.js](https://threejs.org/).
- Built for a course on art history and software at Harvard, November 2026.
