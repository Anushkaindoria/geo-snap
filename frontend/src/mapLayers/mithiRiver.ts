export const addMithiRiver = (map: mapboxgl.Map) =>{
    map.addSource("mithi-river-wms", {
  type: "raster",
  tiles: [
    "http://localhost:8080/geoserver/railway/wms?service=WMS&version=1.1.1&request=GetMap&layers=railway:Mithi River&styles=Mithi_River&format=image/png&transparent=true&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256",
  ],
  tileSize: 256,
});

map.addLayer({
  id: "mithi-river-wms",
  type: "raster",
  source: "mithi-river-wms",
});
}