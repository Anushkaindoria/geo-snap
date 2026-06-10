// GeoServer must be reachable from the device that opens the app.
// Laptop web can use localhost, but Android phones and deployed sites need a network/public URL.
export const GEOSERVER_BASE_URL =
  import.meta.env.VITE_GEOSERVER_BASE_URL || "http://localhost:8080/geoserver";
