# SAMI HGV route endpoint contract

Configure `SAMI_CONFIG.hgvRouteEndpoint` to move from the public preview router to a production HGV-routing service.

## Request
POST JSON:
```json
{
  "start": [-2.12, 52.58],
  "end": [-1.90, 52.48],
  "vehicle": {
    "profile": "artic40",
    "weight": 40,
    "height": 4.2,
    "width": 2.55,
    "length": 16.5,
    "axles": 5
  },
  "country": "GB"
}
```

## Response
```json
{
  "geometry": [[-2.12,52.58],[-2.11,52.57]],
  "distanceKm": 36.4,
  "timeSec": 3410,
  "provider": "OS RAMI-backed SAMI Router",
  "datasetVersion": "2026-09",
  "warning": "Check temporary restrictions, site instructions and actual vehicle dimensions before travel.",
  "authoritative": true
}
```

The service should preserve the road/restriction dataset version used to calculate the route. Re-planning in the PWA creates a new dated route record and retains earlier route records in Route history.
