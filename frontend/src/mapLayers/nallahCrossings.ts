import { GEOSERVER_BASE_URL } from '../config/geoserver';
export const addNallahCrossings = (map:mapboxgl.Map) => {
    map.addSource("nallah-crossings-wms", {
  type: "raster",
  tiles: [
    `${GEOSERVER_BASE_URL}/railway/wms?service=WMS&version=1.1.1&request=GetMap&layers=railway:Nallah_Crossings&styles=Nallah_Crossings&format=image/png&transparent=true&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256`,
  ],
  tileSize: 256,
});

map.addLayer({
  id: "nallah-crossings-wms",
  type: "raster",
  source: "nallah-crossings-wms",
});
}

