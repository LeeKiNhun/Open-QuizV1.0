import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // optional (nếu bạn dùng cookie). Dùng Bearer token thì không bắt buộc
});

// ✅ add token nếu auth bằng JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // đổi key nếu khác
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
