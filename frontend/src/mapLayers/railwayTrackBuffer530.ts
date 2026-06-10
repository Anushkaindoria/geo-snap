import { GEOSERVER_BASE_URL } from '../config/geoserver';
export const addRailwayTrackBuffer530 = (map:mapboxgl.Map) => {
    map.addSource("railway-track-buffer-530-wms", {
  type: "raster",
  tiles: [
    `${GEOSERVER_BASE_URL}/railway/wms?service=WMS&version=1.1.1&request=GetMap&layers=railway:Railway_Track_Buffer_530&styles=Railway_Track_Buffer_530&format=image/png&transparent=true&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256`,
  ],
  tileSize: 256,
});

map.addLayer({
  id: "railway-track-buffer-530-wms",
  type: "raster",
  source: "railway-track-buffer-530-wms",
});
}

