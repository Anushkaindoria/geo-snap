import { GEOSERVER_BASE_URL } from '../config/geoserver';
export const addNallahRivers = (map: mapboxgl.Map) => {
    map.addSource("nallah-rivers-wms", {
  type: "raster",
  tiles: [
    `${GEOSERVER_BASE_URL}/railway/wms?service=WMS&version=1.1.1&request=GetMap&layers=railway:Nallah_Rivers&styles=Nallah_Rivers&format=image/png&transparent=true&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256`,
  ],
  tileSize: 256,
});

map.addLayer({
  id: "nallah-rivers-wms",
  type: "raster",
  source: "nallah-rivers-wms",
});
}

