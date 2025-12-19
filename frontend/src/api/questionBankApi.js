import { api } from "./client";

// lấy cấu trúc
export async function getBankStructure(bankId) {
  const res = await api.get(`/question-banks/${bankId}/structure`);
  return res.data.items || [];
}

// đổi tên folder/node
export async function renameBankNode(bankId, nodeId, title) {
  const res = await api.patch(`/question-banks/${bankId}/structure/nodes/${nodeId}`, { title });
  return res.data.items || [];
}

// xóa folder/node
export async function deleteBankNode(bankId, nodeId) {
  const res = await api.delete(`/question-banks/${bankId}/structure/nodes/${nodeId}`);
  return res.data.items || [];
}
