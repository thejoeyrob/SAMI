# SAMI v0.6.0 · Drawing UX & grouping completion report

## Base retained
This is a progressive enhancement of **SAMI v0.5.0 — Public Services + Document Engine**. Existing HGV Route to Site, bounded CAD capture, services provenance/snapshots, Ask SAMI, project persistence, export formats and the two-page PDF Document Engine remain in place.

## 1. Trakway grouping / hidden generators
- Every Trakway run or filled panel area creates a group ID shared by its generated panels.
- Existing v0.5 Trakway runs migrate to the group model on project load.
- Generation centre-lines / fill outlines are stored as `guideHidden` metadata and do not remain visibly drawn once panels are generated.
- Hidden Trakway generator geometry is also excluded by the Document Engine.
- Group controls support move, duplicate, add another item, ungroup and delete complete run.

## 2. Generic group / ungroup
- Normal SAMI drawing objects and placed assets can be grouped.
- A selected group highlights as one selection and exposes a central drag-to-move control.
- More controls provide Duplicate, Add another item to group, Ungroup and Delete.
- Duplicated Trakway groups receive new group/route identifiers so the copy remains independently editable.

## 3. Site Drawing frame
- Defined Site Drawing area defaults to **A-series landscape ratio 420:297**.
- Freehand site-area drawing now defines an extent; the irregular trace does not become the permanent site boundary.
- Point-drop site-area mode supports **Close shape**, then fits the landscape frame around the points.
- Two-corner and visible-view methods also use the ratio lock.
- Aspect ratio can be explicitly unlocked.
- Older project areas with no aspect-ratio preference are migrated to the landscape ratio while preserving their centre and containing extent.
- **Clear defined site area** removes the frame and stored CAD base while retaining project items/services/routes; Undo remains available.

## 4. Drawing methods and object-first UI
- Access: Point line / Freehand line.
- Egress: Point line / Freehand line.
- On-site route: Point line / Freehand line.
- Stone road: Point line / Freehand line + width.
- Stone area: Point area / Freehand area.
- General area / compound: Point area / Freehand area.
- Concern / exclusion area: Point area / Freehand area.
- Excavation: Point area / Freehand area.
- Precision tools remain available for measurement, rectangle, circle, direction arrow, text, notes and photos.
- Point-area tools close the final segment automatically when **Close shape** is pressed.

## 5. Persistent point editing
- **Edit points** stays active across repeated vertex moves.
- Each move remains committed to history/Undo.
- The user presses **Done** once all point edits are complete; geometry is then locked back into the item.

## 6. Style / route presentation
- Selected-item toolbar follows a familiar mobile-editor pattern: Move, Edit points, Style, More.
- Editable line colour, width, solid/dashed/dotted style and fill colour.
- Access / egress / on-site route lines show direction arrows by default and can disable them.
- Defaults distinguish access (green), egress (red/orange) and general route (blue).
- Stone road / stone area geometry is simplified from the input trace and rendered with a gravel-style texture plus editable outline/fill.

## 7. Pictorial assets
- Asset library remains desktop and touch drag/drop capable.
- Asset icons are more category/item-specific rather than repeated generic boxes.
- Dedicated graphics are included for fire, first aid, muster, toilets, cabins, rigid/artic/van/pickup vehicles, forklift, telehandler, excavator, roller, dumper, MEWP, fencing/gates, parking, generator, fuel, skip, wheelwash and stage.

## 8. Services workflow
- Main Services screen contains two clear actions only: **Service mapping** and **Add service / constraint**.
- Service mapping opens a dedicated selection screen.
- Default mapping visibility: **OHL ON; every other layer OFF**.
- Primary mapping action is simply **Show**.
- Show refreshes only the source families needed by the selected layer set and displays the bounded result.
- Manual service / constraint drawing is in its own screen with point or freehand methods.
- Public/reference datasets retain the existing warning/provenance/snapshot architecture.

## 9. SAMI branding
- The SAMI wordmark PNG now contains transparent background pixels and can sit over launch/CAD/header backgrounds without a black rectangle.

## 10. Document Engine compatibility
- Existing 2-page A3 Site Logistics Pack generation was regression-tested after the v0.6 changes.
- Hidden Trakway generation guides are excluded from PDF output.
- Selected user line/fill styles are respected in the document renderer.
- A generated regression PDF remained a structurally valid two-page A3 document.

## Validation performed
- `node --check` passed for app.js, document-engine.js and service worker.
- Model smoke test verified: OHL-only default visibility, legacy service-visibility migration, Trakway group migration, hidden generation guide migration and A-series site-frame ratio.
- Existing project-area migration was checked to remain at approximately 420:297 landscape ratio.
- PDF regression generation completed successfully: 2 pages, A3 landscape.
- SAMI wordmark PNG alpha range verified as 0–255 (genuine transparent background).
- Local-file and service-worker shell checks are performed before packaging.
- Managed Chromium in this environment blocks local app URLs (`ERR_BLOCKED_BY_ADMINISTRATOR`), so final multi-touch/iPad interaction still requires a real-device Safari/PWA smoke test after deployment.
