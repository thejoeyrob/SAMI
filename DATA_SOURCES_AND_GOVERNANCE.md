# SAMI · UK data sources and governance

This file defines the production data strategy behind the v0.3 workspace. The PWA is designed to **store a bounded project snapshot**, not to depend on continuous live map queries.

## HGV routing
**Preferred production source:** Ordnance Survey Routing & Asset Management Information (OS RAMI), or an HGV routing service whose underlying data provides equivalent current restriction attributes. OS describes the product as containing routable road geometry plus turn/time and height/weight/width restriction information, with monthly updates.

SAMI's production `hgvRouteEndpoint` should version the road/restriction dataset used for a route and return that version in the route record. The flat PWA currently stores the route date, vehicle dimensions and provider. Valhalla/OpenStreetMap is retained only as a clearly identified preview fallback.

## Underground assets
**NUAR:** authoritative/asset-owner underground records are secure data and access is controlled. They must not be redistributed inside a public static application simply because a map layer is desirable. Production SAMI should use authorised access/APIs when available, enforce the permitted use, and serve only the bounded records relevant to the project.

## Electricity / overhead lines
Potential source classes include DNO open-data portals (for example NGED and UK Power Networks) and other licensed/approved electricity-network datasets. The flat build includes an explicit bounded OpenStreetMap power-line snapshot updater as a **representative planning layer**, not a substitute for DNO records or site survey.

## Planning, environment and heritage
The production ingestion layer can maintain versioned datasets for, as applicable to the jurisdiction:
- flood/environment datasets from the Environment Agency / Defra and devolved equivalents;
- protected habitat/SSSI datasets from the national environment bodies;
- Historic England open GIS, Historic Environment Scotland downloads and Cadw datasets;
- Tree Preservation Order data from Planning Data / local planning authorities, recognising incomplete national coverage.

## Refresh rules
Every official/project source should have:
- source organisation;
- source dataset name;
- licence/permission status;
- source revision/update date;
- SAMI ingestion date;
- geometry CRS and transformation record;
- server snapshot version;
- project subset extraction time;
- verification/status label.

A refresh creates a new snapshot. Previous snapshots are archived, not silently destroyed.

## Contributions
A community observation is **never written directly into the collected authoritative dataset**. It is stored separately with:
- contributor/account identifier (server-side in production);
- date/time;
- geometry;
- evidence/source reference;
- photo/document evidence where permitted;
- confidence/status;
- moderation/approval record.

Only an approval workflow may promote an observation into an approved shared layer, and the original observation/provenance should remain auditable.

## Display boundary
- detailed site drawing: defined plan area + configurable drawing bleed;
- service/constraint retrieval: defined plan area + 0.25 mile (402.336 m);
- route-to-site: independent origin/destination corridor.

These boundaries are deliberate performance and information-governance controls.
