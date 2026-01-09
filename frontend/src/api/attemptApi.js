// frontend/src/api/attemptApi.js
import { api } from "./client";

export const attemptApi = {
  start: async (quizId) => {
    const res = await api.post("/attempts/start", { quizId });
    return res.data; // { ok, item }
  },
  submit: async (attemptId, answers) => {
    const res = await api.post(`/attempts/${attemptId}/submit`, { answers });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/attempts/${id}`);
    return res.data;
  },
};
