// src/api/authApi.js
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function safeJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    // backend đôi khi trả HTML (500) => không parse được JSON
    return { message: text?.slice(0, 200) || "Server error" };
  }
}

export async function loginApi({ email, password }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Đăng nhập thất bại");
  return data; // { token, user }
}

export async function registerApi({ hoTen, email, password, vaiTro }) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hoTen, email, password, vaiTro }),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Đăng ký thất bại");
  return data; // { token, user }
}
