window.SAMI_CONFIG = {
  aiEndpoint: '',
  organisation: 'JW EDS',
  productName: 'SAMI',
  build: '0.2.0-workspace',
  // Optional approved GeoJSON area-query endpoints. No private API keys here.
  // The app appends bbox=west,south,east,north, crs=EPSG:4326 and limit=10000.
  // The source must actually filter by bbox, permit CORS, and return WGS84 GeoJSON.
  // [{name:'Project utilities',type:'electric',url:'https://your-server.example/records'}]
  serviceSources: []
};
