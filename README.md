# SAMI v0.6.0 — Drawing UX, grouping & service workflow

Progressive enhancement of the existing SAMI v0.5.0 Public Services + Document Engine build. This package retains the HGV Route to Site workflow, bounded CAD/vector capture, public/reference services snapshots, Ask SAMI, project persistence and the independent two-page SAMI Document Engine.

## Main interaction model

SAMI is now object-first rather than tool-first: choose what you want to draw, then choose the most suitable drawing method for that object.

Supported methods include point line, freehand line, point area, freehand area and drag/drop placement where applicable. Finished items can be selected and edited using a mobile-editor pattern: Move, Edit points, Style and More.

## Site Drawing frame

- The defined Site Drawing area is a drawing-sheet frame, not a permanent freehand polygon.
- Default frame ratio is A-series landscape (420:297 / 1.4142...).
- Freehand and point-drop methods define the required extent; SAMI creates the smallest sensible landscape frame around that extent.
- Two-corner and current-view methods use the same ratio lock.
- Aspect ratio can be manually unlocked.
- Existing pre-v0.6 site areas are migrated to the landscape ratio unless they already have an explicit aspect-ratio preference.
- Clear Site Drawing Area removes the frame/CAD base only; project items are retained and Undo remains available.

## Trakway

- Touch line, freehand run and freehand fill remain available.
- Generated panels from one operation are automatically grouped.
- The generating line/area is retained only as hidden metadata; it is not drawn over the finished panels and is omitted from the PDF renderer.
- Group selection provides move, style, duplicate, add-to-group, ungroup and delete controls.

## Direct editing

- Group / ungroup works on normal SAMI drawing objects and assets.
- Edit points remains active after each point move until the user presses Done.
- A closed point-area automatically joins the final point to the first point.
- Access, egress and general on-site routes have direction-arrow rendering and editable style.
- Stone roads and stone areas are simplified/neatened from the user trace, filled and rendered with a gravel-style texture.
- Line colour, weight, line style and fill colour are editable from the selected-item controls.

## Pictorial asset library

The asset palette remains drag/drop capable and now uses more distinct pictorial representations for safety points, vehicles, plant, welfare, perimeter and logistics assets. Fire, first aid and muster items retain recognisable sign-style graphics.

## Services & constraints

The main Services screen now has only two primary choices:

1. **Service mapping** — choose external/public/reference layers, then press **Show**.
2. **Add service / constraint** — manually draw/import a project record.

Default service mapping visibility is OHL only. Electricity, gas, water, drainage, telecoms and planning/environmental constraint layers remain off until selected. Existing bounded snapshot/provenance behavior remains intact.

## PDF / Document Engine

The v0.5 independent Document Engine is retained. It renders from project data rather than capturing the app screen. Hidden Trakway generation guides are excluded from document output, while user style colours/line types are respected.

## Branding

The SAMI wordmark PNG has been converted to a transparent-background asset for the launch screen, app header, CAD overlay and print template.

## Hosting

The build is a flat static PWA suitable for GitHub Pages while SAMI remains in this client-side development stage. Production credentials/licensed datasets must not be embedded in the public repository.

## Important service-data note

Public/reference services and constraints are planning/demo information only. They are not a substitute for statutory searches, utility-owner drawings, NUAR-authorised information, CAT/Genny detection, survey, trial holes or other required safe-dig controls.
