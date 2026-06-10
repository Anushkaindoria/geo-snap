import { GEOSERVER_BASE_URL } from '../config/geoserver';
export const addRailwayTrackBuffer530Poly = (map:mapboxgl.Map) => {
    map.addSource("railway-track-buffer-530-poly-wms", {
  type: "raster",
  tiles: [
    `${GEOSERVER_BASE_URL}/railway/wms?service=WMS&version=1.1.1&request=GetMap&layers=railway:Railway_Track_Buffer_530_Poly&styles=Railway_Track_Buffer_530_Poly&format=image/png&transparent=true&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256`,
  ],
  tileSize: 256,
});

map.addLayer({
  id: "railway-track-buffer-530-poly-wms",
  type: "raster",
  source: "railway-track-buffer-530-poly-wms",
});
}

