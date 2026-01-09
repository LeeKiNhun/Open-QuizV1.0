import { api } from "./client";

export async function importSeedQuestions(bankId, items) {
  const res = await api.post(`/question-banks/${bankId}/questions/import`, { items });
  return res.data;
}
