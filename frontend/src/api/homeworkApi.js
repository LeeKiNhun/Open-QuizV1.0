// src/api/homeworkApi.js
import { api } from "./client";

// ✅ QUAN TRỌNG: Khai báo API_BASE
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

// ===== TEACHER APIs (cần token) =====
export async function listHomeworks() {
  const res = await api.get("/homeworks");
  return res.data.items || [];
}

export async function createHomework(formData) {
  const res = await api.post("/homeworks", formData);
  return res.data.item;
}

export async function getHomeworkDetail(id) {
  const res = await api.get(`/homeworks/${id}`);
  return res.data.item;
}

export async function updateHomework(id, patch) {
  const res = await api.patch(`/homeworks/${id}`, patch);
  return res.data.item;
}

export async function deleteHomework(id) {
  const res = await api.delete(`/homeworks/${id}`);
  return res.data.ok;
}

export async function publishHomework(id) {
  const res = await api.post(`/homeworks/${id}/publish`);
  return res.data;
}

// ===== STUDENT APIs (PUBLIC - không cần token) =====
export async function getHomeworkByShareCode(shareCode) {
  const url = `${API_BASE}/api/homeworks/share/${shareCode}`;
  
  console.log("🔍 API call: getHomeworkByShareCode");
  console.log("📍 ShareCode:", shareCode);
  console.log("🌐 Full URL:", url);

  try {
    const res = await fetch(url);
    
    console.log("📡 Status:", res.status);
    
    const data = await res.json();
    
    console.log("📦 Response data:", data);

    if (!res.ok) {
      throw new Error(data?.message || "Không tìm thấy bài tập");
    }

    return data;
    
  } catch (error) {
    console.error("❌ getHomeworkByShareCode error:", error);
    throw error;
  }
}

export async function submitHomework(formData) {
  const url = `${API_BASE}/api/homeworks/submit`;
  
  console.log("📤 Submitting homework to:", url);

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    console.log("✅ Submit response:", data);

    if (!res.ok) {
      throw new Error(data?.message || "Không thể nộp bài");
    }

    return data;
    
  } catch (error) {
    console.error("❌ submitHomework error:", error);
    throw error;
  }
}