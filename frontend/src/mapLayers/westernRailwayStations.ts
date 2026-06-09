export const addWesternRailwayStations = (map:mapboxgl.Map) => {
    map.addSource("western-railway-stations-wms", {
  type: "raster",
  tiles: [
    "http://localhost:8080/geoserver/railway/wms?service=WMS&version=1.1.1&request=GetMap&layers=railway:Westren%20Railway%20Stations&styles=Western_Railway_Stations&format=image/png&transparent=true&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256",
  ],
  tileSize: 256,
});

map.addLayer({
  id: "western-railway-stations-wms",
  type: "raster",
  source: "western-railway-stations-wms",
});
}