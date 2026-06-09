import { Capacitor } from "@capacitor/core";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (Capacitor.isNativePlatform()
    ? "http://172.16.148.145:5000"
    : "http://localhost:5000");
alert(`API URL = ${API_BASE_URL}`);
