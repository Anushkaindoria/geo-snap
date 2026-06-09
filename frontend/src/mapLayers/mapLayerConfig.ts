import type { Map as MapboxMap } from "mapbox-gl";
import { addCentralRailwayStations } from "./centralRailwayStations";
import { addFloodProneCentralRailway } from "./floodProneCentralRailway";
import { addFloodProneWesternRailways } from "./floodProneWesternRailway";
import { addMCM } from "./mcm";
import { addMithiRiver } from "./mithiRiver";
import { addMMRBoundary } from "./mmrBoundary";
import { addNallaLayer } from "./nallaLayer";
import { addNallahCrossings } from "./nallahCrossings";
import { addNallahRivers } from "./nallahRivers";
import { addRailwayTrack } from "./railwayTrack";
import { addRailwayTrackBuffer530 } from "./railwayTrackBuffer530";
import { addRailwayTrackBuffer530Poly } from "./railwayTrackBuffer530Poly";
import { addRailwayTrackBuffer530Poly001 } from "./railwayTrackBuffer530Poly001";
import { addRiverCrossings } from "./riverCrossings";
import { addWesternRailwayStations } from "./westernRailwayStations";

export type MapLayerConfig = {
  id: string;
  label: string;
  addLayer: (map: MapboxMap) => void;
};

// One central list keeps the checkbox UI and Mapbox WMS layer registration in sync.
export const MAP_LAYER_CONFIGS: MapLayerConfig[] = [
  {
    id: "central-station-wms",
    label: "Central Railway Stations",
    addLayer: addCentralRailwayStations,
  },
  {
    id: "western-railway-stations-wms",
    label: "Western Railway Stations",
    addLayer: addWesternRailwayStations,
  },
  {
    id: "mmr-wms",
    label: "MMR Boundary",
    addLayer: addMMRBoundary,
  },
  {
    id: "flood-prone-wms",
    label: "Flood Prone Central Railway",
    addLayer: addFloodProneCentralRailway,
  },
  {
    id: "flood-prone-western-wms",
    label: "Flood Prone Western Railway",
    addLayer: addFloodProneWesternRailways,
  },
  {
    id: "mcm-wms",
    label: "MCM",
    addLayer: addMCM,
  },
  {
    id: "mithi-river-wms",
    label: "Mithi River",
    addLayer: addMithiRiver,
  },
  {
    id: "nalla-layer-wms",
    label: "Nalla Layer",
    addLayer: addNallaLayer,
  },
  {
    id: "nallah-crossings-wms",
    label: "Nallah Crossings",
    addLayer: addNallahCrossings,
  },
  {
    id: "nallah-rivers-wms",
    label: "Nallah Rivers",
    addLayer: addNallahRivers,
  },
  {
    id: "railway-track-wms",
    label: "Railway Track",
    addLayer: addRailwayTrack,
  },
  {
    id: "railway-track-buffer-530-wms",
    label: "Railway Track Buffer 530",
    addLayer: addRailwayTrackBuffer530,
  },
  {
    id: "railway-track-buffer-530-poly-wms",
    label: "Railway Track Buffer 530 Poly",
    addLayer: addRailwayTrackBuffer530Poly,
  },
  {
    id: "railway-track-buffer-530-poly-001-wms",
    label: "Railway Track Buffer 530 Poly 001",
    addLayer: addRailwayTrackBuffer530Poly001,
  },
  {
    id: "river-crossings-wms",
    label: "River Crossings",
    addLayer: addRiverCrossings,
  },
];
