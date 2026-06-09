import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./index.css";
import App from "./App.tsx";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);