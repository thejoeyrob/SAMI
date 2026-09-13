# SAMI — site planning workspace

Version 0.2.0 · JW EDS · 13 September 2026

This complete flat PWA continues the v0.1.2 SAMI package. All files belong together at the same level. No build tools or installation of dependencies are needed to host it.

## Find the features

| Where | What you can do |
| --- | --- |
| **Map** at the top | View the site and draw directly on its geographic map. |
| **Route plan** at the top | Choose Trakway panels, dimensions and run width, then draw a route to generate full panels. |
| **Plan drawing** at the top | Fit the defined plan area into the window on a clear drawing background. The view starts locked. |
| **Library** at the top | Add panels/assets, see the materials schedule, and select existing items for editing. |
| **Map / Satellite / Drawing**, above the canvas | Change the map background without moving your drawings. |
| **Undo / Redo**, above the canvas | Reverse or restore edits. While drawing, Undo removes the last draft point. |
| **Draw**, on the side | Routes, access, egress, boundary areas, rectangles, measurements, notes, concerns and photos. |
| **Panels**, on the side | Draw a panel route or place one panel. |
| **Assets**, on the side | Welfare, offices, containers, parking, generators, toilets, skips, stages, ramps or custom footprints. |
| **Services**, on the side | Choose visible service types, draw records, import GeoJSON or load configured records in your plan area. |
| **Plan area**, on the side | Define or redefine the shared area, fit it to screen, or open its fixed drawing. |
| **Layers**, on the side | Show or hide project item types. |
| **Project** | Rename, add notes, save, restore a backup and adjust SAMI talk-back. |

The side toolbar can be dragged with its dotted handle and collapsed with its chevron. Its position is kept clear of the fixed location controls on the right. Tap a label again or use the close button to dismiss a drawer.

## Start a plan

1. Use **Find site** or the location button. Zoom to the site.
2. Open **Plan area**. Choose **Define with two corners**, then tap opposite corners of your site. Alternatively, choose **Use visible map area**.
3. Open **Route plan** to generate Trakway panels, or use **Draw** / **Assets**.
4. Tap deliberate route/boundary points and press **Finish**. For an asset, set its size and tap its exact position.
5. Switch to **Plan drawing**. The same objects appear in the same geographic positions. Draw here and those edits also appear in Map.
6. Tap an item to rename, move, rotate, edit its points or delete it. Generated panel runs can also be deleted together.

Map lock stops panning and zooming while allowing drawing. In Plan drawing it starts on. Unlock temporarily for detail work, or use Fit plan to return to the defined window.

## Add services to your area

Define a plan area first. Then open **Services**.

- **Manual record:** choose a type, enter a label and drawing/source reference, then press **Draw selected service / area**. Electricity, gas, water, drainage, telecom and overhead lines draw as lines; ecological and other restrictions draw as areas.
- **Import:** use **Import records · GeoJSON**. The file must use WGS84 longitude/latitude coordinates. Points, lines, polygons, multipart features and polygon holes are supported. Records are clipped to the plan area, and records wholly outside it are excluded. Re-importing the same filename replaces that import's records.
- **Visibility:** tick types to display them. Imported records of recognised types remain saved even when a type is hidden. A checkbox does not create utility records that have not been provided.
- **Connected records:** if an approved area-query source is configured, **Load selected layers in plan area** loads its records. It does not reload when you pan. Repeat requests use a short cache, replacing previous records from that source. Changing the area, selected types or project cancels a pending load; stale responses cannot overwrite the new state.

Recognised `serviceType` values: `electric`, `gas`, `water`, `drainage`, `telecom`, `ohl`, `ecology`, `sssi`, `tpo`, `heritage`, `archaeology`, `other`. Other fields such as `name`, `label`, `source` and `verification` are retained. Without a recognised service type, the selected import type is used.

**No live utility, NUAR, tree-protection or environmental dataset is connected by default.** Use authorised project records or configure an approved service. Manual/imported records are shown as unverified unless their records explicitly state otherwise. This is a planning display, not clearance to excavate.

## Panels and scale

Panel and asset footprints use metres on a local geographic projection. Default panel dimensions are editable. Lion, Hybrid and TuffTrak use a 3 m run direction; Sabre-X uses a 4 × 2 m footprint with 0.2 m joint overlaps by default.

Routes use full panels. Meeting segments include overlapping panels at bends. For non-Sabre turns greater than 15° and less than 60°, four extra inside panels are added on each meeting run. Sharp corners and Sabre bends are flagged for review. The app does not verify Sabre joint positions or calculate an approved lateral stagger. Check corner coverage, connections, physical product dimensions and site conditions before installation. Panel quantities count full panels, including overlaps; they are not the net covered area.

Measurements can snap to nearby panel / asset corners. Editing measurement points recalculates the displayed distance.

## Ask SAMI

There is one logo button. With an empty text field, **Ask SAMI** starts speech capture. Tap it again to stop. With typed text, the same button becomes **Send request**. Enter also sends text.

Commands include: “open panels”, “show assets”, “show services”, “define plan area”, “plan drawing”, “satellite view”, “lock map”, “unlock map”, “undo”, “redo”, “draw an access route”, “add a note welfare”, and “export DXF”.

Talk-back uses an available device voice. Choose a voice or turn it off in **Project**; the conversation also has a mute button. This package does not include a cloned or studio-recorded SAMI voice. Speech capture and playback depend on browser support and microphone permission. Typing remains available if voice capture is unavailable.

The optional AI endpoint is blank. Without it, SAMI uses local map commands and links to selected official references. It does not claim to have searched an external service.

## Save, transfer and install

- Your current project saves on this device, including compressed photos. Existing v0.1.x SAMI projects migrate when opened on the same origin. Keep a backup before changing hosting addresses.
- Use **Export → Editable SAMI backup** to transfer the complete plan to another device. Restore it under **Project**. The app has no cloud sync in this package.
- GeoJSON and KML keep geographic positions and include the plan boundary. DXF uses a local metre grid and records its longitude/latitude origin. CSV contains the materials schedule and other project records. Print / save PDF uses the drawing view.
- Unzip the package and upload **all its files together** to the same directory on your HTTPS host, such as your existing GitHub Pages repository. Replace the old app files. Do not upload only the ZIP.
- Open the hosted URL in Safari on iPad/iPhone, then **Share → Add to Home Screen**.
- If the previous app is still visible after an update, close and reopen it, then reload once while online. The revised service worker refreshes app files from the network and keeps an offline fallback.

Mapping and geometry libraries are included locally. The app shell and saved drawing work after a successful online load. Live map imagery, address search, browser-provided speech recognition and connected services still need their respective online services. This package does not cache a complete offline basemap.

## Connection configuration

`config.js` exposes optional `aiEndpoint` and `serviceSources` values. Keep private provider keys on your server. Each service source specifies a display `name`, recognised `type` and `url`. The app appends `bbox=west,south,east,north`, `crs=EPSG:4326` and `limit=10000`. The endpoint must filter to the supplied bounding box, support CORS where needed, and return GeoJSON. Client-side clipping and response limits remain in force. No API credentials are included.

## Verification for this release

Passed local JavaScript / DOM interaction tests for initialization, area creation, route generation, Undo/Redo, shared map/plan objects, map locking, asset placement/editing/deletion, manual and imported services, clipping, import replacement, bounded requests, caching, no fetch on pan, cancellation of stale responses, text commands, project round trips, export execution and v0.1.x migration. Pure geometry tests cover metric distance, complete-panel counts and clipping inside/outside boundaries.

Cloud-browser policy prevented opening the local preview. Live iPad/Safari rendering, microphone capture, voice quality, external map services and a real licensed record endpoint were not verified in this session. The responsive layout is included; device testing is still needed.

Leaflet and polygon-clipping licences are included in this package.
