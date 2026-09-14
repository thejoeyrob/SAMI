window.SAMI_CONFIG = {
  aiEndpoint: '',
  organisation: 'JW EDS',
  productName: 'SAMI',
  build: '0.5.0-document-engine-public-data',

  // Optional what3words key. For production, proxy sensitive credentials server-side.
  what3wordsApiKey: '',

  // Production HGV routing endpoint. Expected POST JSON:
  // {start:[lng,lat],end:[lng,lat],vehicle:{profile,weight,height,width,length,axles},country:'GB'}
  // Return {geometry:[[lng,lat],...],distanceKm,timeSec,provider,datasetVersion,warning,authoritative,constraints:[...]}.
  // constraints is optional; restrictions or hazards arrays are also accepted.
  // A production implementation should use a licensed/current restriction source such as OS RAMI.
  hgvRouteEndpoint: '',

  // Preview fallback. Truck routing uses mapped restrictions where available.
  valhallaEndpoint: 'https://valhalla1.openstreetmap.de/route',

  // Used only when the user explicitly captures/refreshes a bounded site snapshot.
  // The app does NOT continuously query while the map is panned.
  overpassEndpoint: 'https://overpass-api.de/api/interpreter',

  // Optional approved GeoJSON area-query endpoints. No private API keys here.
  // SAMI appends bbox=west,south,east,north, crs=EPSG:4326 and limit=10000.
  // Refresh archives the previous active snapshot on the device before replacement.
  // Example:
  // [{name:'Approved utility records',type:'electric',url:'https://your-server.example/records'}]
  serviceSources: []
};
