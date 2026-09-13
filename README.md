# SAMI — Spatial Analysis & Mapping Intelligence
## Working prototype v0.1.0 · by JW EDS

This is the first SAMI-branded continuation of the site-planning / route-studio concept.

## What works in this build
- Responsive PWA shell for phone / tablet / desktop.
- Street + satellite base maps.
- Address/place search using OpenStreetMap Nominatim.
- Current-location positioning (HTTPS + permission required).
- Draw access route, egress route and general site routes.
- Draw site areas / constraint areas.
- Measure mapped distances.
- Draw manually identified service lines by service type.
- Add concern/hazard areas and concern pins.
- Add map notes.
- Attach camera/gallery images to map positions during the session.
- Local project saving.
- Ask SAMI text command bar.
- Ask SAMI voice recognition when the browser supports Web Speech Recognition.
- Voice/text commands can operate core map functions.
- Trusted-source routing for selected safety/construction topics: HSE, Network Rail, GOV.UK / Environment Agency.
- Safety-critical queries are not answered from unsupported model memory; source links are surfaced for verification.
- Export: DXF, GeoJSON, KML, CSV and SAMI project JSON; browser print can be used for PDF.

## Examples to Ask SAMI
- “Draw an access route.”
- “Start an egress route.”
- “Measure distance.”
- “Add a note welfare compound.”
- “Mark a concern soft ground.”
- “Guidance for working near a railway.”
- “What guidance applies to underground services?”
- “Export DXF.”

## Production integrations intentionally NOT faked in this prototype
The UI has been structured to add these next:
1. Server-side grounded AI / RAG endpoint for official-source retrieval, citations and controlled map actions.
2. NUAR / utility-owner / project utility records subject to licensing and API access.
3. Ordnance Survey Places / MasterMap and UPRN lookup where licensed.
4. Environment Agency / SEPA / NRW / NIEA flood and environmental layers.
5. Heritage, ecology, planning, rail and other constraint datasets.
6. Multi-user verified observations / contribution moderation — the “Waze for sites” layer.
7. Enterprise SSO, project permissions, audit trail and organisation workspaces.
8. Cloud project sync and collaboration.
9. Inbound CAD/GIS import including DXF/GeoJSON/KML; production DWG/IFC conversion where required.
10. Native DWG/IFC export through a server-side conversion stack. DXF is provided now for CAD interoperability.
11. what3words / OS gazetteer / customer asset databases.
12. Evidence provenance, confidence level and verification state on every externally sourced or community-contributed item.

## Important safety design principle
SAMI should distinguish:
- AUTHORITATIVE SOURCE DATA
- PROJECT-VERIFIED OBSERVATION
- COMMUNITY / FIELD OBSERVATION
- CALCULATED / DERIVED INFORMATION
- AI INFERENCE

The production system should show source, revision/date, provenance, confidence and verification state and must never imply that a community observation or AI response makes an area safe to excavate or work in.

## Hosting / installation
For full PWA, geolocation and service-worker behaviour, host these flat files at an HTTPS origin (for example GitHub Pages, Cloudflare Pages, Netlify or a company environment). Upload the CONTENTS of this folder to the host root.

On iPhone/iPad: open the HTTPS URL in Safari → Share → Add to Home Screen.

## AI connector
`config.js` contains an empty `aiEndpoint`. This is deliberate. Production AI credentials must live on a server, never inside browser JavaScript. When a secure endpoint is added, SAMI sends the query plus current project context and expects grounded answer/source/action data back.

## Brand status
SAMI is being used here as a working product brand pending final trademark/legal clearance. Do not infer registration from the TM shown in concept artwork.


## Runtime note
This prototype references Leaflet and Leaflet.Draw from public CDNs and uses online basemap/search services. The PWA shell is cacheable, but the first run and live map tiles require an internet connection. A production build should bundle the mapping libraries locally and, where required, add licensed/offline mapping packages.

## Ask SAMI interaction model
“Ask SAMI” is the user-facing interaction phrase rather than a required wake-word. Users can type or tap the microphone to ask for a map action or construction reference. The browser voice-recognition feature depends on platform/browser support. An optional spoken-response setting is available in Project.

For safety-critical questions, the prototype deliberately returns links to official/guidance sources rather than inventing prescriptive distances or controls. A production AI/RAG service should retrieve the source content server-side, retain provenance/revision metadata, quote minimally, and display citations beside each answer.
