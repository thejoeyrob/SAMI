# SAMI grounded intelligence endpoint — draft interface

SAMI's browser must never contain an AI provider key. The PWA sends requests to a server-side service controlled by the SAMI operator.

## Request
`POST /api/sami/ask`

```json
{
  "query": "What guidance applies to working near a railway?",
  "project": { "...": "current SAMI project context" },
  "policy": "official-source-grounded",
  "allowMapActions": true
}
```

## Expected response
```json
{
  "answer": "Network Rail's ASPRO team is the relevant official route for third-party work on or near the railway. Open the cited source and confirm project-specific requirements.",
  "sources": [
    {
      "org": "Network Rail",
      "title": "Asset Protection & Optimisation",
      "url": "https://www.networkrail.co.uk/our-work/looking-after-the-railway/asset-protection-and-optimisation/",
      "desc": "Official source",
      "retrieved_at": "ISO-8601 timestamp",
      "revision": "when available"
    }
  ],
  "confidence": "source-grounded",
  "action": null
}
```

## Map action examples
The server may return ONE validated action such as:
- `{ "type":"activateTool", "tool":"access" }`
- `{ "type":"activateTool", "tool":"measure" }`
- `{ "type":"setView", "lat":52.1, "lng":-1.4, "zoom":18 }`

The client should never execute arbitrary returned JavaScript. Actions must be selected from an allow-list.

## Retrieval policy
1. Prefer the regulator, infrastructure owner, government body, standards owner or explicitly approved company source.
2. Store source URL, source organisation, retrieved time and document revision/date where available.
3. Never manufacture a numeric clearance, safe distance, legal duty or engineering limit when the source has not been retrieved.
4. For project/company documents, show whether the result is authoritative, project-verified, field/community observation, calculated/derived or AI inference.
5. Flag conflicting sources and direct the user to the controlling authority rather than resolving a safety-critical conflict by model judgement.
6. Do not let public/community observations overwrite authoritative layers; use separate provenance/verification states.

## Production extension
Add retrieval connectors for HSE/GOV.UK, Network Rail/other asset owners, environment agencies, organisation-controlled documents, approved standards repositories and licensed spatial datasets. Cache only where licensing permits and preserve source/revision metadata.
