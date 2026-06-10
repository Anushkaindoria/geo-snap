import { GEOSERVER_BASE_URL } from '../config/geoserver';
export const addFloodProneCentralRailway = (map:mapboxgl.Map) =>{
    map.addSource("flood-prone-wms", {
  type: "raster",
  tiles: [
    `${GEOSERVER_BASE_URL}/railway/wms?service=WMS&version=1.1.1&request=GetMap&layers=railway:Flood Prone Car sheds and Workshops on Central Railway&styles=Flood_Prone_Central_Railway&format=image/png&transparent=true&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256`,
  ],
  tileSize: 256,
});

  map.addLayer({
    id: "flood-prone-wms",
    type: "raster",
    source: "flood-prone-wms",
  });
}

