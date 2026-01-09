// frontend/src/api/quizApi.js
import { api } from "./client";

export const quizApi = {
  generate: async (payload) => {
    const res = await api.post("/quizzes/generate", payload);
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/quizzes/${id}`);
    return res.data; // { ok, item }
  },
};
