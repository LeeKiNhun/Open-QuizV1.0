import axios from "axios";

const raw = import.meta.env.VITE_API_URL || "http://localhost:5000";
const baseURL = raw.endsWith("/api") ? raw : `${raw.replace(/\/$/, "")}/api`;

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});