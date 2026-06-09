export const addCentralRailwayStations = (map: mapboxgl.Map) => {
    map.addSource("central-station-wms", {
    type: "raster",
    tiles: [
      "http://localhost:8080/geoserver/railway/wms?service=WMS&version=1.1.1&request=GetMap&layers=railway:Central Railway Station&styles=central_station&format=image/png&transparent=true&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256",
    ],
    tileSize: 256,
  });

  map.addLayer({
    id: "central-station-wms",
    type: "raster",
    source: "central-station-wms",
  });
}