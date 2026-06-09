export const addNallaLayer = (map:mapboxgl.Map) => {
    map.addSource("nalla-layer-wms", {
  type: "raster",
  tiles: [
    "http://localhost:8080/geoserver/railway/wms?service=WMS&version=1.1.1&request=GetMap&layers=railway:Nalla%20Layer&styles=Nalla_Layer&format=image/png&transparent=true&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256",
  ],
  tileSize: 256,
});

map.addLayer({
  id: "nalla-layer-wms",
  type: "raster",
  source: "nalla-layer-wms",
});
}