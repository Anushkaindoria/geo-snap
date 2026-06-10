import { GEOSERVER_BASE_URL } from '../config/geoserver';
export const addMCM = (map:mapboxgl.Map) =>{
    map.addSource("mcm-wms", {
  type: "raster",
  tiles: [
    `${GEOSERVER_BASE_URL}/railway/wms?service=WMS&version=1.1.1&request=GetMap&layers=railway:MCM&styles=MCM&format=image/png&transparent=true&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256`,
  ],
  tileSize: 256,
});

map.addLayer({
  id: "mcm-wms",
  type: "raster",
  source: "mcm-wms",
});
}

