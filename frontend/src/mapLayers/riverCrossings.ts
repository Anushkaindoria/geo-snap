export const addRiverCrossings = (map:mapboxgl.Map) => {
    map.addSource("river-crossings-wms", {
  type: "raster",
  tiles: [
    "http://localhost:8080/geoserver/railway/wms?service=WMS&version=1.1.1&request=GetMap&layers=railway:River_Crossings&styles=River_Crossings&format=image/png&transparent=true&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256",
  ],
  tileSize: 256,
});

map.addLayer({
  id: "river-crossings-wms",
  type: "raster",
  source: "river-crossings-wms",
});
}